# F95Zone Game Scraper

A powerful automation tool that extracts game data from F95Zone using AI and saves it to Google Sheets with automatic download size detection.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/ismaeilalrewany/f95zone-scraper)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node.js-%3E%3D%2018.0.0-brightgreen.svg)](https://nodejs.org/)

## ✨ Features

- 🤖 **AI-Powered Extraction**: Uses Google Gemini 2.0 Flash to extract structured game data
- 🕷️ **Advanced Web Scraping**: Puppeteer-based scraping with anti-detection measures
- 📊 **Google Sheets Integration**: Automatically saves data to spreadsheets
- 📏 **Download Size Detection**: Calculates file sizes from multiple download providers
- 🎨 **Beautiful Web Interface**: Modern, responsive UI for easy operation
- 📱 **Real-time Progress**: Live updates during the scraping process
- 🔄 **Duplicate Detection**: Prevents duplicate entries
- 📈 **Comprehensive Logging**: Detailed logs for debugging and monitoring
- 🧪 **Comprehensive Testing**: Full test suite for reliability
- 📄 **Open Source**: MIT licensed for free use and modification

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Google Gemini API key (free)
- Google Cloud Service Account (for Sheets integration)
- Optional: F95Zone account for enhanced access

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd f95zone-scraper
   npm install
   ```

2. **Configure environment variables**
   ```bash
   copy .env.example .env
   ```
   Edit `.env` with your API keys and credentials.

3. **Start the application**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Setup Guide](docs/SETUP.md) | Detailed installation and configuration |
| [API Documentation](docs/API.md) | REST API endpoints and usage |
| [Authentication Guide](docs/AUTHENTICATION.md) | F95Zone and Google authentication setup |
| [Configuration Guide](docs/CONFIGURATION.md) | Environment variables and options |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Common issues and solutions |
| [Development Guide](docs/DEVELOPMENT.md) | Contributing and development setup |
| [Testing Guide](docs/TESTING.md) | Running and writing tests |
| [Roadmap](docs/ROADMAP.md) | Future features and version history |

## 🏗️ Architecture

```
f95zone-scraper/
├── src/
│   ├── index.js              # Main server
│   ├── services/             # Core business logic
│   └── utils/                # Helper utilities
├── public/                   # Web interface
├── tests/                    # Test suites
├── docs/                     # Documentation
└── logs/                     # Application logs
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
npm test
```

Tests cover all major functionality including web scraping, AI extraction, Google Sheets integration, and error handling.

## 📊 Supported Download Providers

- MEGA
- Google Drive  
- MediaFire
- GoFile
- PixelDrain
- WorkUpload
- UploadHaven

## 🔧 Configuration

Essential environment variables:

```env
# Required
GOOGLE_GEMINI_API_KEY=your-gemini-api-key
GOOGLE_SHEET_ID=your-sheet-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."

# Optional
F95ZONE_USERNAME=your-username
F95ZONE_PASSWORD=your-password
PORT=3000
```

See [Configuration Guide](docs/CONFIGURATION.md) for complete details.

## 📈 Version 1.0.0

Current stable release with core functionality:
- ✅ AI-powered data extraction
- ✅ Google Sheets integration
- ✅ Web interface
- ✅ F95Zone authentication
- ✅ Download size detection
- ✅ Comprehensive testing

## 🚧 Roadmap v1.6.2

Planned improvements:
- [ ] Distribute files in proper folder structure
- [ ] Pagination for games list
- [ ] Fix game size detection (currently shows 0.00 GB)
- [ ] Fix MEGA/WorkUpload download buttons
- [ ] Automatic retry for broken data
- [ ] Test suite improvements
- [ ] F95Zone color scheme integration
- [ ] CI/CD pipeline

See [Roadmap](docs/ROADMAP.md) for detailed planning.

## ⚖️ Legal & Ethics

- Respects F95Zone Terms of Service
- Built-in rate limiting to avoid server overload
- Extracts only publicly available information
- For educational and personal use

## 🤝 Future Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
<!-- 5. Submit a pull request -->

See [Development Guide](docs/DEVELOPMENT.md) for detailed instructions.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🆘 Support

- 📖 Check the [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- 🐛 Report issues on GitHub
- 📧 Contact: [ismailalrewany332@gmail.com]

---

**⚠️ Disclaimer**: This tool is for educational and personal use. Always respect website terms of service and applicable laws.
