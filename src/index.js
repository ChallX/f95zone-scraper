import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { ScraperService } from './services/scraperService.js';
import { AIService } from './services/aiService.js';
import { GoogleSheetsService } from './services/googleSheetsService.js';
import { Logger } from './utils/logger.js';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize services
const scraperService = new ScraperService();
const aiService = new AIService();
const googleSheetsService = new GoogleSheetsService();
const logger = new Logger();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Main scraping endpoint
app.post('/api/scrape', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    logger.info(`Starting scrape for URL: ${url}`);

    // Step 1: Scrape the F95Zone page
    const pageData = await scraperService.scrapePage(url);
    logger.info('Page scraped successfully');

    // Step 2: Extract structured data using AI
    const gameData = await aiService.extractGameData(pageData, url);
    logger.info('Game data extracted with AI');

    // Step 3: Get download sizes
    const sizeData = await scraperService.getDownloadSizes(gameData.download_links);
    logger.info('Download sizes calculated');

    // Step 4: Combine all data
    const finalData = {
      ...gameData,
      total_size_gb: sizeData.total_size_gb,
      total_size_bytes: sizeData.total_size_bytes,
      individual_sizes: sizeData.individual_sizes,
      extracted_date: new Date().toISOString()
    };

    // Step 5: Save to Google Sheets
    const gameNumber = await googleSheetsService.addGameData(finalData);
    logger.info(`Game saved to Google Sheets with number: ${gameNumber}`);

    // Step 6: Download updated sheet
    const downloadUrl = await googleSheetsService.exportSheet();
    
    res.json({
      success: true,
      gameNumber,
      data: finalData,
      downloadUrl,
      message: 'Game data extracted and saved successfully!'
    });

  } catch (error) {
    logger.error('Scraping error:', error);
    res.status(500).json({ 
      error: 'Failed to scrape and process data',
      details: error.message 
    });
  }
});

// Get all games from sheet
app.get('/api/games', async (req, res) => {
  try {
    const games = await googleSheetsService.getAllGames();
    res.json({ success: true, games });
  } catch (error) {
    logger.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// Download sheet as Excel
app.get('/api/download', async (req, res) => {
  try {
    const downloadUrl = await googleSheetsService.exportSheet();
    res.json({ success: true, downloadUrl });
  } catch (error) {
    logger.error('Error generating download:', error);
    res.status(500).json({ error: 'Failed to generate download' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    services: {
      scraper: 'operational',
      ai: aiService.isConfigured() ? 'operational' : 'needs_api_key',
      sheets: googleSheetsService.isConfigured() ? 'operational' : 'needs_credentials'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 F95Zone Scraper Server running on http://localhost:${PORT}`);
  logger.info('📝 Open the web interface to start scraping!');
});

export default app;