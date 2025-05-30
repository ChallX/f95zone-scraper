# Development Guide

This guide covers development setup, contributing guidelines, and technical details for developers working on the F95Zone Scraper project.

## Development Setup

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher
- **Git** for version control
- **VS Code** (recommended IDE)
- **Chrome/Chromium** for Puppeteer

### Development Environment Setup

1. **Clone the repository:**
   ```cmd
   git clone <repository-url>
   cd f95zone-scraper
   ```

2. **Install dependencies:**
   ```cmd
   npm install
   ```

3. **Set up development environment:**
   ```cmd
   copy .env.example .env.development
   ```

4. **Configure development settings:**
   ```env
   NODE_ENV=development
   LOG_LEVEL=debug
   HEADLESS=false
   DEBUG_MODE=true
   LOG_REQUESTS=true
   ```

5. **Start development server:**
   ```cmd
   npm run dev
   ```

### Development Tools

#### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.debugger-for-chrome"
  ]
}
```

#### Development Scripts

```json
{
  "scripts": {
    "dev": "NODE_ENV=development nodemon src/index.js",
    "debug": "NODE_ENV=development node --inspect src/index.js",
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "node tests/test.js",
    "test:integration": "node tests/integration.test.js",
    "test:watch": "nodemon tests/test.js",
    "lint": "eslint src/ tests/",
    "format": "prettier --write src/ tests/ public/",
    "docs": "jsdoc -d docs/api src/",
    "build": "npm run lint && npm run test"
  }
}
```

### Code Style and Standards

#### JavaScript Style Guide

- **ES6+ modules** with import/export
- **Async/await** for asynchronous operations
- **Destructuring** for object/array operations
- **Template literals** for string formatting
- **Arrow functions** for inline functions
- **Consistent naming** (camelCase for variables, PascalCase for classes)

#### Code Formatting

Use Prettier with this configuration:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

#### Linting Rules

ESLint configuration:

```json
{
  "extends": ["eslint:recommended"],
  "env": {
    "es2022": true,
    "node": true
  },
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### Project Architecture

#### Directory Structure

```
f95zone-scraper/
├── src/                     # Source code
│   ├── index.js             # Main server application
│   ├── services/            # Business logic services
│   │   ├── aiService.js     # AI data extraction
│   │   ├── scraperService.js # Web scraping
│   │   └── googleSheetsService.js # Sheets integration
│   └── utils/               # Utility functions
│       └── logger.js        # Logging utility
├── public/                  # Frontend assets
│   ├── index.html           # Main HTML file
│   ├── app.js               # Frontend JavaScript
│   └── styles.css           # Styling
├── tests/                   # Test suites
│   ├── test.js              # Main test runner
│   ├── aiService.test.js    # AI service tests
│   ├── scraperService.test.js # Scraper tests
│   ├── googleSheetsService.test.js # Sheets tests
│   └── integration.test.js  # Integration tests
├── docs/                    # Documentation
├── logs/                    # Application logs
└── package.json             # Project configuration
```

#### Service Layer Architecture

```javascript
// Service base pattern
export class BaseService {
  constructor() {
    this.logger = new Logger();
    this.initialize();
  }

  async initialize() {
    // Service-specific initialization
  }

  isConfigured() {
    // Check if service is properly configured
  }
}
```

#### Error Handling Pattern

```javascript
// Consistent error handling
try {
  const result = await service.performOperation();
  return { success: true, data: result };
} catch (error) {
  this.logger.error('Operation failed:', error);
  throw new Error(`Operation failed: ${error.message}`);
}
```

### Development Workflow

#### Feature Development

1. **Create feature branch:**
   ```cmd
   git checkout -b feature/new-feature-name
   ```

2. **Write tests first (TDD):**
   ```javascript
   // tests/newFeature.test.js
   async function testNewFeature() {
     // Arrange
     const service = new NewService();
     
     // Act
     const result = await service.newMethod();
     
     // Assert
     assert(result.success === true);
   }
   ```

3. **Implement feature:**
   ```javascript
   // src/services/newService.js
   export class NewService {
     async newMethod() {
       // Implementation
     }
   }
   ```

4. **Test implementation:**
   ```cmd
   npm run test:watch
   ```

5. **Update documentation:**
   - Add JSDoc comments
   - Update relevant markdown files
   - Add API documentation if needed

#### Code Review Process

1. **Self-review checklist:**
   - [ ] Code follows style guidelines
   - [ ] Tests are written and passing
   - [ ] Documentation is updated
   - [ ] No console.log statements
   - [ ] Error handling is implemented
   - [ ] Performance considerations addressed

2. **Create pull request:**
   - Clear title and description
   - Link to related issues
   - Include screenshots if UI changes
   - Add reviewers

### Testing Strategy

#### Unit Tests

Test individual functions and classes:

```javascript
// Example unit test
async function testAIService() {
  const aiService = new AIService();
  
  // Mock data
  const mockPageData = {
    title: 'Test Game',
    content: 'Game description...'
  };
  
  try {
    const result = await aiService.extractGameData(mockPageData, 'test-url');
    
    assert(result.game_name, 'Should extract game name');
    assert(result.developer, 'Should extract developer');
    assert(Array.isArray(result.tags), 'Tags should be array');
    
    return { name: 'AI Service Unit Test', status: 'passed' };
  } catch (error) {
    return { name: 'AI Service Unit Test', status: 'failed', error: error.message };
  }
}
```

#### Integration Tests

Test service interactions:

```javascript
// Example integration test
async function testEndToEndScraping() {
  const scraper = new ScraperService();
  const ai = new AIService();
  const sheets = new GoogleSheetsService();
  
  try {
    // Test complete workflow
    const pageData = await scraper.scrapePage(testUrl);
    const gameData = await ai.extractGameData(pageData, testUrl);
    const result = await sheets.addGameData(gameData);
    
    assert(result.success, 'End-to-end process should succeed');
    
    return { name: 'End-to-End Test', status: 'passed' };
  } catch (error) {
    return { name: 'End-to-End Test', status: 'failed', error: error.message };
  }
}
```

#### Test Data Management

Create test data factories:

```javascript
// testData.js
export const TestData = {
  validF95ZoneUrl: 'https://f95zone.to/threads/test-game.123456/',
  
  mockPageData: {
    title: 'Test Game v1.0',
    content: 'Test game description...',
    images: [],
    links: []
  },
  
  expectedGameData: {
    game_name: 'Test Game',
    version: 'v1.0',
    developer: 'Test Developer',
    tags: ['test', '3dcg'],
    description: 'Test game description...'
  }
};
```

### API Development

#### Adding New Endpoints

1. **Define route:**
   ```javascript
   // src/index.js
   app.get('/api/new-endpoint', async (req, res) => {
     try {
       const result = await newService.performOperation(req.query);
       res.json({ success: true, data: result });
     } catch (error) {
       logger.error('New endpoint error:', error);
       res.status(500).json({ 
         error: 'Operation failed', 
         details: error.message 
       });
     }
   });
   ```

2. **Add input validation:**
   ```javascript
   const validateInput = (req, res, next) => {
     if (!req.query.requiredParam) {
       return res.status(400).json({ 
         error: 'Missing required parameter' 
       });
     }
     next();
   };
   
   app.get('/api/new-endpoint', validateInput, handlerFunction);
   ```

3. **Document API:**
   ```markdown
   ## New Endpoint
   
   **URL:** `/api/new-endpoint`
   **Method:** `GET`
   **Parameters:**
   - `requiredParam` (string, required) - Description
   
   **Response:**
   ```json
   {
     "success": true,
     "data": { ... }
   }
   ```

#### Frontend Integration

1. **Add frontend method:**
   ```javascript
   // public/app.js
   class F95Scraper {
     async callNewEndpoint(param) {
       try {
         const response = await fetch(`/api/new-endpoint?param=${param}`);
         const data = await response.json();
         return data;
       } catch (error) {
         console.error('API call failed:', error);
         throw error;
       }
     }
   }
   ```

2. **Add UI elements:**
   ```html
   <!-- public/index.html -->
   <button id="newFeatureBtn" class="btn btn-primary">
     <i class="fas fa-star me-2"></i>New Feature
   </button>
   ```

### Database and Sheets Development

#### Schema Management

Define data structures:

```javascript
// schemas/gameSchema.js
export const GameSchema = {
  game_number: 'number',
  game_name: 'string',
  version: 'string',
  developer: 'string',
  tags: 'array',
  description: 'string',
  download_links: 'array',
  total_size_gb: 'string',
  url: 'string',
  scraped_at: 'string'
};
```

#### Data Validation

```javascript
// utils/validator.js
export class DataValidator {
  static validateGameData(data) {
    const required = ['game_name', 'url'];
    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    
    return true;
  }
}
```

### Performance Optimization

#### Memory Management

```javascript
// Memory-efficient data processing
class EfficientProcessor {
  async processLargeDataset(items) {
    const batchSize = 10;
    const results = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await this.processBatch(batch);
      results.push(...batchResults);
      
      // Allow garbage collection
      if (i % 100 === 0) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }
    
    return results;
  }
}
```

#### Caching Strategy

```javascript
// Simple in-memory cache
class CacheManager {
  constructor(maxSize = 100, ttl = 300000) { // 5 minutes TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }
  
  set(key, value) {
    // Implement LRU eviction
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
}
```

### Security Considerations

#### Input Sanitization

```javascript
// utils/sanitizer.js
export class InputSanitizer {
  static sanitizeUrl(url) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname !== 'f95zone.to') {
        throw new Error('Invalid domain');
      }
      return parsed.toString();
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  }
  
