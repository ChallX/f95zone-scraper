# Setup Guide

Complete installation and configuration guide for the F95Zone Game Scraper.

## Prerequisites

### System Requirements

- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher (comes with Node.js)
- **Git** (for cloning the repository)
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

### Required Services

1. **Google Gemini API** (Free)
   - No credit card required
   - 1 million tokens/month free tier
   - 15 requests/minute rate limit

2. **Google Cloud Account** (Free tier available)
   - For Google Sheets API access
   - Service account setup required

3. **F95Zone Account** (Optional but recommended)
   - Free account registration
   - Required for accessing protected content

## Installation

### 1. Clone the Repository

```bash
# Using HTTPS
git clone https://github.com/yourusername/f95zone-scraper.git
cd f95zone-scraper

# Or using SSH
git clone git@github.com:yourusername/f95zone-scraper.git
cd f95zone-scraper
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Express.js (web server)
- Puppeteer (web scraping)
- Google Generative AI (AI extraction)
- Google APIs (Sheets integration)
- And other dependencies

### 3. Environment Configuration

#### Create Environment File

```bash
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

#### Configure Environment Variables

Edit the `.env` file with your credentials:

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
GOOGLE_PROJECT_ID=your-google-project-id
GOOGLE_PRIVATE_KEY_ID=your-private-key-id
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key-content-here\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_SHEET_NAME=Sheet1

# =============================================================================
# SCRAPING CONFIGURATION (Optional)
# =============================================================================
SCRAPE_DELAY=2000
MAX_RETRIES=3
TIMEOUT=30000
HEADLESS=true
```

## Service Setup

### 1. Google Gemini API Setup

#### Step 1: Get API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Select your Google Cloud project (or create new one)
4. Copy the generated API key
5. Add to `.env` file: `GOOGLE_GEMINI_API_KEY=your-key-here`

#### Step 2: Verify Setup

The API key provides:
- ✅ **Free Tier**: 1 million tokens per month
- ✅ **Rate Limits**: 15 requests per minute
- ✅ **No Credit Card**: Required only for paid tier

### 2. Google Sheets API Setup

#### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "New Project" 
3. Enter project name (e.g., "f95zone-scraper")
4. Click "Create"

#### Step 2: Enable Google Sheets API

1. In Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click on it and press "Enable"
4. Also enable "Google Drive API" (for file access)

#### Step 3: Create Service Account

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Fill in details:
   - **Service account name**: `f95zone-scraper`
   - **Service account ID**: `f95zone-scraper`
   - **Description**: `Service account for F95Zone scraper`
4. Click "Create and Continue"
5. Skip optional steps, click "Done"

#### Step 4: Generate Service Account Key

1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" → "Create New Key"
4. Select "JSON" format
5. Click "Create" - JSON file will download

#### Step 5: Extract Credentials

Open the downloaded JSON file and copy these values to your `.env`:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "f95zone-scraper@your-project.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  ...
}
```

Map to `.env` variables:
- `project_id` → `GOOGLE_PROJECT_ID`
- `private_key_id` → `GOOGLE_PRIVATE_KEY_ID`
- `private_key` → `GOOGLE_PRIVATE_KEY`
- `client_email` → `GOOGLE_CLIENT_EMAIL` and `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `client_id` → `GOOGLE_CLIENT_ID`

#### Step 6: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it (e.g., "F95Zone Games Database")
4. Copy the sheet ID from URL:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
   ```
5. Add to `.env`: `GOOGLE_SHEET_ID=SHEET_ID_HERE`

#### Step 7: Share Sheet with Service Account

1. In your Google Sheet, click "Share"
2. Add your service account email (from `client_email`)
3. Set permission to "Editor"
4. Uncheck "Notify people"
5. Click "Share"

### 3. F95Zone Account Setup (Optional)

#### Benefits of Authentication
- Access to download links (often in spoiler tags)
- Complete file size information
- Member-only content access
- Better scraping reliability
- Reduced rate limiting

#### Setup Steps

1. **Create Account** (if needed):
   - Go to [F95Zone Registration](https://f95zone.to/register/)
   - Fill in registration form
   - Verify email address

2. **Add Credentials**:
   ```env
   F95ZONE_USERNAME=your-username
   F95ZONE_PASSWORD=your-password
   ```

3. **Security Notes**:
   - Credentials stored locally only
   - No data sent to external services
   - Session managed automatically
   - Optional - scraper works without it

## Verification

### 1. Start the Application

```bash
npm start
```

Expected output:
```
🚀 F95Zone Scraper Server running on http://localhost:3000
📝 Open the web interface to start scraping!
```

### 2. Check System Status

1. Open browser to `http://localhost:3000`
2. Look at "System Status" panel
3. Verify all services show as "operational":
   - ✅ **Scraper**: operational
   - ✅ **F95Zone Auth**: authenticated/not configured
   - ✅ **AI Service**: operational
   - ✅ **Google Sheets**: operational

### 3. Run Tests

```bash
npm test
```

This will run comprehensive tests covering:
- Service initialization
- API connectivity
- Authentication
- Data processing
- Error handling

### 4. Test Scraping

1. Find a F95Zone game URL (e.g., `https://f95zone.to/threads/game-name.123456/`)
2. Enter URL in the web interface
3. Click "Extract Game Data"
4. Monitor progress and verify completion
5. Check Google Sheets for new data

## Troubleshooting Setup

### Common Issues

#### 1. Dependencies Installation Failed

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 2. Google Sheets Access Denied

- Verify service account email is shared with the sheet
- Check that Google Sheets API is enabled
- Ensure private key format is correct (includes `\n` characters)

#### 3. F95Zone Authentication Failed

- Verify username/password are correct
- Check if account is verified
- Try logging in manually on F95Zone website first

#### 4. Port Already in Use

```bash
# Change port in .env file
PORT=3001

# Or find and kill process using port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

#### 5. Puppeteer Installation Issues

```bash
# Install Puppeteer with Chromium
npm install puppeteer --force

# Or use system Chrome
npm install puppeteer-core
```

### Log Files

Check these files for detailed error information:
- `logs/app.log` - General application logs
- `logs/error.log` - Error-specific logs

### Debug Mode

Enable debug logging:

```bash
# Windows
set LOG_LEVEL=debug && npm start

# macOS/Linux
LOG_LEVEL=debug npm start
```

## Next Steps

After successful setup:

1. **Read the [User Guide](USAGE.md)** - Learn how to use the web interface
2. **Check [API Documentation](API.md)** - For programmatic access
3. **Review [Configuration Guide](CONFIGURATION.md)** - For advanced options
4. **See [Development Guide](DEVELOPMENT.md)** - If you want to contribute

## Getting Help

If you encounter issues:

1. Check [Troubleshooting Guide](TROUBLESHOOTING.md)
2. Review the log files
3. Run the test suite: `npm test`
4. Create an issue on GitHub with:
   - Error messages
   - Log file contents
   - System information
   - Steps to reproduce
