import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import path from 'path';
import { UnknownTokenLogger } from '../../lib/unknown-token-logger';

describe('UnknownTokenLogger', () => {
  let logger: UnknownTokenLogger;
  const testLogFile = path.join(process.cwd(), 'build', 'TEST_UNKNOWN_TOKENS.csv');

  beforeEach(() => {
    // Get the singleton instance
    logger = UnknownTokenLogger.getInstance();
    // Override the log file path for testing
    (logger as any).logFile = testLogFile;
    (logger as any).isInitialized = false;
  });

  afterEach(() => {
    // Clean up test file
    if (fs.existsSync(testLogFile)) {
      fs.unlinkSync(testLogFile);
    }
  });

  describe('logUnknownToken', () => {
    it('should create log file and log a single unknown token', async () => {
      await logger.logUnknownToken({
        token: 'testword',
        variant: 'ancient',
        context: 'This is a test context'
      });

      expect(fs.existsSync(testLogFile)).toBe(true);
      
      const content = fs.readFileSync(testLogFile, 'utf8');
      const lines = content.trim().split('\n');
      
      expect(lines).toHaveLength(2); // Header + 1 data row
      expect(lines[0]).toBe('timestamp,token,variant,context,userAgent,sessionId');
      expect(lines[1]).toContain('testword');
      expect(lines[1]).toContain('ancient');
      expect(lines[1]).toContain('This is a test context');
    });

    it('should handle tokens with special characters in CSV', async () => {
      await logger.logUnknownToken({
        token: 'test,word"with"quotes',
        variant: 'modern',
        context: 'Context with "quotes" and, commas'
      });

      const content = fs.readFileSync(testLogFile, 'utf8');
      const lines = content.trim().split('\n');
      
      expect(lines[1]).toContain('"test,word""with""quotes"');
      expect(lines[1]).toContain('"Context with ""quotes"" and, commas"');
    });
  });

  describe('logUnknownTokens', () => {
    it('should log multiple unknown tokens', async () => {
      const tokens = ['word1', 'word2', 'word3'];
      
      await logger.logUnknownTokens(tokens, 'ancient', 'Test context');

      const content = fs.readFileSync(testLogFile, 'utf8');
      const lines = content.trim().split('\n');
      
      expect(lines).toHaveLength(4); // Header + 3 data rows
      expect(lines[1]).toContain('word1');
      expect(lines[2]).toContain('word2');
      expect(lines[3]).toContain('word3');
    });
  });

  describe('getUnknownTokens', () => {
    it('should return empty array for non-existent file', async () => {
      const tokens = await logger.getUnknownTokens();
      expect(tokens).toEqual([]);
    });

    it('should read and parse existing tokens', async () => {
      // Create test data
      const testData = `timestamp,token,variant,context,userAgent,sessionId
2023-01-01T00:00:00.000Z,testword,ancient,test context,,
2023-01-01T00:00:00.000Z,anotherword,modern,another context,,`;
      
      fs.writeFileSync(testLogFile, testData, 'utf8');

      const tokens = await logger.getUnknownTokens();
      
      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toEqual({
        timestamp: '2023-01-01T00:00:00.000Z',
        token: 'testword',
        variant: 'ancient',
        context: 'test context',
        userAgent: undefined,
        sessionId: undefined
      });
    });
  });

  describe('getTokenFrequency', () => {
    it('should calculate token frequency correctly', async () => {
      // Create test data with repeated tokens
      const testData = `timestamp,token,variant,context,userAgent,sessionId
2023-01-01T00:00:00.000Z,testword,ancient,context1,,
2023-01-01T00:00:00.000Z,testword,ancient,context2,,
2023-01-01T00:00:00.000Z,testword,modern,context3,,
2023-01-01T00:00:00.000Z,anotherword,ancient,context4,,`;
      
      fs.writeFileSync(testLogFile, testData, 'utf8');

      const frequency = await logger.getTokenFrequency();
      
      expect(frequency['testword:ancient']).toBe(2);
      expect(frequency['testword:modern']).toBe(1);
      expect(frequency['anotherword:ancient']).toBe(1);
    });
  });

  describe('clearLog', () => {
    it('should remove log file', async () => {
      // Create test file
      fs.writeFileSync(testLogFile, 'test data', 'utf8');
      expect(fs.existsSync(testLogFile)).toBe(true);

      await logger.clearLog();
      
      expect(fs.existsSync(testLogFile)).toBe(false);
    });

    it('should handle non-existent file gracefully', async () => {
      await expect(logger.clearLog()).resolves.not.toThrow();
    });
  });
});
