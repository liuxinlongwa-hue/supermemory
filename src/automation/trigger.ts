import { AutoMemoryConfig } from './config.js';
import { AnalysisResult } from './analyzer.js';
import { ValueScore, Evaluator } from './evaluator.js';
import { MemoryManager } from '../memory/manager.js';
import { SearchEngine } from '../memory/search.js';
import { GraphManager } from '../graph/manager.js';

export interface TriggerDecision {
  action: 'auto_store' | 'suggest' | 'skip';
  analysis: AnalysisResult;
  score: ValueScore;
}

export class Trigger {
  private evaluator: Evaluator;
  private recentTriggers: Set<string> = new Set();
  private cooldownMs: number = 5000;

  constructor(
    private config: AutoMemoryConfig,
    private memoryManager: MemoryManager,
    private searchEngine: SearchEngine,
    private graphManager: GraphManager
  ) {
    this.evaluator = new Evaluator();
  }

  decide(analysis: AnalysisResult): TriggerDecision {
    const score = this.evaluator.evaluate(analysis);
    
    const contentKey = analysis.content.slice(0, 50);
    if (this.recentTriggers.has(contentKey)) {
      return { action: 'skip', analysis, score };
    }

    if (score.finalScore >= this.config.triggerThreshold) {
      this.recentTriggers.add(contentKey);
      setTimeout(() => this.recentTriggers.delete(contentKey), this.cooldownMs);
      
      return { action: 'auto_store', analysis, score };
    }

    if (score.finalScore >= this.config.suggestionThreshold) {
      return { action: 'suggest', analysis, score };
    }

    return { action: 'skip', analysis, score };
  }

  async execute(decision: TriggerDecision): Promise<string | null> {
    if (decision.action === 'skip') return null;

    const { analysis, score } = decision;

    const id = this.memoryManager.addMemory({
      content: analysis.content,
      type: analysis.memoryType,
      importance: analysis.importance
    });

    await this.searchEngine.indexMemory(id, analysis.content);

    this.extractAndStoreRelations(analysis.content);

    return id;
  }

  private extractAndStoreRelations(content: string): void {
    const methodPattern = /\b([a-zA-Z_]\w*)\s*\(/g;
    const methods: string[] = [];
    let match;

    while ((match = methodPattern.exec(content)) !== null) {
      methods.push(match[1]);
    }

    for (let i = 0; i < methods.length - 1; i++) {
      for (let j = i + 1; j < methods.length; j++) {
        this.createRelationIfNeeded(methods[i], methods[j]);
      }
    }
  }

  private createRelationIfNeeded(method1: string, method2: string): void {
    let entity1 = this.graphManager.getEntityByName(method1);
    if (!entity1) {
      const id1 = this.graphManager.addEntity(method1, 'method');
      entity1 = { id: id1 };
    }

    let entity2 = this.graphManager.getEntityByName(method2);
    if (!entity2) {
      const id2 = this.graphManager.addEntity(method2, 'method');
      entity2 = { id: id2 };
    }

    this.graphManager.addRelation(
      (entity1 as any).id,
      'related_to',
      (entity2 as any).id
    );
  }
}