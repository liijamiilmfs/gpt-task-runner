import * as fs from 'fs';
import * as path from 'path';
import { createObjectCsvWriter } from 'csv-writer';
import { TaskResponse, DryRunResult } from '../types';

export class BatchWriter {
  async writeResults(
    results: TaskResponse[],
    outputPath: string
  ): Promise<void> {
    const ext = path.extname(outputPath).toLowerCase();

    if (ext === '.csv') {
      await this.writeToCSV(results, outputPath);
    } else if (ext === '.jsonl') {
      await this.writeToJSONL(results, outputPath);
    } else {
      throw new Error(
        `Unsupported output format: ${ext}. Supported formats: .csv, .jsonl`
      );
    }
  }

  async writeDryRunResults(
    results: DryRunResult[],
    outputPath: string
  ): Promise<void> {
    const ext = path.extname(outputPath).toLowerCase();

    if (ext === '.csv') {
      await this.writeDryRunToCSV(results, outputPath);
    } else if (ext === '.jsonl') {
      await this.writeDryRunToJSONL(results, outputPath);
    } else {
      throw new Error(
        `Unsupported output format: ${ext}. Supported formats: .csv, .jsonl`
      );
    }
  }

  private async writeToCSV(
    results: TaskResponse[],
    outputPath: string
  ): Promise<void> {
    const csvWriter = createObjectCsvWriter({
      path: outputPath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'success', title: 'Success' },
        { id: 'response', title: 'Response' },
        { id: 'error', title: 'Error' },
        { id: 'promptTokens', title: 'Prompt Tokens' },
        { id: 'completionTokens', title: 'Completion Tokens' },
        { id: 'totalTokens', title: 'Total Tokens' },
        { id: 'cost', title: 'Cost' },
        { id: 'timestamp', title: 'Timestamp' },
        { id: 'prompt', title: 'Prompt' },
        { id: 'model', title: 'Model' },
        { id: 'temperature', title: 'Temperature' },
        { id: 'maxTokens', title: 'Max Tokens' },
      ],
    });

    const csvData = results.map((result) => ({
      id: result.id,
      success: result.success,
      response: result.response || '',
      error: result.error || '',
      promptTokens: result.usage?.promptTokens || 0,
      completionTokens: result.usage?.completionTokens || 0,
      totalTokens: result.usage?.totalTokens || 0,
      cost: result.cost || 0,
      timestamp: result.timestamp,
      prompt: result.request.prompt,
      model: result.request.model || '',
      temperature: result.request.temperature || '',
      maxTokens: result.request.maxTokens || '',
    }));

    await csvWriter.writeRecords(csvData);
  }

  private async writeToJSONL(
    results: TaskResponse[],
    outputPath: string
  ): Promise<void> {
    const lines = results.map((result) => JSON.stringify(result));
    fs.writeFileSync(outputPath, lines.join('\n') + '\n');
  }

  private async writeDryRunToCSV(
    results: DryRunResult[],
    outputPath: string
  ): Promise<void> {
    const csvWriter = createObjectCsvWriter({
      path: outputPath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'success', title: 'Success' },
        { id: 'simulatedResponse', title: 'Simulated Response' },
        { id: 'promptTokens', title: 'Prompt Tokens' },
        { id: 'completionTokens', title: 'Completion Tokens' },
        { id: 'totalTokens', title: 'Total Tokens' },
        { id: 'simulatedCost', title: 'Simulated Cost' },
        { id: 'timestamp', title: 'Timestamp' },
        { id: 'prompt', title: 'Prompt' },
        { id: 'model', title: 'Model' },
        { id: 'temperature', title: 'Temperature' },
        { id: 'maxTokens', title: 'Max Tokens' },
      ],
    });

    const csvData = results.map((result) => ({
      id: result.id,
      success: result.success,
      simulatedResponse: result.simulatedResponse,
      promptTokens: result.simulatedUsage.promptTokens,
      completionTokens: result.simulatedUsage.completionTokens,
      totalTokens: result.simulatedUsage.totalTokens,
      simulatedCost: result.simulatedCost,
      timestamp: result.timestamp,
      prompt: result.request.prompt,
      model: result.request.model || '',
      temperature: result.request.temperature || '',
      maxTokens: result.request.maxTokens || '',
    }));

    await csvWriter.writeRecords(csvData);
  }

  private async writeDryRunToJSONL(
    results: DryRunResult[],
    outputPath: string
  ): Promise<void> {
    const lines = results.map((result) => JSON.stringify(result));
    fs.writeFileSync(outputPath, lines.join('\n') + '\n');
  }
}
