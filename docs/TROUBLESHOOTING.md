# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the F95Zone Scraper application.

## Quick Diagnostics

### 1. Check System Status

First, verify the application status:

```cmd
npm start
```

Open `http://localhost:3000` and check the **System Status** panel:

- ✅ Green icons = Service working properly
- ⚠️ Yellow icons = Service needs configuration or has warnings
- ❌ Red icons = Service has errors that need attention

### 2. Run Health Check

Test all services programmatically:

```cmd
npm test
```

This runs comprehensive tests and shows which services are working.

### 3. Check Logs

Review application logs for detailed error information:

```cmd
type logs\app.log
type logs\error.log
```

## Common Issues and Solutions

### Installation and Setup Issues

#### Issue: Dependencies Installation Failed

**Symptoms:**
- `npm install` fails with errors
- Missing packages or version conflicts
- Permission denied errors

**Solutions:**

1. **Clear npm cache:**
   ```cmd
   npm cache clean --force
   ```

2. **Delete node_modules and reinstall:**
   ```cmd
   rmdir /s node_modules
   del package-lock.json
   npm install
   ```

3. **Check Node.js version:**
   ```cmd
   node --version
   npm --version
   ```
   Ensure Node.js ≥ 18.0.0

4. **Run as administrator (Windows):**
   - Right-click Command Prompt
   - Select "Run as administrator"
   - Navigate to project directory
   - Run `npm install`

5. **Proxy/firewall issues:**
   ```cmd
   npm config set proxy http://proxy-server:port
   npm config set https-proxy http://proxy-server:port
   ```

#### Issue: Port Already in Use

**Symptoms:**
- Error: "EADDRINUSE: address already in use :::3000"
- Cannot start the application

**Solutions:**

1. **Change port in .env:**
   ```env
   PORT=3001
   ```

2. **Find and kill process using port:**
   ```cmd
   netstat -ano | findstr :3000
   taskkill /PID <process-id> /F
   ```

3. **Use different port temporarily:**
   ```cmd
   set PORT=3001 && npm start
   ```

#### Issue: Environment Variables Not Loading

**Symptoms:**
- "Configuration not found" errors
- Services showing as not configured
- .env file exists but values not recognized

**Solutions:**

1. **Check .env file location:**
   - Must be in project root directory
   - Same level as package.json

2. **Verify .env file format:**
   ```env
   # Correct format
   GOOGLE_GEMINI_API_KEY=your-key-here
   
   # Incorrect (no spaces around =)
   GOOGLE_GEMINI_API_KEY = your-key-here
   ```

3. **Restart application after changes:**
   ```cmd
   # Stop with Ctrl+C, then restart
   npm start
   ```

4. **Check for BOM (Byte Order Mark):**
   - Save .env file as UTF-8 without BOM
   - Use Notepad++ or VS Code

### Authentication Issues

#### Issue: F95Zone Authentication Failed

**Symptoms:**
- Red lock icon in status panel
- "Authentication failed" in logs
- Cannot access protected content

**Solutions:**

1. **Verify credentials:**
   - Test login manually at f95zone.to
   - Check for typos in username/password
   - Ensure account is not banned/suspended

2. **Check .env file:**
   ```env
   F95ZONE_USERNAME=your-actual-username
   F95ZONE_PASSWORD=your-actual-password
   ```

3. **Disable 2FA temporarily:**
   - If using two-factor authentication
   - Test without 2FA first
   - Re-enable after confirming basic auth works

4. **Clear browser cache (debug mode):**
   ```env
   HEADLESS=false
   DEBUG_MODE=true
   ```
   Watch browser interaction for clues

5. **Check for network issues:**
   - Verify internet connection
   - Test accessing f95zone.to directly
   - Check firewall/proxy settings

#### Issue: Google Services Authentication Failed

**Symptoms:**
- "Google Sheets not configured" errors
- "Invalid private key" errors
- Permission denied errors

**Solutions:**

1. **Verify service account setup:**
   - Check if service account exists in Google Cloud Console
   - Ensure required APIs are enabled (Sheets, Drive, AI Platform)

2. **Check spreadsheet permissions:**
   - Service account email must have "Editor" access
   - Verify correct service account email format

3. **Validate private key format:**
   ```env
   # Correct format with quotes and proper escaping
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_CONTENT\n-----END PRIVATE KEY-----\n"
   ```

4. **Test with minimal configuration:**
   Create a new spreadsheet and test with basic setup

5. **Check API quotas:**
   - Visit Google Cloud Console
   - Review API usage and quotas
   - Ensure not exceeding rate limits

### Scraping Issues

#### Issue: Cannot Access F95Zone Pages

**Symptoms:**
- "Navigation timeout" errors
- "Page requires authentication" errors
- Blank or incomplete data extraction

