import { EventEmitter } from 'events';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface CodeChange {
  filePath: string;
  changeType: 'create' | 'modify' | 'delete';
  content?: string;
  timestamp: number;
}

export class Monitor extends EventEmitter {
  private conversationHistory: ConversationMessage[] = [];
  private maxHistorySize: number = 50;
  private conversationWindow: number = 60000;

  addMessage(role: 'user' | 'assistant', content: string): void {
    const message: ConversationMessage = {
      role,
      content,
      timestamp: Date.now()
    };

    this.conversationHistory.push(message);
    
    if (this.conversationHistory.length > this.maxHistorySize) {
      this.conversationHistory.shift();
    }

    this.emit('message', message);
    this.analyzeConversation();
  }

  private analyzeConversation(): void {
    const recentMessages = this.getRecentConversation();
    
    if (recentMessages.length < 2) return;

    const fullText = recentMessages.map(m => m.content).join(' ');
    
    this.emit('analysis', {
      type: 'conversation',
      content: fullText,
      messages: recentMessages,
      timestamp: Date.now()
    });
  }

  getRecentConversation(windowMs?: number): ConversationMessage[] {
    const window = windowMs || this.conversationWindow;
    const cutoff = Date.now() - window;
    
    return this.conversationHistory.filter(m => m.timestamp > cutoff);
  }

  getAllHistory(): ConversationMessage[] {
    return [...this.conversationHistory];
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  analyzeCodeChange(change: CodeChange): void {
    this.emit('analysis', {
      type: 'code',
      content: change.content || '',
      filePath: change.filePath,
      changeType: change.changeType,
      timestamp: change.timestamp
    });
  }
}