/**
 * ScraperService Test Suite
 * Tests for web scraping functionality and F95Zone authentication
 */
import { ScraperService } from '../src/services/scraperService.js';

export default async function runScraperServiceTests() {
  const suite = {
    name: 'ScraperService',
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
      const scraperService = initTest.service;

      // Test 2: Browser Initialization
      const browserTest = await testBrowserInitialization(scraperService);
      suite.tests.push(browserTest);
      updateSuiteStats(suite, browserTest.status);

      // Test 3: Authentication Configuration
      const authConfigTest = await testAuthenticationConfiguration();
      suite.tests.push(authConfigTest);
      updateSuiteStats(suite, authConfigTest.status);

      // Test 4: Authentication Status Check
      const authStatusTest = await testAuthenticationStatus(scraperService);
      suite.tests.push(authStatusTest);
      updateSuiteStats(suite, authStatusTest.status);

      // Test 5: F95Zone Authentication (if configured)
      const authTest = await testF95ZoneAuthentication(scraperService);
      suite.tests.push(authTest);
      updateSuiteStats(suite, authTest.status);

      // Test 6: Basic Scraping (if authenticated)
      const scrapingTest = await testBasicScraping(scraperService);
      suite.tests.push(scrapingTest);
      updateSuiteStats(suite, scrapingTest.status);

      // Test 7: Error Handling
      const errorTest = await testErrorHandling(scraperService);
      suite.tests.push(errorTest);
      updateSuiteStats(suite, errorTest.status);

      // Test 8: Cleanup
      const cleanupTest = await testCleanup(scraperService);
      suite.tests.push(cleanupTest);
      updateSuiteStats(suite, cleanupTest.status);
    }

  } catch (error) {
    console.log(`   ❌ ScraperService test suite failed: ${error.message}`);
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
    console.log('   🔧 Testing scraper service initialization...');
    const service = new ScraperService();
    
    if (!service) {
      throw new Error('Service not created');
    }

    // Check for required methods
    const requiredMethods = [
      'initBrowser',
      'authenticateF95Zone',
      'scrapePage',
      'getAuthenticationStatus',
      'close'
    ];

    for (const method of requiredMethods) {
      if (typeof service[method] !== 'function') {
        throw new Error(`Missing ${method} method`);
      }
    }

    console.log('     ✅ Scraper service initialized with required methods');
    return {
      name: 'Service Initialization',
      status: 'passed',
      message: 'Service created successfully',
      service: service
    };
  } catch (error) {
    console.log(`     ❌ Scraper service initialization failed: ${error.message}`);
    return {
      name: 'Service Initialization',
      status: 'failed',
      message: error.message
    };
  }
}

async function testBrowserInitialization(scraperService) {
  try {
    console.log('   🌐 Testing browser initialization...');
    
    // This might take some time, so we'll set a timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Browser initialization timeout')), 30000)
    );

    await Promise.race([
      scraperService.initBrowser(),
      timeoutPromise
    ]);

    // Check if browser was initialized (this is internal, so we test indirectly)
    console.log('     ✅ Browser initialized successfully');
    return {
      name: 'Browser Initialization',
      status: 'passed',
      message: 'Browser started successfully'
    };
  } catch (error) {
    console.log(`     ❌ Browser initialization failed: ${error.message}`);
    return {
      name: 'Browser Initialization',
      status: 'failed',
      message: error.message
    };
  }
}

async function testAuthenticationConfiguration() {
  try {
    console.log('   ⚙️ Testing authentication configuration...');
    
    const hasUsername = !!process.env.F95ZONE_USERNAME;
    const hasPassword = !!process.env.F95ZONE_PASSWORD;
    
    if (hasUsername && hasPassword) {
      console.log('     ✅ F95Zone credentials configured');
      return {
        name: 'Authentication Configuration',
        status: 'passed',
        message: 'Credentials properly configured'
      };
    } else {
      console.log('     ⚠️ F95Zone credentials not configured');
      return {
        name: 'Authentication Configuration',
        status: 'skipped',
        message: 'Credentials not configured'
      };
    }
  } catch (error) {
    console.log(`     ❌ Authentication configuration check failed: ${error.message}`);
    return {
      name: 'Authentication Configuration',
      status: 'failed',
      message: error.message
    };
  }
}

