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

// Initialize logger first
const logger = new Logger();

// Initialize services with error handling
let scraperService, aiService, googleSheetsService;

try {
  scraperService = new ScraperService();
  aiService = new AIService();
  googleSheetsService = new GoogleSheetsService();
  logger.info('All services initialized successfully');
} catch (error) {
  logger.error('Failed to initialize services:', error);
  process.exit(1);
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "https://attachments.f95zone.to", "https://f95zone.to"],
      "script-src": ["'self'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
    }
  }
}));
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
    
    // Input validation
    if (!url) {
      return res.status(400).json({ 
        error: 'URL is required',
        details: 'Please provide a valid F95Zone URL'
      });
    }

    if (typeof url !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid URL format',
        details: 'URL must be a string'
      });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch (urlError) {
      return res.status(400).json({ 
        error: 'Invalid URL format',
        details: 'Please provide a valid URL'
      });
    }

    // Check if it's an F95Zone URL
    if (!url.includes('f95zone.to')) {
      return res.status(400).json({ 
        error: 'Invalid domain',
        details: 'Please provide an F95Zone URL (f95zone.to)'
      });
    }

    logger.info(`Starting scrape for URL: ${url}`);

    // Check if game already exists
    try {
      const existingGame = await googleSheetsService.checkGameExists(url);
      if (existingGame) {
        return res.status(409).json({
          error: 'Game already exists',
          details: `This game is already in the database as #${existingGame.game_number}`,
          existingGame
        });
      }
    } catch (checkError) {
      logger.warn('Could not check for existing game:', checkError.message);
    }    // Step 1: Scrape the F95Zone page with retry logic
    let pageData;
    try {
      pageData = await scraperService.scrapePageWithRetry(url);
      logger.info('Page scraped successfully');
    } catch (scrapeError) {
      logger.error('Scraping failed:', scrapeError);
      
      // Provide more specific error messages
      let errorDetails = scrapeError.message;
      if (scrapeError.message.includes('authentication')) {
        errorDetails = 'Authentication required or failed. Please check your F95Zone credentials in the .env file.';
      } else if (scrapeError.message.includes('timeout')) {
        errorDetails = 'Request timed out. The page may be temporarily unavailable.';
      } else if (scrapeError.message.includes('navigation')) {
        errorDetails = 'Failed to navigate to the page. Please check the URL.';
      }
      
      return res.status(500).json({ 
        error: 'Failed to scrape page',
        details: errorDetails
      });
    }

    // Step 2: Extract structured data using AI
    let gameData;
    try {
      gameData = await aiService.extractGameData(pageData, url);
      logger.info('Game data extracted with AI');
    } catch (aiError) {
      logger.error('AI extraction failed:', aiError);
      return res.status(500).json({ 
        error: 'Failed to extract game data',
        details: aiError.message
      });
    }

    // Step 3: Get download sizes
    let sizeData;
    try {
      sizeData = await scraperService.getDownloadSizes(gameData.download_links);
      logger.info('Download sizes calculated');
    } catch (sizeError) {
      logger.warn('Could not calculate download sizes:', sizeError.message);
      // Continue with default size data
      sizeData = {
        total_size_bytes: 0,
        total_size_gb: '0.00',
        individual_sizes: []
      };
    }

    // Step 4: Combine all data
    const finalData = {
      ...gameData,
      total_size_gb: sizeData.total_size_gb,
      total_size_bytes: sizeData.total_size_bytes,
      individual_sizes: sizeData.individual_sizes,
      extracted_date: new Date().toISOString()
    };

    // Step 5: Save to Google Sheets
    let gameNumber;
    try {
      gameNumber = await googleSheetsService.addGameData(finalData);
      logger.info(`Game saved to Google Sheets with number: ${gameNumber}`);
    } catch (sheetError) {
      logger.error('Failed to save to Google Sheets:', sheetError);
      return res.status(500).json({ 
        error: 'Failed to save to Google Sheets',
        details: sheetError.message,
        extractedData: finalData // Still return the extracted data
      });
    }

    // Step 6: Generate download URL
    let downloadUrl;
    try {
      downloadUrl = await googleSheetsService.exportSheet();
    } catch (exportError) {
      logger.warn('Could not generate download URL:', exportError.message);
      downloadUrl = null;
    }
    
    res.json({
      success: true,
      gameNumber,
      data: finalData,
      downloadUrl,
      message: 'Game data extracted and saved successfully!'
    });

  } catch (error) {
    logger.error('Unexpected scraping error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: 'An unexpected error occurred during processing',
      timestamp: new Date().toISOString()
    });
  }
});

// Get all games from sheet
app.get('/api/games', async (req, res) => {
  try {
    if (!googleSheetsService.isConfigured()) {
      return res.status(503).json({ 
        error: 'Google Sheets not configured',
        details: 'Please configure Google Sheets credentials'
      });
    }

    const games = await googleSheetsService.getAllGames();
    
    if (!Array.isArray(games)) {
      throw new Error('Invalid response from Google Sheets service');
    }

    res.json({ 
      success: true, 
      games,
      count: games.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching games:', error);
    res.status(500).json({ 
      error: 'Failed to fetch games',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Download sheet as Excel
app.get('/api/download', async (req, res) => {
  try {
    if (!googleSheetsService.isConfigured()) {
      return res.status(503).json({ 
        error: 'Google Sheets not configured',
        details: 'Please configure Google Sheets credentials'
      });
    }

    const downloadUrl = await googleSheetsService.exportSheet();
    
    if (!downloadUrl || typeof downloadUrl !== 'string') {
      throw new Error('Failed to generate download URL');
    }

    res.json({ 
      success: true, 
      downloadUrl,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error generating download:', error);
    res.status(500).json({ 
      error: 'Failed to generate download',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Check F95Zone authentication status
    const f95zoneAuthStatus = await scraperService.getAuthenticationStatus();
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      services: {
        scraper: 'operational',
        ai: aiService.isConfigured() ? 'operational' : 'needs_api_key',
        sheets: googleSheetsService.isConfigured() ? 'operational' : 'needs_credentials',
        f95zone_auth: f95zoneAuthStatus
      }
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({ 
      status: 'ERROR',
      error: 'Failed to check service health',
      timestamp: new Date().toISOString()
    });
  }
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
}).on('error', (error) => {
  logger.error('Failed to start server:', error);
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use. Please use a different port.`);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM signal. Starting graceful shutdown...');
  try {
    await scraperService.close();
    logger.info('Scraper service closed successfully');
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT signal. Starting graceful shutdown...');
  try {
    await scraperService.close();
    logger.info('Scraper service closed successfully');
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
  }
  process.exit(0);
});

export default app;