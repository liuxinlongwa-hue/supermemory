import path from 'path';
import os from 'os';
import fs from 'fs';

export class LocalEmbeddingClient {
  private extractor: any = null;
  private initialized = false;
  private initializing: Promise<void> | null = null;
  readonly dimensions = 384;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initializing) return this.initializing;

    this.initializing = (async () => {
      const { pipeline, env } = await import('@xenova/transformers');
      
      const modelCacheDir = path.join(os.homedir(), '.supermemory', 'models');
      if (!fs.existsSync(modelCacheDir)) {
        fs.mkdirSync(modelCacheDir, { recursive: true });
      }
      env.cacheDir = modelCacheDir;

      this.extractor = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
        { quantized: true }
      );
      this.initialized = true;
    })();

    return this.initializing;
  }

  async embed(text: string): Promise<number[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    const output = await this.extractor(text, {
      pooling: 'mean',
      normalize: true
    });

    return Array.from(output.data as Float32Array);
  }

  async batchEmbed(texts: string[]): Promise<number[][]> {
    if (!this.initialized) {
      await this.initialize();
    }

    const output = await this.extractor(texts, {
      pooling: 'mean',
      normalize: true
    });

    const result: number[][] = [];
    for (let i = 0; i < texts.length; i++) {
      const start = i * this.dimensions;
      const end = start + this.dimensions;
      result.push(Array.from(output.data.slice(start, end) as Float32Array));
    }

    return result;
  }
}