import { describe, it, expect } from 'vitest';
import { ErrorTaxonomy } from '../src/utils/error-taxonomy';
import { ErrorCodes } from '../src/types';
import {
  ExitCodes,
  getExitCodeFromErrorCode,
  getExitCodeDescription,
  isSuccessExitCode,
  isPartialSuccessExitCode,
} from '../src/utils/exit-codes';

describe('Error Taxonomy System', () => {
  describe('ErrorTaxonomy', () => {
    it('should classify rate limit errors correctly', () => {
      const error = new Error('Rate limit exceeded');
      const result = ErrorTaxonomy.classifyError(error);

      expect(result.code).toBe(ErrorCodes.RATE_LIMIT);
      expect(result.isRetryable).toBe(true);
      expect(result.httpStatus).toBe(429);
      expect(result.taxonomy.userMessage).toContain('rate limit');
      expect(result.taxonomy.suggestedAction).toContain('Wait');
    });

    it('should classify authentication errors correctly', () => {
      const error = new Error('Unauthorized: Invalid API key');
      const result = ErrorTaxonomy.classifyError(error);

      expect(result.code).toBe(ErrorCodes.AUTH);
      expect(result.isRetryable).toBe(false);
      expect(result.httpStatus).toBe(401);
      expect(result.taxonomy.userMessage).toContain('Authentication failed');
      expect(result.taxonomy.suggestedAction).toContain('API key');
    });

    it('should classify file not found errors correctly', () => {
      const error = new Error('ENOENT: no such file or directory');
      const result = ErrorTaxonomy.classifyError(error);

      expect(result.code).toBe(ErrorCodes.FILE_NOT_FOUND);
      expect(result.isRetryable).toBe(false);
      expect(result.taxonomy.userMessage).toContain('File not found');
      expect(result.taxonomy.suggestedAction).toContain('file path');
    });

    it('should classify timeout errors correctly', () => {
      const error = new Error('Request timeout after 30s');
      const result = ErrorTaxonomy.classifyError(error);

      expect(result.code).toBe(ErrorCodes.TIMEOUT);
      expect(result.isRetryable).toBe(true);
      expect(result.taxonomy.userMessage).toContain('timed out');
      expect(result.taxonomy.suggestedAction).toContain('Retry');
    });

    it('should classify validation errors correctly', () => {
      const error = new Error('Validation failed: Required field missing');
      const result = ErrorTaxonomy.classifyError(error);

      expect(result.code).toBe(ErrorCodes.VALIDATION);
      expect(result.isRetryable).toBe(false);
      expect(result.taxonomy.userMessage).toContain('validation failed');
      expect(result.taxonomy.suggestedAction).toContain('schema');
    });

    it('should classify network errors correctly', () => {
      const error = new Error('ECONNRESET: Connection reset by peer');
      const result = ErrorTaxonomy.classifyError(error);

      expect(result.code).toBe(ErrorCodes.NETWORK);
      expect(result.isRetryable).toBe(true);
      expect(result.taxonomy.userMessage).toContain('Network connection error');
      expect(result.taxonomy.suggestedAction).toContain('internet connection');
    });

    it('should classify quota errors correctly', () => {
      const error = new Error('Quota exceeded for your organization');
      const result = ErrorTaxonomy.classifyError(error);

      expect(result.code).toBe(ErrorCodes.QUOTA);
      expect(result.isRetryable).toBe(false);
      expect(result.taxonomy.userMessage).toContain('Quota exceeded');
      expect(result.taxonomy.suggestedAction).toContain('billing');
    });

    it('should classify server errors correctly', () => {
      const error = new Error('Internal Server Error (500)');
      const result = ErrorTaxonomy.classifyError(error);

      expect(result.code).toBe(ErrorCodes.SERVER_ERROR);
      expect(result.isRetryable).toBe(true);
      expect(result.httpStatus).toBe(500);
      expect(result.taxonomy.userMessage).toContain('Server error');
      expect(result.taxonomy.suggestedAction).toContain('Retry');
    });

    it('should classify configuration errors correctly', () => {
      const error = new Error('Missing configuration: API_KEY not set');
      const result = ErrorTaxonomy.classifyError(error);

      expect(result.code).toBe(ErrorCodes.CONFIG);
      expect(result.isRetryable).toBe(false);
      expect(result.taxonomy.userMessage).toContain('configuration');
      expect(result.taxonomy.suggestedAction).toContain('configuration');
    });

    it('should classify memory errors correctly', () => {
      const error = new Error('Out of memory: Cannot allocate memory');
      const result = ErrorTaxonomy.classifyError(error);

      expect(result.code).toBe(ErrorCodes.MEMORY);
      expect(result.isRetryable).toBe(true);
      expect(result.taxonomy.userMessage).toContain('memory');
      expect(result.taxonomy.suggestedAction).toContain('batch size');
    });

    it('should classify unknown errors correctly', () => {
      const error = new Error('Some random error message');
      const result = ErrorTaxonomy.classifyError(error);

      expect(result.code).toBe(ErrorCodes.UNKNOWN);
      expect(result.isRetryable).toBe(true);
      expect(result.taxonomy.userMessage).toContain('unknown error');
    });

    it('should get error taxonomy entry by code', () => {
      const entry = ErrorTaxonomy.getEntry(ErrorCodes.RATE_LIMIT);

      expect(entry.code).toBe(ErrorCodes.RATE_LIMIT);
      expect(entry.category).toBe('API');
      expect(entry.isRetryable).toBe(true);
      expect(entry.userMessage).toContain('rate limit');
    });

    it('should get errors by category', () => {
      const apiErrors = ErrorTaxonomy.getErrorsByCategory('API');

      expect(apiErrors.length).toBeGreaterThan(0);
      expect(apiErrors.every((error) => error.category === 'API')).toBe(true);
      expect(
        apiErrors.some((error) => error.code === ErrorCodes.RATE_LIMIT)
      ).toBe(true);
    });

    it('should get troubleshooting information', () => {
      const info = ErrorTaxonomy.getTroubleshootingInfo(ErrorCodes.AUTH);

      expect(info.code).toBe(ErrorCodes.AUTH);
      expect(info.userMessage).toContain('Authentication failed');
      expect(info.suggestedAction).toContain('API key');
      expect(info.documentationUrl).toContain('openai.com');
    });

    it('should generate user-friendly error summary', () => {
      const error = new Error('Rate limit exceeded');
      const summary = ErrorTaxonomy.generateErrorSummary(error);

      expect(summary).toContain('E_RATE_LIMIT');
      expect(summary).toContain('rate limit');
      expect(summary).toContain('Suggested Action');
      expect(summary).toContain('wait');
    });
  });

  describe('Exit Codes', () => {
    it('should map error codes to exit codes correctly', () => {
      expect(getExitCodeFromErrorCode(ErrorCodes.RATE_LIMIT)).toBe(
        ExitCodes.RATE_LIMIT_ERROR
      );
      expect(getExitCodeFromErrorCode(ErrorCodes.AUTH)).toBe(
        ExitCodes.AUTH_ERROR
      );
      expect(getExitCodeFromErrorCode(ErrorCodes.FILE_NOT_FOUND)).toBe(
        ExitCodes.FILE_NOT_FOUND_ERROR
      );
      expect(getExitCodeFromErrorCode(ErrorCodes.VALIDATION)).toBe(
        ExitCodes.VALIDATION_ERROR
      );
      expect(getExitCodeFromErrorCode(ErrorCodes.CONFIG_MISSING)).toBe(
        ExitCodes.CONFIG_MISSING_ERROR
      );
      expect(getExitCodeFromErrorCode(ErrorCodes.MEMORY)).toBe(
        ExitCodes.MEMORY_ERROR
      );
      expect(getExitCodeFromErrorCode(ErrorCodes.BATCH_FAILED)).toBe(
        ExitCodes.BATCH_FAILED_ERROR
      );
    });

    it('should provide human-readable exit code descriptions', () => {
      expect(getExitCodeDescription(ExitCodes.SUCCESS)).toBe(
        'Operation completed successfully'
      );
      expect(getExitCodeDescription(ExitCodes.RATE_LIMIT_ERROR)).toBe(
        'Rate limit exceeded'
      );
      expect(getExitCodeDescription(ExitCodes.AUTH_ERROR)).toBe(
        'Authentication failed'
      );
      expect(getExitCodeDescription(ExitCodes.FILE_NOT_FOUND_ERROR)).toBe(
        'File not found'
      );
      expect(getExitCodeDescription(ExitCodes.PARTIAL_SUCCESS)).toBe(
        'Partial success - some tasks failed'
      );
    });

    it('should correctly identify success exit codes', () => {
      expect(isSuccessExitCode(ExitCodes.SUCCESS)).toBe(true);
      expect(isSuccessExitCode(ExitCodes.SUCCESS_WITH_WARNINGS)).toBe(true);
      expect(isSuccessExitCode(ExitCodes.DRY_RUN_SUCCESS)).toBe(true);
      expect(isSuccessExitCode(ExitCodes.RATE_LIMIT_ERROR)).toBe(false);
      expect(isSuccessExitCode(ExitCodes.PARTIAL_SUCCESS)).toBe(false);
    });

    it('should correctly identify partial success exit codes', () => {
      expect(isPartialSuccessExitCode(ExitCodes.SUCCESS_WITH_WARNINGS)).toBe(
        true
      );
      expect(isPartialSuccessExitCode(ExitCodes.PARTIAL_SUCCESS)).toBe(true);
      expect(isPartialSuccessExitCode(ExitCodes.SUCCESS)).toBe(false);
      expect(isPartialSuccessExitCode(ExitCodes.RATE_LIMIT_ERROR)).toBe(false);
    });
  });

  describe('Error Taxonomy Integration', () => {
    it('should handle circuit breaker errors', () => {
      const error = new Error('Circuit breaker is OPEN');
      const result = ErrorTaxonomy.classifyError(error);

      expect(result.code).toBe(ErrorCodes.SERVER_ERROR);
      expect(result.isRetryable).toBe(true);
    });

    it('should handle HTTP status codes in error messages', () => {
      const error = new Error('HTTP 503 Service Unavailable');
      const result = ErrorTaxonomy.classifyError(error);

      expect(result.code).toBe(ErrorCodes.SERVER_ERROR);
      expect(result.httpStatus).toBe(500); // The taxonomy defaults to 500 for server errors
      expect(result.isRetryable).toBe(true);
    });

    it('should preserve original error information', () => {
      const originalError = new Error('Test error');
      const result = ErrorTaxonomy.classifyError(originalError);

      expect(result.originalError).toBe(originalError);
      expect(result.taxonomy.originalError).toBeUndefined(); // Taxonomy doesn't store original error
    });

    it('should provide both user and technical messages', () => {
      const error = new Error('Rate limit exceeded');
      const result = ErrorTaxonomy.classifyError(error);

      expect(result.message).toBe(result.taxonomy.userMessage);
      expect(result.technicalMessage).toBe(result.taxonomy.technicalMessage);
      expect(result.message).not.toBe(result.technicalMessage);
    });
  });
});
