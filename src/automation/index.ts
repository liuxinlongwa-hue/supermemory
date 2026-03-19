import { ConfigManager, AutoMemoryConfig, DEFAULT_CONFIG } from './config.js';
import { Monitor, ConversationMessage, CodeChange } from './monitor.js';
import { Analyzer } from './analyzer.js';
import { Trigger } from './trigger.js';
import { Cleanup } from './cleanup.js';
import { MemoryManager } from '../memory/manager.js';
import { SearchEngine } from '../memory/search.js';
import { GraphManager } from '../graph/manager.js';
import { MemoryDatabase } from '../db/database.js';

export class AutoMemory {
  private configManager: ConfigManager;
  private monitor: Monitor;
  private analyzer: Analyzer;
  private trigger: Trigger;
  private cleanup: Cleanup;

  constructor(
    private db: MemoryDatabase,
    private memoryManager: MemoryManager,
    private searchEngine: SearchEngine,
    private graphManager: GraphManager,
    config?: Partial<AutoMemoryConfig>
  ) {
    this.configManager = new ConfigManager(config);
    const cfg = this.configManager.getConfig();

    this.monitor = new Monitor();
    this.analyzer = new Analyzer(cfg);
    this.trigger = new Trigger(cfg, memoryManager, searchEngine, graphManager);
    this.cleanup = new Cleanup(db, cfg);

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.monitor.on('analysis', async (context: any) => {
      if (!this.configManager.isEnabled()) return;

      const analysis = this.analyzer.analyze(context);
      if (!analysis) return;

      const decision = this.trigger.decide(analysis);

      if (decision.action === 'auto_store') {
        await this.trigger.execute(decision);
      }
    });
  }

  processMessage(role: 'user' | 'assistant', content: string): void {
    if (!this.configManager.isEnabled()) return;
    this.monitor.addMessage(role, content);
  }

  processCodeChange(filePath: string, changeType: 'create' | 'modify' | 'delete', content?: string): void {
    if (!this.configManager.isEnabled()) return;
    
    const change: CodeChange = {
      filePath,
      changeType,
      content,
      timestamp: Date.now()
    };

    this.monitor.analyzeCodeChange(change);
  }

  async runCleanup(): Promise<any> {
    return this.cleanup.runIfNeeded();
  }

  enable(): void {
    this.configManager.updateConfig({ enabled: true });
  }

  disable(): void {
    this.configManager.updateConfig({ enabled: false });
  }

  isEnabled(): boolean {
    return this.configManager.isEnabled();
  }

  getConfig(): AutoMemoryConfig {
    return this.configManager.getConfig();
  }

  updateConfig(config: Partial<AutoMemoryConfig>): void {
    this.configManager.updateConfig(config);
  }
}