**Solutions:**

1. **Check URL format:**
   ```
   # Correct F95Zone URL format
   https://f95zone.to/threads/game-name.123456/
   ```

2. **Enable authentication:**
   ```env
   F95ZONE_USERNAME=your-username
   F95ZONE_PASSWORD=your-password
   ```

3. **Increase timeout:**
   ```env
   TIMEOUT=60000  # 60 seconds
   ```

4. **Reduce scraping speed:**
   ```env
   SCRAPE_DELAY=5000  # 5 seconds between requests
   ```

5. **Check for rate limiting:**
   - Wait 5-10 minutes before retrying
   - Reduce frequency of requests

#### Issue: AI Data Extraction Failed

**Symptoms:**
- "AI extraction failed" errors
- Incomplete or incorrect game data
- API rate limit errors

**Solutions:**

1. **Check API key:**
   ```env
   GOOGLE_GEMINI_API_KEY=your-valid-api-key
   ```

2. **Verify API quota:**
   - Visit [Google AI Studio](https://aistudio.google.com/)
   - Check usage and rate limits
   - Free tier: 15 requests/minute

3. **Wait for rate limit reset:**
   - Rate limits reset every minute
   - Implement delays between requests

4. **Check page content:**
   - Ensure scraped page has sufficient content
   - Some pages may be member-only
   - Try different F95Zone URLs

5. **Review extraction logs:**
   ```env
   LOG_LEVEL=debug
   ```
   Check logs for AI service responses

#### Issue: Download Size Detection Failed

**Symptoms:**
- Missing file sizes in results
- "Could not calculate download sizes" warnings
- Incomplete size information

**Solutions:**

1. **Check download link accessibility:**
   - Some links require authentication
   - Links may be temporary or expired
   - Try with F95Zone authentication enabled

2. **Increase timeout for size checks:**
   ```env
   TIMEOUT=45000
   ```

3. **Reduce concurrent size checks:**
   ```env
   CONCURRENT_SIZE_CHECKS=1
   ```

4. **Check network connectivity:**
   - Test accessing download providers directly
   - Verify firewall allows outbound connections

### Google Sheets Issues

#### Issue: Permission Denied Error

**Symptoms:**
- "Permission denied" when accessing spreadsheet
- "Service account may not have access" errors

**Solutions:**

1. **Share spreadsheet correctly:**
   - Open Google Sheets
   - Click "Share" button
   - Add service account email with "Editor" permissions
   - Ensure email format: `service-name@project-id.iam.gserviceaccount.com`

2. **Verify service account:**
   - Check Google Cloud Console
   - Ensure service account exists and is active
   - Verify credentials match .env file

3. **Check spreadsheet ID:**
   ```
   # Extract ID from URL
   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
   ```

#### Issue: Spreadsheet Not Found

**Symptoms:**
- "Spreadsheet not found" errors
- "Check if the GOOGLE_SHEET_ID is correct" messages

**Solutions:**

1. **Verify sheet ID in .env:**
   ```env
   GOOGLE_SHEET_ID=your-correct-sheet-id
   ```

2. **Check spreadsheet exists:**
   - Open Google Sheets
   - Verify spreadsheet is accessible
   - Try opening the direct link

3. **Create new spreadsheet:**
   - Sometimes easier to start fresh
   - Create new sheet and update configuration

### Performance Issues

#### Issue: Slow Scraping Performance

**Symptoms:**
- Very slow data extraction
- Frequent timeouts
- High memory usage

**Solutions:**

1. **Optimize configuration:**
   ```env
   SCRAPE_DELAY=1500        # Reduce delay slightly
   TIMEOUT=25000            # Reduce timeout
   CONCURRENT_SIZE_CHECKS=3 # Optimize concurrency
   ```

2. **Close unnecessary applications:**
   - Free up system memory
   - Close browser tabs
   - Stop other intensive processes

3. **Increase Node.js memory:**
   ```cmd
   set NODE_OPTIONS=--max-old-space-size=4096 && npm start
   ```

4. **Use headless mode:**
   ```env
   HEADLESS=true
   ```

#### Issue: High Memory Usage

**Symptoms:**
- System becomes slow
- Out of memory errors
- Application crashes

**Solutions:**

1. **Enable headless mode:**
   ```env
   HEADLESS=true
   DEBUG_MODE=false
   ```

2. **Reduce logging:**
   ```env
   LOG_LEVEL=warn
   LOG_REQUESTS=false
   ```

3. **Restart application periodically:**
   - Close and restart after processing many games
   - Clear browser cache

### Network and Connectivity Issues

#### Issue: Network Timeout Errors

**Symptoms:**
- Frequent timeout errors
- "ENOTFOUND" or "ECONNREFUSED" errors
- Cannot reach external services

**Solutions:**

1. **Check internet connection:**
   ```cmd
   ping google.com
   ping f95zone.to
   ```

2. **Configure proxy (if needed):**
   ```env
   PROXY_URL=http://proxy-server:port
   ```

3. **Adjust timeout settings:**
   ```env
   TIMEOUT=60000  # Increase to 60 seconds
   ```

4. **Check firewall settings:**
   - Allow Node.js through firewall
   - Verify outbound connections permitted

5. **Try different DNS:**
   ```cmd
   nslookup f95zone.to 8.8.8.8
   ```

#### Issue: SSL/TLS Certificate Errors

**Symptoms:**
- "CERT_UNTRUSTED" errors
- SSL handshake failures
- Certificate validation errors

**Solutions:**

1. **Update Node.js:**
   - Ensure using latest LTS version
   - Update npm to latest version

2. **Disable SSL verification (temporary):**
   ```cmd
   set NODE_TLS_REJECT_UNAUTHORIZED=0 && npm start
   ```
   ⚠️ **Warning:** Only for testing, not production

3. **Update certificates:**
   - Update Windows certificates
   - Clear browser cache

## Advanced Troubleshooting

### Debug Mode

Enable comprehensive debugging:

```env
DEBUG_MODE=true
LOG_LEVEL=debug
LOG_REQUESTS=true
HEADLESS=false
```

This provides:
- Visible browser interactions
- Detailed network logs
- Error screenshots
- Step-by-step execution logs

### Manual Testing

Test individual components:

```cmd
# Test Google Sheets connection
node -e "const {GoogleSheetsService} = require('./src/services/googleSheetsService.js'); new GoogleSheetsService().isConfigured() ? console.log('✅ Configured') : console.log('❌ Not configured')"

# Test AI service
node -e "const {AIService} = require('./src/services/aiService.js'); new AIService().isConfigured() ? console.log('✅ Configured') : console.log('❌ Not configured')"
```

### Log Analysis

#### Understanding Log Levels

- **ERROR**: Critical issues requiring immediate attention
- **WARN**: Potential issues that don't stop operation
- **INFO**: General information about application flow
- **DEBUG**: Detailed information for troubleshooting

#### Important Log Patterns

**Authentication Issues:**
```
ERROR: F95Zone authentication failed - check credentials
ERROR: Google Sheets initialization failed: Invalid private key
```

**Network Issues:**
```
WARN: Request timed out, retrying...
ERROR: ENOTFOUND - DNS resolution failed
```

**Rate Limiting:**
```
WARN: Rate limit exceeded, waiting...
ERROR: Too many requests - temporary cooldown
```

### Performance Monitoring

Monitor application performance:

```cmd
# Check memory usage
node -e "console.log(process.memoryUsage())"

# Monitor CPU usage
wmic cpu get loadpercentage /value
```

### Recovery Procedures

#### Soft Reset

1. Stop application (Ctrl+C)
2. Clear temporary files
3. Restart application

#### Hard Reset

1. Stop application
2. Delete node_modules directory
3. Clear npm cache
4. Reinstall dependencies
5. Restart application

```cmd
rmdir /s node_modules
npm cache clean --force
npm install
npm start
```

#### Configuration Reset

1. Backup current .env file
2. Copy from .env.example
3. Reconfigure with your credentials
4. Test with minimal setup

## Getting Help

### Before Requesting Support

1. **Check this troubleshooting guide**
2. **Review application logs**
3. **Test with minimal configuration**
4. **Try the latest version**
5. **Search existing issues**

### Providing Debug Information

When requesting help, include:

1. **Error messages** from logs
2. **Configuration** (without sensitive data)
3. **Steps to reproduce** the issue
4. **System information** (OS, Node.js version)
5. **Screenshots** if relevant

### Log Collection

Collect relevant logs:

```cmd
# Save current logs
copy logs\app.log troubleshooting-app.log
copy logs\error.log troubleshooting-error.log

# Run with debug mode and save output
npm start > debug-output.txt 2>&1
```

### Common Log Locations

- **Application logs**: `logs/app.log`
- **Error logs**: `logs/error.log`
- **Debug screenshots**: Project root directory
- **Node.js logs**: Console output

## Prevention

### Regular Maintenance

1. **Update dependencies monthly**
2. **Rotate API keys quarterly**
3. **Monitor usage quotas**
4. **Backup configurations**
5. **Test after updates**

### Best Practices

1. **Use version control** for configuration
2. **Test in development** before production
3. **Monitor logs regularly**
4. **Keep documentation updated**
5. **Have rollback plan**

### Health Monitoring

Set up regular health checks:

```cmd
# Daily health check
npm test > health-check.log 2>&1
```

Check for:
- Service availability
- Authentication status
- API quota usage
- Error patterns
- Performance degradation
