# Configuration Guide

This guide covers all configuration options available in the F95Zone Scraper application.

## Overview

The application is configured through environment variables defined in the `.env` file. This guide provides comprehensive details about each configuration option.

## Environment Variables

### Server Configuration

```env
# =============================================================================
# SERVER CONFIGURATION
# =============================================================================

# Port the web server will listen on
# Default: 3000
PORT=3000

# Node.js environment
# Options: development, production, test
# Default: development
NODE_ENV=development

# Logging level
# Options: error, warn, info, debug
# Default: info
LOG_LEVEL=info
```

**Details:**
- **PORT**: Change if port 3000 is already in use
- **NODE_ENV**: Affects logging, error handling, and performance optimizations
- **LOG_LEVEL**: Controls verbosity of application logs

### Google Gemini AI Configuration

```env
# =============================================================================
# GOOGLE GEMINI AI (Required)
# =============================================================================

# Google Gemini API key for AI-powered data extraction
GOOGLE_GEMINI_API_KEY=your-google-gemini-api-key-here
```

**Details:**
- **Required**: Yes - Application cannot function without this
- **Free Tier**: 1 million tokens per month
- **Rate Limit**: 15 requests per minute
- **How to Get**: Visit [Google AI Studio](https://aistudio.google.com/app/apikey)

### F95Zone Authentication Configuration

```env
# =============================================================================
# F95ZONE AUTHENTICATION (Optional but Recommended)
# =============================================================================

# F95Zone username for accessing protected content
F95ZONE_USERNAME=your-f95zone-username

# F95Zone password
F95ZONE_PASSWORD=your-f95zone-password
```

**Details:**
- **Required**: No - But recommended for full functionality
- **Benefits**: Access to download links, member content, better reliability
- **Security**: Stored locally only, not shared with third parties
- **Account**: Free F95Zone account required

### Google Sheets Integration Configuration

```env
# =============================================================================
# GOOGLE SHEETS INTEGRATION (Required)
# =============================================================================

# Google Sheet ID where game data will be stored
GOOGLE_SHEET_ID=your-google-sheet-id-here

# Sheet name within the spreadsheet
# Default: Sheet1
GOOGLE_SHEET_NAME=Sheet1

# Google Cloud Project ID
GOOGLE_PROJECT_ID=your-google-project-id

# Service account private key ID
GOOGLE_PRIVATE_KEY_ID=your-private-key-id

# Service account private key (keep quotes and formatting)
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key-content-here\n-----END PRIVATE KEY-----\n"

# Service account email address
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com

# Service account client ID
GOOGLE_CLIENT_ID=your-client-id

# Service account email (same as GOOGLE_CLIENT_EMAIL)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
```

**Details:**
- **Required**: Yes for data storage functionality
- **Setup**: Requires Google Cloud Service Account
- **Permissions**: Service account needs "Editor" access to the spreadsheet
- **Format**: Private key must maintain exact formatting with newlines

### Scraping Configuration

```env
# =============================================================================
# SCRAPING CONFIGURATION (Optional)
# =============================================================================

# Delay between requests to avoid overwhelming the server (milliseconds)
# Default: 2000 (2 seconds)
SCRAPE_DELAY=2000

# Maximum number of retry attempts for failed requests
# Default: 3
MAX_RETRIES=3

# Timeout for page loading (milliseconds)
# Default: 30000 (30 seconds)
TIMEOUT=30000

# Run browser in headless mode
# Options: true, false
# Default: true
HEADLESS=true

# User agent string for web scraping
# Default: Modern Chrome user agent
USER_AGENT=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36
```

**Details:**
- **SCRAPE_DELAY**: Prevents rate limiting and shows respect for F95Zone servers
- **MAX_RETRIES**: Handles temporary network issues and authentication problems
- **TIMEOUT**: Adjust based on your internet connection speed
- **HEADLESS**: Set to `false` for debugging browser interactions
- **USER_AGENT**: Modern browser identification for better compatibility

### Advanced Configuration

```env
# =============================================================================
# ADVANCED CONFIGURATION (Optional)
# =============================================================================

# Maximum file size for download size detection (bytes)
# Default: 10737418240 (10 GB)
MAX_FILE_SIZE=10737418240

# Number of concurrent download size checks
# Default: 3
CONCURRENT_SIZE_CHECKS=3

# Enable debug mode for troubleshooting
# Options: true, false
# Default: false
DEBUG_MODE=false

# Custom Chrome executable path (if needed)
# Default: Auto-detected
CHROME_EXECUTABLE_PATH=

# Enable detailed request logging
# Options: true, false
# Default: false
LOG_REQUESTS=false

# Custom proxy configuration (if needed)
# Format: protocol://username:password@host:port
PROXY_URL=
```

**Details:**
- **MAX_FILE_SIZE**: Prevents checking extremely large files that could timeout
- **CONCURRENT_SIZE_CHECKS**: Balance between speed and server load
- **DEBUG_MODE**: Enables additional logging and screenshots for debugging
- **CHROME_EXECUTABLE_PATH**: Useful for custom Chrome installations
- **LOG_REQUESTS**: Helpful for debugging network issues
- **PROXY_URL**: Required in corporate environments with proxy servers

## Configuration Examples

### Development Environment

```env
# Development configuration
NODE_ENV=development
LOG_LEVEL=debug
HEADLESS=false
DEBUG_MODE=true
LOG_REQUESTS=true
SCRAPE_DELAY=3000
```

### Production Environment

```env
# Production configuration
NODE_ENV=production
LOG_LEVEL=info
HEADLESS=true
DEBUG_MODE=false
LOG_REQUESTS=false
SCRAPE_DELAY=2000
MAX_RETRIES=2
```

### High-Performance Setup

```env
# Optimized for speed
SCRAPE_DELAY=1000
CONCURRENT_SIZE_CHECKS=5
TIMEOUT=20000
MAX_RETRIES=2
```

### Conservative Setup

```env
# Gentle on servers
SCRAPE_DELAY=5000
CONCURRENT_SIZE_CHECKS=1
TIMEOUT=60000
MAX_RETRIES=5
```

## Configuration Validation

The application validates configuration on startup:

### Required Variables

These must be set for the application to function:

- `GOOGLE_GEMINI_API_KEY`
- `GOOGLE_SHEET_ID`
- `GOOGLE_PROJECT_ID`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`

### Optional Variables

These have sensible defaults:

- `PORT` → 3000
- `NODE_ENV` → development
- `LOG_LEVEL` → info
- `SCRAPE_DELAY` → 2000
- `MAX_RETRIES` → 3
- `TIMEOUT` → 30000
- `HEADLESS` → true

### Validation Errors

Common validation errors and solutions:

**"Invalid private key format"**
- Ensure private key includes BEGIN/END markers
- Check for proper newline escaping (`\n`)
- Verify quotes around the entire key

**"Google Sheets not configured"**
- Check all Google Sheets variables are set
- Verify service account has access to the spreadsheet

**"Invalid timeout value"**
- Must be a positive number
- Recommended range: 10000-60000 (10-60 seconds)

## Environment-Specific Configuration

### Using Multiple Environments

Create separate `.env` files for different environments:

```
.env.development
.env.production
.env.test
```

Load specific environment:

```cmd
# Development
set NODE_ENV=development && npm start

# Production
set NODE_ENV=production && npm start

# Testing
set NODE_ENV=test && npm test
```

### Docker Configuration

When using Docker, pass environment variables:

```dockerfile
# Dockerfile
ENV NODE_ENV=production
ENV PORT=3000
ENV HEADLESS=true
```

Or use docker-compose:

```yaml
# docker-compose.yml
services:
  scraper:
    environment:
      - NODE_ENV=production
      - PORT=3000
      - GOOGLE_GEMINI_API_KEY=${GOOGLE_GEMINI_API_KEY}
```

## Security Considerations

### Sensitive Data Protection

**Do:**
- Keep `.env` files out of version control
- Use secure file permissions (600 on Unix systems)
- Rotate API keys regularly
- Use environment-specific configurations

**Don't:**
- Commit credentials to repositories
- Share `.env` files via email or chat
- Use production credentials in development
- Log sensitive configuration values

### Access Control

**Google Service Account:**
- Grant minimum required permissions
- Regularly audit access logs
- Use separate accounts for different environments

**F95Zone Credentials:**
- Use unique password for this purpose
- Enable 2FA on the account
- Monitor account activity

## Performance Tuning

### Memory Usage

For large datasets, adjust Node.js memory:

```cmd
set NODE_OPTIONS=--max-old-space-size=4096 && npm start
```

### Network Optimization

```env
# Faster but more aggressive
SCRAPE_DELAY=1000
TIMEOUT=15000
CONCURRENT_SIZE_CHECKS=5

# Slower but more reliable
SCRAPE_DELAY=5000
TIMEOUT=45000
CONCURRENT_SIZE_CHECKS=2
```

### Database Performance

```env
# Batch operations for better performance
BATCH_SIZE=10
BULK_INSERT=true
```

## Troubleshooting Configuration

### Common Issues

**Port Already in Use:**
```env
PORT=3001  # Change to available port
```

**Timeout Issues:**
```env
TIMEOUT=60000  # Increase timeout
SCRAPE_DELAY=3000  # Reduce server load
```

**Rate Limiting:**
```env
SCRAPE_DELAY=5000  # Increase delay
MAX_RETRIES=5  # More retry attempts
```

**Memory Issues:**
```env
DEBUG_MODE=false  # Reduce memory usage
LOG_LEVEL=warn    # Less verbose logging
```

### Debugging Configuration

Enable debug mode for troubleshooting:

```env
DEBUG_MODE=true
LOG_LEVEL=debug
LOG_REQUESTS=true
HEADLESS=false
```

This will:
- Show browser window during scraping
- Log all network requests
- Take screenshots on errors
- Provide detailed error information

### Configuration Testing

Test your configuration:

```cmd
npm run config-test
```

Or check individual services:

```cmd
npm run test:auth
npm run test:sheets
npm run test:ai
```

## Default Configuration

Complete `.env.example` file:

```env
# =============================================================================
# SERVER CONFIGURATION
# =============================================================================
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# =============================================================================
# GOOGLE GEMINI AI (Required)
# =============================================================================
GOOGLE_GEMINI_API_KEY=your-google-gemini-api-key-here

# =============================================================================
# F95ZONE AUTHENTICATION (Optional)
# =============================================================================
F95ZONE_USERNAME=your-f95zone-username
F95ZONE_PASSWORD=your-f95zone-password

# =============================================================================
# GOOGLE SHEETS INTEGRATION (Required)
# =============================================================================
GOOGLE_SHEET_ID=your-google-sheet-id-here
GOOGLE_SHEET_NAME=Sheet1
GOOGLE_PROJECT_ID=your-google-project-id
GOOGLE_PRIVATE_KEY_ID=your-private-key-id
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key-content-here\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com

# =============================================================================
# SCRAPING CONFIGURATION (Optional)
# =============================================================================
SCRAPE_DELAY=2000
MAX_RETRIES=3
TIMEOUT=30000
HEADLESS=true
```

Copy this to `.env` and customize for your setup.
