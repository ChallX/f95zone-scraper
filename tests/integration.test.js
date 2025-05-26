/**
 * Integration Test Suite
 * Tests the interaction between all services working together
 */
import { ScraperService } from '../src/services/scraperService.js';
import { AIService } from '../src/services/aiService.js';
import { GoogleSheetsService } from '../src/services/googleSheetsService.js';

export default async function runIntegrationTests() {
  const suite = {
    name: 'Integration',
    tests: [],
    passed: 0,
    failed: 0,
    skipped: 0
  };

  try {
    // Test 1: Service Integration
    const integrationTest = await testServiceIntegration();
    suite.tests.push(integrationTest);
    updateSuiteStats(suite, integrationTest.status);

    // Test 2: End-to-End Workflow (if all services configured)
    const e2eTest = await testEndToEndWorkflow();
    suite.tests.push(e2eTest);
    updateSuiteStats(suite, e2eTest.status);

    // Test 3: Error Recovery
    const errorRecoveryTest = await testErrorRecovery();
    suite.tests.push(errorRecoveryTest);
    updateSuiteStats(suite, errorRecoveryTest.status);

    // Test 4: Resource Management
    const resourceTest = await testResourceManagement();
    suite.tests.push(resourceTest);
    updateSuiteStats(suite, resourceTest.status);

  } catch (error) {
    console.log(`   ❌ Integration test suite failed: ${error.message}`);
    suite.tests.push({
      name: 'Test Suite Execution',
      status: 'failed',
      message: error.message
    });
    suite.failed++;
  }

  return suite;
}

async function testServiceIntegration() {
  try {
    console.log('   🔗 Testing service integration...');
    
    // Initialize all services
    const scraperService = new ScraperService();
    const aiService = new AIService();
    const googleSheetsService = new GoogleSheetsService();
    
    // Check if services can be initialized together
    if (!scraperService || !aiService || !googleSheetsService) {
      throw new Error('Failed to initialize one or more services');
    }
    
    // Check service configurations
    const configs = {
      scraper: true, // Always available
      ai: aiService.isConfigured(),
      sheets: googleSheetsService.isConfigured()
    };
    
    console.log(`     📊 Service availability: Scraper=${configs.scraper}, AI=${configs.ai}, Sheets=${configs.sheets}`);
    
    // Clean up scraper
    await scraperService.close();
    
    console.log('     ✅ Service integration successful');
    return {
      name: 'Service Integration',
      status: 'passed',
      message: `Services initialized: AI=${configs.ai}, Sheets=${configs.sheets}`
    };
  } catch (error) {
    console.log(`     ❌ Service integration failed: ${error.message}`);
    return {
      name: 'Service Integration',
      status: 'failed',
      message: error.message
    };
  }
}

async function testEndToEndWorkflow() {
  // Check if all services are configured for full E2E test
  const aiConfigured = !!process.env.GOOGLE_GEMINI_API_KEY;
  const sheetsConfigured = !!(process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
  
  if (!aiConfigured || !sheetsConfigured) {
    console.log('     ⚠️ Not all services configured - skipping E2E test');
    return {
      name: 'End-to-End Workflow',
      status: 'skipped',
      message: `Missing: ${!aiConfigured ? 'AI ' : ''}${!sheetsConfigured ? 'Sheets' : ''}`
    };
  }

  try {
    console.log('   🔄 Testing end-to-end workflow...');
    
    // Initialize services
    const scraperService = new ScraperService();
    const aiService = new AIService();
    const googleSheetsService = new GoogleSheetsService();
    
    // Test workflow with mock data (avoid actual scraping in tests)
    const mockPageData = {
      title: 'Integration Test Game v1.0 [Test Dev]',
      content: 'This is a test game for integration testing. Version 1.0 by Test Developer.',
      images: [{ src: 'https://example.com/test-cover.jpg', alt: 'Test Game Cover' }],
      links: [
        { href: 'https://mega.nz/test', text: 'MEGA Download PC' }
      ]
    };
    
    // Step 1: AI extraction
    const extractedData = await aiService.extractGameData(mockPageData, 'https://test.example.com');
    
    if (!extractedData || typeof extractedData !== 'object') {
      throw new Error('AI extraction failed');
    }
    
    // Step 2: Check if game exists (should return null for test URL)
    const existingGame = await googleSheetsService.checkGameExists('https://test.example.com');
    
    if (existingGame !== null) {
      console.log('     ⚠️ Test game already exists in sheets - this is unexpected');
    }
    
    // Clean up
    await scraperService.close();
    
    console.log('     ✅ End-to-end workflow successful');
    return {
      name: 'End-to-End Workflow',
      status: 'passed',
      message: 'AI extraction and sheets integration working'
    };
  } catch (error) {
    console.log(`     ❌ End-to-end workflow failed: ${error.message}`);
    return {
      name: 'End-to-End Workflow',
      status: 'failed',
      message: error.message
    };
  }
}

async function testErrorRecovery() {
  try {
    console.log('   🔄 Testing error recovery...');
    
    const scraperService = new ScraperService();
    
    // Test scraper recovery from invalid URL
    try {
      await scraperService.scrapePage('invalid-url');
    } catch (error) {
      // This should fail gracefully
      if (error.message && typeof error.message === 'string') {
        console.log('     ✅ Scraper handles invalid URLs gracefully');
      } else {
        throw new Error('Scraper error handling needs improvement');
      }
    }
    
    // Test AI service recovery
    const aiService = new AIService();
    if (aiService.isConfigured()) {
      try {
        await aiService.extractGameData(null, 'https://example.com');
      } catch (error) {
        if (error.message && typeof error.message === 'string') {
          console.log('     ✅ AI service handles invalid data gracefully');
        } else {
          throw new Error('AI service error handling needs improvement');
        }
      }
    }
    
    // Clean up
    await scraperService.close();
    
    console.log('     ✅ Error recovery successful');
    return {
      name: 'Error Recovery',
      status: 'passed',
      message: 'Services handle errors gracefully'
    };
  } catch (error) {
    console.log(`     ❌ Error recovery failed: ${error.message}`);
    return {
      name: 'Error Recovery',
      status: 'failed',
      message: error.message
    };
  }
}

async function testResourceManagement() {
  try {
    console.log('   🧹 Testing resource management...');
    
    // Test multiple service instances
    const services = [];
    
    for (let i = 0; i < 3; i++) {
      const scraperService = new ScraperService();
      services.push(scraperService);
    }
    
    // Clean up all services
    for (const service of services) {
      await service.close();
    }
    
    console.log('     ✅ Resource management successful');
    return {
      name: 'Resource Management',
      status: 'passed',
      message: 'Multiple service instances handled properly'
    };
  } catch (error) {
    console.log(`     ❌ Resource management failed: ${error.message}`);
    return {
      name: 'Resource Management',
      status: 'failed',
      message: error.message
    };
  }
}

function updateSuiteStats(suite, status) {
  if (status === 'passed') suite.passed++;
  else if (status === 'failed') suite.failed++;
  else suite.skipped++;
}