  static sanitizeString(str, maxLength = 1000) {
    if (typeof str !== 'string') return '';
    return str.trim().substring(0, maxLength);
  }
}
```

#### Rate Limiting

```javascript
// utils/rateLimiter.js
export class RateLimiter {
  constructor(maxRequests = 15, windowMs = 60000) {
    this.requests = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  isAllowed(key) {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];
    
    // Clean old requests
    const validRequests = userRequests.filter(
      time => now - time < this.windowMs
    );
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
}
```

### Debugging and Logging

#### Debug Configuration

```javascript
// utils/debugger.js
export class Debugger {
  constructor() {
    this.isDebugMode = process.env.DEBUG_MODE === 'true';
  }
  
  async capturePageScreenshot(page, filename) {
    if (!this.isDebugMode) return;
    
    try {
      await page.screenshot({ 
        path: `debug-${filename}-${Date.now()}.png`,
        fullPage: true
      });
    } catch (error) {
      console.warn('Screenshot capture failed:', error.message);
    }
  }
  
  logRequestDetails(url, method, headers) {
    if (!this.isDebugMode) return;
    
    console.log('🌐 Request Details:', {
      url,
      method,
      headers: this.sanitizeHeaders(headers)
    });
  }
}
```

#### Structured Logging

```javascript
// Enhanced logger
export class Logger {
  constructor() {
    this.level = process.env.LOG_LEVEL || 'info';
  }
  