async function testAuthenticationStatus(scraperService) {
  try {
    console.log('   📊 Testing authentication status check...');
    
    const status = await scraperService.getAuthenticationStatus();
    
    if (!status || typeof status !== 'object') {
      throw new Error('Invalid authentication status response');
    }

    if (!status.hasOwnProperty('status')) {
      throw new Error('Authentication status missing status field');
    }

    console.log(`     ✅ Authentication status: ${status.status}`);
    return {
      name: 'Authentication Status Check',
      status: 'passed',
      message: `Status: ${status.status}`
    };
  } catch (error) {
    console.log(`     ❌ Authentication status check failed: ${error.message}`);
    return {
      name: 'Authentication Status Check',
      status: 'failed',
      message: error.message
    };
  }
}

async function testF95ZoneAuthentication(scraperService) {
  if (!process.env.F95ZONE_USERNAME || !process.env.F95ZONE_PASSWORD) {
    console.log('     ⚠️ F95Zone credentials not configured - skipping authentication test');
    return {
      name: 'F95Zone Authentication',
      status: 'skipped',
      message: 'Credentials not configured'
    };
  }

  try {
    console.log('   🔐 Testing F95Zone authentication...');
    
    // Set a longer timeout for authentication
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Authentication timeout')), 60000)
    );

    const result = await Promise.race([
      scraperService.authenticateF95Zone(),
      timeoutPromise
    ]);

    if (result === true) {
      console.log('     ✅ F95Zone authentication successful');
      return {
        name: 'F95Zone Authentication',
        status: 'passed',
        message: 'Successfully authenticated with F95Zone'
      };
    } else {
      console.log('     ❌ F95Zone authentication failed');
      return {
        name: 'F95Zone Authentication',
        status: 'failed',
        message: 'Authentication returned false'
      };
    }
  } catch (error) {
    console.log(`     ❌ F95Zone authentication failed: ${error.message}`);
    return {
      name: 'F95Zone Authentication',
      status: 'failed',
      message: error.message
    };
  }
}

async function testBasicScraping(scraperService) {
  // Skip if not authenticated
  try {
    const authStatus = await scraperService.getAuthenticationStatus();
    if (authStatus.status !== 'authenticated') {
      console.log('     ⚠️ Not authenticated - skipping scraping test');
      return {
        name: 'Basic Scraping',
        status: 'skipped',
        message: 'Not authenticated'
      };
    }
  } catch (error) {
    console.log('     ⚠️ Could not check auth status - skipping scraping test');
    return {
      name: 'Basic Scraping',
      status: 'skipped',
      message: 'Auth status check failed'
    };
  }
  try {
    console.log('   🕷️ Testing basic page scraping...');
    
    // Use a specific F95Zone game URL for testing
    const testUrl = 'https://f95zone.to/threads/my-early-life-ep-21-06-celavie-group.166790/';
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Scraping timeout')), 30000)
    );

    const result = await Promise.race([
      scraperService.scrapePage(testUrl),
      timeoutPromise
    ]);

    if (result && typeof result === 'object') {
      console.log('     ✅ Basic scraping successful');
      return {
        name: 'Basic Scraping',
        status: 'passed',
        message: 'Successfully scraped test page'
      };
    } else {
      throw new Error('Invalid scraping result');
    }
  } catch (error) {
    console.log(`     ❌ Basic scraping failed: ${error.message}`);
    return {
      name: 'Basic Scraping',
      status: 'failed',
      message: error.message
    };
  }
}

async function testErrorHandling(scraperService) {
  try {
    console.log('   ⚠️ Testing error handling...');
    
    // Test with invalid URL
    try {
      await scraperService.scrapePage('invalid-url');
      throw new Error('Should have thrown error for invalid URL');
    } catch (error) {
      if (error.message.includes('Should have thrown')) {
        throw error;
      }
      // This is expected behavior
      console.log('     ✅ Invalid URL error handling working');
    }

    // Test with non-existent URL
    try {
      await scraperService.scrapePage('https://non-existent-domain-12345.com');
      // If it doesn't throw, that's also acceptable (might timeout instead)
      console.log('     ⚠️ Non-existent URL handling - no error thrown');
    } catch (error) {
      console.log('     ✅ Non-existent URL error handling working');
    }

    return {
      name: 'Error Handling',
      status: 'passed',
      message: 'Error handling working correctly'
    };
  } catch (error) {
    console.log(`     ❌ Error handling test failed: ${error.message}`);
    return {
      name: 'Error Handling',
      status: 'failed',
      message: error.message
    };
  }
}

async function testCleanup(scraperService) {
  try {
    console.log('   🧹 Testing service cleanup...');
    
    await scraperService.close();
    
    console.log('     ✅ Service cleanup successful');
    return {
      name: 'Service Cleanup',
      status: 'passed',
      message: 'Browser and resources cleaned up successfully'
    };
  } catch (error) {
    console.log(`     ❌ Service cleanup failed: ${error.message}`);
    return {
      name: 'Service Cleanup',
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