import * as fs from 'fs/promises';
import * as path from 'path';
import { PageProcessor } from './utils/pageProcessor';
import { TokenBucketRateLimiter } from './utils/rateLimiter';
import { UrlCollector } from './utils/urlCollector';
import { ScrapingResult } from './utils/types';

const CONFIG = {
  OUTPUT_DIR: 'output',
  BASE_URL: 'https://docs.driveworks.io',
  MAX_CONCURRENT: 5,
  REQUESTS_PER_SECOND: 2,
  MAX_RETRIES: 3
};

async function initializeOutput(): Promise<void> {
  try {
    await fs.mkdir(CONFIG.OUTPUT_DIR, { recursive: true });
    await fs.mkdir(path.join(CONFIG.OUTPUT_DIR, 'content'), { recursive: true });
    await fs.mkdir(path.join(CONFIG.OUTPUT_DIR, 'metadata'), { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

async function saveResult(result: ScrapingResult): Promise<void> {
  const sanitizedFilename = result.metadata.url
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase();

  // Save content
  const contentPath = path.join(CONFIG.OUTPUT_DIR, 'content', `${sanitizedFilename}.md`);
  await fs.writeFile(contentPath, result.content, 'utf-8');

  // Save metadata
  const metadataPath = path.join(CONFIG.OUTPUT_DIR, 'metadata', `${sanitizedFilename}.json`);
  await fs.writeFile(metadataPath, JSON.stringify(result.metadata, null, 2), 'utf-8');
}

async function processUrls(urls: string[]): Promise<void> {
  const processor = new PageProcessor();
  const rateLimiter = new TokenBucketRateLimiter(CONFIG.MAX_CONCURRENT, CONFIG.REQUESTS_PER_SECOND);

  await processor.initialize();

  try {
    const results = await Promise.all(
      urls.map(async (url) => {
        await rateLimiter.waitForToken();
        
        let retries = 0;
        let result: ScrapingResult | null = null;

        while (retries < CONFIG.MAX_RETRIES && (!result || !result.success)) {
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          }

          result = await processor.processPage(url);
          retries++;
        }

        if (result && result.success) {
          await saveResult(result);
          console.log(`Successfully processed: ${url}`);
        } else {
          console.error(`Failed to process ${url} after ${retries} attempts`);
        }
      })
    );
  } finally {
    await processor.close();
  }
}

async function main() {
  try {
    await initializeOutput();

    const urlCollector = new UrlCollector(CONFIG.BASE_URL);
    const urls = await urlCollector.collectUrls(CONFIG.BASE_URL);

    console.log(`Found ${urls.length} URLs to process`);
    await processUrls(urls);

    console.log('Processing complete');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main().catch(console.error);
