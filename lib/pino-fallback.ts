import fs from 'node:fs'
import path from 'node:path'

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

type LogPayload = Record<string, unknown> | string | Error | unknown

type LogTarget = {
  level?: LogLevel | string
  stream: {
    write: (message: string) => void
  }
}

interface PinoLikeOptions {
  level?: LogLevel | string
  base?: Record<string, unknown>
  timestamp?: (() => string) | boolean
  formatters?: {
    level?: (label: string) => Record<string, unknown>
  }
}

const LEVEL_WEIGHTS: Record<string, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
  silent: Number.POSITIVE_INFINITY
}

function resolveLevelWeight(level?: string | LogLevel): number {
  if (!level) {
    return LEVEL_WEIGHTS.info
  }

  const normalized = level.toString().toLowerCase()
  return LEVEL_WEIGHTS[normalized] ?? LEVEL_WEIGHTS.info
}

function shouldLog(currentLevel: string | LogLevel | undefined, messageLevel: LogLevel): boolean {
  return resolveLevelWeight(messageLevel) >= resolveLevelWeight(currentLevel)
}

function ensureLineEnding(message: string): string {
  return message.endsWith('\n') ? message : `${message}\n`
}

function serializePayload(payload: LogPayload): Record<string, unknown> {
  if (payload instanceof Error) {
    return {
      msg: payload.message,
      stack: payload.stack
    }
  }

  if (typeof payload === 'string') {
    return { msg: payload }
  }

  if (payload && typeof payload === 'object') {
    return { ...payload as Record<string, unknown> }
  }

  return { msg: String(payload) }
}

function writeToTargets(message: string, targets: LogTarget[]): void {
  if (targets.length === 0) {
    // Fallback to stdout to avoid swallowing logs entirely
    // eslint-disable-next-line no-console
    console.log(message)
    return
  }

  const line = ensureLineEnding(message)
  for (const target of targets) {
    if (!target || typeof target.stream?.write !== 'function') {
      continue
    }
    try {
      target.stream.write(line)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to write log message', error)
    }
  }
}

function buildLogEntry(
  level: LogLevel,
  payload: LogPayload,
  options: PinoLikeOptions,
  baseBindings: Record<string, unknown>
): Record<string, unknown> {
  const timestamp = typeof options.timestamp === 'function'
    ? options.timestamp()
    : new Date().toISOString()

  const levelBinding = options.formatters?.level
    ? options.formatters.level(level)
    : { level }

  return {
    time: timestamp,
    ...levelBinding,
    ...baseBindings,
    ...serializePayload(payload)
  }
}

function createLogger(
  options: PinoLikeOptions = {},
  targets: LogTarget[]
) {
  const baseBindings = { ...(options.base ?? {}) }
  const currentLevel = options.level ?? 'info'

  const logAtLevel = (level: LogLevel) => (payload: LogPayload) => {
    if (!shouldLog(currentLevel, level)) {
      return
    }

    const entry = buildLogEntry(level, payload, options, baseBindings)
    const serialized = JSON.stringify(entry)

    const eligibleTargets = targets.filter(target => shouldLog(target?.level ?? currentLevel, level))
    writeToTargets(serialized, eligibleTargets)
  }

  return {
    level: currentLevel,
    trace: logAtLevel('trace'),
    debug: logAtLevel('debug'),
    info: logAtLevel('info'),
    warn: logAtLevel('warn'),
    error: logAtLevel('error'),
    fatal: logAtLevel('fatal'),
    child(bindings: Record<string, unknown> = {}) {
      return createLogger({ ...options, base: { ...baseBindings, ...bindings } }, targets)
    }
  }
}

function normalizeTargets(streamOrStreams?: LogTarget | LogTarget[]): LogTarget[] {
  if (!streamOrStreams) {
    return []
  }

  return Array.isArray(streamOrStreams) ? streamOrStreams : [streamOrStreams]
}

const fallback = (options?: PinoLikeOptions, streamOrStreams?: LogTarget | LogTarget[]) =>
  createLogger(options, normalizeTargets(streamOrStreams))

fallback.destination = ({ dest, sync = false }: { dest: string; sync?: boolean }) => {
  const directory = path.dirname(dest)
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true })
  }

  if (sync) {
    return {
      write(message: string) {
        fs.appendFileSync(dest, ensureLineEnding(message), 'utf8')
      }
    }
  }

  return {
    write(message: string) {
      fs.promises.appendFile(dest, ensureLineEnding(message), 'utf8').catch(error => {
        // eslint-disable-next-line no-console
        console.error('Failed to append async log file', error)
      })
    }
  }
}

fallback.multistream = (streams: LogTarget[]): LogTarget[] => streams

fallback.transport = ({ target }: { target: string; options?: Record<string, unknown> }) => ({
  write(message: string) {
    const line = `[${target}] ${message}`
    // eslint-disable-next-line no-console
    console.log(line)
  }
})

fallback.stdTimeFunctions = {
  isoTime: () => new Date().toISOString()
}

export type FallbackPino = typeof fallback

export default fallback
