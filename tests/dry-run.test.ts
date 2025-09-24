import { DryRunTransport } from '../src/transports/dry-run-transport';
import { TaskRequest } from '../src/types';

describe('DryRunTransport', () => {
  let transport: DryRunTransport;

  beforeEach(() => {
    transport = new DryRunTransport();
  });

  describe('execute', () => {
    it('should generate deterministic responses', async () => {
      const request: TaskRequest = {
        id: 'test-1',
        prompt: 'Test prompt',
        model: 'gpt-3.5-turbo',
      };

      const result1 = await transport.execute(request);
      const result2 = await transport.execute(request);

      // Should be deterministic
      expect(result1.response).toBe(result2.response);
      expect(result1.usage).toEqual(result2.usage);
      expect(result1.cost).toBe(result2.cost);
    });

    it('should not make external API calls', async () => {
      const request: TaskRequest = {
        id: 'test-2',
        prompt: 'Another test prompt',
      };

      // Mock fetch to ensure no external calls
      const originalFetch = global.fetch;
      global.fetch = jest.fn();

      await transport.execute(request);

      // Verify no fetch calls were made
      expect(global.fetch).not.toHaveBeenCalled();

      // Restore original fetch
      global.fetch = originalFetch;
    });

    it('should generate realistic token usage', async () => {
      const request: TaskRequest = {
        id: 'test-3',
        prompt: 'This is a longer prompt that should generate more tokens',
      };

      const result = await transport.execute(request);

      expect(result.usage?.promptTokens).toBeGreaterThan(0);
      expect(result.usage?.completionTokens).toBeGreaterThan(0);
      expect(result.usage?.totalTokens).toBe(
        (result.usage?.promptTokens || 0) + (result.usage?.completionTokens || 0)
      );
    });

    it('should calculate costs correctly for different models', async () => {
      const testCases = [
        { model: 'gpt-3.5-turbo', expectedMinCost: 0.0001 },
        { model: 'gpt-4', expectedMinCost: 0.001 },
        { model: 'gpt-4-turbo', expectedMinCost: 0.0005 },
      ];

      for (const testCase of testCases) {
        const request: TaskRequest = {
          id: `test-${testCase.model}`,
          prompt: 'Test prompt',
          model: testCase.model,
        };

        const result = await transport.execute(request);

        expect(result.cost).toBeGreaterThan(testCase.expectedMinCost);
        expect(typeof result.cost).toBe('number');
      }
    });

    it('should handle requests with different parameters', async () => {
      const request: TaskRequest = {
        id: 'test-params',
        prompt: 'Test prompt with parameters',
        model: 'gpt-4',
        temperature: 0.8,
        maxTokens: 500,
        metadata: { source: 'test' },
      };

      const result = await transport.execute(request);

      expect(result.success).toBe(true);
      expect(result.id).toBe('test-params');
      expect(result.request).toEqual(request);
      expect(result.response).toBeDefined();
      expect(result.usage).toBeDefined();
      expect(result.cost).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should always return success for dry run', async () => {
      const request: TaskRequest = {
        id: 'test-success',
        prompt: 'Any prompt',
      };

      const result = await transport.execute(request);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('executeBatch', () => {
    it('should handle batch execution', async () => {
      const requests: TaskRequest[] = [
        { id: 'batch-1', prompt: 'First prompt' },
        { id: 'batch-2', prompt: 'Second prompt' },
        { id: 'batch-3', prompt: 'Third prompt' },
      ];

      const results = await transport.executeBatch(requests);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(transport.getDryRunResults()).toHaveLength(3);
    });

    it('should process requests in order', async () => {
      const requests: TaskRequest[] = [
        { id: 'order-1', prompt: 'First' },
        { id: 'order-2', prompt: 'Second' },
        { id: 'order-3', prompt: 'Third' },
      ];

      const results = await transport.executeBatch(requests);

      expect(results[0].id).toBe('order-1');
      expect(results[1].id).toBe('order-2');
      expect(results[2].id).toBe('order-3');
    });

    it('should handle empty batch', async () => {
      const results = await transport.executeBatch([]);

      expect(results).toHaveLength(0);
      expect(transport.getDryRunResults()).toHaveLength(0);
    });
  });

  describe('getDryRunResults', () => {
    it('should track dry run results', async () => {
      const request: TaskRequest = {
        id: 'test-5',
        prompt: 'Test prompt',
      };

      await transport.execute(request);
      const dryRunResults = transport.getDryRunResults();

      expect(dryRunResults).toHaveLength(1);
      expect(dryRunResults[0].id).toBe('test-5');
      expect(dryRunResults[0].simulatedResponse).toBeDefined();
      expect(dryRunResults[0].simulatedUsage).toBeDefined();
      expect(dryRunResults[0].simulatedCost).toBeDefined();
    });

    it('should return a copy of results', async () => {
      const request: TaskRequest = {
        id: 'test-copy',
        prompt: 'Test prompt',
      };

      await transport.execute(request);
      const results1 = transport.getDryRunResults();
      const results2 = transport.getDryRunResults();

      expect(results1).toEqual(results2);
      expect(results1).not.toBe(results2); // Should be different objects
    });

    it('should accumulate results across multiple executions', async () => {
      const requests: TaskRequest[] = [
        { id: 'accumulate-1', prompt: 'First' },
        { id: 'accumulate-2', prompt: 'Second' },
      ];

      await transport.execute(requests[0]);
      expect(transport.getDryRunResults()).toHaveLength(1);

      await transport.execute(requests[1]);
      expect(transport.getDryRunResults()).toHaveLength(2);

      await transport.executeBatch(requests);
      expect(transport.getDryRunResults()).toHaveLength(4);
    });
  });

  describe('response generation', () => {
    it('should generate different responses for different prompts', async () => {
      const request1: TaskRequest = {
        id: 'diff-1',
        prompt: 'First unique prompt',
      };
      const request2: TaskRequest = {
        id: 'diff-2',
        prompt: 'Second unique prompt',
      };

      const result1 = await transport.execute(request1);
      const result2 = await transport.execute(request2);

      expect(result1.response).not.toBe(result2.response);
    });

    it('should include task ID in response', async () => {
      const request: TaskRequest = {
        id: 'test-id-in-response',
        prompt: 'Test prompt',
      };

      const result = await transport.execute(request);

      expect(result.response).toContain('test-id-in-response');
    });

    it('should include prompt snippet in response', async () => {
      const request: TaskRequest = {
        id: 'test-prompt-snippet',
        prompt: 'This is a very specific test prompt',
      };

      const result = await transport.execute(request);

      expect(result.response).toContain('This is a very specific test prompt');
    });
  });

  describe('token usage simulation', () => {
    it('should scale token usage with prompt length', async () => {
      const shortRequest: TaskRequest = {
        id: 'short',
        prompt: 'Short',
      };
      const longRequest: TaskRequest = {
        id: 'long',
        prompt: 'This is a much longer prompt that should generate more prompt tokens because it has more content and should result in higher token usage overall',
      };

      const shortResult = await transport.execute(shortRequest);
      const longResult = await transport.execute(longRequest);

      expect(longResult.usage?.promptTokens).toBeGreaterThan(shortResult.usage?.promptTokens || 0);
    });

    it('should generate reasonable token counts', async () => {
      const request: TaskRequest = {
        id: 'reasonable-tokens',
        prompt: 'A normal length prompt for testing',
      };

      const result = await transport.execute(request);

      expect(result.usage?.promptTokens).toBeGreaterThan(0);
      expect(result.usage?.promptTokens).toBeLessThan(1000);
      expect(result.usage?.completionTokens).toBeGreaterThan(0);
      expect(result.usage?.completionTokens).toBeLessThan(1000);
    });
  });

  describe('cost calculation', () => {
    it('should calculate different costs for different models', async () => {
      const gpt35Request: TaskRequest = {
        id: 'gpt35',
        prompt: 'Same prompt',
        model: 'gpt-3.5-turbo',
      };
      const gpt4Request: TaskRequest = {
        id: 'gpt4',
        prompt: 'Same prompt',
        model: 'gpt-4',
      };

      const gpt35Result = await transport.execute(gpt35Request);
      const gpt4Result = await transport.execute(gpt4Request);

      expect(gpt4Result.cost).toBeGreaterThan(gpt35Result.cost || 0);
    });

    it('should calculate costs based on token usage', async () => {
      const request: TaskRequest = {
        id: 'cost-calculation',
        prompt: 'Test prompt',
        model: 'gpt-3.5-turbo',
      };

      const result = await transport.execute(request);

      // Cost should be positive and reasonable
      expect(result.cost).toBeGreaterThan(0);
      expect(result.cost).toBeLessThan(1); // Should be less than $1 for a single request
    });
  });
});
