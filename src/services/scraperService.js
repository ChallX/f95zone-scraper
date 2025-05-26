import puppeteer from 'puppeteer';
import axios from 'axios';
import { Logger } from '../utils/logger.js';

export class ScraperService {
  constructor() {
    this.logger = new Logger();
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
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
    }
    return this.browser;
  }

  async scrapePage(url) {
    const browser = await this.initBrowser();
    const page = await browser.newPage();
    
    try {
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

      // Navigate to the page
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for content to load
      await page.waitForTimeout(3000);

      // Extract page data
      const pageData = await page.evaluate(() => {
        const data = {
          title: document.title,
          url: window.location.href,
          content: document.body.innerText,
          html: document.documentElement.outerHTML,
          images: [],
          links: []
        };

        // Extract images
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

        // Extract download links
        const links = document.querySelectorAll('a');
        links.forEach(link => {
          if (link.href && link.href.includes('mega.nz') || 
              link.href.includes('drive.google.com') ||
              link.href.includes('mediafire.com') ||
              link.href.includes('uploadhaven.com') ||
              link.href.includes('gofile.io') ||
              link.href.includes('pixeldrain.com') ||
              link.href.includes('workupload.com') ||
              link.textContent.toLowerCase().includes('download') ||
              link.textContent.toLowerCase().includes('pc')) {
            data.links.push({
              href: link.href,
              text: link.textContent.trim(),
              title: link.title || ''
            });
          }
        });

        return data;
      });

      this.logger.info(`Scraped page: ${url}`);
      return pageData;

    } catch (error) {
      this.logger.error('Error scraping page:', error);
      throw error;
    } finally {
      await page.close();
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
    try {
      const response = await axios.head(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const contentLength = response.headers['content-length'];
      if (contentLength) {
        return parseInt(contentLength, 10);
      }

      // If HEAD doesn't work, try a range request
      const rangeResponse = await axios.get(url, {
        timeout: 5000,
        headers: {
          'Range': 'bytes=0-1',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const contentRange = rangeResponse.headers['content-range'];
      if (contentRange) {
        const match = contentRange.match(/bytes \d+-\d+\/(\d+)/);
        if (match) {
          return parseInt(match[1], 10);
        }
      }

      return 0;
    } catch (error) {
      this.logger.warn(`Error getting file size from ${url}: ${error.message}`);
      return 0;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
