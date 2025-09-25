export interface TaskRequest {
  id: string;
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  metadata?: Record<string, any>;
  batch_id?: string;
  corr_id?: string;
}

export interface TaskResponse {
  id: string;
  request: TaskRequest;
  response?: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost?: number;
  timestamp: string;
  success: boolean;
  prompt_hash?: string;
  timings?: {
    start: string;
    end: string;
    duration_ms: number;
  };
  batch_id?: string;
  corr_id?: string;
}

export interface DryRunResult {
  id: string;
  request: TaskRequest;
  simulatedResponse: string;
  simulatedUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  simulatedCost: number;
  timestamp: string;
  success: boolean;
}

export interface Transport {
  execute(request: TaskRequest): Promise<TaskResponse>;
  executeBatch(
    requests: TaskRequest[],
    batchId?: string
  ): Promise<TaskResponse[]>;
}

export interface DryRunTransport extends Transport {
  getDryRunResults(): DryRunResult[];
}

export interface BatchInput {
  tasks: TaskRequest[];
  format: 'csv' | 'jsonl';
}

export interface CliOptions {
  dryRun: boolean;
  input: string;
  output?: string;
  config?: string;
  verbose: boolean;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}
