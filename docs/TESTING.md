# Testing Guide

This guide covers how to run tests, write new tests, and understand the testing strategy for the F95Zone Scraper project.

## Overview

The project uses a comprehensive testing strategy that includes:

- **Unit Tests** - Test individual functions and classes
- **Integration Tests** - Test service interactions
- **End-to-End Tests** - Test complete workflows
- **Manual Testing** - GUI and user experience testing

## Running Tests

### Quick Test Run

Run all tests with a single command:

```cmd
npm test
```

This executes the complete test suite and provides a summary of results.

### Individual Test Suites

Run specific test categories:

```cmd
# All unit tests
npm run test:unit

# Integration tests only
npm run test:integration

# Specific service tests
node tests/aiService.test.js
node tests/scraperService.test.js
node tests/googleSheetsService.test.js
```

### Development Testing

For continuous testing during development:

```cmd
# Watch mode - reruns tests on file changes
npm run test:watch

# Debug mode with detailed output
npm run test:debug
```

### Test Output Interpretation

#### Successful Test Run
```
🧪 F95Zone Scraper Test Suite
========================================

✅ AI Service Tests
   ✅ Service Initialization: PASSED
   ✅ Configuration Check: PASSED
   ✅ Data Extraction: PASSED

✅ Scraper Service Tests  
   ✅ Service Initialization: PASSED
   ✅ F95Zone Authentication: PASSED
   ✅ Basic Scraping: PASSED

✅ Google Sheets Service Tests
   ✅ Service Initialization: PASSED
   ✅ Headers Setup: PASSED
   ✅ Data Operations: PASSED

✅ Integration Tests
   ✅ End-to-End Workflow: PASSED

========================================
📊 Test Results: 12 passed, 0 failed
✅ All tests completed successfully!
```

#### Failed Test Run
```
❌ AI Service Tests
   ❌ Configuration Check: FAILED - Google Gemini API key not configured
   
❌ Google Sheets Service Tests  
   ❌ Service Initialization: FAILED - Invalid private key format

========================================
📊 Test Results: 8 passed, 4 failed
❌ Some tests failed - check configuration
```

## Test Categories

### Unit Tests

#### AI Service Tests (`tests/aiService.test.js`)

Tests the Google Gemini AI integration:

```javascript
async function testAIServiceInitialization() {
  try {
    const aiService = new AIService();
    
    // Test service creation
    assert(aiService !== null, 'AI service should be created');
    
    // Test configuration check
    const isConfigured = aiService.isConfigured();
    console.log(`   📝 AI Service configured: ${isConfigured}`);
    
    return {
      name: 'AI Service Initialization',
      status: 'passed',
      message: 'Service created successfully'
    };
  } catch (error) {
    return {
      name: 'AI Service Initialization', 
      status: 'failed',
      message: error.message
    };
  }
}
```

**What it tests:**
- Service initialization
- Configuration validation
- API key verification
- Data extraction functionality

#### Scraper Service Tests (`tests/scraperService.test.js`)

Tests web scraping functionality:

```javascript
async function testF95ZoneAuthentication(scraperService) {
  if (!process.env.F95ZONE_USERNAME || !process.env.F95ZONE_PASSWORD) {
    return {
      name: 'F95Zone Authentication',
      status: 'skipped',
      message: 'Credentials not configured'
    };
  }

  try {
    const result = await scraperService.authenticateF95Zone();
    
    if (result === true) {
      return {
        name: 'F95Zone Authentication',
        status: 'passed',
        message: 'Successfully authenticated with F95Zone'
      };
    } else {
      return {
        name: 'F95Zone Authentication',
        status: 'failed', 
        message: 'Authentication returned false'
      };
    }
  } catch (error) {
    return {
      name: 'F95Zone Authentication',
      status: 'failed',
      message: error.message
    };
  }
}
```

**What it tests:**
- Browser initialization
- F95Zone authentication
- Page scraping
- Download size detection
- Error handling

#### Google Sheets Service Tests (`tests/googleSheetsService.test.js`)

Tests Google Sheets integration:

