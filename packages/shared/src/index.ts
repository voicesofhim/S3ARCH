// Shared utilities for the S3ARCH ecosystem

export interface S3ARCHConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
}

export class S3ARCHUtils {
  static formatCost(cost: number): string {
    return `$${cost.toFixed(6)}`;
  }

  static formatTokens(tokens: number): string {
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}k`;
    }
    return tokens.toString();
  }

  static validateConfig(config: S3ARCHConfig): boolean {
    return !!(config.apiKey && config.model && config.maxTokens > 0);
  }
}

export const DEFAULT_CONFIG: S3ARCHConfig = {
  apiKey: '',
  model: 'gemini-pro',
  maxTokens: 1000
};

