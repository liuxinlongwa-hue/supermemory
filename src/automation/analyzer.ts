import { AutoMemoryConfig } from './config.js';

export interface AnalysisResult {
  shouldRemember: boolean;
  memoryType: 'episodic' | 'semantic' | 'procedural' | 'project' | 'session' | 'habit';
  importance: number;
  content: string;
  pattern: string;
  confidence: number;
}

export interface AnalysisContext {
  type: 'conversation' | 'code';
  content: string;
  messages?: any[];
  filePath?: string;
}

export class Analyzer {
  constructor(private config: AutoMemoryConfig) {}

  analyze(context: AnalysisContext): AnalysisResult | null {
    const text = context.content.toLowerCase();

    const errorMatch = this.matchErrorResolution(text);
    if (errorMatch) return errorMatch;

    const preferenceMatch = this.matchUserPreference(text);
    if (preferenceMatch) return preferenceMatch;

    const methodMatch = this.matchMethodDescription(text);
    if (methodMatch) return methodMatch;

    const apiMatch = this.matchApiUsage(text);
    if (apiMatch) return apiMatch;

    const codeMatch = this.matchCodePattern(context);
    if (codeMatch) return codeMatch;

    return null;
  }

  private matchErrorResolution(text: string): AnalysisResult | null {
    const patterns = this.config.patterns.errorResolution;
    const hasError = /error|bug|issue|problem|fail|exception/i.test(text);
    const hasSolution = patterns.some(p => text.includes(p));

    if (hasError && hasSolution) {
      return {
        shouldRemember: true,
        memoryType: 'procedural',
        importance: 1,
        content: this.extractRelevantContent(text, 'error'),
        pattern: 'error_resolution',
        confidence: 0.8
      };
    }

    return null;
  }

  private matchUserPreference(text: string): AnalysisResult | null {
    const patterns = this.config.patterns.userPreferences;
    const match = patterns.find(p => text.includes(p));

    if (match) {
      return {
        shouldRemember: true,
        memoryType: 'habit',
        importance: 1,
        content: this.extractRelevantContent(text, 'preference'),
        pattern: 'user_preference',
        confidence: 0.75
      };
    }

    return null;
  }

  private matchMethodDescription(text: string): AnalysisResult | null {
    const patterns = this.config.patterns.methodDescription;
    const match = patterns.find(p => text.includes(p));

    if (match) {
      const hasFunctionName = /\b[a-z_]\w*\s*\(/i.test(text);
      if (hasFunctionName) {
        return {
          shouldRemember: true,
          memoryType: 'procedural',
          importance: 0,
          content: this.extractRelevantContent(text, 'method'),
          pattern: 'method_description',
          confidence: 0.7
        };
      }
    }

    return null;
  }

  private matchApiUsage(text: string): AnalysisResult | null {
    const patterns = this.config.patterns.apiUsage;
    const match = patterns.find(p => text.includes(p));

    if (match) {
      const hasApi = /api|sdk|library|package|import|require/i.test(text);
      if (hasApi) {
        return {
          shouldRemember: true,
          memoryType: 'semantic',
          importance: 0,
          content: this.extractRelevantContent(text, 'api'),
          pattern: 'api_usage',
          confidence: 0.65
        };
      }
    }

    return null;
  }

  private matchCodePattern(context: AnalysisContext): AnalysisResult | null {
    if (context.type !== 'code') return null;

    const text = context.content;

    if (context.filePath && text.length > 100) {
      const ext = context.filePath.split('.').pop()?.toLowerCase();
      const langMap: Record<string, string> = {
        ts: 'TypeScript',
        js: 'JavaScript',
        py: 'Python',
        go: 'Go',
        rs: 'Rust'
      };

      const lang = langMap[ext || ''] || 'code';

      const functionCount = (text.match(/function|def |func |fn /gi) || []).length;
      const classCount = (text.match(/class /gi) || []).length;

      if (functionCount > 0 || classCount > 0) {
        const fileName = context.filePath.split('/').pop() || context.filePath;
        
        return {
          shouldRemember: true,
          memoryType: 'project',
          importance: 0,
          content: `File: ${fileName}. Language: ${lang}. Functions: ${functionCount}, Classes: ${classCount}`,
          pattern: 'code_structure',
          confidence: 0.6
        };
      }
    }

    return null;
  }

  private extractRelevantContent(text: string, type: string): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    if (sentences.length === 0) return text.slice(0, 200);
    
    const relevant = sentences.slice(0, 3).join('. ');
    return relevant.length > 500 ? relevant.slice(0, 500) + '...' : relevant;
  }
}