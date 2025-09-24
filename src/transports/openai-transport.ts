import OpenAI from 'openai';
import { Transport, TaskRequest, TaskResponse } from '../types';

export class OpenAITransport implements Transport {
  private client: OpenAI;

  constructor(apiKey: string, baseURL?: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL,
    });
  }

  async execute(request: TaskRequest): Promise<TaskResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: request.model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: request.prompt,
          },
        ],
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 1000,
      });

      const usage = response.usage;
      const cost = this.calculateCost(
        response.model,
        usage?.prompt_tokens || 0,
        usage?.completion_tokens || 0
      );

      return {
        id: request.id,
        request,
        response: response.choices[0]?.message?.content || '',
        usage: {
          promptTokens: usage?.prompt_tokens || 0,
          completionTokens: usage?.completion_tokens || 0,
          totalTokens: usage?.total_tokens || 0,
        },
        cost,
        timestamp: new Date().toISOString(),
        success: true,
      };
    } catch (error) {
      return {
        id: request.id,
        request,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        success: false,
      };
    }
  }

  async executeBatch(requests: TaskRequest[]): Promise<TaskResponse[]> {
    const results: TaskResponse[] = [];
    
    for (const request of requests) {
      const result = await this.execute(request);
      results.push(result);
    }
    
    return results;
  }

  private calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    // Pricing as of 2024 (per 1K tokens)
    const pricing: Record<string, { prompt: number; completion: number }> = {
      'gpt-3.5-turbo': { prompt: 0.0015, completion: 0.002 },
      'gpt-3.5-turbo-16k': { prompt: 0.003, completion: 0.004 },
      'gpt-4': { prompt: 0.03, completion: 0.06 },
      'gpt-4-32k': { prompt: 0.06, completion: 0.12 },
      'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
    };

    const modelPricing = pricing[model] || pricing['gpt-3.5-turbo'];
    const promptCost = (promptTokens / 1000) * modelPricing.prompt;
    const completionCost = (completionTokens / 1000) * modelPricing.completion;
    
    return promptCost + completionCost;
  }
}
