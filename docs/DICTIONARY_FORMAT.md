# Dictionary Format Specification

This document describes the JSON schema and format for Librán dictionaries used in the translation system.

## Overview

Librán dictionaries are JSON files that contain word mappings, phrases, grammatical rules, and metadata for translating between English and Librán variants.

## File Structure

### Basic Structure
```json
{
  "version": "1.0.0",
  "language": "ancient-libran",
  "metadata": {
    "description": "Ancient Librán dictionary",
    "lastUpdated": "2024-01-01",
    "wordCount": 1500,
    "author": "Librán Voice Forge Team"
  },
  "entries": {
    "english_word": "libran_translation"
  },
  "phrases": {
    "english_phrase": "libran_phrase"
  },
  "rules": {
    "rule_name": "rule_value"
  }
}
```

## Schema Definition

### Root Object Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `version` | string | ✅ | Dictionary format version (semantic versioning) |
| `language` | string | ✅ | Language identifier (`ancient-libran`, `modern-libran`) |
| `metadata` | object | ✅ | Dictionary metadata and information |
| `entries` | object | ✅ | Word-to-word translations |
| `phrases` | object | ❌ | Phrase-to-phrase translations |
| `rules` | object | ✅ | Grammatical and phonetic rules |

### Metadata Object

```json
{
  "metadata": {
    "description": "Human-readable description of the dictionary",
    "lastUpdated": "ISO 8601 date string",
    "wordCount": "number",
    "author": "string",
    "contributors": ["array", "of", "strings"],
    "license": "string",
    "source": "string"
  }
}
```

### Entries Object

Word-to-word translations with support for multiple forms:

```json
{
  "entries": {
    "hello": "salaam",
    "world": "dunya",
    "peace": "aman",
    "water": {
      "base": "maa",
      "plural": "maayan",
      "possessive": "maai"
    },
    "to_be": {
      "present": "kana",
      "past": "kaana",
      "future": "sayakuna"
    }
  }
}
```

### Phrases Object

Phrase-level translations that take precedence over word-level:

```json
{
  "phrases": {
    "good morning": "sabah al-khayr",
    "good night": "layla sa'ida",
    "how are you": "kayf halak",
    "thank you": "shukran",
    "you're welcome": "afwan"
  }
}
```

### Rules Object

Grammatical and phonetic rules for the language:

```json
{
  "rules": {
    "plural_suffix": "an",
    "verb_ending": "ar",
    "adjective_agreement": true,
    "word_order": "SVO",
    "definite_article": "al",
    "indefinite_article": "waahid",
    "sound_shifts": {
      "s_to_sh": "before_i",
      "k_to_q": "in_ancient"
    }
  }
}
```

## Diacritics and Special Characters

### Supported Diacritics

Librán uses the following diacritical marks (UTF-8 encoded):

| Character | Unicode | Name | Usage |
|-----------|---------|------|-------|
| `á` | U+00E1 | Acute Accent | Long 'a' sound |
| `é` | U+00E9 | Acute Accent | Long 'e' sound |
| `í` | U+00ED | Acute Accent | Long 'i' sound |
| `ó` | U+00F3 | Acute Accent | Long 'o' sound |
| `ú` | U+00FA | Acute Accent | Long 'u' sound |
| `ā` | U+0101 | Macron | Extra long vowel |
| `ē` | U+0113 | Macron | Extra long vowel |
| `ī` | U+012B | Macron | Extra long vowel |
| `ō` | U+014D | Macron | Extra long vowel |
| `ū` | U+016B | Macron | Extra long vowel |
| `ḥ` | U+1E25 | Dot Below | Emphatic 'h' |
| `ṣ` | U+1E63 | Dot Below | Emphatic 's' |
| `ṭ` | U+1E6D | Dot Below | Emphatic 't' |
| `ẓ` | U+1E93 | Dot Below | Emphatic 'z' |
| `ʿ` | U+02BF | Left Half Ring | Glottal stop |
| `ʾ` | U+02BE | Right Half Ring | Glottal stop |

### Pronunciation Guidelines

```json
{
  "pronunciation_guide": {
    "á": "ah as in 'father'",
    "é": "eh as in 'bed'",
    "í": "ee as in 'see'",
    "ó": "oh as in 'go'",
    "ú": "oo as in 'moon'",
    "ḥ": "h with more breath",
    "ṣ": "s with more emphasis",
    "ṭ": "t with more emphasis",
    "ẓ": "z with more emphasis",
    "ʿ": "glottal stop like in 'uh-oh'",
    "ʾ": "glottal stop like in 'uh-oh'"
  }
}
```

## Complex Word Forms

