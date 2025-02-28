import { ContentValidator } from './utils/validator';
import { Logger } from './utils/logger';
import { FileManager } from './utils/fileManager';
import { ScrapingResult } from './utils/types';

// Initialize components
const validator = new ContentValidator();
const logger = new Logger();
const fileManager = new FileManager();

// Example scraping result
const exampleResult: ScrapingResult = {
  metadata: {
    url: 'https://example.com',
    title: 'Example Page',
    lastModified: '2023-10-01',
    category: 'Examples'
  },
  content: 'This is an example content for validation.',
  success: true
};

// Validate content
const validation = validator.validateContent(exampleResult);

// Log validation results
if (validation.isValid) {
  logger.info('Content is valid', { url: exampleResult.metadata.url });
  // Save content
  const filePath = fileManager.saveContent(exampleResult);
  logger.info('Content saved successfully', { filePath });
} else {
  logger.error('Content validation failed', { issues: validation.issues });
}
