# Unified Libran Dictionary QA Process

## Overview

The QA process for the Unified Libran Dictionary is a comprehensive 7-category evaluation system designed to ensure linguistic quality, cultural authenticity, and practical usability. This process must achieve a **95% or higher score** before a dictionary version can be approved for production use.

## QA Categories and Scoring

### 1. Collision Check (20% weight)
**Purpose**: Detect duplicates in Ancient or Modern forms

**Rules**:
- Flag identical Ancient or Modern forms across different English meanings
- **Exception**: Allow homonyms only when semantically justified
- Examples of justified homonyms:
  - "brother" (kinship) vs "brother" (body part)
  - "hand" (body part) vs "hand" (measurement)
- Examples of problematic collisions:
  - "horse" (animal) vs "horse" (cavalry) - different meanings, same form

**Scoring**: -2 points per collision
**Threshold**: <5 collisions for passing grade

### 2. Suffix/Laziness Audit (20% weight)
**Purpose**: Ensure authentic donor language roots

**Ancient Forms - Prohibited**:
- ❌ "Bookor" (English + -or)
- ❌ "Tableon" (English + -on)
- ❌ "Housum" (English + -um)

**Ancient Forms - Required**:
- ✅ "Liber" (Latin: book)
- ✅ "Tabulae" (Latin: table)
- ✅ "Domus" (Latin: house)

**Modern Forms - Required**:
- Must lean on Hungarian/Romanian/Icelandic phonology
- ✅ "könyv" (Hungarian influence)
- ✅ "asztal" (Hungarian influence)
- ❌ "buk" (English-like)
- ❌ "teybul" (English-like)

**Scoring**: -1.5 points per lazy formation

### 3. Compound/Hyphen Review (15% weight)
**Purpose**: Ensure meaningful, culturally grounded compounds

**Prohibited**:
- ❌ "fire-sword" (lazy compound)
- ❌ "water-house" (meaningless compound)
- ❌ "big-man" (redundant compound)

**Allowed**:
- ✅ "fegyver" (weapon - culturally specific term)
- ✅ "ház" (house - standalone, culturally appropriate)
- ✅ Compounds only when culturally grounded in notes

**Scoring**: -2 points per problematic compound

### 4. Coverage Analysis (15% weight)
**Purpose**: Ensure balanced vocabulary distribution

**Target Ratios**:
- Verbs: ≥15% of total entries
- Nouns: ≤70% of total entries
- Adjectives: ≥10% of total entries
- Everyday-use words: ≥60% of entries

**Word Type Detection**:
- Verbs: "walk", "run", "to be", "to have"
- Adjectives: "good", "bad", "big", "small"
- Nouns: Everything else (default)

**Scoring**: -10 points per coverage violation

### 5. Ruleset Compliance (15% weight)
**Purpose**: Ensure adherence to linguistic rules

**Required Elements**:
- **Donor Language Notes**: Required when etymology isn't obvious
- **Meaningful Donor Anchors**: Clear connection to Latin, Hungarian, Romanian, or Icelandic
- **Cultural Grounding**: Entries must fit fictional world's linguistic evolution

**Examples**:
- ✅ "virtus" → "erény" (Notes: "Lat virtus; Hu erény")
- ❌ "goodor" → "goodish" (No donor language notes)

**Scoring**: -1 point per compliance violation

### 6. Phrasebook Integration (10% weight)
**Purpose**: Ensure real-world usability

**Test Method**:
- Generate phrases from current lexicon
- Compare against established 100-phrase v1.2 Phrasebook
- Essential phrases: "I am", "you are", "good", "house", "water", etc.

**Success Metric**:
- Can construct meaningful sentences
- Covers essential daily vocabulary
- Enables basic communication

**Scoring**: Based on phrase coverage percentage

### 7. Versioning Check (5% weight)
**Purpose**: Ensure proper metadata and versioning

**Required Metadata**:
- Semantic versioning (major.minor.patch)
- Creation timestamp
- Files included list
- Total entry count
- Processing notes

**Examples**:
- ✅ "1.6.3" (semantic versioning)
- ❌ "v1.6" (non-semantic)
- ❌ "latest" (non-versioned)

**Scoring**: -15 points per versioning issue

## Scoring System

### Overall Score Calculation
```
Overall Score = Σ(Category Score × Weight)
```

### Category Weights:
- Collision Check: 20%
- Suffix/Laziness Audit: 20%
- Compound/Hyphen Review: 15%
- Coverage Analysis: 15%
- Ruleset Compliance: 15%
- Phrasebook Integration: 10%
- Versioning Check: 5%

### Passing Threshold
**95% or higher** required for dictionary approval

## QA Workflow

### 1. Pre-QA Preparation
- Merge all tranche files into unified dictionary
- Move tranches to `merged/` folder
- Ensure all required metadata is present

### 2. QA Execution
- Run automated QA process
- Generate detailed reports (JSON + CSV)
- Identify specific issues by category

### 3. QA Review
- If score < 95%: Address issues, keep tranches in `merged/`
- If score ≥ 95%: Move tranches to `delete/` folder
- Update translator to use new dictionary version

### 4. Post-QA Actions
- Generate QA reports for linguistics team review
- Archive old dictionary versions
- Update documentation

## Reporting

### JSON Report Structure
```json
{
  "timestamp": "2025-09-23T01:30:00.000Z",
  "totalEntries": 2543,
  "overallScore": 97,
  "categories": [
    {
      "category": "Collision Check",
      "score": 96,
      "issues": 2,
      "summary": "2 collisions found"
    }
  ],
  "detailedIssues": [...]
}
```

### CSV Report
- Category-level summary
- Issue counts per category
- Recommended actions

## Best Practices

### For Linguistics Team
1. **Daily Review**: Run QA on new tranches before integration
2. **Issue Prioritization**: Address high-weight categories first
3. **Documentation**: Maintain detailed notes for donor language connections
4. **Cultural Context**: Ensure entries fit the fictional world's evolution

### For Development Team
1. **Automated Checks**: Run QA as part of CI/CD pipeline
2. **Threshold Enforcement**: Never deploy with <95% QA score
3. **Report Analysis**: Use detailed reports for continuous improvement
4. **Version Control**: Maintain clear versioning and rollback capabilities

## Common Issues and Solutions

### High-Frequency Issues
1. **Lazy Ancient Forms**: Replace with proper Latin roots
2. **Missing Etymology**: Add donor language notes
3. **Imbalanced Coverage**: Add more verbs and adjectives
4. **Cultural Disconnect**: Ground entries in fictional world context

### Prevention Strategies
1. **Template Guidelines**: Provide clear formation rules
2. **Donor Language References**: Maintain reference materials
3. **Regular Training**: Update linguistics team on new rules
4. **Peer Review**: Implement cross-checking procedures

## Integration with Build Process

The QA process is fully integrated into the dictionary build system:

```bash
node build-dictionary.js
```

This command:
1. Merges tranches into unified dictionary
2. Moves tranches to `merged/` folder
3. Runs comprehensive QA process
4. Only moves to `delete/` if QA score ≥ 95%
5. Updates translator with new dictionary version

## Continuous Improvement

### Metrics to Track
- Average QA scores over time
- Most common issue types
- Time to resolution for failed QAs
- Dictionary growth and coverage expansion

### Regular Reviews
- Monthly QA process refinement
- Quarterly linguistics team training
- Annual ruleset updates based on usage patterns
