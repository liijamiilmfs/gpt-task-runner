import { Token } from './tokenizer'

export function applySoundShifts(tokens: Token[], variant: 'ancient' | 'modern'): Token[] {
  return tokens.map(token => {
    if (token.type === 'word' && token.translatedValue) {
      const shiftedValue = applyVariantSoundShifts(token.translatedValue, variant)
      return {
        ...token,
        translatedValue: shiftedValue
      }
    }
    return token
  })
}

function applyVariantSoundShifts(text: string, variant: 'ancient' | 'modern'): string {
  let result = text
  
  if (variant === 'ancient') {
    // Ancient Librán sound shifts
    result = applyAncientSoundShifts(result)
  } else {
    // Modern Librán sound shifts
    result = applyModernSoundShifts(result)
  }
  
  return result
}

function applyAncientSoundShifts(text: string): string {
  let result = text
  
  // Ancient sound shifts
  result = result.replace(/s/g, 'ṣ') // s to emphatic s
  result = result.replace(/k/g, 'q') // k to q
  result = result.replace(/t/g, 'ṭ') // t to emphatic t
  result = result.replace(/d/g, 'ḍ') // d to emphatic d
  result = result.replace(/z/g, 'ẓ') // z to emphatic z
  
  // Vowel elongation in stressed syllables
  result = result.replace(/a/g, 'ā') // a to long a
  result = result.replace(/i/g, 'ī') // i to long i
  result = result.replace(/u/g, 'ū') // u to long u
  
  // Glottal stops
  result = result.replace(/'/g, 'ʿ') // apostrophe to left half ring
  result = result.replace(/`/g, 'ʾ') // backtick to right half ring
  
  return result
}

function applyModernSoundShifts(text: string): string {
  let result = text
  
  // Modern sound shifts (less emphatic)
  result = result.replace(/ṣ/g, 's') // emphatic s to regular s
  result = result.replace(/q/g, 'k') // q to k
  result = result.replace(/ṭ/g, 't') // emphatic t to regular t
  result = result.replace(/ḍ/g, 'd') // emphatic d to regular d
  result = result.replace(/ẓ/g, 'z') // emphatic z to regular z
  
  // Vowel shortening
  result = result.replace(/ā/g, 'a') // long a to short a
  result = result.replace(/ī/g, 'i') // long i to short i
  result = result.replace(/ū/g, 'u') // long u to short u
  
  // Simplified glottal stops
  result = result.replace(/ʿ/g, "'") // left half ring to apostrophe
  result = result.replace(/ʾ/g, "'") // right half ring to apostrophe
  
  return result
}

export function applyPhoneticRules(text: string, rules: Record<string, any>): string {
  let result = text
  
  // Apply sound shift rules from dictionary
  if (rules.sound_shifts) {
    for (const [rule, condition] of Object.entries(rules.sound_shifts)) {
      result = applyPhoneticRule(result, rule, condition)
    }
  }
  
  return result
}

function applyPhoneticRule(text: string, rule: string, condition: any): string {
  switch (rule) {
    case 's_to_sh':
      if (condition === 'before_i') {
        return text.replace(/s(?=i)/g, 'sh')
      }
      break
    case 'k_to_q':
      if (condition === 'in_ancient') {
        return text.replace(/k/g, 'q')
      }
      break
    case 'vowel_elongation':
      if (condition === 'in_stressed_syllables') {
        return text.replace(/([aeiou])([^aeiou]*)([aeiou])/g, '$1$2$3')
      }
      break
    default:
      break
  }
  
  return text
}










