#!/usr/bin/env node

/**
 * Log Viewer for Librán Voice Forge
 * 
 * Provides human-readable log viewing with filtering and color coding
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
}

// Log level colors
const levelColors = {
  error: colors.red,
  warn: colors.yellow,
  info: colors.cyan,
  http: colors.magenta,
  debug: colors.gray,
  success: colors.green
}

// Configuration
const config = {
  logsDir: path.join(process.cwd(), 'logs'),
  follow: process.argv.includes('--follow') || process.argv.includes('-f'),
  tail: process.argv.includes('--tail') || process.argv.includes('-t'),
  lines: process.argv.find(arg => arg.startsWith('--lines='))?.split('=')[1] || '50',
  filter: process.argv.find(arg => arg.startsWith('--filter='))?.split('=')[1],
  type: process.argv.find(arg => arg.startsWith('--type='))?.split('=')[1],
  level: process.argv.find(arg => arg.startsWith('--level='))?.split('=')[1],
  help: process.argv.includes('--help') || process.argv.includes('-h')
}

function showHelp() {
  console.log(`
${colors.bright}Librán Voice Forge Log Viewer${colors.reset}

Usage: node scripts/view-logs.js [options]

Options:
  -f, --follow        Follow log files (like tail -f)
  -t, --tail          Show last N lines (default: 50)
  --lines=N           Number of lines to show (default: 50)
  --filter=STRING     Filter logs containing string
  --type=TYPE         Filter by log type (api, translation, tts, error, performance, security)
  --level=LEVEL       Filter by log level (error, warn, info, debug)
  -h, --help          Show this help

Examples:
  node scripts/view-logs.js --type=api --follow
  node scripts/view-logs.js --level=error --lines=100
  node scripts/view-logs.js --filter="translation" --type=translation
  node scripts/view-logs.js --tail --lines=20

Log Types:
  - application: General application logs
  - api: API request/response logs
  - translation: Translation operation logs
  - tts: Text-to-speech logs
  - error: Error logs only
  - performance: Performance metrics
  - security: Security events
`)
}

function getLogFiles() {
  const logTypes = {
    application: 'application',
    api: 'api',
    translation: 'translation',
    tts: 'tts',
    error: 'errors',
    performance: 'performance',
    security: 'security'
  }

  if (config.type && logTypes[config.type]) {
    const subDir = logTypes[config.type]
    const subDirPath = path.join(config.logsDir, subDir)
    if (fs.existsSync(subDirPath)) {
      const files = fs.readdirSync(subDirPath)
        .filter(file => file.endsWith('.log'))
        .map(file => path.join(subDirPath, file))
        .sort()
      return files.length > 0 ? [files[files.length - 1]] : []
    }
  }

  // Default: show all recent log files
  const allFiles = []
  Object.values(logTypes).forEach(subDir => {
    const subDirPath = path.join(config.logsDir, subDir)
    if (fs.existsSync(subDirPath)) {
      const files = fs.readdirSync(subDirPath)
        .filter(file => file.endsWith('.log'))
        .map(file => path.join(subDirPath, file))
      allFiles.push(...files)
    }
  })

  return allFiles.sort().slice(-5) // Show last 5 log files
}

function formatLogLine(line) {
  try {
    const logEntry = JSON.parse(line)
    const timestamp = logEntry.timestamp || new Date().toISOString()
    const level = logEntry.level || 'info'
    const message = logEntry.message || ''
    const type = logEntry.type || ''
    const correlationId = logEntry.correlationId || ''
    const service = logEntry.service || ''
    const environment = logEntry.environment || ''

    // Apply filters
    if (config.filter && !message.toLowerCase().includes(config.filter.toLowerCase())) {
      return null
    }

    if (config.level && level !== config.level) {
      return null
    }

    // Format timestamp
    const time = timestamp.replace('T', ' ').replace('Z', '').substring(0, 19)
    
    // Color coding
    const levelColor = levelColors[level] || colors.white
    const reset = colors.reset
    
    // Build log line
    let logLine = `${colors.gray}${time}${reset} `
    
    if (service) logLine += `${colors.blue}[${service}]${reset} `
    if (environment && environment !== 'production') logLine += `${colors.dim}[${environment}]${reset} `
    if (correlationId) logLine += `${colors.magenta}[${correlationId}]${reset} `
    if (type) logLine += `${colors.cyan}[${type}]${reset} `
    
    logLine += `${levelColor}[${level.toUpperCase()}]${reset} ${message}`
    
    // Add metadata if present
    const meta = { ...logEntry }
    delete meta.timestamp
    delete meta.level
    delete meta.message
    delete meta.type
    delete meta.correlationId
    delete meta.service
    delete meta.environment
    
    if (Object.keys(meta).length > 0) {
      logLine += `\n${colors.dim}${JSON.stringify(meta, null, 2)}${reset}`
    }
    
    return logLine
  } catch (error) {
    // If it's not JSON, treat as plain text
    return line
  }
}

function viewLogs() {
  const logFiles = getLogFiles()
  
  if (logFiles.length === 0) {
    console.log(`${colors.yellow}No log files found in ${config.logsDir}${colors.reset}`)
    return
  }

  console.log(`${colors.bright}Viewing logs from:${colors.reset}`)
  logFiles.forEach(file => {
    console.log(`  ${colors.cyan}${file}${colors.reset}`)
  })
  console.log()

  if (config.follow) {
    // Follow mode - show recent logs and then follow
    logFiles.forEach(file => {
      try {
        const content = execSync(`tail -n ${config.lines} "${file}"`, { encoding: 'utf8' })
        const lines = content.split('\n').filter(line => line.trim())
        lines.forEach(line => {
          const formatted = formatLogLine(line)
          if (formatted) console.log(formatted)
        })
      } catch (error) {
        console.log(`${colors.red}Error reading ${file}: ${error.message}${colors.reset}`)
      }
    })

    // Follow the most recent file
    const mostRecentFile = logFiles[logFiles.length - 1]
    console.log(`${colors.green}Following ${mostRecentFile}...${colors.reset}`)
    console.log(`${colors.dim}Press Ctrl+C to stop${colors.reset}`)
    
    const { spawn } = require('child_process')
    const tail = spawn('tail', ['-f', mostRecentFile])
    
    tail.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim())
      lines.forEach(line => {
        const formatted = formatLogLine(line)
        if (formatted) console.log(formatted)
      })
    })
    
    tail.stderr.on('data', (data) => {
      console.error(`${colors.red}Error: ${data}${colors.reset}`)
    })
    
    process.on('SIGINT', () => {
      tail.kill()
      process.exit(0)
    })
  } else {
    // Show recent logs
    logFiles.forEach(file => {
      try {
        const content = execSync(`tail -n ${config.lines} "${file}"`, { encoding: 'utf8' })
        const lines = content.split('\n').filter(line => line.trim())
        lines.forEach(line => {
          const formatted = formatLogLine(line)
          if (formatted) console.log(formatted)
        })
      } catch (error) {
        console.log(`${colors.red}Error reading ${file}: ${error.message}${colors.reset}`)
      }
    })
  }
}

function main() {
  if (config.help) {
    showHelp()
    return
  }

  if (!fs.existsSync(config.logsDir)) {
    console.log(`${colors.red}Logs directory not found: ${config.logsDir}${colors.reset}`)
    return
  }

  viewLogs()
}

if (require.main === module) {
  main()
}
