# F95Zone Game Scraper

A powerful automation tool that extracts game data from F95Zone using AI and saves it to Google Sheets with automatic download size detection.

## Features

- 🤖 **AI-Powered Extraction**: Uses Google Gemini 2.0 Flash to extract structured game data
- 🕷️ **Advanced Web Scraping**: Puppeteer-based scraping with anti-detection measures
- 📊 **Google Sheets Integration**: Automatically saves data to spreadsheets
- 📏 **Download Size Detection**: Calculates file sizes from multiple download providers
- 🎨 **Beautiful Web Interface**: Modern, responsive UI for easy operation (included in repo)
- 📱 **Real-time Progress**: Live updates during the scraping process
- 🔄 **Duplicate Detection**: Prevents duplicate entries
- 📈 **Comprehensive Logging**: Detailed logs for debugging and monitoring
- 📄 **Open Source**: MIT licensed for free use and modification

## Quick Start

> **Note**: This project now includes the complete web interface in version control. The `public/` directory containing the UI files is no longer ignored by Git.

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and update with your API keys:

```bash
# Copy the example environment file
copy .env.example .env
```

Edit `.env` with your actual credentials:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Google Gemini API Key (Required for AI data extraction)
GOOGLE_GEMINI_API_KEY=your-google-gemini-api-key-here

# F95Zone Authentication (Optional - for accessing protected content)
F95ZONE_USERNAME=your-f95zone-username
F95ZONE_PASSWORD=your-f95zone-password

# Google Sheets Configuration (Required for saving data)
GOOGLE_SHEET_ID=your-google-sheet-id-here
GOOGLE_PROJECT_ID=your-google-project-id
GOOGLE_PRIVATE_KEY_ID=your-private-key-id
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key-content-here\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_SHEET_NAME=sheet-name-here

# Optional: Scraping Configuration
SCRAPE_DELAY=2000
MAX_RETRIES=3
TIMEOUT=30000
```

### 3. Run the Application

```bash
npm start
```

Visit `http://localhost:3000` in your browser.

## API Keys and Authentication Setup

### Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy the key and add it to your `.env` file

**Cost**: **FREE** with generous quotas:
- 15 requests per minute
- 1 million tokens per month
- No credit card required

### F95Zone Authentication (Optional)

To access protected content like download links and complete game information, you can configure F95Zone authentication:

