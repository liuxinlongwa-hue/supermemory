export interface AutoMemoryConfig {
  enabled: boolean;
  triggerThreshold: number;
  suggestionThreshold: number;
  cleanupIntervalHours: number;
  maxMemoryTtlDays: number;
  enableFileMonitoring: boolean;
  enableConversationMonitoring: boolean;
  patterns: {
    errorResolution: string[];
    userPreferences: string[];
    methodDescription: string[];
    apiUsage: string[];
  };
}

export const DEFAULT_CONFIG: AutoMemoryConfig = {
  enabled: true,
  triggerThreshold: 0.6,
  suggestionThreshold: 0.3,
  cleanupIntervalHours: 168,
  maxMemoryTtlDays: 30,
  enableFileMonitoring: true,
  enableConversationMonitoring: true,
  patterns: {
    errorResolution: ['solved', 'fixed', 'resolved', 'workaround', 'solution', 'works now'],
    userPreferences: ['prefer', 'like to', 'always', 'never', 'habit', 'style', 'usually'],
    methodDescription: ['this function', 'this method', 'implements', 'handles', 'does', 'responsible for'],
    apiUsage: ['using', 'call', 'api', 'example', 'usage', 'how to use']
  }
};

export class ConfigManager {
  private config: AutoMemoryConfig;

  constructor(config?: Partial<AutoMemoryConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  getConfig(): AutoMemoryConfig {
    return this.config;
  }

  updateConfig(updates: Partial<AutoMemoryConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }
}