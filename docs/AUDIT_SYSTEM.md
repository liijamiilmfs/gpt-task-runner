# Dictionary Audit System

## Overview

The Dictionary Audit System is an advanced quality assurance tool designed to identify problematic or suspect entries that may have made it past the initial QA process. It provides deep linguistic analysis and cultural validation to ensure ongoing dictionary quality.

## Purpose

While the QA process ensures entries meet basic quality standards during build, the audit system performs deeper analysis to catch:
- Subtle linguistic inconsistencies
- Cultural anachronisms
- Etymological mismatches
- Morphological irregularities
- Usage pattern anomalies

## Audit Categories

### 1. Suspicious Pattern Detection
**Purpose**: Identify entries that appear to be lazy formations or English derivatives

**Checks**:
- English-like patterns in Ancient forms (`-or`, `-on`, `-um`, `-us` suffixes)
- English-like patterns in Modern forms (`-ing`, `-tion`, `-ness`, `-ly` endings)
- CamelCase or mixed-case compounds
- Forms too similar to English (>60% similarity for Ancient, >50% for Modern)

**Examples**:
- ❌ "Bookor" (English + -or)
- ❌ "Running" (English -ing ending)
- ❌ "Goodness" (English -ness ending)

### 2. Etymological Inconsistencies
**Purpose**: Verify that claimed donor languages match the actual forms

**Checks**:
- Latin claims vs. Latin morphological patterns
- Hungarian claims vs. Hungarian phonetic features
- Romanian claims vs. Romanian orthography
- Icelandic claims vs. Icelandic characters

**Examples**:
- ❌ Claims "Lat" but Ancient form "Goodus" (not Latin-like)
- ❌ Claims "Hu" but Modern form "goodish" (not Hungarian-like)

### 3. Cultural Anachronisms
**Purpose**: Identify entries that don't fit the fictional world's time period

**Checks**:
- Modern technology terms (computer, internet, phone)
- Modern concepts (democracy, psychology, biology)
- Modern institutions (university, hospital, bank)
- Modern materials (plastic, rubber, aluminum)
- Modern foods (chocolate, coffee, tobacco)

**Examples**:
- ❌ "computer" (too modern for medieval fantasy)
- ❌ "democracy" (anachronistic political concept)

### 4. Phonetic Anomalies
**Purpose**: Identify forms with impossible or unusual phonetic patterns

**Checks**:
- Impossible consonant clusters (4+ consecutive consonants)
- Excessive vowel sequences (4+ consecutive vowels)
- Missing vowels entirely
- Unusual word-initial or word-final clusters

**Examples**:
- ❌ "strxq" (impossible consonant cluster)
- ❌ "aeiou" (excessive vowels)
- ❌ "qrst" (no vowels)

### 5. Semantic Conflicts
**Purpose**: Detect entries with conflicting meanings or duplicate forms

**Checks**:
- Multiple entries for same English word with identical Ancient forms
- Multiple entries for same English word with identical Modern forms
- Entries that should be homonyms but aren't marked as such

**Examples**:
- ❌ Two entries for "brother" both using "Frater" in Ancient
- ❌ Two entries for "hand" both using "kéz" in Modern

### 6. Usage Frequency Analysis
**Purpose**: Ensure appropriate complexity for word frequency

**Checks**:
- Core vocabulary with overly complex forms
- Specialized terms without sufficient context
- Length appropriateness for word type

**Examples**:
- ❌ "I" → "Egoquusmagnificus" (overly complex for core word)
- ❌ "dragon" without cultural context notes

### 7. Donor Language Compliance
**Purpose**: Verify proper application of donor language rules

**Checks**:
- Multiple donor language claims without justification
- Complex forms without donor language notes
- Inconsistent donor language application

**Examples**:
- ❌ Claims "Lat + Hu + Ro" without explanation
- ❌ Complex Ancient form without etymology notes

### 8. Morphological Irregularities
**Purpose**: Identify unusual language evolution patterns

**Checks**:
- Excessive similarity/dissimilarity between Ancient and Modern
- Unusual length changes in evolution
- Inconsistent morphological patterns

**Examples**:
- ❌ "Liber" → "Book" (complete replacement, not evolution)
- ❌ "Domus" → "Házházházház" (excessive lengthening)

## Scoring System

### Severity Levels
- **High**: Critical issues that must be addressed
- **Medium**: Important issues that should be reviewed
- **Low**: Minor issues for consideration

### Score Calculation
```
Audit Score = 100 - (Weighted Issues per Entry × 50)
Weighted Issues = High×3 + Medium×2 + Low×1
```

