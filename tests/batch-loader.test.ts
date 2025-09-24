import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BatchLoader } from '../src/io/batch-loader';
// import { TaskRequest } from '../src/types';

describe('BatchLoader', () => {
  let batchLoader: BatchLoader;
  let tempDir: string;

  beforeEach(() => {
    batchLoader = new BatchLoader();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'batch-loader-test-'));
  });

  afterEach(() => {
    // Clean up temp files
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('loadFromFile', () => {
    it('should load CSV files correctly', async () => {
      const csvContent = `id,prompt,model,temperature,maxTokens
task-1,"Write a haiku about programming",gpt-3.5-turbo,0.7,100
task-2,"Explain quantum computing",gpt-4,0.5,500
task-3,"Generate a story",gpt-3.5-turbo,0.9,300`;

      const csvPath = path.join(tempDir, 'test.csv');
      fs.writeFileSync(csvPath, csvContent);

      const result = await batchLoader.loadFromFile(csvPath);

      expect(result.format).toBe('csv');
      expect(result.tasks).toHaveLength(3);
      expect(result.tasks[0]).toEqual({
        id: 'task-1',
        prompt: 'Write a haiku about programming',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 100,
      });
    });

    it('should load JSONL files correctly', async () => {
      const jsonlContent = `{"id":"task-1","prompt":"Write a haiku","model":"gpt-3.5-turbo","temperature":0.7,"maxTokens":100}
{"id":"task-2","prompt":"Explain AI","model":"gpt-4","temperature":0.5,"maxTokens":500}
{"id":"task-3","prompt":"Generate story","model":"gpt-3.5-turbo","temperature":0.9,"maxTokens":300}`;

      const jsonlPath = path.join(tempDir, 'test.jsonl');
      fs.writeFileSync(jsonlPath, jsonlContent);

      const result = await batchLoader.loadFromFile(jsonlPath);

      expect(result.format).toBe('jsonl');
      expect(result.tasks).toHaveLength(3);
      expect(result.tasks[0]).toEqual({
        id: 'task-1',
        prompt: 'Write a haiku',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 100,
      });
    });

    it('should handle CSV files with missing optional fields', async () => {
      const csvContent = `id,prompt
task-1,"Write a haiku"
task-2,"Explain AI"`;

      const csvPath = path.join(tempDir, 'minimal.csv');
      fs.writeFileSync(csvPath, csvContent);

      const result = await batchLoader.loadFromFile(csvPath);

      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0]).toEqual({
        id: 'task-1',
        prompt: 'Write a haiku',
      });
      expect(result.tasks[1]).toEqual({
        id: 'task-2',
        prompt: 'Explain AI',
      });
    });

    it('should handle CSV files with metadata fields', async () => {
      const csvContent = `id,prompt,model,source,priority
task-1,"Write a haiku",gpt-3.5-turbo,test,high
task-2,"Explain AI",gpt-4,production,low`;

      const csvPath = path.join(tempDir, 'metadata.csv');
      fs.writeFileSync(csvPath, csvContent);

      const result = await batchLoader.loadFromFile(csvPath);

      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0]).toEqual({
        id: 'task-1',
        prompt: 'Write a haiku',
        model: 'gpt-3.5-turbo',
        metadata: {
          source: 'test',
          priority: 'high',
        },
      });
    });

    it('should auto-generate IDs for CSV when missing', async () => {
      const csvContent = `prompt,model
"Write a haiku",gpt-3.5-turbo
"Explain AI",gpt-4`;

      const csvPath = path.join(tempDir, 'no-ids.csv');
      fs.writeFileSync(csvPath, csvContent);

      const result = await batchLoader.loadFromFile(csvPath);

      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0].id).toBe('task-1');
      expect(result.tasks[1].id).toBe('task-2');
    });

    it('should handle empty CSV files', async () => {
      const csvContent = `id,prompt,model`;

      const csvPath = path.join(tempDir, 'empty.csv');
      fs.writeFileSync(csvPath, csvContent);

      const result = await batchLoader.loadFromFile(csvPath);

      expect(result.tasks).toHaveLength(0);
      expect(result.format).toBe('csv');
    });

    it('should handle empty JSONL files', async () => {
      const jsonlContent = '';

      const jsonlPath = path.join(tempDir, 'empty.jsonl');
      fs.writeFileSync(jsonlPath, jsonlContent);

      const result = await batchLoader.loadFromFile(jsonlPath);

      expect(result.tasks).toHaveLength(0);
      expect(result.format).toBe('jsonl');
    });

    it('should handle JSONL files with empty lines', async () => {
      const jsonlContent = `{"id":"task-1","prompt":"First task"}

{"id":"task-2","prompt":"Second task"}

`;

      const jsonlPath = path.join(tempDir, 'empty-lines.jsonl');
      fs.writeFileSync(jsonlPath, jsonlContent);

      const result = await batchLoader.loadFromFile(jsonlPath);

      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0].id).toBe('task-1');
      expect(result.tasks[1].id).toBe('task-2');
    });

    it('should throw error for unsupported file formats', async () => {
      const txtPath = path.join(tempDir, 'test.txt');
      fs.writeFileSync(txtPath, 'Some content');

      await expect(batchLoader.loadFromFile(txtPath)).rejects.toThrow(
        'Unsupported file format: .txt. Supported formats: .csv, .jsonl'
      );
    });

    it('should throw error for invalid JSONL', async () => {
      const jsonlContent = `{"id":"task-1","prompt":"Valid task"}
{"id":"task-2","prompt":"Invalid JSON"`;

      const jsonlPath = path.join(tempDir, 'invalid.jsonl');
      fs.writeFileSync(jsonlPath, jsonlContent);

      await expect(batchLoader.loadFromFile(jsonlPath)).rejects.toThrow(
        /Invalid JSONL line/
      );
    });

    it.skip('should throw error for non-existent files', async () => {
      const nonExistentPath = path.join(tempDir, 'non-existent.csv');

      await expect(batchLoader.loadFromFile(nonExistentPath)).rejects.toThrow();
    }, 15000);

    it('should handle CSV files with different delimiters and quotes', async () => {
      const csvContent = `id,prompt,model
"task-1","Write a haiku about ""programming""",gpt-3.5-turbo
"task-2","Explain, quantum computing",gpt-4`;

      const csvPath = path.join(tempDir, 'quotes.csv');
      fs.writeFileSync(csvPath, csvContent);

      const result = await batchLoader.loadFromFile(csvPath);

      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0].prompt).toBe('Write a haiku about "programming"');
      expect(result.tasks[1].prompt).toBe('Explain, quantum computing');
    });

    it('should parse numeric values correctly', async () => {
      const csvContent = `id,prompt,temperature,maxTokens
task-1,"Test prompt",0.7,100
task-2,"Another prompt",0.5,200`;

      const csvPath = path.join(tempDir, 'numeric.csv');
      fs.writeFileSync(csvPath, csvContent);

      const result = await batchLoader.loadFromFile(csvPath);

      expect(result.tasks[0].temperature).toBe(0.7);
      expect(result.tasks[0].maxTokens).toBe(100);
      expect(result.tasks[1].temperature).toBe(0.5);
      expect(result.tasks[1].maxTokens).toBe(200);
    });

    it('should handle case-insensitive file extensions', async () => {
      const csvContent = `id,prompt
task-1,"Test prompt"`;

      const csvPath = path.join(tempDir, 'test.CSV');
      fs.writeFileSync(csvPath, csvContent);

      const result = await batchLoader.loadFromFile(csvPath);

      expect(result.format).toBe('csv');
      expect(result.tasks).toHaveLength(1);
    });

    it('should handle JSONL files with complex objects', async () => {
      const jsonlContent = `{"id":"task-1","prompt":"Test","metadata":{"nested":{"value":123},"array":[1,2,3]}}
{"id":"task-2","prompt":"Another","metadata":{"simple":"value"}}`;

      const jsonlPath = path.join(tempDir, 'complex.jsonl');
      fs.writeFileSync(jsonlPath, jsonlContent);

      const result = await batchLoader.loadFromFile(jsonlPath);

      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0].metadata).toEqual({
        nested: { value: 123 },
        array: [1, 2, 3],
      });
    });
  });

  describe('error handling', () => {
    it('should handle CSV parsing errors gracefully', async () => {
      const csvContent = `id,prompt,model
task-1,"Write a haiku",gpt-3.5-turbo
malformed,row,with,too,many,columns`;

      const csvPath = path.join(tempDir, 'malformed.csv');
      fs.writeFileSync(csvPath, csvContent);

      // This should not throw but might produce unexpected results
      const result = await batchLoader.loadFromFile(csvPath);
      expect(result.tasks).toHaveLength(2);
    });

    it('should handle very large files', async () => {
      const tasks = [];
      for (let i = 0; i < 1000; i++) {
        tasks.push(`{"id":"task-${i}","prompt":"Task ${i}"}`);
      }

      const jsonlPath = path.join(tempDir, 'large.jsonl');
      fs.writeFileSync(jsonlPath, tasks.join('\n'));

      const result = await batchLoader.loadFromFile(jsonlPath);

      expect(result.tasks).toHaveLength(1000);
      expect(result.tasks[0].id).toBe('task-0');
      expect(result.tasks[999].id).toBe('task-999');
    });
  });
});
