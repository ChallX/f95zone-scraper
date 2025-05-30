# Authentication Guide

This guide covers authentication setup for F95Zone access and Google services integration.

## Overview

The F95Zone Scraper uses two main authentication systems:

1. **F95Zone Authentication** - Optional but recommended for accessing protected content
2. **Google Services Authentication** - Required for AI and Sheets functionality

## F95Zone Authentication

### Why Authenticate?

Without authentication, the scraper has limited access:
- ❌ Cannot access download links (often in spoiler tags)
- ❌ Cannot see member-only content
- ❌ May encounter rate limiting
- ❌ Cannot access some game details

With authentication:
- ✅ Full access to download links and file sizes
- ✅ Access to member-only content and discussions
- ✅ Better scraping reliability and reduced rate limiting
- ✅ Complete game information extraction

### Setup Steps

#### 1. Create F95Zone Account

If you don't have an account:

1. Visit [F95Zone Registration](https://f95zone.to/register/)
2. Fill out the registration form:
   - Choose a username
   - Provide a valid email address
   - Create a secure password
   - Complete any required verification
3. Verify your email address
4. Log in to ensure your account is active

#### 2. Configure Credentials

Add your F95Zone credentials to the `.env` file:

```env
# F95Zone Authentication (Optional but recommended)
F95ZONE_USERNAME=your-username
F95ZONE_PASSWORD=your-password
```

**Security Notes:**
- Credentials are stored locally only
- No data is sent to external services except F95Zone
- Use a unique password for this account
- Enable 2FA on your F95Zone account for additional security

#### 3. Test Authentication

Start the application and check the status:

```cmd
npm start
```

Open `http://localhost:3000` and look at the System Status panel:

- ✅ **Authenticated**: Green lock icon - Ready to scrape protected content
- ⚠️ **Not Configured**: Gray lock icon - Credentials not provided
- ❌ **Authentication Failed**: Red lock icon - Check credentials
- 🔄 **Session Expired**: Yellow icon - Will re-authenticate automatically

### Authentication Process

The scraper automatically handles authentication:

1. **Automatic Login**: Credentials are used to log into F95Zone
2. **Session Management**: Maintains login session across requests
3. **Auto-Retry**: Re-authenticates if session expires
4. **Fallback**: Continues without auth if login fails

### Common Issues

#### Authentication Failed

**Symptoms:**
- Red lock icon in status panel
- "Authentication failed" in logs
- Cannot access protected content

**Solutions:**
1. **Check Credentials**: Verify username/password in `.env`
2. **Manual Test**: Try logging in manually at f95zone.to
3. **Account Status**: Ensure account is not banned/suspended
4. **2FA Issues**: If 2FA is enabled, temporary disable for testing
5. **Network Issues**: Check internet connection and firewall settings

#### Session Expired

**Symptoms:**
- Yellow lock icon in status panel
- "Session expired" messages
- Intermittent access issues

**Solutions:**
- Authentication automatically retries
- Check logs for re-authentication attempts
- Restart application if issues persist

#### Rate Limiting

**Symptoms:**
- Slow responses
- "Too many requests" errors
- Temporary blocks

**Solutions:**
- Authentication reduces rate limiting
- Wait before retrying
- Consider longer delays between requests

## Google Services Authentication

### Required Services

1. **Google Gemini AI API** - For intelligent data extraction
2. **Google Sheets API** - For data storage and management
3. **Google Drive API** - For spreadsheet export functionality

### Setup Process

#### 1. Google Cloud Project Setup

1. **Create Project**:
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Click "New Project"
   - Name: "f95zone-scraper"
   - Click "Create"

2. **Enable APIs**:
   - Go to "APIs & Services" → "Library"
   - Search and enable:
     - Google Sheets API
     - Google Drive API
     - Google AI Platform API (for Gemini)

#### 2. Service Account Creation

1. **Create Service Account**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "Service Account"
   - Name: `f95zone-scraper`
   - Description: `Service account for F95Zone scraper`
   - Click "Create"

2. **Generate Key**:
   - Click on the created service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create New Key"
   - Select "JSON" format
   - Download the JSON file

#### 3. Extract Credentials

Open the downloaded JSON file and map values to `.env`:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id-here",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "f95zone-scraper@your-project.iam.gserviceaccount.com",
  "client_id": "client-id-here"
}
```

Map to environment variables:

```env
# Google Service Account Credentials
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_PRIVATE_KEY_ID=key-id-here
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key-content\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=f95zone-scraper@your-project.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=client-id-here
GOOGLE_SERVICE_ACCOUNT_EMAIL=f95zone-scraper@your-project.iam.gserviceaccount.com
```

**Important Notes:**
- Keep the private key formatting intact
- Include quotes around the private key
- Don't share these credentials publicly

#### 4. Google Gemini API Setup

1. **Get API Key**:
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Click "Create API Key"
   - Select your project
   - Copy the generated key

2. **Add to Environment**:
   ```env
   GOOGLE_GEMINI_API_KEY=your-gemini-api-key-here
   ```

#### 5. Google Sheets Setup

1. **Create Spreadsheet**:
   - Go to [Google Sheets](https://sheets.google.com)
   - Create a new blank spreadsheet
   - Name it "F95Zone Games Database"
   - Copy the sheet ID from the URL:
     ```
     https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
     ```

2. **Configure Access**:
   - Click "Share" in the spreadsheet
   - Add your service account email
   - Set permission to "Editor"
   - Uncheck "Notify people"
   - Click "Share"

3. **Add to Environment**:
   ```env
   GOOGLE_SHEET_ID=your-sheet-id-here
   GOOGLE_SHEET_NAME=Sheet1
   ```

### Verification

Test your Google authentication setup:

1. **Start Application**:
   ```cmd
   npm start
   ```

2. **Check Status Panel**:
   - ✅ **AI Service**: operational
   - ✅ **Google Sheets**: operational

3. **Run Tests**:
   ```cmd
   npm test
   ```

   Tests will verify:
   - Google Sheets connection
   - AI service functionality
   - Authentication flow

### Troubleshooting Google Authentication

#### Service Account Issues

**Error**: "Permission denied"
- **Solution**: Ensure service account has "Editor" access to the spreadsheet
- **Check**: Service account email is correct in sharing settings

**Error**: "Spreadsheet not found"
- **Solution**: Verify `GOOGLE_SHEET_ID` in `.env` file
- **Check**: Sheet exists and is accessible

**Error**: "Invalid private key"
- **Solution**: Check private key formatting in `.env`
- **Ensure**: Key includes BEGIN/END markers and proper escaping

#### API Key Issues

**Error**: "Invalid API key"
- **Solution**: Regenerate API key in Google AI Studio
- **Check**: Key is correctly copied without extra spaces

**Error**: "API not enabled"
- **Solution**: Enable required APIs in Google Cloud Console
- **Required**: Sheets API, Drive API, AI Platform API

#### Network Issues

**Error**: "Network error"
- **Solution**: Check internet connection and firewall settings
- **Proxy**: Configure proxy settings if required

## Security Best Practices

### F95Zone Security

1. **Account Security**:
   - Use a unique password for F95Zone
   - Enable 2FA if available
   - Monitor account activity regularly

2. **Credential Protection**:
   - Never commit `.env` file to version control
   - Use environment-specific configurations
   - Rotate passwords periodically

### Google Services Security

1. **Service Account Security**:
   - Limit service account permissions to minimum required
   - Regularly audit service account usage
   - Monitor Google Cloud activity logs

2. **API Key Security**:
   - Restrict API key usage to specific IPs if possible
   - Monitor API usage and quotas
   - Regenerate keys if compromised

3. **Data Protection**:
   - Keep spreadsheets private
   - Use appropriate sharing permissions
   - Regular backup of important data

## Rate Limits and Quotas

### F95Zone
- **Recommended Delay**: 2 seconds between requests
- **Daily Limits**: No official limits, but be respectful
- **Authentication**: Reduces likelihood of rate limiting

### Google Services
- **Gemini API**: 15 requests per minute (free tier)
- **Sheets API**: 1000 requests per 100 seconds
- **Drive API**: 1000 requests per 100 seconds

### Monitoring Usage

Check current usage in:
- **Google Cloud Console**: API quotas and usage
- **Application Logs**: Request timing and errors
- **F95Zone**: Monitor for any warning messages

## Environment Variables Reference

Complete list of authentication-related environment variables:

```env
# =============================================================================
# F95ZONE AUTHENTICATION (Optional)
# =============================================================================
F95ZONE_USERNAME=your-f95zone-username
F95ZONE_PASSWORD=your-f95zone-password

# =============================================================================
# GOOGLE GEMINI AI (Required)
# =============================================================================
GOOGLE_GEMINI_API_KEY=your-google-gemini-api-key-here

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
```

## Next Steps

After completing authentication setup:

1. **Test the System**: Run `npm test` to verify all services
2. **Try Scraping**: Test with a sample F95Zone URL
3. **Check Logs**: Monitor `logs/app.log` for any issues
4. **Configure Advanced Settings**: See [Configuration Guide](CONFIGURATION.md)
5. **Start Using**: Begin scraping your game collection!