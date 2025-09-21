import * as fs from 'fs';
import path from 'path';
import { log } from './logger';

export interface UnknownTokenEntry {
  token: string;
  variant: 'ancient' | 'modern';
  context?: string;
  timestamp: string;
  userAgent?: string;
  sessionId?: string;
}

export class UnknownTokenLogger {
  private static instance: UnknownTokenLogger;
  private logFile: string;
  private isInitialized: boolean = false;

  private constructor() {
    this.logFile = path.join(process.cwd(), 'build', 'UNKNOWN_TOKENS.csv');
  }

  public static getInstance(): UnknownTokenLogger {
    if (!UnknownTokenLogger.instance) {
      UnknownTokenLogger.instance = new UnknownTokenLogger();
    }
    return UnknownTokenLogger.instance;
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Ensure build directory exists
      const buildDir = path.dirname(this.logFile);
      if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir, { recursive: true });
      }

      // Create CSV file with headers if it doesn't exist
      if (!fs.existsSync(this.logFile)) {
        const headers = 'timestamp,token,variant,context,userAgent,sessionId\n';
        fs.writeFileSync(this.logFile, headers, 'utf8');
        log.info('Created unknown tokens log file', { file: this.logFile });
      }

      this.isInitialized = true;
    } catch (error) {
      log.error('Failed to initialize unknown token logger', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  public async logUnknownToken(entry: Omit<UnknownTokenEntry, 'timestamp'>): Promise<void> {
    try {
      await this.initialize();

      const fullEntry: UnknownTokenEntry = {
        ...entry,
        timestamp: new Date().toISOString()
      };

      // Escape CSV values
      const csvRow = [
        fullEntry.timestamp,
        this.escapeCsvValue(fullEntry.token),
        fullEntry.variant,
        this.escapeCsvValue(fullEntry.context || ''),
        this.escapeCsvValue(fullEntry.userAgent || ''),
        this.escapeCsvValue(fullEntry.sessionId || '')
      ].join(',');

      // Append to file
      fs.appendFileSync(this.logFile, csvRow + '\n', 'utf8');

      log.debug('Logged unknown token', { 
        token: fullEntry.token, 
        variant: fullEntry.variant,
        context: fullEntry.context 
      });
    } catch (error) {
      log.error('Failed to log unknown token', { 
        error: error instanceof Error ? error.message : String(error), 
        token: entry.token 
      });
    }
  }

  public async logUnknownTokens(tokens: string[], variant: 'ancient' | 'modern', context?: string): Promise<void> {
    try {
      await this.initialize();

      const timestamp = new Date().toISOString();
      const userAgent = this.getUserAgent();
      const sessionId = this.getSessionId();

      // Create CSV rows for all tokens
      const csvRows = tokens.map(token => {
        const csvRow = [
          timestamp,
          this.escapeCsvValue(token),
          variant,
          this.escapeCsvValue(context || ''),
          this.escapeCsvValue(userAgent || ''),
          this.escapeCsvValue(sessionId || '')
        ].join(',');
        return csvRow;
      });

      // Append all rows to file
      const csvContent = csvRows.join('\n') + '\n';
      fs.appendFileSync(this.logFile, csvContent, 'utf8');

      log.info('Logged unknown tokens', { 
        count: tokens.length, 
        variant,
        context 
      });
    } catch (error) {
      log.error('Failed to log unknown tokens', { 
        error: error instanceof Error ? error.message : String(error), 
        count: tokens.length 
      });
    }
  }

  public async getUnknownTokens(): Promise<UnknownTokenEntry[]> {
    try {
      await this.initialize();

      if (!fs.existsSync(this.logFile)) {
        return [];
      }

      const content = fs.readFileSync(this.logFile, 'utf8');
      const lines = content.trim().split('\n');
      
      if (lines.length <= 1) {
        return []; // Only headers or empty file
      }

      const entries: UnknownTokenEntry[] = [];
      for (let i = 1; i < lines.length; i++) { // Skip header row
        const line = lines[i].trim();
        if (!line) continue;

        const [timestamp, token, variant, context, userAgent, sessionId] = line.split(',');
        entries.push({
          timestamp: this.unescapeCsvValue(timestamp),
          token: this.unescapeCsvValue(token),
          variant: variant as 'ancient' | 'modern',
          context: this.unescapeCsvValue(context) || undefined,
          userAgent: this.unescapeCsvValue(userAgent) || undefined,
          sessionId: this.unescapeCsvValue(sessionId) || undefined
        });
      }

      return entries;
    } catch (error) {
      log.error('Failed to read unknown tokens', { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }

  public async getTokenFrequency(): Promise<Record<string, number>> {
    const entries = await this.getUnknownTokens();
    const frequency: Record<string, number> = {};

    for (const entry of entries) {
      const key = `${entry.token}:${entry.variant}`;
      frequency[key] = (frequency[key] || 0) + 1;
    }

    return frequency;
  }

  public async clearLog(): Promise<void> {
    try {
      if (fs.existsSync(this.logFile)) {
        fs.unlinkSync(this.logFile);
        log.info('Cleared unknown tokens log file');
      }
    } catch (error) {
      log.error('Failed to clear unknown tokens log', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private unescapeCsvValue(value: string): string {
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1).replace(/""/g, '"');
    }
    return value;
  }

  private getUserAgent(): string | undefined {
    // In a real implementation, this would come from the request context
    return process.env.USER_AGENT || undefined;
  }

  private getSessionId(): string | undefined {
    // In a real implementation, this would come from the request context
    return process.env.SESSION_ID || undefined;
  }
}

// Export singleton instance
export const unknownTokenLogger = UnknownTokenLogger.getInstance();
