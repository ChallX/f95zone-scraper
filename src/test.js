import { ScraperService } from './services/scraperService.js';
import { AIService } from './services/aiService.js';
import { GoogleSheetsService } from './services/googleSheetsService.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testServices() {
  console.log('🧪 Testing F95Zone Scraper Services...\n');
  
  try {
    // Test 1: Check environment variables
    console.log('1. Environment Variables:');
    console.log(`   ✅ Google Gemini API Key: ${process.env.GOOGLE_GEMINI_API_KEY ? 'Configured' : '❌ Missing'}`);
    console.log(`   ✅ Google Sheet ID: ${process.env.GOOGLE_SHEET_ID ? 'Configured' : '❌ Missing'}`);
    console.log(`   ✅ Google Service Email: ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Configured' : '❌ Missing'}`);
    console.log('');

    // Test 2: Initialize services with error handling
    console.log('2. Service Initialization:');
    
    let scraperService, aiService, googleSheetsService;
    
    try {
      scraperService = new ScraperService();
      console.log(`   ✅ Scraper Service: Initialized`);
    } catch (error) {
      console.log(`   ❌ Scraper Service: Failed - ${error.message}`);
      return;
    }

    try {
      aiService = new AIService();
      console.log(`   ✅ AI Service: ${aiService.isConfigured() ? 'Configured' : '❌ Needs API Key'}`);
    } catch (error) {
      console.log(`   ❌ AI Service: Failed - ${error.message}`);
      return;
    }

    try {
      googleSheetsService = new GoogleSheetsService();
      console.log(`   ✅ Google Sheets: ${googleSheetsService.isConfigured() ? 'Configured' : '❌ Needs Credentials'}`);
    } catch (error) {
      console.log(`   ❌ Google Sheets: Failed - ${error.message}`);
      return;
    }
    
    console.log('');

    // Test 3: Basic functionality (if configured)
    if (aiService.isConfigured()) {
      console.log('3. Testing AI Service with sample data...');
      try {
        const sampleData = {
          title: 'Sample Game - v1.0 [Developer Name]',
          content: 'This is a sample game description with version 1.0 created by Developer Name. Download links: MEGA, Google Drive.',
          images: [{ src: 'https://example.com/cover.jpg', alt: 'Game Cover' }],
          links: [
            { href: 'https://mega.nz/file/sample', text: 'MEGA Download PC' },
            { href: 'https://drive.google.com/sample', text: 'Google Drive PC' }
          ]
        };
        
        const result = await aiService.extractGameData(sampleData, 'https://example.com');
        
        if (!result || typeof result !== 'object') {
          throw new Error('Invalid result from AI service');
        }
        
        console.log(`   ✅ AI Extraction: Success`);
        console.log(`   📊 Extracted: ${result.game_name} v${result.version}`);
      } catch (error) {
        console.log(`   ❌ AI Extraction Failed: ${error.message}`);
      }
    } else {
      console.log('3. Skipping AI Service test - API key not configured');
    }

    if (googleSheetsService.isConfigured()) {
      console.log('4. Testing Google Sheets connection...');
      try {
        await googleSheetsService.ensureHeaders();
        console.log(`   ✅ Google Sheets: Connection successful`);
      } catch (error) {
        console.log(`   ❌ Google Sheets Failed: ${error.message}`);
      }
    } else {
      console.log('4. Skipping Google Sheets test - credentials not configured');
    }

    console.log('\n🎉 Test completed! Check the results above.');
    console.log('\n📝 Next steps:');
    console.log('   1. Configure missing API keys in .env file');
    console.log('   2. Run "npm start" to launch the web interface');
    console.log('   3. Visit http://localhost:3000 to start scraping');

    // Clean up
    if (scraperService) {
      try {
        await scraperService.close();
        console.log('\n🧹 Cleanup completed successfully');
      } catch (error) {
        console.log(`\n⚠️ Cleanup warning: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run tests
testServices().catch(console.error);
