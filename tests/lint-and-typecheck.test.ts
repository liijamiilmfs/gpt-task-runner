import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Code Quality Checks', () => {
  it('should pass TypeScript type checking', () => {
    try {
      execSync('npm run type-check', {
        stdio: 'pipe',
        cwd: process.cwd(),
      });
      expect(true).toBe(true); // If we get here, type checking passed
    } catch (error) {
      const output = error instanceof Error ? error.message : String(error);
      throw new Error(`TypeScript type checking failed:\n${output}`);
    }
  });

  it('should pass ESLint linting', () => {
    try {
      execSync('npm run lint', {
        stdio: 'pipe',
        cwd: process.cwd(),
      });
      expect(true).toBe(true); // If we get here, linting passed
    } catch (error) {
      const output = error instanceof Error ? error.message : String(error);
      throw new Error(`ESLint linting failed:\n${output}`);
    }
  });

  it('should have consistent code formatting', () => {
    try {
      execSync('npm run format:check', {
        stdio: 'pipe',
        cwd: process.cwd(),
      });
      expect(true).toBe(true); // If we get here, formatting check passed
    } catch (error) {
      const output = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Code formatting check failed. Run 'npm run format' to fix:\n${output}`
      );
    }
  });

  it('should have valid TypeScript configuration', () => {
    const tsconfigPath = join(process.cwd(), 'tsconfig.json');
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));

    expect(tsconfig).toBeDefined();
    expect(tsconfig.compilerOptions).toBeDefined();
    expect(tsconfig.compilerOptions.strict).toBe(true);
    expect(tsconfig.compilerOptions.noImplicitAny).toBe(true);
  });

  it('should have valid package.json configuration', () => {
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

    expect(packageJson).toBeDefined();
    expect(packageJson.scripts).toBeDefined();
    expect(packageJson.scripts['type-check']).toBe('tsc --noEmit');
    expect(packageJson.scripts.lint).toBeDefined();
    expect(packageJson.scripts.format).toBeDefined();
  });
});
