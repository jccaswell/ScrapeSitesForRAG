export interface PageMetadata {
  url: string;
  title: string;
  lastModified?: string;
  category?: string;
  parentPage?: string;
}

export interface ScrapingResult {
  metadata: PageMetadata;
  content: string;
  success: boolean;
  error?: string;
}

export interface RateLimiter {
  tokens: number;
  lastRefill: number;
  refillRate: number;
  maxTokens: number;
}

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
}
