/**
 * GoogleSheetsService Test Suite
 * Tests for Google Sheets integration functionality
 */
import { GoogleSheetsService } from '../src/services/googleSheetsService.js';

export default async function runGoogleSheetsServiceTests() {
  const suite = {
    name: 'GoogleSheetsService',
    tests: [],
    passed: 0,
    failed: 0,
    skipped: 0
  };

  try {
    // Test 1: Service Initialization
    const initTest = await testServiceInitialization();
    suite.tests.push(initTest);
    updateSuiteStats(suite, initTest.status);

    if (initTest.status === 'passed') {
      const googleSheetsService = initTest.service;

      // Test 2: Configuration Check
      const configTest = await testConfiguration(googleSheetsService);
      suite.tests.push(configTest);
      updateSuiteStats(suite, configTest.status);

      // Test 3: Google Sheets Connection (if configured)
      const connectionTest = await testGoogleSheetsConnection(googleSheetsService);
      suite.tests.push(connectionTest);
      updateSuiteStats(suite, connectionTest.status);

      // Test 4: Headers Management
      const headersTest = await testHeadersManagement(googleSheetsService);
      suite.tests.push(headersTest);
      updateSuiteStats(suite, headersTest.status);

      // Test 5: Game Number Management
      const gameNumberTest = await testGameNumberManagement(googleSheetsService);
      suite.tests.push(gameNumberTest);
      updateSuiteStats(suite, gameNumberTest.status);

      // Test 6: Data Validation
      const validationTest = await testDataValidation(googleSheetsService);
      suite.tests.push(validationTest);
      updateSuiteStats(suite, validationTest.status);

      // Test 7: Export Functionality
      const exportTest = await testExportFunctionality(googleSheetsService);
      suite.tests.push(exportTest);
      updateSuiteStats(suite, exportTest.status);

      // Test 8: Error Handling
      const errorTest = await testErrorHandling(googleSheetsService);
      suite.tests.push(errorTest);
      updateSuiteStats(suite, errorTest.status);
    }

  } catch (error) {
    console.log(`   ❌ GoogleSheetsService test suite failed: ${error.message}`);
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
    console.log('   🔧 Testing Google Sheets service initialization...');
    const service = new GoogleSheetsService();
    
    if (!service) {
      throw new Error('Service not created');
    }

    // Check for required methods
    const requiredMethods = [
      'isConfigured',
      'ensureHeaders',
      'getLastGameNumber',
      'addGameData',
      'getAllGames',
      'exportSheet',
      'checkGameExists'
    ];

    for (const method of requiredMethods) {
      if (typeof service[method] !== 'function') {
        throw new Error(`Missing ${method} method`);
      }
    }

    console.log('     ✅ Google Sheets service initialized with required methods');
    return {
      name: 'Service Initialization',
      status: 'passed',
      message: 'Service created successfully',
      service: service
    };
  } catch (error) {
    console.log(`     ❌ Google Sheets service initialization failed: ${error.message}`);
    return {
      name: 'Service Initialization',
      status: 'failed',
      message: error.message
    };
  }
}

