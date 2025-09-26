import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BatchLoader } from '../src/io/batch-loader';

describe('Multiline CSV Parsing', () => {
  it('should handle multiline CSV fields with embedded newlines', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'multiline-csv-test-'));
    
    try {
      // Create a CSV with multiline prompt containing embedded newlines
      const csvContent = `id,prompt,model
task-1,"Write a haiku about programming.
Make it creative and thoughtful.
Include some technical terms.",gpt-3.5-turbo
task-2,"Explain quantum computing
in simple terms for beginners",gpt-4`;

      const csvPath = path.join(tempDir, 'multiline.csv');
      fs.writeFileSync(csvPath, csvContent);

      const batchLoader = new BatchLoader();
      const result = await batchLoader.loadFromFile(csvPath);

      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0].prompt).toBe(
        'Write a haiku about programming.\nMake it creative and thoughtful.\nInclude some technical terms.'
      );
      expect(result.tasks[1].prompt).toBe(
        'Explain quantum computing\nin simple terms for beginners'
      );
      expect(result.tasks[0].model).toBe('gpt-3.5-turbo');
      expect(result.tasks[1].model).toBe('gpt-4');
    } finally {
      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should handle CSV fields with escaped quotes and newlines', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'multiline-csv-test-'));
    
    try {
      // Create a CSV with escaped quotes and newlines
      const csvContent = `id,prompt,model
task-1,"He said ""Hello world""
and then walked away",gpt-3.5-turbo
task-2,"Simple prompt without quotes",gpt-4`;

      const csvPath = path.join(tempDir, 'escaped-quotes.csv');
      fs.writeFileSync(csvPath, csvContent);

      const batchLoader = new BatchLoader();
      const result = await batchLoader.loadFromFile(csvPath);

      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0].prompt).toBe('He said "Hello world"\nand then walked away');
      expect(result.tasks[1].prompt).toBe('Simple prompt without quotes');
    } finally {
      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should handle CSV with mixed single and multiline fields', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'multiline-csv-test-'));
    
    try {
      const csvContent = `id,prompt,model,notes
task-1,"Single line prompt",gpt-3.5-turbo,"Simple task"
task-2,"Multiline prompt
with embedded newlines
and more content",gpt-4,"Complex task
with notes"
task-3,"Another single line",gpt-3.5-turbo,"Basic task"`;

      const csvPath = path.join(tempDir, 'mixed.csv');
      fs.writeFileSync(csvPath, csvContent);

      const batchLoader = new BatchLoader();
      const result = await batchLoader.loadFromFile(csvPath);

      expect(result.tasks).toHaveLength(3);
      
      // Check single line field
      expect(result.tasks[0].prompt).toBe('Single line prompt');
      expect(result.tasks[0].metadata?.notes).toBe('Simple task');
      
      // Check multiline fields
      expect(result.tasks[1].prompt).toBe('Multiline prompt\nwith embedded newlines\nand more content');
      expect(result.tasks[1].metadata?.notes).toBe('Complex task\nwith notes');
      
      // Check another single line
      expect(result.tasks[2].prompt).toBe('Another single line');
      expect(result.tasks[2].metadata?.notes).toBe('Basic task');
    } finally {
      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
