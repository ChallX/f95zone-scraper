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
  try {    const { url, sessionId } = req.body;
    
    // Input validation
    if (!url) {
      if (sessionId) errorProgress(sessionId, 'URL is required');
      return res.status(400).json({ 
        error: 'URL is required',
        details: 'Please provide a valid F95Zone URL'
      });
    }

    if (typeof url !== 'string') {
      if (sessionId) errorProgress(sessionId, 'Invalid URL format');
      return res.status(400).json({ 
        error: 'Invalid URL format',
        details: 'URL must be a string'
      });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch (urlError) {
      if (sessionId) errorProgress(sessionId, 'Invalid URL format');
      return res.status(400).json({ 
        error: 'Invalid URL format',
        details: 'Please provide a valid URL'
      });
    }

    // Check if it's an F95Zone URL
    if (!url.includes('f95zone.to')) {
      if (sessionId) errorProgress(sessionId, 'Invalid domain - must be F95Zone URL');
      return res.status(400).json({ 
        error: 'Invalid domain',
        details: 'Please provide an F95Zone URL (f95zone.to)'
      });
    }    logger.info(`Starting scrape for URL: ${url}`);

    // Step 1: Scrape the F95Zone page with retry logic
    if (sessionId) sendProgress(sessionId, 1, 6, 'Scraping F95Zone page...');
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
        errorDetails = 'Failed to navigate to the page. Please check the URL.';      }
      
      if (sessionId) errorProgress(sessionId, `Failed to scrape page: ${errorDetails}`);
      return res.status(500).json({ 
        error: 'Failed to scrape page',
        details: errorDetails
      });
    }

    // Step 2: Extract structured data using AI
    if (sessionId) sendProgress(sessionId, 2, 6, 'Extracting game data with AI...');
    let gameData;
    try {
      gameData = await aiService.extractGameData(pageData, url);
      logger.info('Game data extracted with AI');    } catch (aiError) {
      logger.error('AI extraction failed:', aiError);
      if (sessionId) errorProgress(sessionId, `AI extraction failed: ${aiError.message}`);
      return res.status(500).json({ 
        error: 'Failed to extract game data',
        details: aiError.message
      });
    }

    // Step 3: Check if game already exists (by URL or name) AFTER getting game data
    if (sessionId) sendProgress(sessionId, 3, 6, 'Checking for existing game...');
    let existingGame;
    let isUpdate = false;
    try {
      existingGame = await googleSheetsService.checkGameExists(url, gameData.game_name);
      if (existingGame) {
        isUpdate = true;
        const matchTypeText = existingGame.matchType === 'url' ? 'URL' : 'game name';
        logger.info(`Found existing game #${existingGame.game_number} by ${matchTypeText}: ${existingGame.game_name}`);
        if (sessionId) sendProgress(sessionId, 3, 6, `Found existing game, will update #${existingGame.game_number}...`);
      }
    } catch (checkError) {
      logger.warn('Could not check for existing game:', checkError.message);
    }

    // Step 4: Get download sizes
    if (sessionId) sendProgress(sessionId, 4, 6, 'Calculating download sizes...');
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
      };    }

    // Step 5: Combine all data
    if (sessionId) sendProgress(sessionId, 5, 6, 'Preparing data for Google Sheets...');
    const finalData = {
      ...gameData,
      total_size_gb: sizeData.total_size_gb,
      total_size_bytes: sizeData.total_size_bytes,
      individual_sizes: sizeData.individual_sizes,
      extracted_date: new Date().toISOString()    };

    // Step 6: Save or Update in Google Sheets
    if (sessionId) sendProgress(sessionId, 6, 6, isUpdate ? 'Updating existing game...' : 'Saving new game...');
    let gameNumber;
    try {
      if (isUpdate) {
        gameNumber = await googleSheetsService.updateGameData(existingGame, finalData);
        logger.info(`Game updated in Google Sheets with number: ${gameNumber}`);
      } else {
        gameNumber = await googleSheetsService.addGameData(finalData);
        logger.info(`Game saved to Google Sheets with number: ${gameNumber}`);
      }
    } catch (sheetError) {
      logger.error('Failed to save to Google Sheets:', sheetError);
      if (sessionId) errorProgress(sessionId, `Failed to save to Google Sheets: ${sheetError.message}`);
      return res.status(500).json({ 
        error: 'Failed to save to Google Sheets',
        details: sheetError.message,
        extractedData: finalData // Still return the extracted data
      });
    }    // Step 7: Generate download URL
    let downloadUrl;
    try {
      downloadUrl = await googleSheetsService.exportSheet();
    } catch (exportError) {
      logger.warn('Could not generate download URL:', exportError.message);
      downloadUrl = null;    }
    
    const responseData = {
      success: true,
      gameNumber,
      data: finalData,
      downloadUrl,
      isUpdate,
      message: isUpdate ? 
        `Game #${gameNumber} updated successfully!` : 
        'Game data extracted and saved successfully!'
    };

    if (sessionId) completeProgress(sessionId, responseData);
    
    res.json(responseData);
  } catch (error) {
    logger.error('Unexpected scraping error:', error);
    const { sessionId } = req.body;
    if (sessionId) errorProgress(sessionId, 'An unexpected error occurred during processing');
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

// Delete game endpoint
app.delete('/api/games/:gameNumber', async (req, res) => {
  try {
    const gameNumber = req.params.gameNumber;
    
    // Validate game number
    if (!gameNumber || isNaN(gameNumber)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid game number' 
      });
    }

    logger.info(`Delete request received for game number: ${gameNumber}`);
    
    // Call the delete method
    const result = await googleSheetsService.deleteGame(gameNumber);
    
    res.json({ 
      success: true, 
      message: `Game ${gameNumber} deletion requested`,
      gameNumber: parseInt(gameNumber)
    });
    
  } catch (error) {
    logger.error('Error deleting game:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Progress tracking for SSE
const progressSessions = new Map();

// SSE endpoint for progress updates
app.get('/api/progress/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Store the response object for this session
  progressSessions.set(sessionId, res);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ step: 0, message: 'Connected to progress stream', status: 'connected' })}\n\n`);

  // Set up cleanup timeout (10 minutes)
  const timeoutId = setTimeout(() => {
    if (progressSessions.has(sessionId)) {
      console.log(`Cleaning up stale SSE connection for session: ${sessionId}`);
      const staleRes = progressSessions.get(sessionId);
      if (staleRes && !staleRes.destroyed) {
        try {
          staleRes.end();
        } catch (error) {
          console.error('Error closing stale connection:', error);
        }
      }
      progressSessions.delete(sessionId);
    }
  }, 10 * 60 * 1000); // 10 minutes

  // Clean up on client disconnect
  req.on('close', () => {
    clearTimeout(timeoutId);
    progressSessions.delete(sessionId);
  });

  req.on('aborted', () => {
    clearTimeout(timeoutId);
    progressSessions.delete(sessionId);
  });
});

// Helper function to send progress updates
function sendProgress(sessionId, step, total, message, status = 'progress') {
  const res = progressSessions.get(sessionId);
  if (res && !res.destroyed && !res.headersSent === false) {
    try {
      const progress = Math.round((step / total) * 100);
      const data = {
        step,
        total,
        progress,
        message,
        status,
        timestamp: new Date().toISOString()
      };
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error('Error sending progress:', error);
      progressSessions.delete(sessionId);
    }
  }
}

// Helper function to complete progress
function completeProgress(sessionId, data = null) {
  const res = progressSessions.get(sessionId);
  if (res && !res.destroyed) {
    try {
      const completionData = {
        progress: 100,
        message: 'Process completed successfully',
        status: 'completed',
        data,
        timestamp: new Date().toISOString()
      };
      res.write(`data: ${JSON.stringify(completionData)}\n\n`);
      res.end();
    } catch (error) {
      console.error('Error completing progress:', error);
    } finally {
      progressSessions.delete(sessionId);
    }
  }
}

// Helper function to send error progress
function errorProgress(sessionId, error) {
  const res = progressSessions.get(sessionId);
  if (res && !res.destroyed) {
    try {
      const errorData = {
        progress: 0,
        message: error,
        status: 'error',
        timestamp: new Date().toISOString()
      };
      res.write(`data: ${JSON.stringify(errorData)}\n\n`);
      res.end();
    } catch (writeError) {
      console.error('Error sending error progress:', writeError);
    } finally {
      progressSessions.delete(sessionId);
    }
  }
}

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