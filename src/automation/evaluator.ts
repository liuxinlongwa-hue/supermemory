import { AnalysisResult } from './analyzer.js';

export interface ValueScore {
  contentQuality: number;
  frequencyBoost: number;
  feedbackScore: number;
  contextRelevance: number;
  finalScore: number;
}

export class Evaluator {
  private mentionCounts: Map<string, number> = new Map();
  private feedbackScores: Map<string, number> = new Map();

  evaluate(analysis: AnalysisResult): ValueScore {
    const contentQuality = this.evaluateContentQuality(analysis.content);
    const frequencyBoost = this.calculateFrequencyBoost(analysis.content);
    const feedbackScore = this.getFeedbackScore(analysis.content);
    const contextRelevance = analysis.confidence;

    const finalScore = (
      contentQuality * 0.4 +
      Math.min(frequencyBoost * 0.3, 0.3) +
      feedbackScore * 0.2 +
      contextRelevance * 0.1
    );

    return {
      contentQuality,
      frequencyBoost,
      feedbackScore,
      contextRelevance,
      finalScore: Math.max(finalScore, 0.1)
    };
  }

  private evaluateContentQuality(content: string): number {
    if (content.length < 20) return 0.2;
    if (content.length > 500) return 0.8;

    const hasStructure = /function|method|implements|solves|fixes|uses|error|solution/i.test(content);
    const specificity = this.countSpecificTerms(content) / Math.max(content.split(' ').length, 1);

    return Math.min(0.3 + (hasStructure ? 0.3 : 0) + specificity * 0.4, 1.0);
  }

  private countSpecificTerms(content: string): number {
    const patterns = [
      /\b[a-zA-Z_]\w+\.\w+/g,
      /\b[A-Z][a-z]+Error\b/g,
      /\b\d+(\.\d+)?\b/g,
      /\bhttps?:\/\/\S+/g,
      /\b[A-Za-z_]\w+\([^)]*\)/g
    ];

    return patterns.reduce((count, pattern) => 
      count + (content.match(pattern)?.length || 0), 0);
  }

  private calculateFrequencyBoost(content: string): number {
    const key = content.slice(0, 50);
    const count = this.mentionCounts.get(key) || 0;
    this.mentionCounts.set(key, count + 1);

    return Math.log1p(count) / Math.log1p(10);
  }

  private getFeedbackScore(content: string): number {
    const key = content.slice(0, 50);
    return this.feedbackScores.get(key) || 0.5;
  }

  recordFeedback(content: string, isPositive: boolean): void {
    const key = content.slice(0, 50);
    const current = this.feedbackScores.get(key) || 0.5;
    const adjustment = isPositive ? 0.1 : -0.1;
    this.feedbackScores.set(key, Math.max(0, Math.min(1, current + adjustment)));
  }
}