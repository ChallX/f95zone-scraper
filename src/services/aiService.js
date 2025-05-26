import { GoogleGenerativeAI } from '@google/generative-ai';
import { Logger } from '../utils/logger.js';

export class AIService {
  constructor() {
    this.logger = new Logger();
    this.genAI = process.env.GOOGLE_GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY) : null;
    this.model = this.genAI ? this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) : null;
  }

  isConfigured() {
    return !!(this.genAI && this.model);
  }
  async extractGameData(pageData, originalUrl) {
    if (!this.model) {
      throw new Error('Google Gemini API key not configured');
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
Title: ${pageData.title}
URL: ${originalUrl}
Content: ${pageData.content.substring(0, 8000)}

Images found: ${JSON.stringify(pageData.images.slice(0, 10))}
Links found: ${JSON.stringify(pageData.links.slice(0, 20))}

Return only valid JSON with the structure above.`;

    try {
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

      const response = await result.response;
      const extractedText = response.text().trim();
      
      // Clean the response to ensure it's valid JSON
      let cleanedJson = extractedText;
      if (cleanedJson.startsWith('```json')) {
        cleanedJson = cleanedJson.replace(/```json\n?/, '').replace(/\n?```$/, '');
      }
      if (cleanedJson.startsWith('```')) {
        cleanedJson = cleanedJson.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      const gameData = JSON.parse(cleanedJson);
      
      // Add original URL
      gameData.original_url = originalUrl;
      
      // Validate and clean the data
      return this.validateAndCleanGameData(gameData);

    } catch (error) {
      this.logger.error('Error extracting game data with Google Gemini:', error);
      
      // Fallback extraction using regex patterns
      return this.fallbackExtraction(pageData, originalUrl);
    }
  }

  validateAndCleanGameData(data) {
    const cleaned = {
      game_name: data.game_name || 'Unknown Game',
      version: data.version || 'Unknown',
      developer: data.developer || 'Unknown',
      release_date: data.release_date || null,
      cover_image: data.cover_image || null,
      description: data.description || '',
      tags: Array.isArray(data.tags) ? data.tags : [],
      download_links: Array.isArray(data.download_links) ? data.download_links : [],
      file_size: data.file_size || null,
      original_url: data.original_url
    };

    // Validate download links structure
    cleaned.download_links = cleaned.download_links.map(link => ({
      provider: link.provider || 'Unknown',
      url: link.url || '',
      platform: link.platform || 'PC',
      version: link.version || cleaned.version
    })).filter(link => link.url);

    return cleaned;
  }

  fallbackExtraction(pageData, originalUrl) {
    this.logger.info('Using fallback extraction method');
    
    const content = pageData.content;
    const title = pageData.title;
    
    // Extract game name from title
    const gameName = title.split(' - ')[0] || title.split('|')[0] || 'Unknown Game';
    
    // Extract version using regex
    const versionMatch = content.match(/v?(\d+\.?\d*\.?\d*\.?\d*)/i);
    const version = versionMatch ? versionMatch[0] : 'Unknown';
    
    // Extract cover image
    const coverImage = pageData.images.find(img => 
      img.src.includes('attachments') || 
      img.src.includes('cover') ||
      img.alt.toLowerCase().includes('cover')
    )?.src || null;
    
    // Extract download links
    const downloadLinks = pageData.links
      .filter(link => 
        link.href.includes('mega.nz') ||
        link.href.includes('drive.google.com') ||
        link.href.includes('mediafire.com') ||
        link.href.includes('gofile.io') ||
        link.href.includes('pixeldrain.com') ||
        link.text.toLowerCase().includes('pc')
      )
      .map(link => {
        let provider = 'Unknown';
        if (link.href.includes('mega.nz')) provider = 'MEGA';
        else if (link.href.includes('drive.google.com')) provider = 'Google Drive';
        else if (link.href.includes('mediafire.com')) provider = 'MediaFire';
        else if (link.href.includes('gofile.io')) provider = 'GoFile';
        else if (link.href.includes('pixeldrain.com')) provider = 'PixelDrain';
        
        return {
          provider,
          url: link.href,
          platform: 'PC',
          version
        };
      });

    return {
      game_name: gameName.trim(),
      version,
      developer: 'Unknown',
      release_date: null,
      cover_image: coverImage,
      description: content.substring(0, 200) + '...',
      tags: [],
      download_links: downloadLinks,
      file_size: null,
      original_url: originalUrl
    };
  }
}
