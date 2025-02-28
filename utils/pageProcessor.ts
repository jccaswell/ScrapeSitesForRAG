import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { PageMetadata, ScrapingResult } from './types';
import { htmlToMarkdown } from './converter';

export class PageProcessor {
  private browser: puppeteer.Browser | null = null;

  async initialize(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
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

    try {
      const page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

      await page.goto(url, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      const metadata = await this.extractMetadata(page);
      const html = await page.content();
      const content = await htmlToMarkdown(html);

      await page.close();

      return {
        metadata,
        content,
        success: true
      };
    } catch (error) {
      return {
        metadata: { url, title: '' },
        content: '',
        success: false,
        error: error.message
      };
    }
  }

  private async extractMetadata(page: puppeteer.Page): Promise<PageMetadata> {
    return {
      url: page.url(),
      title: await page.title(),
      lastModified: await page.$eval('meta[property="article:modified_time"]', 
        (el) => el.getAttribute('content') || undefined
      ).catch(() => undefined),
      category: await page.$eval('[data-category]',
        (el) => el.getAttribute('data-category') || undefined
      ).catch(() => undefined)
    };
  }
}