### Verb Conjugations

```json
{
  "to_speak": {
    "base": "takallam",
    "present": {
      "I": "atakallam",
      "you": "tatakallam",
      "he": "yatakallam",
      "she": "tatakallam",
      "we": "natakallam",
      "they": "yatakallamun"
    },
    "past": {
      "I": "takallamtu",
      "you": "takallamta",
      "he": "takallama",
      "she": "takallamat",
      "we": "takallamna",
      "they": "takallamu"
    },
    "future": {
      "I": "satahakallam",
      "you": "satahakallam",
      "he": "sayatakallam",
      "she": "satatakallam",
      "we": "sanatakallam",
      "they": "sayatakallamun"
    }
  }
}
```

### Noun Declensions

```json
{
  "book": {
    "base": "kitab",
    "singular": "kitab",
    "plural": "kutub",
    "dual": "kitaban",
    "possessive": {
      "my": "kitabi",
      "your": "kitabak",
      "his": "kitabuhu",
      "her": "kitabuha",
      "our": "kitabuna",
      "their": "kitabuhum"
    }
  }
}
```

### Adjective Forms

```json
{
  "beautiful": {
    "masculine": "jameel",
    "feminine": "jameela",
    "plural_masculine": "jameelun",
    "plural_feminine": "jameelat",
    "comparative": "ajmal",
    "superlative": "al-ajmal"
  }
}
```

## Rule System

### Grammatical Rules

```json
{
  "rules": {
    "word_order": "SVO",
    "adjective_placement": "after_noun",
    "definite_article": "al",
    "indefinite_article": "waahid",
    "plural_formation": {
      "regular": "add_an_suffix",
      "irregular": "use_plural_form",
      "broken": "change_vowel_pattern"
    },
    "verb_agreement": {
      "person": true,
      "number": true,
      "gender": "feminine_only"
    }
  }
}
```

### Phonetic Rules

```json
{
  "rules": {
    "sound_shifts": {
      "s_to_sh": {
        "condition": "before_i_or_e",
        "example": "salaam -> shalaam"
      },
      "k_to_q": {
        "condition": "in_ancient_variant",
        "example": "kitab -> qitab"
      },
      "vowel_harmony": {
        "condition": "in_compound_words",
        "example": "al-kitab -> al-kitaab"
      }
    }
  }
}
```

## File Naming Convention

### Dictionary Files
- `ancient-libran.json` - Ancient Librán dictionary
- `modern-libran.json` - Modern Librán dictionary
- `rules.json` - Shared grammatical rules
- `phonetic-rules.json` - Phonetic transformation rules

### Version Control
- Use semantic versioning (e.g., `1.0.0`, `1.1.0`, `2.0.0`)
- Include version in both filename and JSON content
- Maintain backward compatibility when possible

## Validation Schema

