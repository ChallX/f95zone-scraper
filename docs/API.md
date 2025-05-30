# API Documentation

This document describes the REST API endpoints available in the F95Zone Scraper application.

## Base URL

```
http://localhost:3000/api
```

## Endpoints

### 1. Health Check

Check the status of all services.

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "scraper": "operational",
    "ai": "operational",
    "sheets": "operational",
    "f95zone_auth": {
      "status": "authenticated",
      "message": "F95Zone authentication active",
      "authenticated": true
    }
  }
}
```

**Service Status Values:**
- `operational` - Service is working properly
- `needs_api_key` - AI service requires API key configuration
- `needs_credentials` - Google Sheets requires credential configuration

**F95Zone Auth Status:**
- `authenticated` - Successfully authenticated
- `not_configured` - Credentials not provided
- `not_authenticated` - Authentication failed
- `session_expired` - Session has expired

### 2. Scrape Game Data

Extract game data from an F95Zone URL.

**Endpoint:** `POST /api/scrape`

**Request Body:**
```json
{
  "url": "https://f95zone.to/threads/game-name.123456/",
  "sessionId": "session_1234567890_abc123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "gameNumber": 15,
  "data": {
    "game_name": "Example Game",
    "version": "v1.0.0",
    "developer": "Game Developer",
    "tags": ["3dcg", "male protagonist", "big tits"],
    "description": "Game description here...",
    "download_links": [
      {
        "provider": "MEGA",
        "url": "https://mega.nz/...",
        "size": "2.5 GB"
      }
    ],
    "total_size_gb": "2.50",
    "game_number": 15,
    "url": "https://f95zone.to/threads/game-name.123456/",
    "scraped_at": "2024-01-15T10:30:00.000Z"
  },
  "downloadUrl": "https://docs.google.com/spreadsheets/...",
  "isUpdate": false,
  "message": "Game data extracted and saved successfully!"
}
```

**Response (Error):**
```json
{
  "error": "Failed to scrape page",
  "details": "Authentication required or failed. Please check your F95Zone credentials in the .env file."
}
```

**Error Types:**
- **Invalid URL**: Non-F95Zone URLs or malformed URLs
- **Scraping Failed**: Network errors, timeouts, or authentication issues
- **AI Extraction Failed**: AI service errors or API rate limits
- **Google Sheets Error**: Permissions or API errors

### 3. Get All Games

Retrieve all games from the Google Sheets database.

**Endpoint:** `GET /api/games`

**Response:**
```json
{
  "success": true,
  "games": [
    {
      "game_number": 1,
      "game_name": "Example Game",
      "version": "v1.0.0",
      "developer": "Game Developer",
      "tags": ["3dcg", "male protagonist"],
      "description": "Game description...",
      "download_links": [...],
      "total_size_gb": "2.50",
      "url": "https://f95zone.to/threads/game-name.123456/",
      "scraped_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 4. Delete Game

Delete a game from the Google Sheets database.

**Endpoint:** `DELETE /api/games/:gameNumber`

**Parameters:**
- `gameNumber` - The game number to delete

**Response:**
```json
{
  "success": true,
  "message": "Game 15 deletion requested",
  "gameNumber": 15
}
```

### 5. Download Spreadsheet

Get a download URL for the Google Sheets spreadsheet.

**Endpoint:** `GET /api/download`

**Response:**
```json
{
  "success": true,
  "downloadUrl": "https://docs.google.com/spreadsheets/d/.../export?format=xlsx",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 6. Progress Updates (Server-Sent Events)

Real-time progress updates during scraping operations.

**Endpoint:** `GET /api/progress/:sessionId`

**Event Types:**

**Connection Established:**
```json
{
  "status": "connected",
  "sessionId": "session_1234567890_abc123"
}
```

**Progress Update:**
```json
{
  "status": "progress",
  "progress": 50,
  "message": "Extracting game data with AI...",
  "step": 3,
  "totalSteps": 6
}
```

**Completion:**
```json
{
  "status": "completed",
  "data": {
    "success": true,
    "gameNumber": 15,
    "data": {...},
    "message": "Game data extracted and saved successfully!"
  }
}
```

**Error:**
```json
{
  "status": "error",
  "message": "Failed to extract game data: AI service unavailable"
}
```

## Error Handling

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid input)
- `500` - Internal Server Error
- `503` - Service Unavailable (service not configured)

### Common Error Scenarios

1. **Service Not Configured**
   ```json
   {
     "error": "Google Sheets not configured",
     "details": "Please configure Google Sheets credentials"
   }
   ```

2. **Authentication Failed**
   ```json
   {
     "error": "Failed to scrape page", 
     "details": "Authentication required or failed. Please check your F95Zone credentials in the .env file."
   }
   ```

3. **Rate Limit Exceeded**
   ```json
   {
     "error": "Failed to extract game data",
     "details": "AI service rate limit exceeded. Please try again later."
   }
   ```

4. **Invalid Input**
   ```json
   {
     "error": "Invalid domain",
     "details": "Please provide an F95Zone URL (f95zone.to)"
   }
   ```

## Rate Limits

- **Google Gemini API**: 15 requests per minute
- **Google Sheets API**: 1000 requests per 100 seconds
- **F95Zone**: Respect site's rate limiting (2-second delays between requests)

## Authentication

### F95Zone Authentication

The scraper automatically handles F95Zone authentication when credentials are configured. Authentication status is included in health check responses.

### Google Services Authentication

Google services use service account authentication configured through environment variables. No API key headers are required for requests.

## Data Models

### Game Data Schema

```typescript
interface GameData {
  game_number: number;
  game_name: string;
  version: string;
  developer: string;
  tags: string[];
  description: string;
  download_links: DownloadLink[];
  total_size_bytes: number;
  total_size_gb: string;
  individual_sizes: object[];
  url: string;
  scraped_at: string;
}

interface DownloadLink {
  provider: string;
  url: string;
  size?: string;
}
```

## Examples

### Complete Scraping Workflow

1. **Check System Status**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Start Scraping with Progress Tracking**
   ```javascript
   // Generate session ID
   const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
   
   // Set up Server-Sent Events
   const eventSource = new EventSource(`/api/progress/${sessionId}`);
   
   eventSource.onmessage = (event) => {
     const data = JSON.parse(event.data);
     console.log('Progress:', data);
   };
   
   // Start scraping
   fetch('/api/scrape', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       url: 'https://f95zone.to/threads/game-name.123456/',
       sessionId: sessionId
     })
   });
   ```

3. **Retrieve All Games**
   ```bash
   curl http://localhost:3000/api/games
   ```

4. **Download Spreadsheet**
   ```bash
   curl http://localhost:3000/api/download
   ```

## WebSocket Alternative

Currently, the API uses Server-Sent Events (SSE) for real-time updates. WebSocket support may be added in future versions for bi-directional communication.

## Versioning

Current API version: **v1.0.0**

The API follows semantic versioning. Breaking changes will increment the major version number.
