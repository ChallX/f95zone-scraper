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
    this.sheetName = 'Games Database';
    this.initialize();
  }

  async initialize() {
    try {
      if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
        // Service account authentication
        this.auth = new google.auth.GoogleAuth({
          credentials: {
            type: 'service_account',
            project_id: process.env.GOOGLE_PROJECT_ID,
            private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
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
      }
    } catch (error) {
      this.logger.error('Error initializing Google Sheets service:', error);
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
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:A`
      });

      if (!response.data.values || response.data.values.length <= 1) {
        return 0;
      }

      // Get all game numbers and find the highest
      const gameNumbers = response.data.values
        .slice(1) // Skip header
        .map(row => parseInt(row[0]) || 0)
        .filter(num => num > 0);

      return gameNumbers.length > 0 ? Math.max(...gameNumbers) : 0;
    } catch (error) {
      this.logger.error('Error getting last game number:', error);
      return 0;
    }
  }

  async addGameData(gameData) {
    if (!this.isConfigured()) {
      throw new Error('Google Sheets not configured');
    }

    try {
      await this.ensureHeaders();
      const gameNumber = (await this.getLastGameNumber()) + 1;

      const row = [
        gameNumber,
        gameData.game_name || '',
        gameData.version || '',
        gameData.developer || '',
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

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:N`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: [row]
        }
      });

      this.logger.info(`Game #${gameNumber} added to Google Sheets: ${gameData.game_name}`);
      return gameNumber;

    } catch (error) {
      this.logger.error('Error adding game data to Google Sheets:', error);
      throw error;
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

    try {
      // Create export URL for Excel format
      const exportUrl = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/export?format=xlsx`;
      
      this.logger.info('Generated Excel export URL');
      return exportUrl;

    } catch (error) {
      this.logger.error('Error generating export URL:', error);
      throw error;
    }
  }

  async checkGameExists(gameUrl) {
    try {
      const games = await this.getAllGames();
      return games.find(game => game.original_url === gameUrl);
    } catch (error) {
      this.logger.error('Error checking if game exists:', error);
      return null;
    }
  }
}
