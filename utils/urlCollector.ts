import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

export class UrlCollector {
  private visitedUrls: Set<string> = new Set();
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async collectUrls(startUrl: string): Promise<string[]> {
    const browser = await puppeteer.launch();
    const urls: string[] = [];

    try {
      const page = await browser.newPage();
      await page.goto(startUrl, { waitUntil: 'networkidle0' });

      const html = await page.content();
      const $ = cheerio.load(html);

      // Collect URLs from navigation and content
      $('a').each((_, element) => {
        const href = $(element).attr('href');
        if (href && this.isValidUrl(href)) {
          const fullUrl = new URL(href, this.baseUrl).toString();
          if (!this.visitedUrls.has(fullUrl)) {
            urls.push(fullUrl);
            this.visitedUrls.add(fullUrl);
          }
        }
      });
    } finally {
      await browser.close();
    }

    return urls;
  }

  private isValidUrl(url: string): boolean {
    // Filter out external links and non-documentation pages
    return url.startsWith('/') || url.startsWith(this.baseUrl);
  }
}
