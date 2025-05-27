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
        throw new Error('Spreadsheet not found: Check if the GOOGLE_SHEET_ID is correct');      } else {
        throw new Error(`Failed to add game data: ${error.message}`);
      }
    }
  }

  async updateGameData(existingGame, newGameData) {
    if (!this.isConfigured()) {
      throw new Error('Google Sheets not configured');
    }

    if (!existingGame || !newGameData || typeof newGameData !== 'object') {
      throw new Error('Invalid game data provided for update');
    }

    try {
      await this.ensureHeaders();

      // Keep the original game number
      const gameNumber = existingGame.game_number;
      const gameName = newGameData.game_name || existingGame.game_name || 'Unknown Game';
      const version = newGameData.version || existingGame.version || 'Unknown';

      this.logger.info(`Updating game #${gameNumber}: ${gameName} (${existingGame.version || 'Unknown'} → ${version})`);

      // Merge data: use new data where available, fall back to existing data
      const mergedData = {
        game_name: newGameData.game_name || existingGame.game_name,
        version: newGameData.version || existingGame.version,
        developer: newGameData.developer || existingGame.developer,
        release_date: newGameData.release_date || existingGame.release_date,
        original_url: newGameData.original_url || existingGame.original_url, // Update to new URL
        cover_image: newGameData.cover_image || existingGame.cover_image,
        description: newGameData.description || existingGame.description,
        tags: newGameData.tags && newGameData.tags.length > 0 ? newGameData.tags : existingGame.tags,
        total_size_gb: newGameData.total_size_gb || existingGame.total_size_gb,
        total_size_bytes: newGameData.total_size_bytes || existingGame.total_size_bytes,
        download_links: newGameData.download_links && newGameData.download_links.length > 0 ? newGameData.download_links : existingGame.download_links,
        individual_sizes: newGameData.individual_sizes && newGameData.individual_sizes.length > 0 ? newGameData.individual_sizes : existingGame.individual_sizes,
        extracted_date: new Date().toISOString() // Always update extraction date
      };

      const row = [
        gameNumber, // Keep original game number
        mergedData.game_name,
        mergedData.version,
        mergedData.developer || 'Unknown',
        mergedData.release_date || '',
        mergedData.original_url || '',
        mergedData.cover_image || '',
        mergedData.description || '',
        Array.isArray(mergedData.tags) ? mergedData.tags.join(', ') : '',
        mergedData.total_size_gb || '0.00',
        mergedData.total_size_bytes || 0,
        JSON.stringify(mergedData.download_links || []),
        JSON.stringify(mergedData.individual_sizes || []),
        mergedData.extracted_date
      ];

      // Find the row to update by getting all data and finding the matching game number
      const allData = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:N`
      });

      if (!allData.data.values || allData.data.values.length <= 1) {
        throw new Error('No data found in spreadsheet');
      }

      // Find the row index (1-based, +1 for header)
      const dataRows = allData.data.values.slice(1);
      const rowIndex = dataRows.findIndex(row => parseInt(row[0]) === parseInt(gameNumber));
      
      if (rowIndex === -1) {
        throw new Error(`Game #${gameNumber} not found in spreadsheet`);
      }

      // Convert to 1-based index and add 2 (1 for 0-based to 1-based, 1 for header)
      const sheetRowIndex = rowIndex + 2;

      // Update the specific row
      const updateResponse = await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A${sheetRowIndex}:N${sheetRowIndex}`,
        valueInputOption: 'RAW',
        resource: {
          values: [row]
        }
      });

      if (!updateResponse || !updateResponse.data) {
        throw new Error('Invalid response from Google Sheets API');
      }

      this.logger.info(`Game #${gameNumber} updated in Google Sheets successfully: ${gameName}`);
      return gameNumber;

    } catch (error) {
      this.logger.error('Error updating game data in Google Sheets:', error);
      
      if (error.code === 'ENOTFOUND') {
        throw new Error('Network error: Unable to reach Google Sheets API');
      } else if (error.code === 403) {
        throw new Error('Permission denied: Service account may not have access to the spreadsheet');
      } else if (error.code === 404) {
        throw new Error('Spreadsheet not found: Check if the GOOGLE_SHEET_ID is correct');
      } else {
        throw new Error(`Failed to update game data: ${error.message}`);
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
  }  // Normalize game name by removing version info and common prefixes/suffixes
  normalizeGameName(name) {
    if (!name || typeof name !== 'string') return '';
    
    return name
      .toLowerCase()
      .trim()
      // Remove version patterns like v1.0, version 1.2, ep 1, episode 1, etc.
      .replace(/\s*\b(v|ver|version|ep|episode|chapter|ch|part|pt|release|r)\s*[\d.]+\w*\b/gi, '')
      // Remove common prefixes
      .replace(/^(the\s+|a\s+|an\s+)/i, '')
      // Remove parentheses and brackets content (often contains version info)
      .replace(/\s*[\[\(].*?[\]\)]\s*/g, ' ')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  async checkGameExists(gameUrl, gameName = null) {
    if (!gameUrl || typeof gameUrl !== 'string') {
      this.logger.warn('Invalid game URL provided for existence check');
      return null;
    }

    try {
      const games = await this.getAllGames();
      
      // First, check by exact URL match
      let existingGame = games.find(game => game.original_url === gameUrl);
      if (existingGame) {
        this.logger.info(`Found exact URL match for game: ${existingGame.game_name}`);
        return { ...existingGame, matchType: 'url' };
      }

      // If no URL match and we have a game name, check by normalized name
      if (gameName) {
        const normalizedNewName = this.normalizeGameName(gameName);
        if (normalizedNewName) {
          existingGame = games.find(game => {
            const normalizedExistingName = this.normalizeGameName(game.game_name);
            return normalizedExistingName === normalizedNewName;
          });
          
          if (existingGame) {
            this.logger.info(`Found name match for game: "${gameName}" matches existing "${existingGame.game_name}"`);
            return { ...existingGame, matchType: 'name' };
          }
        }
      }

      return null;
    } catch (error) {
      this.logger.error('Error checking if game exists:', error);
      return null;
    }
  }
}
