import { Transport, DryRunTransport, TaskRequest, TaskResponse, DryRunResult } from '../types';

export class DryRunTransport implements DryRunTransport {
  private dryRunResults: DryRunResult[] = [];
  private requestCounter = 0;

  async execute(request: TaskRequest): Promise<TaskResponse> {
    const simulatedResponse = this.generateSimulatedResponse(request);
    const simulatedUsage = this.generateSimulatedUsage(request);
    const simulatedCost = this.calculateSimulatedCost(request.model || 'gpt-3.5-turbo', simulatedUsage);

    const dryRunResult: DryRunResult = {
      id: request.id,
      request,
      simulatedResponse,
      simulatedUsage,
      simulatedCost,
      timestamp: new Date().toISOString(),
      success: true,
    };

    this.dryRunResults.push(dryRunResult);

    return {
      id: request.id,
      request,
      response: simulatedResponse,
      usage: simulatedUsage,
      cost: simulatedCost,
      timestamp: new Date().toISOString(),
      success: true,
    };
  }

  async executeBatch(requests: TaskRequest[]): Promise<TaskResponse[]> {
    const results: TaskResponse[] = [];
    
    for (const request of requests) {
      const result = await this.execute(request);
      results.push(result);
    }
    
    return results;
  }

  getDryRunResults(): DryRunResult[] {
    return [...this.dryRunResults];
  }

  private generateSimulatedResponse(request: TaskRequest): string {
    // Generate deterministic responses based on request content
    const hash = this.simpleHash(request.prompt + request.id);
    const responses = [
      `This is a simulated response for task "${request.id}". The prompt was: "${request.prompt.substring(0, 50)}..."`,
      `[DRY RUN] Generated response for: ${request.prompt}`,
      `Simulated AI response: Based on the input "${request.prompt}", here's what the AI would likely respond with...`,
      `Mock response for task ${request.id}: This is what GPT would generate for your prompt.`,
      `[SIMULATION] Task ${request.id} completed successfully. Response: ${request.prompt} processed.`,
    ];
    
    return responses[hash % responses.length];
  }

  private generateSimulatedUsage(request: TaskRequest): { promptTokens: number; completionTokens: number; totalTokens: number } {
    // Generate realistic token usage based on prompt length
    const promptTokens = Math.ceil(request.prompt.length / 4); // Rough estimate: 4 chars per token
    const completionTokens = Math.ceil(promptTokens * 0.3 + Math.random() * 100); // 30% of prompt + some variation
    const totalTokens = promptTokens + completionTokens;

    return {
      promptTokens,
      completionTokens,
      totalTokens,
    };
  }

  private calculateSimulatedCost(model: string, usage: { promptTokens: number; completionTokens: number }): number {
    // Same pricing as OpenAI transport
    const pricing: Record<string, { prompt: number; completion: number }> = {
      'gpt-3.5-turbo': { prompt: 0.0015, completion: 0.002 },
      'gpt-3.5-turbo-16k': { prompt: 0.003, completion: 0.004 },
      'gpt-4': { prompt: 0.03, completion: 0.06 },
      'gpt-4-32k': { prompt: 0.06, completion: 0.12 },
      'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
    };

    const modelPricing = pricing[model] || pricing['gpt-3.5-turbo'];
    const promptCost = (usage.promptTokens / 1000) * modelPricing.prompt;
    const completionCost = (usage.completionTokens / 1000) * modelPricing.completion;
    
    return promptCost + completionCost;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