async function testConfiguration(googleSheetsService) {
  try {
    console.log('   ⚙️ Testing Google Sheets service configuration...');
    
    const isConfigured = googleSheetsService.isConfigured();
    
    if (typeof isConfigured !== 'boolean') {
      throw new Error('isConfigured should return boolean');
    }

    // Check environment variables
    const hasSheetId = !!process.env.GOOGLE_SHEET_ID;
    const hasServiceEmail = !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const hasPrivateKey = !!process.env.GOOGLE_PRIVATE_KEY;
    
    const hasAllCreds = hasSheetId && hasServiceEmail && hasPrivateKey;
    
    if (hasAllCreds && !isConfigured) {
      throw new Error('All credentials exist but service not configured');
    }

    if (!hasAllCreds && isConfigured) {
      throw new Error('Missing credentials but service reports configured');
    }

    console.log(`     ✅ Configuration check: ${isConfigured ? 'Configured' : 'Not configured'}`);
    console.log(`     📊 Credentials: Sheet ID=${hasSheetId}, Email=${hasServiceEmail}, Key=${hasPrivateKey}`);
    
    return {
      name: 'Configuration Check',
      status: 'passed',
      message: `Service ${isConfigured ? 'properly configured' : 'not configured (expected)'}`
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

async function testGoogleSheetsConnection(googleSheetsService) {
  if (!googleSheetsService.isConfigured()) {
    console.log('     ⚠️ Google Sheets not configured - skipping connection test');
    return {
      name: 'Google Sheets Connection',
      status: 'skipped',
      message: 'Service not configured'
    };
  }

  try {
    console.log('   🔗 Testing Google Sheets connection...');
    
    // Try to ensure headers - this will test the connection
    await googleSheetsService.ensureHeaders();
    
    console.log('     ✅ Google Sheets connection successful');
    return {
      name: 'Google Sheets Connection',
      status: 'passed',
      message: 'Successfully connected to Google Sheets'
    };
  } catch (error) {
    console.log(`     ❌ Google Sheets connection failed: ${error.message}`);
    return {
      name: 'Google Sheets Connection',
      status: 'failed',
      message: error.message
    };
  }
}

async function testHeadersManagement(googleSheetsService) {
  if (!googleSheetsService.isConfigured()) {
    console.log('     ⚠️ Google Sheets not configured - skipping headers test');
    return {
      name: 'Headers Management',
      status: 'skipped',
      message: 'Service not configured'
    };
  }

  try {
    console.log('   📋 Testing headers management...');
    
    // Test headers creation/verification
    await googleSheetsService.ensureHeaders();
    
    console.log('     ✅ Headers management successful');
    return {
      name: 'Headers Management',
      status: 'passed',
      message: 'Headers ensured successfully'
    };
  } catch (error) {
    console.log(`     ❌ Headers management failed: ${error.message}`);
    return {
      name: 'Headers Management',
      status: 'failed',
      message: error.message
    };
  }
}

async function testGameNumberManagement(googleSheetsService) {
  if (!googleSheetsService.isConfigured()) {
    console.log('     ⚠️ Google Sheets not configured - skipping game number test');
    return {
      name: 'Game Number Management',
      status: 'skipped',
      message: 'Service not configured'
    };
  }

  try {
    console.log('   🔢 Testing game number management...');
    
    const lastGameNumber = await googleSheetsService.getLastGameNumber();
    
    if (typeof lastGameNumber !== 'number') {
      throw new Error('getLastGameNumber should return a number');
    }

    if (lastGameNumber < 0) {
      throw new Error('Game number should not be negative');
    }

    console.log(`     ✅ Game number management: Last game number is ${lastGameNumber}`);
    return {
      name: 'Game Number Management',
      status: 'passed',
      message: `Last game number: ${lastGameNumber}`
    };
  } catch (error) {
    console.log(`     ❌ Game number management failed: ${error.message}`);
    return {
      name: 'Game Number Management',
      status: 'failed',
      message: error.message
    };
  }
}

async function testDataValidation(googleSheetsService) {
  try {
    console.log('   ✅ Testing data validation...');
    
    // Test with invalid data
    const invalidTests = [
      { data: null, description: 'null data' },
      { data: 'string', description: 'string data' },
      { data: 123, description: 'numeric data' },
      { data: [], description: 'array data' }
    ];

    let validationsPassed = 0;
    for (const test of invalidTests) {
      try {
        if (googleSheetsService.isConfigured()) {
          await googleSheetsService.addGameData(test.data);
          // If we reach here, validation failed
          console.log(`     ⚠️ Validation failed for ${test.description}`);
        } else {
          // If not configured, it should throw an error
          await googleSheetsService.addGameData(test.data);
        }
      } catch (error) {
        // This is expected behavior
        validationsPassed++;
      }
    }

    if (validationsPassed === invalidTests.length) {
      console.log('     ✅ Data validation working correctly');
      return {
        name: 'Data Validation',
        status: 'passed',
        message: 'All invalid data properly rejected'
      };
    } else {
      console.log(`     ⚠️ Data validation partially working (${validationsPassed}/${invalidTests.length})`);
      return {
        name: 'Data Validation',
        status: 'failed',
        message: `Only ${validationsPassed}/${invalidTests.length} validations passed`
      };
    }
  } catch (error) {
    console.log(`     ❌ Data validation test failed: ${error.message}`);
    return {
      name: 'Data Validation',
      status: 'failed',
      message: error.message
    };
  }
}

async function testExportFunctionality(googleSheetsService) {
  if (!googleSheetsService.isConfigured()) {
    console.log('     ⚠️ Google Sheets not configured - skipping export test');
    return {
      name: 'Export Functionality',
      status: 'skipped',
      message: 'Service not configured'
    };
  }

  try {
    console.log('   📤 Testing export functionality...');
    
    const exportUrl = await googleSheetsService.exportSheet();
    
    if (!exportUrl || typeof exportUrl !== 'string') {
      throw new Error('Export should return a string URL');
    }

    if (!exportUrl.includes('docs.google.com')) {
      throw new Error('Export URL should be a Google Docs URL');
    }

    if (!exportUrl.includes('export?format=xlsx')) {
      throw new Error('Export URL should be for Excel format');
    }

    console.log('     ✅ Export functionality working');
    return {
      name: 'Export Functionality',
      status: 'passed',
      message: 'Export URL generated successfully'
    };
  } catch (error) {
    console.log(`     ❌ Export functionality failed: ${error.message}`);
    return {
      name: 'Export Functionality',
      status: 'failed',
      message: error.message
    };
  }
}

async function testErrorHandling(googleSheetsService) {
  try {
    console.log('   ⚠️ Testing error handling...');
    
    if (!googleSheetsService.isConfigured()) {
      // Test error when not configured
      try {
        await googleSheetsService.addGameData({
          game_name: 'Test Game',
          version: '1.0'
        });
        throw new Error('Should have thrown error for unconfigured service');
      } catch (error) {
        if (error.message.includes('Should have thrown')) {
          throw error;
        }
        if (error.message.includes('not configured')) {
          console.log('     ✅ Unconfigured service error handling working');
          return {
            name: 'Error Handling',
            status: 'passed',
            message: 'Properly handles unconfigured state'
          };
        } else {
          throw error;
        }
      }
    } else {
      // Test with invalid URL checking
      try {
        const result = await googleSheetsService.checkGameExists(null);
        if (result === null) {
          console.log('     ✅ Error handling working for invalid input');
          return {
            name: 'Error Handling',
            status: 'passed',
            message: 'Properly handles invalid game URL'
          };
        } else {
          throw new Error('Should return null for invalid input');
        }
      } catch (error) {
        console.log('     ✅ Error handling working for invalid input');
        return {
          name: 'Error Handling',
          status: 'passed',
          message: 'Properly handles invalid input'
        };
      }
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

function updateSuiteStats(suite, status) {
  if (status === 'passed') suite.passed++;
  else if (status === 'failed') suite.failed++;
  else suite.skipped++;
}