  info(message, metadata = {}) {
    this.log('INFO', message, metadata);
  }
  
  error(message, error = null) {
    const metadata = error ? {
      stack: error.stack,
      name: error.name,
      message: error.message
    } : {};
    
    this.log('ERROR', message, metadata);
  }
  
  log(level, message, metadata) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...metadata
    };
    
    console.log(JSON.stringify(logEntry));
  }
}
```

### Contributing Guidelines

#### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature  
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] New tests added for changes
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes without migration path
```

#### Commit Message Format

```
type(scope): subject

body

footer
```

Examples:
```
feat(scraper): add retry mechanism for failed requests
fix(auth): handle session expiry correctly
docs(api): update endpoint documentation
test(sheets): add integration tests for data validation
```

### Release Process

#### Version Management

Follow semantic versioning (semver):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

#### Release Checklist

1. **Pre-release:**
   - [ ] All tests passing
   - [ ] Documentation updated
   - [ ] CHANGELOG updated
   - [ ] Version bumped
   - [ ] Security audit completed

2. **Release:**
   - [ ] Tag created
   - [ ] Release notes published
   - [ ] Dependencies updated
   - [ ] Deployment tested

3. **Post-release:**
   - [ ] Monitor for issues
   - [ ] Update documentation
   - [ ] Communicate changes

### Development Best Practices

#### Code Quality

- Write self-documenting code
- Use meaningful variable names
- Keep functions small and focused
- Avoid deep nesting
- Handle errors gracefully
- Comment complex logic

#### Performance

- Profile critical paths
- Use appropriate data structures
- Implement caching where beneficial
- Monitor memory usage
- Optimize database queries

#### Security

- Validate all inputs
- Use parameterized queries
- Implement rate limiting
- Log security events
- Keep dependencies updated

#### Maintenance

- Regular dependency updates
- Monitor error logs
- Review performance metrics
- Update documentation
- Refactor when needed
