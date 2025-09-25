import OpenAI from 'openai';
import { Transport, TaskRequest, TaskResponse, RetryConfig } from '../types';
import { RetryManager, defaultRetryConfig } from '../utils/retry';
import { TimingTracker } from '../utils/timing';

export class OpenAITransport implements Transport {
  private client: OpenAI;
  private retryManager: RetryManager;

  constructor(
    apiKey: string,
    baseURL?: string,
    retryConfig?: Partial<RetryConfig>
  ) {
    this.client = new OpenAI({
      apiKey,
      baseURL,
      timeout: retryConfig?.timeoutMs || defaultRetryConfig.timeoutMs,
    });

    const config = { ...defaultRetryConfig, ...retryConfig };
    this.retryManager = new RetryManager(config);
  }

  async execute(request: TaskRequest): Promise<TaskResponse> {
    const timing = new TimingTracker();
    let retryCount = 0;

    try {
      const result = await this.retryManager.executeWithRetry(async () => {
        retryCount++;
        return await this.executeSingle(request);
      }, `task-${request.id}`);

      timing.end();
      return {
        ...result,
        timings: timing.getTimings(),
        retryCount: retryCount - 1, // Don't count the successful attempt
      };
    } catch (error) {
      timing.end();
      return this.createErrorResponse(request, error, timing, retryCount);
    }
  }

  private async executeSingle(request: TaskRequest): Promise<TaskResponse> {
    // Convert request to OpenAI message format
    let messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }>;

    if (request.messages && request.messages.length > 0) {
      messages = request.messages;
    } else if (request.prompt) {
      messages = [
        {
          role: 'user',
          content: request.prompt,
        },
      ];
    } else {
      throw new Error('Either prompt or messages must be provided');
    }

    const response = await this.client.chat.completions.create({
      model: request.model || 'gpt-3.5-turbo',
      messages,
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
  }

  private createErrorResponse(
    request: TaskRequest,
    error: unknown,
    timing: TimingTracker,
    retryCount: number
  ): TaskResponse {
    let errorMessage = 'Unknown error';
    let errorCode = 'E_UNKNOWN';
    let isRetryable = true;

    if (error instanceof Error) {
      errorMessage = error.message;

      // Check if it's a RetryError with error info
      if (error.name === 'RetryError' && 'errorInfo' in error) {
        const retryError = error as any;
        errorCode = retryError.errorInfo.code;
        isRetryable = retryError.errorInfo.isRetryable;
      } else {
        errorCode = this.extractErrorCode(error);
        isRetryable = this.isRetryableError(error);

        // Provide user-friendly error messages for common error codes
        if (errorCode === 'E_INPUT') {
          errorMessage = 'Invalid input or bad request';
        } else if (errorCode === 'E_AUTH') {
          errorMessage = 'Authentication failed';
        } else if (errorCode === 'E_QUOTA') {
          errorMessage = 'Quota exceeded or billing issue';
        } else if (errorCode === 'E_RATE_LIMIT') {
          errorMessage = 'Rate limit exceeded';
        }
      }
    }

    return {
      id: request.id,
      request,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      success: false,
      timings: timing.getTimings(),
      retryCount,
      errorCode,
      isRetryable,
    };
  }

  private extractErrorCode(error: unknown): string {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('rate limit') || message.includes('429')) {
        return 'E_RATE_LIMIT';
      }
      if (message.includes('timeout') || message.includes('etimedout')) {
        return 'E_TIMEOUT';
      }
      if (message.includes('unauthorized') || message.includes('401')) {
        return 'E_AUTH';
      }
      if (message.includes('quota') || message.includes('billing')) {
        return 'E_QUOTA';
      }
      if (
        message.includes('invalid') ||
        message.includes('bad request') ||
        message.includes('must be provided')
      ) {
        return 'E_INPUT';
      }
      if (
        message.includes('500') ||
        message.includes('502') ||
        message.includes('503')
      ) {
        return 'E_SERVER_ERROR';
      }
      if (message.includes('network') || message.includes('econnreset')) {
        return 'E_NETWORK';
      }
    }
    return 'E_UNKNOWN';
  }

  private isRetryableError(error: unknown): boolean {
    const code = this.extractErrorCode(error);
    const nonRetryableCodes = ['E_AUTH', 'E_QUOTA', 'E_INPUT'];
    return !nonRetryableCodes.includes(code);
  }

  async executeBatch(requests: TaskRequest[]): Promise<TaskResponse[]> {
    const results: TaskResponse[] = [];
    const batchStartTime = Date.now();

    console.log(`Starting batch execution of ${requests.length} tasks...`);

    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      console.log(`Processing task ${i + 1}/${requests.length}: ${request.id}`);

      const result = await this.execute(request);
      results.push(result);

      // Log progress and any failures
      if (result.success) {
        console.log(`✅ Task ${request.id} completed successfully`);
      } else {
        console.warn(`❌ Task ${request.id} failed: ${result.error}`);
      }
    }

    const batchDuration = Date.now() - batchStartTime;
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    console.log(
      `Batch completed in ${batchDuration}ms: ${successCount} successful, ${failureCount} failed`
    );

    return results;
  }

  /**
   * Get circuit breaker state for monitoring
   */
  getCircuitBreakerState() {
    return this.retryManager.getCircuitBreakerState();
  }

  /**
   * Reset circuit breaker (useful for testing or manual recovery)
   */
  resetCircuitBreaker() {
    // Create a new retry manager to reset circuit breaker
    const config = this.retryManager['config'];
    this.retryManager = new RetryManager(config);
  }

  /**
   * Reset the transport state (useful for testing)
   */
  reset() {
    this.retryManager.reset();
  }

  private calculateCost(
    model: string,
    promptTokens: number,
    completionTokens: number
  ): number {
    // Pricing as of 2024 (per 1K tokens)
    const pricing: Record<string, { prompt: number; completion: number }> = {
      'gpt-3.5-turbo': { prompt: 0.0015, completion: 0.002 },
      'gpt-3.5-turbo-16k': { prompt: 0.003, completion: 0.004 },
      'gpt-4': { prompt: 0.03, completion: 0.06 },
      'gpt-4-32k': { prompt: 0.06, completion: 0.12 },
      'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
    };

    const modelPricing = pricing[model] || pricing['gpt-3.5-turbo'];
    const promptCost = (promptTokens / 1000) * (modelPricing?.prompt || 0);
    const completionCost =
      (completionTokens / 1000) * (modelPricing?.completion || 0);

    return promptCost + completionCost;
  }
}
