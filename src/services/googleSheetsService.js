import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class GoogleSheetsService {
  constructor() {
    this.logger = new Logger();
    this.sheets = null;
    this.auth = null;
    this.spreadsheetId = process.env.GOOGLE_SHEET_ID;
    this.sheetName = process.env.GOOGLE_SHEET_NAME;
    this.initialize();
  }
  async initialize() {
    try {
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        this.logger.warn('Google Sheets credentials not configured');
        return;
      }

      // Validate private key format
      let privateKey = process.env.GOOGLE_PRIVATE_KEY;
      if (!privateKey.includes('BEGIN PRIVATE KEY')) {
        throw new Error('Invalid private key format');
      }

      // Service account authentication
      this.auth = new google.auth.GoogleAuth({
        credentials: {
          type: 'service_account',
          project_id: process.env.GOOGLE_PROJECT_ID,
          private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
          private_key: privateKey.replace(/\\n/g, '\n'),
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          client_id: process.env.GOOGLE_CLIENT_ID,
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}`
        },
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive'
        ]
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      this.drive = google.drive({ version: 'v3', auth: this.auth });
      
      this.logger.info('Google Sheets service initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing Google Sheets service:', error);
      this.auth = null;
      this.sheets = null;
      this.drive = null;
      throw new Error(`Google Sheets initialization failed: ${error.message}`);
    }
  }

  isConfigured() {
    return !!(this.sheets && this.spreadsheetId);
  }

  async ensureHeaders() {
    if (!this.isConfigured()) {
      throw new Error('Google Sheets not configured');
    }

    try {
      // Check if sheet exists and has headers
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A1:Z1`
      });

      if (!response.data.values || response.data.values.length === 0) {
        // Add headers
        const headers = [
          'Game Number',
          'Game Name',
          'Version',
          'Developer',
          'Release Date',
          'Original URL',
          'Cover Image',
          'Description',
          'Tags',
          'Total Size (GB)',
          'Total Size (Bytes)',
          'Download Links',
          'Individual Sizes',
          'Extracted Date'
        ];

        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A1`,
          valueInputOption: 'RAW',
          resource: {
            values: [headers]
          }
        });

        this.logger.info('Headers added to Google Sheet');
      }
    } catch (error) {
      this.logger.error('Error ensuring headers:', error);
      throw error;
    }
  }
  async getLastGameNumber() {
    if (!this.isConfigured()) {
      this.logger.warn('Google Sheets not configured for getting last game number');
      return 0;
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:A`
      });

      if (!response || !response.data || !response.data.values || response.data.values.length <= 1) {
        this.logger.info('No existing games found, starting from 0');
        return 0;
      }

      // Get all game numbers and find the highest
      const gameNumbers = response.data.values
        .slice(1) // Skip header
        .map(row => {
          const num = parseInt(row[0]);
          return isNaN(num) ? 0 : num;
        })
        .filter(num => num > 0);

      const lastNumber = gameNumbers.length > 0 ? Math.max(...gameNumbers) : 0;
      this.logger.debug(`Last game number found: ${lastNumber}`);
      return lastNumber;
    } catch (error) {
      this.logger.error('Error getting last game number:', error);
      if (error.code === 404) {
        this.logger.warn('Spreadsheet or sheet not found, returning 0');
      }
      return 0;
    }
  }
  async addGameData(gameData) {
    if (!this.isConfigured()) {
      throw new Error('Google Sheets not configured');
    }

    if (!gameData || typeof gameData !== 'object') {
      throw new Error('Invalid game data provided');
    }

    try {
      await this.ensureHeaders();
      const gameNumber = (await this.getLastGameNumber()) + 1;

      // Validate required fields
      const gameName = gameData.game_name || 'Unknown Game';
      const version = gameData.version || 'Unknown';
      
      this.logger.info(`Adding game #${gameNumber}: ${gameName}`);

      const row = [
        gameNumber,
        gameName,
        version,
        gameData.developer || 'Unknown',
        gameData.release_date || '',
        gameData.original_url || '',
        gameData.cover_image || '',
        gameData.description || '',
        Array.isArray(gameData.tags) ? gameData.tags.join(', ') : '',
        gameData.total_size_gb || '0.00',
        gameData.total_size_bytes || 0,
        JSON.stringify(gameData.download_links || []),
        JSON.stringify(gameData.individual_sizes || []),
        gameData.extracted_date || new Date().toISOString()
      ];

      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:N`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: [row]
        }
      });

      if (!response || !response.data) {
        throw new Error('Invalid response from Google Sheets API');
      }

      this.logger.info(`Game #${gameNumber} added to Google Sheets successfully: ${gameName}`);
      return gameNumber;

    } catch (error) {
      this.logger.error('Error adding game data to Google Sheets:', error);
      
      if (error.code === 'ENOTFOUND') {
        throw new Error('Network error: Unable to reach Google Sheets API');
      } else if (error.code === 403) {
        throw new Error('Permission denied: Service account may not have access to the spreadsheet');
      } else if (error.code === 404) {
        throw new Error('Spreadsheet not found: Check if the GOOGLE_SHEET_ID is correct');
      } else {
        throw new Error(`Failed to add game data: ${error.message}`);
      }
    }
  }

  async getAllGames() {
    if (!this.isConfigured()) {
      throw new Error('Google Sheets not configured');
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:N`
      });

      if (!response.data.values || response.data.values.length <= 1) {
        return [];
      }

      const headers = response.data.values[0];
      const rows = response.data.values.slice(1);

      return rows.map(row => {
        const game = {};
        headers.forEach((header, index) => {
          const key = header.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '');
          let value = row[index] || '';
          
          // Parse JSON fields
          if (key === 'download_links' || key === 'individual_sizes') {
            try {
              value = JSON.parse(value);
            } catch {
              value = [];
            }
          }
          
          // Parse tags
          if (key === 'tags') {
            value = value ? value.split(', ').filter(tag => tag.trim()) : [];
          }
          
          game[key] = value;
        });
        
        return game;
      });

    } catch (error) {
      this.logger.error('Error getting all games:', error);
      throw error;
    }
  }
  async exportSheet() {
    if (!this.isConfigured()) {
      throw new Error('Google Sheets not configured');
    }

    if (!this.spreadsheetId) {
      throw new Error('Spreadsheet ID not configured');
    }

    try {
      // Create export URL for Excel format
      const exportUrl = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/export?format=xlsx`;
      
      this.logger.info('Generated Excel export URL successfully');
      return exportUrl;

    } catch (error) {
      this.logger.error('Error generating export URL:', error);
      throw new Error(`Failed to generate export URL: ${error.message}`);
    }
  }
  async checkGameExists(gameUrl) {
    if (!gameUrl || typeof gameUrl !== 'string') {
      this.logger.warn('Invalid game URL provided for existence check');
      return null;
    }

    try {
      const games = await this.getAllGames();
      return games.find(game => game.original_url === gameUrl) || null;
    } catch (error) {
      this.logger.error('Error checking if game exists:', error);
      return null;
    }
  }
}
