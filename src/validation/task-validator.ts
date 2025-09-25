// import { TaskRequest } from '../types'; // Used in type annotations

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export class TaskValidator {
  private static readonly REQUIRED_FIELDS = ['id'];
  // private static readonly REQUIRED_CONTENT_FIELDS = ['prompt', 'messages']; // At least one required
  private static readonly VALID_MODELS = [
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-16k',
    'gpt-4',
    'gpt-4-32k',
    'gpt-4-turbo',
    'gpt-4o',
    'gpt-4o-mini',
  ];
  private static readonly MIN_TEMPERATURE = 0;
  private static readonly MAX_TEMPERATURE = 2;
  private static readonly MIN_MAX_TOKENS = 1;
  private static readonly MAX_MAX_TOKENS = 4096;

  static validateTask(task: any, rowNumber?: number): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate required fields
    for (const field of this.REQUIRED_FIELDS) {
      if (!task[field] || (typeof task[field] === 'string' && task[field].trim() === '')) {
        errors.push({
          field,
          message: `Required field '${field}' is missing or empty`,
          value: task[field],
        });
      }
    }

    // Validate that at least one content field is present
    const hasPrompt = task.prompt && typeof task.prompt === 'string' && task.prompt.trim() !== '';
    const hasMessages = task.messages && Array.isArray(task.messages) && task.messages.length > 0;
    
    if (!hasPrompt && !hasMessages) {
      errors.push({
        field: 'content',
        message: 'Either "prompt" or "messages" field is required',
        value: { prompt: task.prompt, messages: task.messages },
      });
    }

    // Validate ID format
    if (task.id && typeof task.id === 'string') {
      if (task.id.length > 100) {
        errors.push({
          field: 'id',
          message: 'Task ID must be 100 characters or less',
          value: task.id,
        });
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(task.id)) {
        errors.push({
          field: 'id',
          message: 'Task ID must contain only alphanumeric characters, hyphens, and underscores',
          value: task.id,
        });
      }
    }

    // Validate model
    if (task.model) {
      if (typeof task.model !== 'string') {
        errors.push({
          field: 'model',
          message: 'Model must be a string',
          value: task.model,
        });
      } else if (!this.VALID_MODELS.includes(task.model)) {
        warnings.push({
          field: 'model',
          message: `Unknown model '${task.model}'. Valid models: ${this.VALID_MODELS.join(', ')}`,
          value: task.model,
        });
      }
    }

    // Validate temperature
    if (task.temperature !== undefined) {
      const temp = parseFloat(task.temperature);
      if (isNaN(temp)) {
        errors.push({
          field: 'temperature',
          message: 'Temperature must be a valid number',
          value: task.temperature,
        });
      } else if (temp < this.MIN_TEMPERATURE || temp > this.MAX_TEMPERATURE) {
        errors.push({
          field: 'temperature',
          message: `Temperature must be between ${this.MIN_TEMPERATURE} and ${this.MAX_TEMPERATURE}`,
          value: task.temperature,
        });
      }
    }

    // Validate maxTokens
    if (task.maxTokens !== undefined) {
      const tokens = parseInt(task.maxTokens);
      if (isNaN(tokens) || !Number.isInteger(tokens)) {
        errors.push({
          field: 'maxTokens',
          message: 'Max tokens must be a valid integer',
          value: task.maxTokens,
        });
      } else if (tokens < this.MIN_MAX_TOKENS || tokens > this.MAX_MAX_TOKENS) {
        errors.push({
          field: 'maxTokens',
          message: `Max tokens must be between ${this.MIN_MAX_TOKENS} and ${this.MAX_MAX_TOKENS}`,
          value: task.maxTokens,
        });
      }
    }

    // Validate messages format
    if (task.messages && Array.isArray(task.messages)) {
      for (let i = 0; i < task.messages.length; i++) {
        const message = task.messages[i];
        if (!message || typeof message !== 'object') {
          errors.push({
            field: `messages[${i}]`,
            message: 'Message must be an object',
            value: message,
          });
          continue;
        }

        if (!message.role || !['system', 'user', 'assistant'].includes(message.role)) {
          errors.push({
            field: `messages[${i}].role`,
            message: 'Message role must be "system", "user", or "assistant"',
            value: message.role,
          });
        }

        if (!message.content || typeof message.content !== 'string' || message.content.trim() === '') {
          errors.push({
            field: `messages[${i}].content`,
            message: 'Message content must be a non-empty string',
            value: message.content,
          });
        }
      }
    }

    // Validate metadata
    if (task.metadata !== undefined) {
      if (typeof task.metadata !== 'object' || task.metadata === null || Array.isArray(task.metadata)) {
        errors.push({
          field: 'metadata',
          message: 'Metadata must be an object',
          value: task.metadata,
        });
      }
    }

    // Validate idempotency_key
    if (task.idempotency_key !== undefined) {
      if (typeof task.idempotency_key !== 'string') {
        errors.push({
          field: 'idempotency_key',
          message: 'Idempotency key must be a string',
          value: task.idempotency_key,
        });
      } else if (task.idempotency_key.length > 100) {
        errors.push({
          field: 'idempotency_key',
          message: 'Idempotency key must be 100 characters or less',
          value: task.idempotency_key,
        });
      }
    }

    // Add row number context to errors if provided
    if (rowNumber !== undefined) {
      errors.forEach(error => {
        error.message = `Row ${rowNumber}: ${error.message}`;
      });
      warnings.forEach(warning => {
        warning.message = `Row ${rowNumber}: ${warning.message}`;
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  static validateBatch(tasks: any[]): ValidationResult {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationError[] = [];

    for (let i = 0; i < tasks.length; i++) {
      const result = this.validateTask(tasks[i], i + 1);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    };
  }

  static getRequiredCsvHeaders(): string[] {
    return ['id', 'prompt'];
  }

  static getOptionalCsvHeaders(): string[] {
    return [
      'messages',
      'model',
      'temperature',
      'maxTokens',
      'metadata',
      'batch_id',
      'corr_id',
      'idempotency_key',
    ];
  }

  static getAllCsvHeaders(): string[] {
    return [...this.getRequiredCsvHeaders(), ...this.getOptionalCsvHeaders()];
  }
}
