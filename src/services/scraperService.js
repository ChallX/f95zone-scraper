import puppeteer from 'puppeteer';
import axios from 'axios';
import { Logger } from '../utils/logger.js';

export class ScraperService {
  constructor() {
    this.logger = new Logger();
    this.browser = null;
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
    }
  }
  async scrapePage(url) {
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL provided');
    }

    let browser, page;
    
    try {
      browser = await this.initBrowser();
      page = await browser.newPage();
      
      // Set user agent and headers
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Set extra headers
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      });

      this.logger.info(`Navigating to URL: ${url}`);

      // Navigate to the page with timeout and error handling
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for content to load
      await page.waitForSelector('body', { timeout: 10000 });

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
          });

          // Extract download links safely
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
                link.textContent.toLowerCase().includes('download') ||
                link.textContent.toLowerCase().includes('pc'))) {
              data.links.push({
                href: link.href,
                text: link.textContent ? link.textContent.trim() : '',
                title: link.title || ''
              });
            }
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
      }
    } finally {
      if (page) {
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
  async close() {
    try {
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
      throw new Error(`Failed to close browser: ${error.message}`);
    }
  }
}
