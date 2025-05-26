/**
 * F95Zone Scraper - Main Test Runner
 * Orchestrates all test suites and provides comprehensive testing
 */
import dotenv from 'dotenv';
import runAIServiceTests from './aiService.test.js';
import runScraperServiceTests from './scraperService.test.js';
import runGoogleSheetsServiceTests from './googleSheetsService.test.js';
import runIntegrationTests from './integration.test.js';

// Load environment variables
dotenv.config();

async function runAllTests() {
  console.log('🧪 F95Zone Scraper - Comprehensive Test Suite\n');
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  const testResults = {
    suites: [],
    totalTests: 0,
    totalPassed: 0,
    totalFailed: 0,
    totalSkipped: 0,
    duration: 0
  };

  try {
    // Pre-flight checks
    console.log('\n📋 Pre-flight Environment Check:');
    await performEnvironmentCheck();    // Run all test suites
    const testSuites = [
      { name: 'AIService', runner: runAIServiceTests },
      { name: 'ScraperService', runner: runScraperServiceTests },
      { name: 'GoogleSheetsService', runner: runGoogleSheetsServiceTests },
      { name: 'Integration', runner: runIntegrationTests }
    ];
    for (const testSuite of testSuites) {
      console.log('\n' + '=' .repeat(60));
      console.log(`🔍 Running ${testSuite.name} Tests`);
      console.log('=' .repeat(60));
      
      const suiteStartTime = Date.now();
      
      try {
        console.log(`⏳ Starting ${testSuite.name} test suite...`);
        const suiteResult = await testSuite.runner();
        const suiteDuration = Date.now() - suiteStartTime;
        
        console.log(`⏱️ ${testSuite.name} tests completed in ${suiteDuration}ms`);
        
        testResults.suites.push(suiteResult);
        
        // Update totals
        testResults.totalTests += suiteResult.tests.length;
        testResults.totalPassed += suiteResult.passed;
        testResults.totalFailed += suiteResult.failed;
        testResults.totalSkipped += suiteResult.skipped;
        
        // Display suite summary
        displaySuiteSummary(suiteResult);
        
      } catch (error) {
        console.log(`❌ ${testSuite.name} test suite crashed: ${error.message}`);
        console.log(`Stack trace: ${error.stack}`);
        testResults.suites.push({
          name: testSuite.name,
          tests: [],
          passed: 0,
          failed: 1,
          skipped: 0,
          error: error.message
        });
        testResults.totalFailed++;
      }
    }

    // Calculate duration
    testResults.duration = Date.now() - startTime;

    // Display final results
    displayFinalResults(testResults);

  } catch (error) {
    console.error('\n❌ Test suite execution failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

async function performEnvironmentCheck() {
  const envChecks = [
    { name: 'Google Gemini API Key', key: 'GOOGLE_GEMINI_API_KEY', required: false },
    { name: 'Google Sheet ID', key: 'GOOGLE_SHEET_ID', required: false },
    { name: 'Google Service Email', key: 'GOOGLE_SERVICE_ACCOUNT_EMAIL', required: false },
    { name: 'Google Private Key', key: 'GOOGLE_PRIVATE_KEY', required: false },
    { name: 'F95Zone Username', key: 'F95ZONE_USERNAME', required: false },
    { name: 'F95Zone Password', key: 'F95ZONE_PASSWORD', required: false }
  ];

  let configuredCount = 0;
  
  envChecks.forEach(check => {
    const isConfigured = !!process.env[check.key];
    const status = isConfigured ? '✅' : (check.required ? '❌' : '⚠️');
    const label = isConfigured ? 'Configured' : (check.required ? 'MISSING (Required)' : 'Not Configured');
    
    console.log(`   ${status} ${check.name}: ${label}`);
    
    if (isConfigured) configuredCount++;
  });

  console.log(`\n📊 Configuration Summary: ${configuredCount}/${envChecks.length} services configured`);
  
  if (configuredCount === 0) {
    console.log('⚠️  Note: Tests will run with limited functionality due to missing configuration');
  } else if (configuredCount < envChecks.length) {
    console.log('ℹ️  Some services not configured - related tests will be skipped');
  } else {
    console.log('🎉 All services configured - full test coverage available');
  }
}function displaySuiteSummary(suiteResult) {
  const { name, tests, passed, failed, skipped } = suiteResult;
  
  console.log(`\n📊 ${name} Test Results:`);
  console.log(`   Total Tests: ${tests.length}`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   ⚠️ Skipped: ${skipped}`);
  
  if (suiteResult.error) {
    console.log(`   💥 Suite Error: ${suiteResult.error}`);
  }
  
  // Show individual test results if there are failures
  if (failed > 0) {
    console.log('\n   Failed Tests:');
    tests.filter(test => test.status === 'failed').forEach(test => {
      console.log(`     ❌ ${test.name}: ${test.message}`);
    });
  }
  
  // Calculate success rate
  const successRate = tests.length > 0 ? Math.round((passed / tests.length) * 100) : 0;
  console.log(`   Success Rate: ${successRate}%`);
}

function displayFinalResults(testResults) {
  const { suites, totalTests, totalPassed, totalFailed, totalSkipped, duration } = testResults;
  
  console.log('\n' + '=' .repeat(60));
  console.log('🎯 FINAL TEST RESULTS');
  console.log('=' .repeat(60));
  
  console.log(`\n📈 Overall Statistics:`);
  console.log(`   Total Test Suites: ${suites.length}`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   ✅ Passed: ${totalPassed}`);
  console.log(`   ❌ Failed: ${totalFailed}`);
  console.log(`   ⚠️ Skipped: ${totalSkipped}`);
  console.log(`   ⏱️ Duration: ${(duration / 1000).toFixed(2)}s`);
  
  // Calculate overall success rate
  const overallSuccessRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
  console.log(`   Success Rate: ${overallSuccessRate}%`);
  
  // Suite breakdown
  console.log(`\n📋 Suite Breakdown:`);
  suites.forEach(suite => {
    const suiteSuccess = suite.tests.length > 0 ? Math.round((suite.passed / suite.tests.length) * 100) : 0;
    const status = suite.failed === 0 ? '✅' : (suite.passed > 0 ? '⚠️' : '❌');
    console.log(`   ${status} ${suite.name}: ${suite.passed}/${suite.tests.length} (${suiteSuccess}%)`);
  });
  
  // Final verdict
  console.log('\n' + '=' .repeat(60));
  if (totalFailed === 0) {
    console.log('🎉 ALL TESTS PASSED! Your F95Zone Scraper is working perfectly.');
  } else if (totalPassed > totalFailed) {
    console.log('⚠️ TESTS PARTIALLY PASSED. Some functionality may need attention.');
  } else {
    console.log('❌ TESTS FAILED. Critical issues detected that need fixing.');
  }
  
  // Recommendations
  console.log('\n📝 Recommendations:');
  
  if (totalSkipped > 0) {
    console.log('   • Configure missing environment variables to enable skipped tests');
  }
  
  if (totalFailed > 0) {
    console.log('   • Review failed tests and fix underlying issues');
    console.log('   • Check logs for detailed error information');
  }
  
  if (totalFailed === 0 && totalSkipped === 0) {
    console.log('   • All systems operational - ready for production use!');
    console.log('   • Run "npm start" to launch the web interface');
  }
  
  console.log('=' .repeat(60));
}

// Run the test suite
runAllTests().catch(error => {
  console.error('\n💥 Unexpected error during test execution:', error);
  process.exit(1);
});
