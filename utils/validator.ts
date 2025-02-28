import { ScrapingResult } from './types';

export class ContentValidator {
  private minContentLength = 100; // Minimum content length to be considered valid
  private maxContentLength = 1000000; // Maximum content length (1MB)
  
  validateContent(result: ScrapingResult): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check if scraping was successful
    if (!result.success) {
      issues.push(`Scraping failed: ${result.error}`);
      return { isValid: false, issues };
    }

    // Validate metadata
    this.validateMetadata(result, issues);

    // Validate content
    this.validateContentBody(result.content, issues);

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  private validateMetadata(result: ScrapingResult, issues: string[]): void {
    const { metadata } = result;

    if (!metadata.title) {
      issues.push('Missing title in metadata');
    }

    if (!metadata.url) {
      issues.push('Missing URL in metadata');
    } else if (!this.isValidUrl(metadata.url)) {
      issues.push('Invalid URL format');
    }

    if (metadata.lastModified && !this.isValidDate(metadata.lastModified)) {
      issues.push('Invalid last modified date format');
    }
  }

  private validateContentBody(content: string, issues: string[]): void {
    // Check content length
    if (content.length < this.minContentLength) {
      issues.push(`Content too short (${content.length} chars)`);
    }

    if (content.length > this.maxContentLength) {
      issues.push(`Content too long (${content.length} chars)`);
    }

    // Check for broken markdown
    if (this.hasBrokenMarkdown(content)) {
      issues.push('Contains broken markdown syntax');
    }

    // Check for common HTML artifacts
    if (this.containsHtmlTags(content)) {
      issues.push('Contains unprocessed HTML tags');
    }

    // Check for broken links
    if (this.hasBrokenLinks(content)) {
      issues.push('Contains potentially broken links');
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidDate(dateStr: string): boolean {
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
  }

  private hasBrokenMarkdown(content: string): boolean {
    const brokenPatterns = [
      /\[([^\]]*)\](?!\()/,  // Broken links
      /```[^```]*$/,         // Unclosed code blocks
      /\|[^\|]*\|[^\n]*[^|]$/ // Broken tables
    ];

    return brokenPatterns.some(pattern => pattern.test(content));
  }

  private containsHtmlTags(content: string): boolean {
    const htmlPattern = /<[^>]+>/;
    return htmlPattern.test(content);
  }

  private hasBrokenLinks(content: string): boolean {
    const linkPattern = /\[([^\]]+)\]\(([^\)]+)\)/g;
    let match;
    while ((match = linkPattern.exec(content)) !== null) {
      const url = match[2];
      if (!this.isValidUrl(url) && !url.startsWith('/') && !url.startsWith('#')) {
        return true;
      }
    }
    return false;
  }
}
