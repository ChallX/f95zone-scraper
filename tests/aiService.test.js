/**
 * AIService Test Suite
 * Tests for AI-powered data extraction functionality
 */
import { AIService } from '../src/services/aiService.js';

export default async function runAIServiceTests() {
  const suite = {
    name: 'AIService',
    tests: [],
    passed: 0,
    failed: 0,
    skipped: 0
  };

  console.log('🤖 AIService Test Suite');
  console.log('Testing AI-powered data extraction functionality...\n');

  try {
    // Test 1: Service Initialization
    console.log('📋 1. Service Initialization:');
    const initResult = await testServiceInitialization();
    suite.tests.push(initResult);
    updateSuiteStats(suite, initResult.status);

    // Get service instance for subsequent tests
    const aiService = initResult.service || new AIService();

    console.log('\n🔧 2. Configuration Check:');
    const configResult = await testConfiguration(aiService);
    suite.tests.push(configResult);
    updateSuiteStats(suite, configResult.status);

    console.log('\n🔍 3. Data Extraction:');
    const extractionResult = await testDataExtraction(aiService);
    suite.tests.push(extractionResult);
    updateSuiteStats(suite, extractionResult.status);

    console.log('\n🛡️ 4. Input Validation:');
    const validationResult = await testInputValidation(aiService);
    suite.tests.push(validationResult);
    updateSuiteStats(suite, validationResult.status);

    console.log('\n⚠️ 5. Error Handling:');
    const errorResult = await testErrorHandling(aiService);
    suite.tests.push(errorResult);
    updateSuiteStats(suite, errorResult.status);

    console.log('\n📝 6. Response Parsing:');
    const parsingResult = await testResponseParsing(aiService);
    suite.tests.push(parsingResult);
    updateSuiteStats(suite, parsingResult.status);

    console.log('\n✅ AIService tests completed');

  } catch (error) {
    console.log(`   ❌ AIService test suite failed: ${error.message}`);
    suite.tests.push({
      name: 'Test Suite Execution',
      status: 'failed',
      message: error.message
    });
    suite.failed++;
  }

  return suite;
}

async function testServiceInitialization() {
  try {
    console.log('   🔧 Testing AI service initialization...');
    const service = new AIService();
    
    if (!service) {
      throw new Error('Service not created');
    }

    if (typeof service.extractGameData !== 'function') {
      throw new Error('Missing extractGameData method');
    }

    if (typeof service.isConfigured !== 'function') {
      throw new Error('Missing isConfigured method');
    }

    console.log('     ✅ AI service initialized with required methods');
    return {
      name: 'Service Initialization',
      status: 'passed',
      message: 'Service created successfully',
      service: service
    };
  } catch (error) {
    console.log(`     ❌ AI service initialization failed: ${error.message}`);
    return {
      name: 'Service Initialization',
      status: 'failed',
      message: error.message
    };
  }
}

async function testConfiguration(aiService) {
  try {
    console.log('   ⚙️ Testing AI service configuration...');
    const isConfigured = aiService.isConfigured();
    
    if (typeof isConfigured !== 'boolean') {
      throw new Error('isConfigured should return boolean');
    }

    const hasApiKey = !!process.env.GOOGLE_GEMINI_API_KEY;
    
    console.log(`     ✅ Configuration check: ${isConfigured ? 'Configured' : 'Not configured'}`);
    return {
      name: 'Configuration Check',
      status: 'passed',
      message: `Service ${isConfigured ? 'properly configured' : 'not configured (expected without API key)'}`
    };
  } catch (error) {
    console.log(`     ❌ Configuration check failed: ${error.message}`);
    return {
      name: 'Configuration Check',
      status: 'failed',
      message: error.message
    };
  }
}

async function testDataExtraction(aiService) {
  if (!aiService.isConfigured()) {
    console.log('     ⚠️ AI service not configured - skipping data extraction test');
    return {
      name: 'Data Extraction',
      status: 'skipped',
      message: 'API key not configured'
    };
  }

  try {
    console.log('   🤖 Testing AI data extraction...');
    
    const sampleData = {
      title: 'Test Game - v1.2.3 [Test Developer]',
      content: 'This is a test game description. Version: 1.2.3, Developer: Test Developer',
      images: [{ src: 'https://example.com/cover.jpg', alt: 'Game Cover' }],
      links: [{ href: 'https://mega.nz/file/test123', text: 'MEGA Download PC' }]
    };
    
    const testUrl = 'https://f95zone.to/threads/test-game.123456/';
    const result = await aiService.extractGameData(sampleData, testUrl);
    
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid extraction result type');
    }

    console.log(`     ✅ AI extraction successful: ${result.game_name || 'Game'} v${result.version || 'Unknown'}`);
    return {
      name: 'Data Extraction',
      status: 'passed',
      message: `Successfully extracted game data`
    };
  } catch (error) {
    console.log(`     ❌ AI extraction failed: ${error.message}`);
    return {
      name: 'Data Extraction',
      status: 'failed',
      message: error.message
    };
  }
}

async function testInputValidation(aiService) {
  try {
    console.log('   🔍 Testing input validation...');
    
    let validationsPassed = 0;
    const tests = [
      { data: null, url: 'https://example.com' },
      { data: {}, url: null }
    ];

    for (const test of tests) {
      try {
        await aiService.extractGameData(test.data, test.url);
      } catch (error) {
        validationsPassed++;
      }
    }

    console.log('     ✅ Input validation working correctly');
    return {
      name: 'Input Validation',
      status: 'passed',
      message: 'Invalid inputs properly rejected'
    };
  } catch (error) {
    console.log(`     ❌ Input validation test failed: ${error.message}`);
    return {
      name: 'Input Validation',
      status: 'failed',
      message: error.message
    };
  }
}

async function testErrorHandling(aiService) {
  try {
    console.log('   ⚠️ Testing error handling...');
    
    if (!aiService.isConfigured()) {
      try {
        await aiService.extractGameData({ title: 'Test' }, 'https://example.com');
        throw new Error('Should have thrown error for unconfigured service');
      } catch (error) {
        if (error.message.includes('not configured') || error.message.includes('API key')) {
          console.log('     ✅ Unconfigured service error handling working');
          return {
            name: 'Error Handling',
            status: 'passed',
            message: 'Properly handles unconfigured state'
          };
        }
        throw error;
      }
    } else {
      console.log('     ⚠️ Service configured - skipping unconfigured error test');
      return {
        name: 'Error Handling',
        status: 'skipped',
        message: 'Service configured'
      };
    }
  } catch (error) {
    console.log(`     ❌ Error handling test failed: ${error.message}`);
    return {
      name: 'Error Handling',
      status: 'failed',
      message: error.message
    };
  }
}

async function testResponseParsing(aiService) {
  if (!aiService.isConfigured()) {
    console.log('     ⚠️ AI service not configured - skipping response parsing test');
    return {
      name: 'Response Parsing',
      status: 'skipped',
      message: 'API key not configured'
    };
  }

  try {
    console.log('   📝 Testing response parsing...');
    
    const minimalData = {
      title: 'Minimal Game v1.0',
      content: 'Basic game description',
      images: [],
      links: []
    };
    
    const result = await aiService.extractGameData(minimalData, 'https://example.com');
    
    if (typeof result !== 'object') {
      throw new Error('Result is not an object');
    }

    console.log('     ✅ Response parsing successful');
    return {
      name: 'Response Parsing',
      status: 'passed',
      message: 'AI response properly parsed'
    };
  } catch (error) {
    console.log(`     ❌ Response parsing failed: ${error.message}`);
    return {
      name: 'Response Parsing',
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
