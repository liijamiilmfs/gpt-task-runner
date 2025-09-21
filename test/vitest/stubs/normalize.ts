const LIGATURES: Record<string, string> = {
  'ﬁ': 'fi',
  'ﬂ': 'fl',
  'ﬀ': 'ff',
  'ﬃ': 'ffi',
  'ﬄ': 'ffl',
  'ﬆ': 'st',
  'ﬅ': 'ft',
}

const PRESERVE_DIACRITICS = new Set(['í', 'Í', 'ë', 'Ë'])

const KNOWN_HYPHEN_PREFIXES = new Set([
  'self-', 'non-', 'pre-', 'post-', 'anti-', 'pro-', 'co-', 'ex-',
  'multi-', 'sub-', 'super-', 'ultra-', 'inter-', 'intra-',
  'semi-', 'pseudo-', 'quasi-', 'neo-', 'proto-', 'meta-', 'para-',
  'counter-', 'over-', 'out-', 'up-', 'down-', 'off-', 'on-', 'in-'
])

function stripDiacriticsPreserving(text: string): string {
  return Array.from(text).map(char => {
    if (PRESERVE_DIACRITICS.has(char)) {
      return char
    }

    const normalized = char.normalize('NFD')
    // Use a simpler regex that works with ES5
    return normalized.replace(/[\u0300-\u036f\u1ab0-\u1aff\u1dc0-\u1dff\u20d0-\u20ff\ufe20-\ufe2f]/g, '')
  }).join('')
}

export function normalizeLigatures(text: string): string {
  return Object.entries(LIGATURES).reduce((value, [ligature, replacement]) => {
    return value.replace(new RegExp(ligature, 'g'), replacement)
  }, text)
}

export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

export function isHyphenatedWord(word: string): boolean {
  const lower = word.toLowerCase()

  // Convert Set to Array for ES5 compatibility
  const prefixes = Array.from(KNOWN_HYPHEN_PREFIXES)
  for (let i = 0; i < prefixes.length; i++) {
    const prefix = prefixes[i]
    if (lower.startsWith(prefix)) {
      return true
    }
  }

  if (lower.includes('-')) {
    const [first, second] = lower.split('-')
    return first.length > 1 && second.length > 1
  }

  return false
}

export function restoreHyphenatedWords(lines: string[]): string[] {
  const result: string[] = []

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]

    if (line.endsWith('-') && index + 1 < lines.length) {
      const nextLine = lines[index + 1]
      const nextTrimmed = nextLine.trim()

      if (nextTrimmed && nextTrimmed[0] === nextTrimmed[0].toLowerCase()) {
        const [nextWord] = nextTrimmed.split(/\s+/)
        const candidate = `${line.slice(0, -1)}-${nextWord}`

        if (!isHyphenatedWord(candidate)) {
          const merged = `${line.slice(0, -1)}${nextTrimmed}`
          result.push(merged)
          index += 1
          continue
        }
      }
    }

    result.push(line)
  }

  return result
}

function mergeContinuationLines(lines: string[]): string[] {
  const result: string[] = []
  let buffer = ''

  for (const line of lines) {
    if (!buffer) {
      buffer = line
      continue
    }

    const shouldMerge =
      line &&
      line[0] === line[0].toLowerCase() &&
      !/[.!?:]$/.test(buffer)

    if (shouldMerge) {
      buffer = `${buffer} ${line}`
    } else {
      result.push(buffer)
      buffer = line
    }
  }

  if (buffer) {
    result.push(buffer)
  }

  return result
}

export function cleanHeadword(word: string): string {
  if (!word.trim()) {
    return ''
  }

  const whitespaceNormalized = normalizeWhitespace(word)
  const ligaturesNormalized = normalizeLigatures(whitespaceNormalized)

  return stripDiacriticsPreserving(ligaturesNormalized)
}

export function cleanTranslation(text: string): string {
  if (!text.trim()) {
    return ''
  }

  const whitespaceNormalized = normalizeWhitespace(text)
  const ligaturesNormalized = normalizeLigatures(whitespaceNormalized)

  return stripDiacriticsPreserving(ligaturesNormalized)
}

export function normalizeText(text: string): string {
  const lines = text
    .split('\n')
    .map(line => normalizeLigatures(line.trim()))
    .filter(line => line.length > 0)

  const restored = restoreHyphenatedWords(lines)
  const merged = mergeContinuationLines(restored)

  const normalized = merged.map(line => {
    const whitespaceNormalized = normalizeWhitespace(line)
    return stripDiacriticsPreserving(whitespaceNormalized)
  })

  return normalized.join('\n')
}
