import puppeteer from 'puppeteer';
import axios from 'axios';
import { Logger } from '../utils/logger.js';

export class ScraperService {
  constructor() {
    this.logger = new Logger();
    this.browser = null;
    this.isAuthenticated = false;
    this.authPage = null; // Keep a page for authentication state
  }
  async initBrowser() {
    try {
      if (!this.browser) {
        this.logger.info('Initializing Puppeteer browser...');
        this.browser = await puppeteer.launch({
          headless: 'new',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
          ]
        });
        this.logger.info('Browser initialized successfully');
      }
      return this.browser;
    } catch (error) {
      this.logger.error('Failed to initialize browser:', error);
      throw new Error(`Browser initialization failed: ${error.message}`);
    }  }
  
  async authenticateF95Zone() {
    const username = process.env.F95ZONE_USERNAME;
    const password = process.env.F95ZONE_PASSWORD;
    
    if (!username || !password) {
      this.logger.warn('F95Zone credentials not configured - proceeding without authentication');
      return false;
    }
    
    try {
      this.logger.info('Attempting F95Zone authentication...');
      
      const browser = await this.initBrowser();
      this.authPage = await browser.newPage();
      
      // Set user agent and headers
      await this.authPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Navigate to login page
      await this.authPage.goto('https://f95zone.to/login/', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait for login form
      await this.authPage.waitForSelector('input[name="login"]', { timeout: 10000 });
      
      // Fill in credentials
      await this.authPage.type('input[name="login"]', username);
      await this.authPage.type('input[name="password"]', password);
      
      // Submit the form
      await Promise.all([
        this.authPage.waitForNavigation({ waitUntil: 'networkidle2' }),
        this.authPage.click('button[type="submit"], input[type="submit"]')
      ]);
      
      // Check if login was successful
      const currentUrl = this.authPage.url();
      const isLoggedIn = !currentUrl.includes('/login/') && 
                        !await this.authPage.$('.errorPanel') &&
                        await this.authPage.$('.p-nav-opposite'); // Look for user menu
      
      if (isLoggedIn) {
        this.isAuthenticated = true;
        this.logger.info('F95Zone authentication successful');
        return true;
      } else {
        this.logger.error('F95Zone authentication failed - check credentials');
        await this.authPage.close();
        this.authPage = null;
        return false;
      }
      
    } catch (error) {
      this.logger.error('Error during F95Zone authentication:', error);
      if (this.authPage) {
        await this.authPage.close();
        this.authPage = null;
      }
      return false;
    }
  }
    async scrapePage(url) {
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL provided');
    }

    // Ensure F95Zone authentication if not already done
    if (!this.isAuthenticated) {
      const authSuccess = await this.authenticateF95Zone();
      if (!authSuccess) {
        this.logger.warn('Proceeding without F95Zone authentication - some content may be restricted');
      }
    }

    let page;
    
    try {
      const browser = await this.initBrowser();
      
      // Use authenticated page if available, otherwise create new one
      if (this.isAuthenticated && this.authPage) {
        page = this.authPage;
        this.logger.info('Using authenticated session for scraping');
      } else {
        page = await browser.newPage();
        
        // Set user agent and headers for unauthenticated session
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        await page.setExtraHTTPHeaders({
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        });
      }

      this.logger.info(`Navigating to URL: ${url} ${this.isAuthenticated ? '(authenticated)' : '(unauthenticated)'}`);

      // Navigate to the page with timeout and error handling
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for content to load
      await page.waitForSelector('body', { timeout: 10000 });

      // Check if we need to login (redirected to login page)
      const currentUrl = page.url();
      if (currentUrl.includes('/login/') && !this.isAuthenticated) {
        throw new Error('Page requires authentication. Please configure F95ZONE_USERNAME and F95ZONE_PASSWORD in your .env file');
      }

      // Extract page data with error handling
      const pageData = await page.evaluate(() => {
        try {
          const data = {
            title: document.title || 'No title',
            url: window.location.href,
            content: document.body ? document.body.innerText : '',
            html: document.documentElement ? document.documentElement.outerHTML : '',
            images: [],
            links: []
          };

          // Extract images safely
          const images = document.querySelectorAll('img');
          images.forEach(img => {
            if (img.src) {
              data.images.push({
                src: img.src,
                alt: img.alt || '',
                title: img.title || ''
              });
            }
          });          // Extract download links safely (enhanced for authenticated content)
          const links = document.querySelectorAll('a');
          links.forEach(link => {
            if (link.href && (
                link.href.includes('mega.nz') || 
                link.href.includes('drive.google.com') ||
                link.href.includes('mediafire.com') ||
                link.href.includes('uploadhaven.com') ||
                link.href.includes('gofile.io') ||
                link.href.includes('pixeldrain.com') ||
                link.href.includes('workupload.com') ||
                link.href.includes('rapidgator.net') ||
                link.href.includes('katfile.com') ||
                link.href.includes('mixdrop.co') ||
                link.href.includes('anonfiles.com') ||
                link.textContent.toLowerCase().includes('download') ||
                link.textContent.toLowerCase().includes('pc') ||
                link.textContent.toLowerCase().includes('windows') ||
                link.textContent.toLowerCase().includes('mac') ||
                link.textContent.toLowerCase().includes('android'))) {
              
              // Get surrounding text for context (file size, version info)
              const parent = link.parentElement;
              const contextText = parent ? parent.textContent.trim() : '';
              
              data.links.push({
                href: link.href,
                text: link.textContent ? link.textContent.trim() : '',
                title: link.title || '',
                context: contextText.substring(0, 200) // Include surrounding context
              });
            }
          });
          
          // Also extract content from spoiler tags (common for download links)
          const spoilers = document.querySelectorAll('.bbCodeSpoiler-content, .spoiler-content, [data-spoiler]');
          spoilers.forEach(spoiler => {
            const spoilerLinks = spoiler.querySelectorAll('a');
            spoilerLinks.forEach(link => {
              if (link.href && (
                  link.href.includes('mega.nz') || 
                  link.href.includes('drive.google.com') ||
                  link.href.includes('mediafire.com') ||
                  link.href.includes('uploadhaven.com') ||
                  link.href.includes('gofile.io') ||
                  link.href.includes('pixeldrain.com') ||
                  link.href.includes('workupload.com'))) {
                
                data.links.push({
                  href: link.href,
                  text: link.textContent ? link.textContent.trim() : '',
                  title: link.title || '',
                  context: spoiler.textContent.trim().substring(0, 200),
                  fromSpoiler: true
                });
              }
            });
          });

          return data;
        } catch (error) {
          throw new Error(`Page evaluation failed: ${error.message}`);
        }
      });

      if (!pageData || !pageData.content) {
        throw new Error('Failed to extract meaningful content from page');
      }

      this.logger.info(`Successfully scraped page: ${url}`);
      return pageData;

    } catch (error) {
      this.logger.error(`Error scraping page ${url}:`, error);
      
      if (error.name === 'TimeoutError') {
        throw new Error(`Page load timeout: ${url} took too long to load`);
      } else if (error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
        throw new Error(`DNS resolution failed: Cannot reach ${url}`);
      } else if (error.message.includes('net::ERR_INTERNET_DISCONNECTED')) {
        throw new Error('Internet connection lost during scraping');
      } else {
        throw new Error(`Scraping failed: ${error.message}`);
      }    } finally {
      // Only close page if it's not our authenticated session page
      if (page && page !== this.authPage) {
        try {
          await page.close();
        } catch (error) {
          this.logger.warn('Error closing page:', error);
        }
      }
    }
  }

  async getDownloadSizes(downloadLinks) {
    const sizeData = {
      total_size_bytes: 0,
      total_size_gb: '0.00',
      individual_sizes: []
    };

    if (!downloadLinks || !Array.isArray(downloadLinks)) {
      return sizeData;
    }

    for (const link of downloadLinks) {
      try {
        const size = await this.getFileSizeFromUrl(link.url);
        if (size > 0) {
          const sizeGB = (size / (1024 * 1024 * 1024)).toFixed(2);
          sizeData.total_size_bytes += size;
          sizeData.individual_sizes.push({
            provider: link.provider,
            platform: link.platform,
            size_bytes: size,
            size_gb: sizeGB,
            url: link.url
          });
        }
      } catch (error) {
        this.logger.warn(`Could not get size for ${link.provider}: ${error.message}`);
      }
    }

    sizeData.total_size_gb = (sizeData.total_size_bytes / (1024 * 1024 * 1024)).toFixed(2);
    return sizeData;
  }
  async getFileSizeFromUrl(url) {
    if (!url || typeof url !== 'string') {
      this.logger.warn('Invalid URL provided for size check');
      return 0;
    }

    try {
      this.logger.debug(`Getting file size from: ${url}`);
      
      const response = await axios.head(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        maxRedirects: 5
      });

      const contentLength = response.headers['content-length'];
      if (contentLength) {
        const size = parseInt(contentLength, 10);
        if (isNaN(size) || size < 0) {
          this.logger.warn(`Invalid content-length received: ${contentLength}`);
          return 0;
        }
        return size;
      }

      // If HEAD doesn't work, try a range request
      try {
        const rangeResponse = await axios.get(url, {
          timeout: 5000,
          headers: {
            'Range': 'bytes=0-1',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          maxRedirects: 5
        });

        const contentRange = rangeResponse.headers['content-range'];
        if (contentRange) {
          const match = contentRange.match(/bytes \d+-\d+\/(\d+)/);
          if (match) {
            const size = parseInt(match[1], 10);
            if (isNaN(size) || size < 0) {
              this.logger.warn(`Invalid content-range size: ${match[1]}`);
              return 0;
            }
            return size;
          }
        }
      } catch (rangeError) {
        this.logger.debug(`Range request failed for ${url}:`, rangeError.message);
      }

      return 0;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        this.logger.warn(`Timeout getting file size from ${url}`);
      } else if (error.response && error.response.status) {
        this.logger.warn(`HTTP ${error.response.status} error getting file size from ${url}`);
      } else {
        this.logger.warn(`Error getting file size from ${url}: ${error.message}`);
      }
      return 0;
    }
  }

  async getAuthenticationStatus() {
    const username = process.env.F95ZONE_USERNAME;
    const password = process.env.F95ZONE_PASSWORD;

    if (!username || !password) {
      return {
        status: 'not_configured',
        message: 'F95Zone credentials not configured',
        authenticated: false
      };
    }

    if (this.isAuthenticated && this.authPage) {
      try {
        // Quick check if the authenticated page is still valid
        const currentUrl = this.authPage.url();
        if (currentUrl && !currentUrl.includes('/login/')) {
          return {
            status: 'authenticated',
            message: 'F95Zone authentication active',
            authenticated: true
          };
        } else {
          // Session may have expired
          this.isAuthenticated = false;
          return {
            status: 'session_expired',
            message: 'F95Zone session expired',
            authenticated: false
          };
        }
      } catch (error) {
        this.logger.warn('Error checking authentication status:', error);
        this.isAuthenticated = false;
        return {
          status: 'error',
          message: 'Error checking authentication status',
          authenticated: false
        };
      }
    }

    return {
      status: 'not_authenticated',
      message: 'F95Zone credentials configured but not authenticated',
      authenticated: false
    };
  }

  async close() {
    try {
      // Close authenticated page first
      if (this.authPage) {
        this.logger.info('Closing authenticated session...');
        await this.authPage.close();
        this.authPage = null;
        this.isAuthenticated = false;
      }
      
      if (this.browser) {
        this.logger.info('Closing browser...');
        await this.browser.close();
        this.browser = null;
        this.logger.info('Browser closed successfully');
      }
    } catch (error) {
      this.logger.error('Error closing browser:', error);
      // Force null assignment even if close fails
      this.browser = null;
      this.authPage = null;
      this.isAuthenticated = false;
      throw new Error(`Failed to close browser: ${error.message}`);
    }
  }

  async handleAuthenticationExpiry() {
    this.logger.info('Handling authentication expiry...');
    
    // Reset authentication state
    this.isAuthenticated = false;
    
    if (this.authPage) {
      try {
        await this.authPage.close();
      } catch (error) {
        this.logger.warn('Error closing expired auth page:', error);
      }
      this.authPage = null;
    }
    
    // Attempt re-authentication
    return await this.authenticateF95Zone();
  }

  async scrapePageWithRetry(url, maxRetries = 2) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.info(`Scraping attempt ${attempt}/${maxRetries} for: ${url}`);
        return await this.scrapePage(url);
      } catch (error) {
        lastError = error;
        this.logger.warn(`Scraping attempt ${attempt} failed:`, error.message);
        
        // Check if it's an authentication-related error
        if (error.message.includes('requires authentication') || 
            error.message.includes('login') ||
            error.message.includes('session expired')) {
          
          this.logger.info('Authentication error detected, attempting to re-authenticate...');
          const reauth = await this.handleAuthenticationExpiry();
          
          if (!reauth && attempt === maxRetries) {
            throw new Error(`Authentication failed after ${maxRetries} attempts. Please check your F95Zone credentials in the .env file.`);
          }
        } else if (attempt === maxRetries) {
          // Not an auth error and final attempt
          throw error;
        }
        
        // Wait before retry
        if (attempt < maxRetries) {
          const delay = attempt * 2000; // Progressive delay
          this.logger.info(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }
}