```javascript
async function testGoogleSheetsInitialization() {
  try {
    const sheetsService = new GoogleSheetsService();
    
    // Test service creation
    assert(sheetsService !== null, 'Google Sheets service should be created');
    
    // Test configuration
    const isConfigured = sheetsService.isConfigured();
    console.log(`   📊 Google Sheets configured: ${isConfigured}`);
    
    if (isConfigured) {
      // Test connection
      await sheetsService.ensureHeaders();
      console.log('   ✅ Successfully connected to Google Sheets');
    }
    
    return {
      name: 'Google Sheets Initialization',
      status: 'passed',
      message: 'Service initialized successfully'
    };
  } catch (error) {
    return {
      name: 'Google Sheets Initialization',
      status: 'failed',
      message: error.message
    };
  }
}
```

**What it tests:**
- Service initialization
- Authentication with Google APIs
- Spreadsheet access
- Data operations (read/write)
- Header management

### Integration Tests (`tests/integration.test.js`)

Tests complete workflows and service interactions:

```javascript
async function testEndToEndWorkflow() {
  try {
    console.log('   🔄 Testing complete scraping workflow...');
    
    // Initialize all services
    const scraperService = new ScraperService();
    const aiService = new AIService();
    const sheetsService = new GoogleSheetsService();
    
    // Check prerequisites
    if (!aiService.isConfigured()) {
      throw new Error('AI service not configured');
    }
    
    if (!sheetsService.isConfigured()) {
      throw new Error('Google Sheets not configured');
    }
    
    // Test with a known F95Zone URL
    const testUrl = 'https://f95zone.to/threads/my-early-life-ep-21-06-celavie-group.166790/';
    
    // Step 1: Scrape page
    console.log('     📄 Scraping test page...');
    const pageData = await scraperService.scrapePage(testUrl);
    
    // Step 2: Extract data with AI
    console.log('     🤖 Extracting data with AI...');
    const gameData = await aiService.extractGameData(pageData, testUrl);
    
    // Step 3: Validate extracted data
    assert(gameData.game_name, 'Game name should be extracted');
    assert(gameData.url === testUrl, 'URL should match');
    
    console.log(`     ✅ Successfully extracted: ${gameData.game_name}`);
    
    return {
      name: 'End-to-End Workflow',
      status: 'passed',
      message: `Successfully processed: ${gameData.game_name}`
    };
    
  } catch (error) {
    return {
      name: 'End-to-End Workflow',
      status: 'failed',
      message: error.message
    };
  }
}
```

**What it tests:**
- Complete scraping workflow
- Service integration
- Data flow between services
- Error propagation
- Real-world scenarios

## Writing New Tests

### Test Structure

Follow this pattern for new tests:

```javascript
// tests/newFeature.test.js
import { NewService } from '../src/services/newService.js';
import { Logger } from '../src/utils/logger.js';

const logger = new Logger();

async function testNewFeatureFunction() {
  try {
    // Arrange
    const service = new NewService();
    const input = { /* test data */ };
    
    // Act
    const result = await service.newMethod(input);
    
    // Assert
    assert(result.success === true, 'Should return success');
    assert(result.data !== null, 'Should return data');
    
    return {
      name: 'New Feature Function',
      status: 'passed',
      message: 'Function works correctly'
    };
    
  } catch (error) {
    logger.error('Test failed:', error);
    return {
      name: 'New Feature Function',
      status: 'failed', 
      message: error.message
    };
  }
}

// Export for test runner
export { testNewFeatureFunction };
```

### Test Data Management

Create reusable test data:

```javascript
// tests/testData.js
export const TestData = {
  // Valid F95Zone URLs for testing
  validUrls: [
    'https://f95zone.to/threads/test-game.123456/',
    'https://f95zone.to/threads/another-game.789012/'
  ],
  
  // Mock page data
  mockPageData: {
    title: 'Test Game v1.0 [Developer Name]',
    content: 'This is a test game with 3DCG graphics...',
    url: 'https://f95zone.to/threads/test-game.123456/',
    images: [
      { src: 'https://attachments.f95zone.to/test-image.jpg', alt: 'Preview' }
    ],
    links: [
      { href: 'https://mega.nz/test-download', text: 'MEGA Download' }
    ]
  },
  
  // Expected extraction results
  expectedGameData: {
    game_name: 'Test Game',
    version: 'v1.0',
    developer: 'Developer Name',
    tags: ['3dcg', 'male protagonist'],
    description: 'This is a test game...'
  },
  
  // Invalid test cases
  invalidUrls: [
    'https://invalid-domain.com/game',
    'not-a-url',
    'https://f95zone.to/invalid-path'
  ]
};
```

