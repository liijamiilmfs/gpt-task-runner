import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAITransport } from '../src/transports/openai-transport';
import { TaskRequest, RetryConfig } from '../src/types';

// Mock OpenAI with shared spy instance
const mockCreate = vi.hoisted(() => vi.fn());
const mockClient = {
  chat: {
    completions: {
      create: mockCreate,
    },
  },
};

vi.mock('openai', () => ({
  default: vi.fn(() => mockClient),
  __esModule: true,
  mockCreate,
}));

describe('OpenAITransport with Retry', () => {
  let transport: OpenAITransport;
  const mockApiKey = 'test-api-key';

  beforeEach(async () => {
    // Reset modules to ensure fresh imports
    vi.resetModules();
    
    // Clear mock state but keep the spy instance
    mockCreate.mockClear();
    mockCreate.mockReset();
  });

  afterEach(() => {
    // Use clearAllMocks instead of restoreAllMocks to keep hoisted mocks active
    vi.clearAllMocks();
  });

  describe('execute with retry', () => {
    it('should succeed on first attempt', async () => {
      const transport = new OpenAITransport(mockApiKey);
      
      const mockResponse = {
        choices: [{ message: { content: 'Test response' } }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
        model: 'gpt-3.5-turbo',
      };

      mockCreate.mockResolvedValue(mockResponse);

      const request: TaskRequest = {
        id: 'test-1',
        prompt: 'Test prompt',
      };

      const result = await transport.execute(request);

      expect(result.success).toBe(true);
      expect(result.response).toBe('Test response');
      expect(result.retryCount).toBe(0);
      expect(result.timings).toBeDefined();
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });


    it('should retry on rate limit errors', async () => {
      const transport = new OpenAITransport(mockApiKey);
      
      const mockResponse = {
        choices: [{ message: { content: 'Success after retry' } }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
        model: 'gpt-3.5-turbo',
      };

      // First call fails with rate limit, second succeeds
      mockCreate
        .mockRejectedValueOnce(new Error('rate limit exceeded'))
        .mockResolvedValueOnce(mockResponse);

      const request: TaskRequest = {
        id: 'test-2',
        prompt: 'Test prompt',
      };

      const result = await transport.execute(request);

      expect(result.success).toBe(true);
      expect(result.response).toBe('Success after retry');
      expect(result.retryCount).toBe(1);
      expect(result.errorCode).toBeUndefined();
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should not retry on authentication errors', async () => {
      const transport = new OpenAITransport(mockApiKey);
      
      const authError = new Error('unauthorized');
      mockCreate.mockRejectedValue(authError);

      const request: TaskRequest = {
        id: 'test-3',
        prompt: 'Test prompt',
      };

      const result = await transport.execute(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication failed');
      expect(result.errorCode).toBe('E_AUTH');
      expect(result.isRetryable).toBe(false);
      expect(result.retryCount).toBe(1);
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should handle quota exceeded errors', async () => {
      const transport = new OpenAITransport(mockApiKey);
      
      const quotaError = new Error('quota exceeded');
      mockCreate.mockRejectedValue(quotaError);

      const request: TaskRequest = {
        id: 'test-4',
        prompt: 'Test prompt',
      };

      const result = await transport.execute(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Quota exceeded or billing issue');
      expect(result.errorCode).toBe('E_QUOTA');
      expect(result.isRetryable).toBe(false);
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should include timing information', async () => {
      const transport = new OpenAITransport(mockApiKey);
      
      const mockResponse = {
        choices: [{ message: { content: 'Test response' } }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
        model: 'gpt-3.5-turbo',
      };

      // Add a small delay to ensure timing is measurable
      mockCreate.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return mockResponse;
      });

      const request: TaskRequest = {
        id: 'test-5',
        prompt: 'Test prompt',
      };

      const result = await transport.execute(request);

      expect(result.timings).toBeDefined();
      expect(result.timings?.start).toBeDefined();
      expect(result.timings?.end).toBeDefined();
      expect(result.timings?.duration_ms).toBeGreaterThanOrEqual(0);
    });

    it('should calculate cost correctly', async () => {
      const transport = new OpenAITransport(mockApiKey);
      
      const mockResponse = {
        choices: [{ message: { content: 'Test response' } }],
        usage: {
          prompt_tokens: 1000,
          completion_tokens: 500,
          total_tokens: 1500,
        },
        model: 'gpt-3.5-turbo',
      };

      mockCreate.mockResolvedValue(mockResponse);

      const request: TaskRequest = {
        id: 'test-6',
        prompt: 'Test prompt',
      };

      const result = await transport.execute(request);

      expect(result.cost).toBeDefined();
      expect(result.cost).toBeGreaterThan(0);
      // For gpt-3.5-turbo: (1000 * 0.0015 + 500 * 0.002) / 1000 = 0.0025
      expect(result.cost).toBeCloseTo(0.0025, 4);
    });
  });

  describe('executeBatch', () => {
    it('should process multiple requests with individual retry logic', async () => {
      const transport = new OpenAITransport(mockApiKey);
      
      const mockResponse = {
        choices: [{ message: { content: 'Test response' } }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
        model: 'gpt-3.5-turbo',
      };

      // First request fails once, second succeeds immediately
      mockCreate
        .mockRejectedValueOnce(new Error('rate limit exceeded'))
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(mockResponse);

      const requests: TaskRequest[] = [
        { id: 'batch-1', prompt: 'First prompt' },
        { id: 'batch-2', prompt: 'Second prompt' },
      ];

      const results = await transport.executeBatch(requests);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[0].retryCount).toBe(1);
      expect(results[1].success).toBe(true);
      expect(results[1].retryCount).toBe(0);
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });
  });

  describe('circuit breaker', () => {
    it('should provide circuit breaker state', () => {
      const transport = new OpenAITransport(mockApiKey);
      const state = transport.getCircuitBreakerState();
      expect(state).toBeDefined();
      expect(state.state).toBe('CLOSED');
      expect(state.failureCount).toBe(0);
    });

    it('should allow circuit breaker reset', () => {
      const transport = new OpenAITransport(mockApiKey);
      transport.resetCircuitBreaker();
      const state = transport.getCircuitBreakerState();
      expect(state.state).toBe('CLOSED');
      expect(state.failureCount).toBe(0);
    });
  });

  describe('custom retry configuration', () => {
    it('should use custom retry configuration', () => {
      const customConfig: Partial<RetryConfig> = {
        maxRetries: 5,
        baseDelayMs: 500,
        timeoutMs: 30000,
      };

      const customTransport = new OpenAITransport(
        mockApiKey,
        undefined,
        customConfig
      );
      expect(customTransport).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle messages format correctly', async () => {
      const transport = new OpenAITransport(mockApiKey);
      
      const mockResponse = {
        choices: [{ message: { content: 'Test response' } }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
        model: 'gpt-3.5-turbo',
      };

      mockCreate.mockResolvedValue(mockResponse);

      const request: TaskRequest = {
        id: 'test-7',
        messages: [
          { role: 'system', content: 'You are a helpful assistant' },
          { role: 'user', content: 'Test message' },
        ],
      };

      const result = await transport.execute(request);

      expect(result.success).toBe(true);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: request.messages,
        })
      );
    });

    it('should throw error when neither prompt nor messages provided', async () => {
      const transport = new OpenAITransport(mockApiKey);
      
      const request: TaskRequest = {
        id: 'test-8',
        // No prompt or messages
      };

      const result = await transport.execute(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'Invalid input or bad request'
      );
      expect(result.errorCode).toBe('E_INPUT');
    });
  });
});
