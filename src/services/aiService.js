import { GoogleGenerativeAI } from '@google/generative-ai';
import { Logger } from '../utils/logger.js';

export class AIService {
  constructor() {
    this.logger = new Logger();
    
    try {
      this.genAI = process.env.GOOGLE_GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY) : null;
      this.model = this.genAI ? this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) : null;
      
      if (this.isConfigured()) {
        this.logger.info('Google Gemini AI service initialized successfully');
      } else {
        this.logger.warn('Google Gemini API key not configured - AI service will not be available');
      }
    } catch (error) {
      this.logger.error('Failed to initialize AI service:', error);
      this.genAI = null;
      this.model = null;
    }
  }

  isConfigured() {
    return !!(this.genAI && this.model);
  }  async extractGameData(pageData, originalUrl) {
    if (!this.model) {
      throw new Error('Google Gemini API key not configured');
    }

    if (!pageData || typeof pageData !== 'object') {
      throw new Error('Invalid page data provided');
    }

    if (!originalUrl || typeof originalUrl !== 'string') {
      throw new Error('Invalid original URL provided');
    }

    const prompt = `
You are a data extraction specialist for F95Zone adult game pages. Extract structured game information from the provided web page content.

IMPORTANT: Extract ALL information accurately and return ONLY valid JSON.

Extract the following data:
- game_name: The exact game title
- version: Current version (look for v1.0, Version 1.2, etc.)
- developer: Game developer/creator name
- release_date: Release or update date if mentioned
- cover_image: Direct URL to the main game cover/preview image
- description: Brief game description (max 200 chars)
- tags: Array of game tags/genres mentioned
- download_links: Array of download objects with {provider, url, platform, version}
- file_size: Any size information mentioned in the text

For download_links, look for:
- PC/Windows downloads
- MEGA, Google Drive, MediaFire, GoFile, PixelDrain, WorkUpload links
- Different versions if multiple exist

Page Content:
Title: ${pageData.title || 'No title'}
URL: ${originalUrl}
Content: ${(pageData.content || '').substring(0, 8000)}

Images found: ${JSON.stringify((pageData.images || []).slice(0, 10))}
Links found: ${JSON.stringify((pageData.links || []).slice(0, 20))}

Return only valid JSON with the structure above.`;

    try {
      this.logger.info('Starting AI extraction...');
      
      const result = await this.model.generateContent({
        contents: [{
          role: 'user',
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2000,
        }
      });

      if (!result || !result.response) {
        throw new Error('No response received from AI service');
      }

      const response = await result.response;
      const extractedText = response.text();
      
      if (!extractedText || typeof extractedText !== 'string') {
        throw new Error('Invalid response text from AI service');
      }

      // Clean the response to ensure it's valid JSON
      let cleanedJson = extractedText.trim();
      if (cleanedJson.startsWith('```json')) {
        cleanedJson = cleanedJson.replace(/```json\n?/, '').replace(/\n?```$/, '');
      }
      if (cleanedJson.startsWith('```')) {
        cleanedJson = cleanedJson.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      let gameData;
      try {
        gameData = JSON.parse(cleanedJson);
      } catch (parseError) {
        this.logger.warn('AI response was not valid JSON, falling back to regex extraction');
        throw new Error(`Invalid JSON from AI: ${parseError.message}`);
      }
      
      // Add original URL
      gameData.original_url = originalUrl;
      
      // Validate and clean the data
      const validatedData = this.validateAndCleanGameData(gameData);
      this.logger.info('AI extraction completed successfully');
      return validatedData;

    } catch (error) {
      this.logger.error('Error extracting game data with Google Gemini:', error);
      
      // Fallback extraction using regex patterns
      this.logger.info('Attempting fallback extraction...');
      try {
        return this.fallbackExtraction(pageData, originalUrl);
      } catch (fallbackError) {
        this.logger.error('Fallback extraction also failed:', fallbackError);
        throw new Error(`AI extraction failed: ${error.message}. Fallback also failed: ${fallbackError.message}`);
      }
    }
  }
  validateAndCleanGameData(data) {
    if (!data || typeof data !== 'object') {
      this.logger.warn('Invalid game data provided for validation');
      data = {};
    }

    try {
      const cleaned = {
        game_name: (data.game_name && typeof data.game_name === 'string') ? data.game_name.trim() : 'Unknown Game',
        version: (data.version && typeof data.version === 'string') ? data.version.trim() : 'Unknown',
        developer: (data.developer && typeof data.developer === 'string') ? data.developer.trim() : 'Unknown',
        release_date: (data.release_date && typeof data.release_date === 'string') ? data.release_date.trim() : null,
        cover_image: (data.cover_image && typeof data.cover_image === 'string' && data.cover_image.startsWith('http')) ? data.cover_image.trim() : null,
        description: (data.description && typeof data.description === 'string') ? data.description.trim().substring(0, 500) : '',
        tags: Array.isArray(data.tags) ? data.tags.filter(tag => tag && typeof tag === 'string').map(tag => tag.trim()) : [],
        download_links: Array.isArray(data.download_links) ? data.download_links : [],
        file_size: (data.file_size && typeof data.file_size === 'string') ? data.file_size.trim() : null,
        original_url: (data.original_url && typeof data.original_url === 'string') ? data.original_url.trim() : ''
      };

      // Validate and clean download links structure
      cleaned.download_links = cleaned.download_links
        .filter(link => link && typeof link === 'object' && link.url)
        .map(link => ({
          provider: (link.provider && typeof link.provider === 'string') ? link.provider.trim() : 'Unknown',
          url: (link.url && typeof link.url === 'string') ? link.url.trim() : '',
          platform: (link.platform && typeof link.platform === 'string') ? link.platform.trim() : 'PC',
          version: (link.version && typeof link.version === 'string') ? link.version.trim() : cleaned.version
        }))
        .filter(link => link.url && link.url.startsWith('http'));

      this.logger.info(`Validated game data: ${cleaned.game_name}`);
      return cleaned;
    } catch (error) {
      this.logger.error('Error validating game data:', error);
      // Return minimal valid structure
      return {
        game_name: 'Unknown Game',
        version: 'Unknown',
        developer: 'Unknown',
        release_date: null,
        cover_image: null,
        description: '',
        tags: [],
        download_links: [],
        file_size: null,
        original_url: data.original_url || ''
      };
    }
  }
  fallbackExtraction(pageData, originalUrl) {
    try {
      this.logger.info('Using fallback extraction method');
      
      if (!pageData || typeof pageData !== 'object') {
        throw new Error('Invalid page data for fallback extraction');
      }

      const content = pageData.content || '';
      const title = pageData.title || 'Unknown Game';
      
      // Extract game name from title
      const gameName = title.split(' - ')[0] || title.split('|')[0] || 'Unknown Game';
      
      // Extract version using regex
      const versionMatch = content.match(/v?(\d+\.?\d*\.?\d*\.?\d*)/i);
      const version = versionMatch ? versionMatch[0] : 'Unknown';
      
      // Extract cover image
      const coverImage = this.findCoverImage(pageData.images || []);
      
      // Extract download links
      const downloadLinks = this.extractDownloadLinks(pageData.links || [], version);

      const result = {
        game_name: gameName.trim(),
        version,
        developer: 'Unknown',
        release_date: null,
        cover_image: coverImage,
        description: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
        tags: [],
        download_links: downloadLinks,
        file_size: null,
        original_url: originalUrl
      };

      this.logger.info('Fallback extraction completed successfully');
      return result;
    } catch (error) {
      this.logger.error('Fallback extraction failed:', error);
      throw new Error(`Fallback extraction failed: ${error.message}`);
    }
  }

  findCoverImage(images) {
    try {
      if (!Array.isArray(images)) return null;
      
      const coverImage = images.find(img => 
        img && img.src &&
        (img.src.includes('attachments') || 
         img.src.includes('cover') ||
         (img.alt && img.alt.toLowerCase().includes('cover')))
      );
      
      return coverImage ? coverImage.src : null;
    } catch (error) {
      this.logger.warn('Error finding cover image:', error);
      return null;
    }
  }

  extractDownloadLinks(links, version) {
    try {
      if (!Array.isArray(links)) return [];
      
      return links
        .filter(link => 
          link && link.href && (
            link.href.includes('mega.nz') ||
            link.href.includes('drive.google.com') ||
            link.href.includes('mediafire.com') ||
            link.href.includes('gofile.io') ||
            link.href.includes('pixeldrain.com') ||
            (link.text && link.text.toLowerCase().includes('pc'))
          )
        )
        .map(link => {
          let provider = 'Unknown';
          const href = link.href;
          
          if (href.includes('mega.nz')) provider = 'MEGA';
          else if (href.includes('drive.google.com')) provider = 'Google Drive';
          else if (href.includes('mediafire.com')) provider = 'MediaFire';
          else if (href.includes('gofile.io')) provider = 'GoFile';
          else if (href.includes('pixeldrain.com')) provider = 'PixelDrain';
          
          return {
            provider,
            url: href,
            platform: 'PC',
            version
          };
        });
    } catch (error) {
      this.logger.warn('Error extracting download links:', error);
      return [];
    }
  }
}
