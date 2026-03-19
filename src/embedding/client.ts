export interface EmbeddingConfig {
  baseUrl: string;
  apiKey: string;
  modelId: string;
}

export class EmbeddingClient {
  constructor(private config: EmbeddingConfig) {}

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.config.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.modelId,
        input: text
      })
    });

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  async batchEmbed(texts: string[]): Promise<number[][]> {
    const response = await fetch(`${this.config.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.modelId,
        input: texts
      })
    });

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.map((item: any) => item.embedding);
  }
}
