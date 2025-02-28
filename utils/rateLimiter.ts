import { RateLimiter } from './types';

export class TokenBucketRateLimiter {
  private state: RateLimiter;

  constructor(maxTokens: number, refillRate: number) {
    this.state = {
      tokens: maxTokens,
      lastRefill: Date.now(),
      refillRate,
      maxTokens
    };
  }

  async waitForToken(): Promise<void> {
    while (true) {
      this.refillTokens();
      if (this.state.tokens > 0) {
        this.state.tokens--;
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.state.lastRefill;
    const newTokens = Math.floor(timePassed * (this.state.refillRate / 1000));
    
    if (newTokens > 0) {
      this.state.tokens = Math.min(this.state.maxTokens, this.state.tokens + newTokens);
      this.state.lastRefill = now;
    }
  }
}
