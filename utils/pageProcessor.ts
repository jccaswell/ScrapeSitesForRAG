import puppeteer from 'puppeteer';
import { ContentConverter } from './converter';
import { ScrapingResult, PageMetadata } from './types';

export class PageProcessor {
  private browser: puppeteer.Browser | null = null;
  private converter: ContentConverter;

  constructor() {
    this.converter = new ContentConverter();
  }

  async initialize(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async processPage(url: string): Promise<ScrapingResult> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();
    
    try {
      // Set reasonable viewport
      await page.setViewport({ width: 1280, height: 800 });

      // Navigate to page with timeout
      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Wait for content to load
      await page.waitForSelector('body', { timeout: 5000 });

      // Get page content
      const html = await page.content();

      // Process content
      const $ = await page.evaluate(() => document.documentElement.outerHTML);
      const content = this.converter.convertToMarkdown($);

      // Extract metadata
      const metadata: PageMetadata = {
        url,
        title: await page.title(),
        lastModified: await page.evaluate(() => {
          const modified = document.querySelector('meta[name="last-modified"]');
          return modified ? modified.getAttribute('content') : undefined;
        }),
        category: await page.evaluate(() => {
          const breadcrumb = document.querySelector('.breadcrumb, .breadcrumbs');
          return breadcrumb ? breadcrumb.textContent : undefined;
        })
      };

      return {
        metadata,
        content,
        success: true
      };

    } catch (error) {
      console.error(`Error processing ${url}:`, error);
      return {
        metadata: { url, title: '' },
        content: '',
        success: false,
        error: error.message
      };
    } finally {
      await page.close();
    }
  }
}
