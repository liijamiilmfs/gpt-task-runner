declare module 'fs' {
  export function readFileSync(path: string, options?: { encoding?: string } | string): string
  const fsDefault: {
    readFileSync: typeof readFileSync
  }
  export default fsDefault
}

declare module 'path' {
  export function join(...paths: string[]): string
  const pathDefault: {
    join: typeof join
  }
  export default pathDefault
}

declare module 'node:assert/strict' {
  import assert = require('assert')
  export = assert
}

declare module 'node:test' {
  export function describe(name: string, fn: () => void): void
  export function it(name: string, fn: () => any): void
  export function before(fn: () => any): void
  export function test(name: string, fn: (...args: any[]) => any): void
}

declare module 'module' {
  interface ModuleType {
    _load(request: string, parent: any, isMain: boolean): any
    _resolveFilename(request: string, parent: any, isMain: boolean): string
    _cache: Record<string, any>
  }

  const Module: ModuleType
  export = Module
}

declare module 'pino' {
  export type DestinationStream = any
  const pino: any
  export default pino
}

declare function require(moduleName: string): any

declare module 'next/server' {
  export class NextRequest extends Request {}
  export class NextResponse extends Response {
    static json(data: any, init?: { status?: number }): NextResponse
  }
}

declare const process: {
  cwd(): string
  env: Record<string, string | undefined>
}