### JSON Schema Example
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["version", "language", "metadata", "entries", "rules"],
  "properties": {
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$"
    },
    "language": {
      "type": "string",
      "enum": ["ancient-libran", "modern-libran"]
    },
    "metadata": {
      "type": "object",
      "required": ["description", "lastUpdated", "wordCount"],
      "properties": {
        "description": {"type": "string"},
        "lastUpdated": {"type": "string", "format": "date"},
        "wordCount": {"type": "number", "minimum": 0}
      }
    },
    "entries": {
      "type": "object",
      "patternProperties": {
        "^[a-zA-Z_]+$": {
          "oneOf": [
            {"type": "string"},
            {"type": "object"}
          ]
        }
      }
    }
  }
}
```

## Best Practices

### 1. Dictionary Maintenance
- **Regular Updates**: Update dictionaries regularly with new words
- **Consistency**: Maintain consistent formatting and style
- **Validation**: Validate JSON syntax before committing
- **Backup**: Keep backup copies of working dictionaries

### 2. Word Addition
- **Research**: Research proper Librán equivalents
- **Context**: Consider context and usage
- **Diacritics**: Use appropriate diacritical marks
- **Testing**: Test new words in translation system

### 3. Quality Assurance
- **Proofreading**: Have native speakers review translations
- **Consistency Checks**: Ensure consistent terminology
- **Cross-Reference**: Cross-reference with other dictionaries
- **Documentation**: Document unusual or complex translations

## Example Dictionary Files

### Complete Ancient Librán Dictionary
```json
{
  "version": "1.0.0",
  "language": "ancient-libran",
  "metadata": {
    "description": "Ancient Librán dictionary for mystical translations",
    "lastUpdated": "2024-01-01",
    "wordCount": 1500,
    "author": "Librán Voice Forge Team",
    "license": "MIT"
  },
  "entries": {
    "hello": "salaam",
    "world": "dunya",
    "peace": "aman",
    "water": "maa",
    "fire": "naar",
    "earth": "ard",
    "air": "hawa",
    "spirit": "ruh",
    "magic": "sihr",
    "ancient": "qadeem",
    "mystical": "ghaybi",
    "secret": "sirr",
    "knowledge": "ilm",
    "wisdom": "hikma",
    "power": "quwwa",
    "strength": "qawwa",
    "beautiful": "jameel",
    "dark": "zulma",
    "light": "nur",
    "shadow": "zill"
  },
  "phrases": {
    "good morning": "sabah al-khayr",
    "good night": "layla sa'ida",
    "thank you": "shukran",
    "you're welcome": "afwan",
    "how are you": "kayf halak",
    "peace be upon you": "al-salaam alaykum",
    "may the spirits guide you": "li-tahdi al-arwah lak",
    "ancient wisdom": "al-hikma al-qadeema",
    "mystical power": "al-quwwa al-ghaybiyya"
  },
  "rules": {
    "plural_suffix": "an",
    "verb_ending": "ar",
    "adjective_agreement": true,
    "word_order": "SVO",
    "definite_article": "al",
    "indefinite_article": "waahid",
    "sound_shifts": {
      "s_to_sh": "before_i",
      "k_to_q": "in_ancient",
      "vowel_elongation": "in_stressed_syllables"
    }
  }
}
```

## Exclusion Policy and Rationale

### Excluded Terms

Certain categories of terms are systematically excluded from Librán dictionaries to maintain linguistic purity and avoid cultural contamination:

#### 1. Divine and Pantheon Terms
**Rationale**: Divine names and pantheon-specific terminology should remain in their original languages to preserve their sacred nature and avoid cultural appropriation.

**Examples of Excluded Terms**:
- `god`, `goddess`, `deity`, `divine`, `holy`, `sacred`
- `jesus`, `christ`, `allah`, `yahweh`, `zeus`, `odin`
- `heaven`, `hell`, `paradise`, `nirvana`, `valhalla`
- `prayer`, `worship`, `temple`, `church`, `mosque`

#### 2. Proper Names and Cultural References
**Rationale**: Personal names, place names, and cultural-specific references should retain their original form to maintain historical and cultural accuracy.

**Examples of Excluded Terms**:
- Personal names: `john`, `mary`, `muhammad`, `buddha`
- Place names: `rome`, `mecca`, `jerusalem`, `tibet`
- Cultural terms: `christmas`, `ramadan`, `hanukkah`, `diwali`
- Brand names: `coca-cola`, `mcdonalds`, `nike`

#### 3. Technical and Modern Concepts
**Rationale**: Modern technical terms, scientific concepts, and contemporary technology should remain in their original form to maintain precision and avoid confusion.

**Examples of Excluded Terms**:
- Technology: `computer`, `internet`, `smartphone`, `wifi`
- Scientific: `dna`, `quantum`, `laser`, `nuclear`
- Medical: `antibiotic`, `vaccine`, `surgery`, `chemotherapy`
- Modern concepts: `democracy`, `capitalism`, `socialism`, `feminism`

#### 4. Comoară and Mystical Entities
**Rationale**: Specific mystical entities and concepts from the Librán universe should remain untranslated to preserve their unique cultural significance.

**Examples of Excluded Terms**:
- `comoară` (treasure/essence)
- `spiritus` (spiritual essence)
- `mysticus` (mystical power)
- `arcanum` (secret knowledge)

### Exclusion Implementation

#### Exclusion List Format
```json
{
  "exclusions": {
    "divine_terms": [
      "god", "goddess", "deity", "divine", "holy", "sacred",
      "jesus", "christ", "allah", "yahweh", "zeus", "odin"
    ],
    "proper_names": [
      "john", "mary", "muhammad", "buddha",
      "rome", "mecca", "jerusalem", "tibet"
    ],
    "technical_terms": [
      "computer", "internet", "smartphone", "wifi",
      "dna", "quantum", "laser", "nuclear"
    ],
    "mystical_entities": [
      "comoară", "spiritus", "mysticus", "arcanum"
    ]
  }
}
```

#### Exclusion Processing
1. **Pre-processing**: Check all input terms against exclusion lists
2. **Case-insensitive matching**: Handle variations in capitalization
3. **Stemming**: Check root forms of words (e.g., "gods" → "god")
4. **Phrase detection**: Identify excluded terms within phrases
5. **Logging**: Record excluded terms for analysis and review

## Conflict Resolution

### Conflict Types

#### 1. Multiple Translations for Same Word
**Scenario**: A single English word has multiple valid Librán translations.

**Example Conflict**:
```json
{
  "conflicts": {
    "light": {
      "ancient": "nur",
      "modern": "daw'",
      "context": "physical_illumination"
    }
  }
}
```

**Resolution Strategy**:
1. **Context-based selection**: Choose translation based on usage context
2. **Variant-specific mapping**: Different translations for ancient vs modern
3. **Frequency-based preference**: Use most common translation
4. **Manual review**: Flag for human decision

#### 2. Ambiguous Word Forms
**Scenario**: English word has multiple meanings requiring different translations.

**Example Conflict**:
```json
{
  "conflicts": {
    "bank": {
      "financial": "masrif",
      "geographical": "jurf",
      "context": "noun_type"
    }
  }
}
```

**Resolution Strategy**:
1. **Part-of-speech analysis**: Determine word function
2. **Semantic analysis**: Analyze surrounding context
3. **Default mapping**: Use most common meaning
4. **Fallback handling**: Mark as ambiguous for manual review

#### 3. Cross-Variant Inconsistencies
**Scenario**: Same English word translated differently in ancient vs modern variants.

**Example Conflict**:
```json
{
  "conflicts": {
    "water": {
      "ancient": "maa",
      "modern": "miya",
      "inconsistency": "phonetic_drift"
    }
  }
}
```

**Resolution Strategy**:
1. **Historical accuracy**: Maintain variant-specific translations
2. **Consistency checking**: Flag inconsistencies for review
3. **Documentation**: Record rationale for differences
4. **Validation**: Ensure translations follow variant rules

### Conflict Resolution Process

#### 1. Detection Phase
```json
{
  "conflict_detection": {
    "duplicate_entries": "scan_for_same_english_word",
    "inconsistent_variants": "compare_ancient_vs_modern",
    "ambiguous_contexts": "identify_multiple_meanings",
    "rule_violations": "check_grammatical_consistency"
  }
}
```

#### 2. Analysis Phase
```json
{
  "conflict_analysis": {
    "frequency_analysis": "count_usage_frequency",
    "context_analysis": "analyze_surrounding_words",
    "rule_validation": "check_grammatical_rules",
    "historical_accuracy": "verify_variant_appropriateness"
  }
}
```

#### 3. Resolution Phase
```json
{
  "conflict_resolution": {
    "automatic_resolution": "apply_resolution_rules",
    "manual_review": "flag_complex_cases",
    "documentation": "record_resolution_rationale",
    "validation": "verify_resolution_quality"
  }
}
```

### Conflict Examples

#### Example 1: Multiple Meanings
**English**: "spirit"
**Conflict**: 
- Ancient: "ruh" (soul/spirit)
- Modern: "hawa" (air/wind)
- Context: "The spirit of the wind"

**Resolution**: Use context-aware selection
```json
{
  "spirit": {
    "ancient": "ruh",
    "modern": "hawa",
    "context_rules": {
      "metaphysical": "ruh",
      "physical_wind": "hawa",
      "alcoholic": "khamr"
    }
  }
}
```

#### Example 2: Phonetic Drift
**English**: "book"
**Conflict**:
- Ancient: "kitab"
- Modern: "kitab" (same spelling, different pronunciation)

**Resolution**: Maintain spelling, document pronunciation
```json
{
  "book": {
    "ancient": "kitab",
    "modern": "kitab",
    "pronunciation": {
      "ancient": "ki-TAB",
      "modern": "ki-tab"
    }
  }
}
```

#### Example 3: Cultural Adaptation
**English**: "house"
**Conflict**:
- Ancient: "bayt" (traditional dwelling)
- Modern: "manzil" (modern residence)

**Resolution**: Variant-specific mapping
```json
{
  "house": {
    "ancient": "bayt",
    "modern": "manzil",
    "context": "architectural_style"
  }
}
```

### Conflict Resolution Rules

#### 1. Priority Order
1. **Context-based selection** (highest priority)
2. **Variant-specific mapping**
3. **Frequency-based preference**
4. **Manual review** (lowest priority)

#### 2. Validation Criteria
- **Grammatical consistency**: Follows language rules
- **Cultural appropriateness**: Respects cultural context
- **Historical accuracy**: Maintains variant integrity
- **Usage frequency**: Reflects common usage

#### 3. Documentation Requirements
- **Conflict description**: Clear explanation of the conflict
- **Resolution rationale**: Why this resolution was chosen
- **Alternative options**: Other possible resolutions considered
- **Review status**: Whether manual review is required

---

*This dictionary format specification ensures consistent, maintainable, and extensible translation dictionaries for the Librán Voice Forge system.*