### Mocking External Services

For testing without external dependencies:

```javascript
// tests/mocks/mockAIService.js
export class MockAIService {
  constructor() {
    this.configured = true;
  }
  
  isConfigured() {
    return this.configured;
  }
  
  async extractGameData(pageData, url) {
    // Return predictable test data
    return {
      game_name: 'Mock Game',
      version: 'v1.0',
      developer: 'Mock Developer',
      tags: ['test', 'mock'],
      description: 'Mock game description',
      url: url,
      scraped_at: new Date().toISOString()
    };
  }
}
```

### Async Test Patterns

Handle asynchronous operations properly:

```javascript
async function testAsyncOperation() {
  try {
    // Test with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Test timeout')), 10000)
    );
    
    const operationPromise = service.performAsyncOperation();
    
    const result = await Promise.race([operationPromise, timeoutPromise]);
    
    assert(result !== null, 'Should return result');
    
    return {
      name: 'Async Operation',
      status: 'passed',
      message: 'Operation completed successfully'
    };
    
  } catch (error) {
    return {
      name: 'Async Operation',
      status: 'failed',
      message: error.message
    };
  }
}
```

## Test Configuration

### Environment Setup

Create test-specific environment:

```env
# .env.test
NODE_ENV=test
LOG_LEVEL=warn
HEADLESS=true
TIMEOUT=30000
SCRAPE_DELAY=1000

# Test-specific credentials (if available)
GOOGLE_GEMINI_API_KEY=test-api-key
F95ZONE_USERNAME=test-username
F95ZONE_PASSWORD=test-password
```

### Test Database/Sheets

Use separate Google Sheet for testing:

```env
# Test Google Sheets configuration
GOOGLE_SHEET_ID=test-sheet-id-here
GOOGLE_SHEET_NAME=TestSheet
```

### CI/CD Configuration

For automated testing in CI/CD pipelines:

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
        env:
          GOOGLE_GEMINI_API_KEY: ${{ secrets.GOOGLE_GEMINI_API_KEY }}
          GOOGLE_SHEET_ID: ${{ secrets.TEST_GOOGLE_SHEET_ID }}
