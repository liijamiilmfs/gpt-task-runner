import { Transport, TaskRequest, TaskResponse, DryRunResult } from '../types';

export class DryRunTransport implements Transport {
  private dryRunResults: DryRunResult[] = [];

  private getTaskContent(task: TaskRequest): string {
    if (task.prompt) {
      return task.prompt;
    } else if (task.messages && task.messages.length > 0) {
      return task.messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    } else {
      return 'No content provided';
    }
  }

  async execute(request: TaskRequest): Promise<TaskResponse> {
    return this.executeBatch([request]).then((results) => results[0]);
  }

  async executeBatch(tasks: TaskRequest[]): Promise<TaskResponse[]> {
    console.log(`[DRY RUN] Would execute ${tasks.length} tasks`);

    const responses: TaskResponse[] = [];

    for (const task of tasks) {
      const content = this.getTaskContent(task);
      const dryRunResult: DryRunResult = {
        id: task.id,
        request: task,
        simulatedResponse: `[DRY RUN] Would process task ${task.id}: ${content.substring(0, 50)}...`,
        simulatedUsage: {
          promptTokens: Math.floor(content.length / 4), // Rough estimate
          completionTokens: Math.floor((task.maxTokens || 1000) * 0.7), // Rough estimate
          totalTokens:
            Math.floor(content.length / 4) +
            Math.floor((task.maxTokens || 1000) * 0.7),
        },
        simulatedCost: this.calculateEstimatedCost(task),
        timestamp: new Date().toISOString(),
        success: true,
      };

      this.dryRunResults.push(dryRunResult);

      const response: TaskResponse = {
        id: task.id,
        request: task,
        response: `[DRY RUN] Would process task ${task.id}: ${content.substring(0, 50)}...`,
        usage: {
          promptTokens: Math.floor(content.length / 4), // Rough estimate
          completionTokens: Math.floor((task.maxTokens || 1000) * 0.7), // Rough estimate
          totalTokens:
            Math.floor(content.length / 4) +
            Math.floor((task.maxTokens || 1000) * 0.7),
        },
        cost: dryRunResult.simulatedCost,
        timestamp: new Date().toISOString(),
        success: true,
      };

      responses.push(response);
    }

    return responses;
  }

  getDryRunResults(): DryRunResult[] {
    return [...this.dryRunResults];
  }

  clearDryRunResults(): void {
    this.dryRunResults = [];
  }

  private calculateEstimatedCost(task: TaskRequest): number {
    // Rough cost estimation based on OpenAI pricing
    const modelPricing: Record<string, { prompt: number; completion: number }> =
      {
        'gpt-4': { prompt: 0.03, completion: 0.06 },
        'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
        'gpt-3.5-turbo': { prompt: 0.0015, completion: 0.002 },
      };

    const model = task.model || 'gpt-3.5-turbo';
    const pricing = modelPricing[model] || modelPricing['gpt-3.5-turbo'];
    const content = this.getTaskContent(task);
    const promptTokens = Math.floor(content.length / 4);
    const completionTokens = Math.floor((task.maxTokens || 1000) * 0.7);

    const promptCost = (promptTokens / 1000) * pricing.prompt;
    const completionCost = (completionTokens / 1000) * pricing.completion;

    return promptCost + completionCost;
  }
}