### Score Interpretation
- **90-100%**: Excellent - minimal issues
- **80-89%**: Good - some minor issues
- **70-79%**: Fair - several issues need attention
- **60-69%**: Poor - significant issues
- **<60%**: Critical - major problems

## Usage

### Standalone Audit (Linguistics Team)
```bash
# Run comprehensive audit on current dictionary
node audit-dictionary.js
```

### Integrated Audit (Build Process)
```bash
# Run full build with audit
node build-dictionary.js
```

### Programmatic Usage
```javascript
const { runDictionaryAudit } = require('./lib/dictionary-builder/audit-process');
const result = await runDictionaryAudit();
```

## Reports

### JSON Report
Structured data for programmatic analysis:
```json
{
  "timestamp": "2025-09-23T01:30:00.000Z",
  "totalEntries": 2543,
  "auditScore": 85,
  "totalSuspectEntries": 127,
  "categories": [...],
  "detailedIssues": [...],
  "recommendations": [...]
}
```

### CSV Report
Spreadsheet-compatible format for data analysis:
```csv
Category,Total Issues,High Severity,Medium Severity,Low Severity,Summary
Suspicious Pattern Detection,45,12,18,15,"45 suspicious patterns found"
Etymological Inconsistencies,23,8,10,5,"23 etymological inconsistencies found"
```

### Detailed Text Report
Human-readable format for linguistics team review:
```
DETAILED DICTIONARY AUDIT REPORT
==================================================

SUSPICIOUS PATTERN DETECTION
-----------------------------
45 suspicious patterns found

HIGH SEVERITY (12 issues):
  • Entry #123: "book"
    Ancient: "Bookor"
    Modern: "könyv"
    Issue: Ancient form "Bookor" matches suspicious pattern and is 75% similar to English "book"
    Recommendation: Review for authentic donor language formation

  • Entry #456: "running"
    Ancient: "Currens"
    Modern: "futás"
    Issue: Modern form "futás" matches suspicious pattern and is 60% similar to English "running"
    Recommendation: Review for authentic donor language formation
```

## Best Practices

### For Linguistics Team
1. **Run audits regularly** - at least weekly during active development
2. **Prioritize high-severity issues** - address critical problems first
3. **Review patterns** - look for systematic issues across entries
4. **Document decisions** - note why certain formations are acceptable
5. **Cross-reference** - verify claims against donor language references

### For Development Team
1. **Integrate into workflow** - run audit as part of build process
2. **Monitor trends** - track audit scores over time
3. **Automate alerts** - notify team of critical issues
4. **Archive reports** - maintain audit history for analysis

## Common Issues and Solutions

### High-Frequency Issues
1. **English-like formations**: Replace with authentic donor language roots
2. **Missing etymology**: Add comprehensive donor language notes
3. **Cultural anachronisms**: Verify historical appropriateness
4. **Phonetic impossibilities**: Adjust for linguistic plausibility

### Prevention Strategies
1. **Reference materials**: Maintain donor language dictionaries
2. **Formation guidelines**: Clear rules for each donor language
3. **Peer review**: Cross-check entries with team members
4. **Regular training**: Update team on new patterns and rules

## Integration with QA Process

### Workflow Position
1. **QA Process**: Basic quality checks (95% threshold)
2. **Audit Process**: Advanced analysis (informational)
3. **Human Review**: Linguistics team evaluation
4. **Final Approval**: Production deployment

### Complementary Roles
- **QA**: Ensures entries meet minimum standards
- **Audit**: Identifies subtle issues and patterns
- **Human Review**: Applies linguistic expertise and context
- **Final Check**: Validates overall dictionary quality

## Advanced Features

### Pattern Learning
The audit system can learn from corrections to improve detection:
- Track which patterns are commonly flagged
- Refine similarity thresholds based on feedback
- Update suspicious pattern lists

### Custom Rules
Teams can add custom audit rules:
- Project-specific cultural requirements
- Specialized linguistic constraints
- Domain-specific terminology rules

### Historical Analysis
Track audit results over time:
- Monitor improvement trends
- Identify recurring issues
- Measure quality progression

## Future Enhancements

### Planned Features
- **Machine Learning**: AI-assisted pattern detection
- **Cultural Database**: Automated cultural context validation
- **Linguistic Analysis**: Advanced morphological analysis
- **Collaborative Review**: Multi-user issue resolution

### Research Areas
- **Pattern Recognition**: Advanced linguistic pattern detection
- **Cultural Mapping**: Automated historical context validation
- **Usage Analytics**: Real-world translation performance correlation
- **Quality Metrics**: Objective quality measurement systems