```

## Performance Testing

### Load Testing

Test system under load:

```javascript
async function testHighVolumeProcessing() {
  try {
    const urls = Array(10).fill(0).map((_, i) => 
      `https://f95zone.to/threads/test-game-${i}.${123456 + i}/`
    );
    
    const startTime = Date.now();
    
    // Process multiple URLs concurrently
    const promises = urls.map(url => processUrl(url));
    const results = await Promise.allSettled(promises);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`   📊 Processed ${urls.length} URLs in ${duration}ms`);
    console.log(`   ✅ Successful: ${successful}, ❌ Failed: ${failed}`);
    
    return {
      name: 'High Volume Processing',
      status: successful >= urls.length * 0.8 ? 'passed' : 'failed',
      message: `${successful}/${urls.length} successful in ${duration}ms`
    };
    
  } catch (error) {
    return {
      name: 'High Volume Processing',
      status: 'failed',
      message: error.message
    };
  }
}
```

### Memory Testing

Monitor memory usage:

```javascript
function testMemoryUsage() {
  const initialMemory = process.memoryUsage();
  
  // Perform memory-intensive operation
  performLargeDataProcessing();
  
  const finalMemory = process.memoryUsage();
  const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
  
  console.log(`   💾 Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
  
  // Verify memory increase is reasonable
  const maxAcceptableIncrease = 100 * 1024 * 1024; // 100MB
  
  return {
    name: 'Memory Usage Test',
    status: memoryIncrease < maxAcceptableIncrease ? 'passed' : 'failed',
    message: `Memory increased by ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`
  };
}
```

## Manual Testing

### GUI Testing Checklist

Test the web interface manually:

#### System Status Panel
- [ ] All services show correct status
- [ ] Status updates in real-time
- [ ] Error states display properly
- [ ] Authentication status is accurate

#### Scraping Interface
- [ ] URL input accepts valid F95Zone URLs
- [ ] Invalid URLs show appropriate errors
- [ ] Progress bar updates during scraping
- [ ] Real-time progress messages appear
- [ ] Results display correctly after completion

#### Game Management
- [ ] Games list loads and displays properly
- [ ] Lazy loading works for images
- [ ] Delete functionality works
- [ ] Refresh updates the list
- [ ] Download button generates correct URL

#### Error Handling
- [ ] Network errors display user-friendly messages
- [ ] Service configuration errors are clear
- [ ] Rate limiting shows appropriate warnings
- [ ] Authentication failures provide guidance

### Browser Compatibility Testing

Test across different browsers:

- **Chrome** (recommended)
- **Firefox**
- **Safari** (if available)
- **Edge**

#### Mobile Responsiveness
- [ ] Interface works on mobile devices
- [ ] Buttons are touch-friendly
- [ ] Text is readable without zooming
- [ ] Navigation works with touch

### Performance Testing

#### User Experience
- [ ] Pages load within 3 seconds
- [ ] Interactions feel responsive
- [ ] No blocking operations on UI
- [ ] Smooth animations and transitions

#### Stress Testing
- [ ] Multiple simultaneous scraping operations
- [ ] Large datasets (100+ games)
- [ ] Extended usage sessions
- [ ] Recovery from errors

## Debugging Tests

### Test Debugging

Enable debug mode for failing tests:

```cmd
set DEBUG_MODE=true && npm test
```

This provides:
- Detailed error logs
- Screenshots of browser state
- Network request/response details
- Step-by-step execution logs

### Common Test Failures

#### Authentication Failures
```
❌ F95Zone Authentication: FAILED - Authentication returned false
```

**Solutions:**
- Check F95Zone credentials in .env
- Verify account is not banned
- Test manual login at f95zone.to
- Disable 2FA temporarily

#### API Failures
```
❌ AI Service Configuration: FAILED - Google Gemini API key not configured
```

**Solutions:**
- Verify GOOGLE_GEMINI_API_KEY in .env
- Check API key validity at Google AI Studio
- Confirm API quotas not exceeded

#### Network Timeouts
```
❌ Basic Scraping: FAILED - Navigation timeout
```

**Solutions:**
- Increase TIMEOUT value
- Check internet connection
- Try different test URLs
- Enable debug mode to see browser

### Test Data Cleanup

Clean up test data after runs:

```javascript
async function cleanupTestData() {
  try {
    // Remove test entries from Google Sheets
    const testEntries = await sheetsService.getAllGames();
    const testData = testEntries.filter(game => 
      game.game_name.includes('Test') || 
      game.url.includes('test-game')
    );
    
    for (const game of testData) {
      await sheetsService.deleteGame(game.game_number);
    }
    
    console.log(`🧹 Cleaned up ${testData.length} test entries`);
    
  } catch (error) {
    console.warn('Test cleanup failed:', error.message);
  }
}
```

## Continuous Testing

### Pre-commit Testing

Set up Git hooks for automatic testing:

```bash
# .git/hooks/pre-commit
#!/bin/sh
npm run test:quick
if [ $? -ne 0 ]; then
  echo "Tests failed. Commit aborted."
  exit 1
fi
```

### Automated Testing Schedule

Run comprehensive tests regularly:

```bash
# Weekly comprehensive test
0 2 * * 0 cd /path/to/project && npm test > test-results.log 2>&1
```

### Test Coverage Monitoring

Track test coverage over time:

```cmd
# Generate coverage report
npm run test:coverage

# View coverage in browser
npm run coverage:open
```

## Test Best Practices

### Test Organization
- Group related tests together
- Use descriptive test names
- Keep tests independent
- Clean up after tests

### Test Data
- Use realistic test data
- Avoid hardcoded values
- Create reusable test fixtures
- Mock external dependencies

### Assertions
- Test one thing at a time
- Use meaningful error messages
- Verify both positive and negative cases
- Test edge cases and boundaries

### Performance
- Keep tests fast
- Use timeouts appropriately
- Parallelize when possible
- Clean up resources

### Maintenance
- Update tests with code changes
- Review and refactor tests regularly
- Remove obsolete tests
- Document test requirements