1. **Create F95Zone Account** (if you don't have one):
   - Go to [F95Zone Registration](https://f95zone.to/register/)
   - Create a free account
   - Verify your email address

2. **Add Credentials to Environment**:
   ```env
   F95ZONE_USERNAME=your-username-here
   F95ZONE_PASSWORD=your-password-here
   ```

3. **Benefits of Authentication**:
   - ✅ Access to download links (often hidden behind spoiler tags)
   - ✅ Complete file size information
   - ✅ Access to member-only content
   - ✅ Reduced rate limiting
   - ✅ Better scraping reliability

4. **Security Notes**:
   - Credentials are stored locally in your `.env` file
   - Authentication is handled automatically during scraping
   - Session is maintained across multiple scraping requests
   - No credentials are sent to external services

**Note**: Authentication is optional. The scraper will work without it, but some content may be restricted or incomplete.

### Google Sheets Setup

#### Method 1: Service Account (Recommended)

1. **Create Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Google Sheets API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

3. **Create Service Account**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "Service Account"
   - Fill in the details and create

4. **Generate Private Key**:
   - Click on the created service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create New Key" → "JSON"
   - Download the JSON file

5. **Extract Credentials**:
   From the downloaded JSON file, copy these values to your `.env`:
   ```env
   GOOGLE_PROJECT_ID=your-project-id
   GOOGLE_PRIVATE_KEY_ID=your-private-key-id
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
   GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
   ```

6. **Create Google Sheet**:
   - Create a new Google Sheet
   - Copy the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`
   - Add the Sheet ID to your `.env` file
   - Share the sheet with your service account email (give Editor access)

## Usage

### Web Interface

1. **Start the server**: `npm start`
2. **Open browser**: Navigate to `http://localhost:3000`
3. **Check status**: Ensure all services show "operational"
4. **Scrape games**: 
   - Enter F95Zone game URL
   - Click "Extract Game Data"
   - Wait for processing to complete
   - Download the updated Excel file

### API Endpoints

- `POST /api/scrape` - Scrape a single game
- `GET /api/games` - Get all games from database
- `GET /api/download` - Download Excel file
- `GET /api/health` - Check system status

### Example API Usage

```javascript
// Scrape a game
const response = await fetch('/api/scrape', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    url: 'https://f95zone.to/threads/game-name.123456/' 
  })
});
```

## Configuration Options

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | Environment (development/production) |
| `LOG_LEVEL` | No | Logging level (debug/info/warn/error) |
| `GOOGLE_GEMINI_API_KEY` | Yes | Google Gemini API key for AI extraction |
| `F95ZONE_USERNAME` | No | F95Zone username for authentication |
| `F95ZONE_PASSWORD` | No | F95Zone password for authentication |
| `GOOGLE_SHEET_ID` | Yes | Google Sheets document ID |
| `GOOGLE_PROJECT_ID` | Yes | Google Cloud project ID |
| `GOOGLE_PRIVATE_KEY_ID` | Yes | Service account private key ID |
| `GOOGLE_PRIVATE_KEY` | Yes | Service account private key |
| `GOOGLE_CLIENT_EMAIL` | Yes | Service account email |
| `GOOGLE_CLIENT_ID` | Yes | Service account client ID |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Yes | Service account email (alias) |
| `GOOGLE_SHEET_NAME` | No | Sheet name (default: "Sheet1") |
| `SCRAPE_DELAY` | No | Delay between requests in ms (default: 2000) |
| `MAX_RETRIES` | No | Maximum retry attempts (default: 3) |
| `TIMEOUT` | No | Request timeout in ms (default: 30000) |

### Supported Download Providers

- MEGA
- Google Drive
- MediaFire
- GoFile
- PixelDrain
- WorkUpload
- UploadHaven

## Data Structure

The scraper extracts and stores the following data for each game:

```json
{
  "game_number": 1,
  "game_name": "Game Title",
  "version": "v1.0",
  "developer": "Developer Name",
  "release_date": "2024-01-01",
  "original_url": "https://f95zone.to/threads/...",
  "cover_image": "https://image-url.jpg",
  "description": "Game description...",
  "tags": ["tag1", "tag2"],
  "total_size_gb": "2.50",
  "total_size_bytes": 2684354560,
  "download_links": [
    {
      "provider": "MEGA",
      "url": "https://mega.nz/...",
      "platform": "PC",
      "version": "v1.0"
    }
  ],
  "individual_sizes": [
    {
      "provider": "MEGA",
      "platform": "PC",
      "size_gb": "2.50",
      "size_bytes": 2684354560
    }
  ],
  "extracted_date": "2024-01-01T00:00:00.000Z"
}
```

## Troubleshooting

### Common Issues

1. **"Google Gemini API key not configured"**
   - Ensure `GOOGLE_GEMINI_API_KEY` is set in `.env`
   - Verify the API key is valid

2. **"Google Sheets not configured"**
   - Check all Google credentials in `.env`
   - Ensure the service account has access to the sheet
   - Verify the sheet ID is correct

3. **"Failed to scrape page"**
   - Check if the F95Zone URL is accessible
   - Verify the URL format is correct
   - Some pages may require login (not supported)

4. **"Cannot get download sizes"**
   - Some download providers block HEAD requests
   - The scraper will continue without size data

### Debug Mode

Run with debug logging:

```bash
set LOG_LEVEL=debug && npm start
```

### Logs

Check the logs directory for detailed error information:
- `logs/app.log` - General application logs
- `logs/error.log` - Error-only logs

## Development

### Project Structure

```plaintext
f95zone-scraper/
├── src/
│   ├── index.js              # Main server file
│   ├── services/
│   │   ├── scraperService.js # Web scraping logic
│   │   ├── aiService.js      # AI data extraction
│   │   └── googleSheetsService.js # Google Sheets integration
│   └── utils/
│       └── logger.js         # Logging utility
├── public/                   # Web UI (included in version control)
│   ├── index.html           # Web interface
│   ├── app.js              # Frontend JavaScript
│   └── styles.css          # UI styling
├── logs/                   # Application logs
├── .env                   # Environment variables
├── LICENSE                # MIT License
└── package.json          # Dependencies and scripts
```

### Available Scripts

```bash
npm start       # Start the production server
npm run dev     # Start with file watching (development)
npm test        # Run tests
```

### Adding New Features

1. **New Download Provider**: Update `scraperService.js`
2. **Additional Data Fields**: Modify AI prompt in `aiService.js`
3. **Custom UI**: Edit `public/index.html` and `public/app.js`

## Legal and Ethical Considerations

- ⚖️ **Respect Terms of Service**: Ensure compliance with F95Zone's ToS
- 🚫 **Rate Limiting**: Built-in delays to avoid overwhelming servers
- 🔒 **Content Filtering**: AI naturally filters inappropriate content in structured extraction
- 📋 **Data Usage**: Only extract publicly available information

## License

MIT License - See LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs for error details
3. Ensure all API keys are properly configured

---

**Note**: This tool is for educational and personal use. Always respect website terms of service and applicable laws.
