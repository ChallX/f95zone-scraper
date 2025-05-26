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

Copy `.env` file and update with your API keys:

```bash
# Copy the example environment file
copy .env .env.local
```

Edit `.env` with your actual credentials:

```env
# Google Gemini API Key (Required)
GOOGLE_GEMINI_API_KEY=your-google-gemini-api-key-here

# Google Sheets Configuration (Required)
GOOGLE_SHEET_ID=your-google-sheet-id-here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key-here\n-----END PRIVATE KEY-----"
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
| `GOOGLE_GEMINI_API_KEY` | Yes | Google Gemini API key for AI extraction |
| `GOOGLE_SHEET_ID` | Yes | Google Sheets document ID |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Yes | Service account email |
| `GOOGLE_PRIVATE_KEY` | Yes | Service account private key |
| `PORT` | No | Server port (default: 3000) |
| `LOG_LEVEL` | No | Logging level (default: info) |
| `SCRAPE_DELAY` | No | Delay between requests (default: 2000ms) |

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
