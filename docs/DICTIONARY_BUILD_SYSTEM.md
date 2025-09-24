# Unified Libran Dictionary Build System

## Overview

The Dictionary Build System is a comprehensive workflow for merging tranche files into unified dictionaries with rigorous QA processes. It ensures linguistic quality, cultural authenticity, and practical usability through automated checks and scoring.

## System Components

### 1. Main Build Routine (`build-dictionary.js`)
- **Orchestrates** the entire build process
- **Merges** tranche files into unified dictionary
- **Manages** file lifecycle (tranches → merged → delete)
- **Enforces** 95% QA threshold for approval
- **Provides** comprehensive logging and reporting

### 2. Merge Process (`lib/dictionary-builder/merge-process.js`)
- **Handles** multiple file formats (arrays, objects, sections)
- **Detects** and removes duplicates intelligently
- **Validates** entry completeness (english, ancient, modern)
- **Generates** comprehensive metadata

### 3. QA Process (`lib/dictionary-builder/qa-process.js`)
- **Implements** 7-category evaluation system
- **Scores** each category with weighted importance
- **Generates** detailed JSON and CSV reports
- **Enforces** 95% minimum threshold for approval

### 4. Documentation (`docs/QA_PROCESS.md`)
- **Explains** QA categories and scoring rules
- **Provides** examples of good/bad formations
- **Outlines** best practices for linguistics team
- **Documents** workflow and integration points

## QA Categories (Weighted Scoring)

| Category | Weight | Purpose | Key Checks |
|----------|--------|---------|------------|
| **Collision Check** | 20% | Detect duplicate Ancient/Modern forms | Homonym justification, semantic analysis |
| **Suffix/Laziness Audit** | 20% | Ensure authentic donor language roots | Reject English+suffix, require donor languages |
| **Compound/Hyphen Review** | 15% | Validate meaningful compounds | Cultural grounding, avoid lazy formations |
| **Coverage Analysis** | 15% | Balance vocabulary distribution | Verb/noun ratios, everyday usage |
| **Ruleset Compliance** | 15% | Adhere to linguistic rules | Donor language notes, etymology |
| **Phrasebook Integration** | 10% | Ensure real-world usability | Essential phrase coverage |
| **Versioning Check** | 5% | Proper metadata and versioning | Semantic versioning, required fields |

## Workflow

### Phase 1: Merge
```bash
node build-dictionary.js
```
1. **Scans** `data/Tranches/` for JSON files
2. **Excludes** existing unified dictionaries and duplicates
3. **Merges** all tranche files into unified dictionary
4. **Generates** comprehensive metadata

### Phase 2: File Management
1. **Moves** processed tranches to `data/Tranches/merged/`
2. **Preserves** original files for rollback capability
3. **Maintains** audit trail of processed files

### Phase 3: QA Evaluation
1. **Runs** 7-category comprehensive QA process
2. **Scores** each category with weighted importance
3. **Calculates** overall score (0-100%)
4. **Generates** detailed reports (JSON + CSV)

### Phase 4: Approval Gate
- **If score ≥ 95%**: Move tranches to `data/Tranches/delete/`
- **If score < 95%**: Keep tranches in `merged/` for review
- **Provides** detailed issue reports for remediation

### Phase 5: Production Deployment
1. **Updates** translator with new dictionary version
2. **Archives** old dictionary versions
3. **Updates** documentation and metadata

## File Structure

```
data/
├── Tranches/                 # Source tranche files
│   ├── merged/              # Files awaiting QA approval
│   └── delete/              # Approved files (can be deleted)
├── UnifiedLibranDictionaryv1.6.3.json  # Current unified dictionary
└── phrasebook-v1.2.json     # Reference phrasebook for QA

lib/dictionary-builder/
├── merge-process.js         # Tranche merging logic
└── qa-process.js           # QA evaluation engine

docs/
└── QA_PROCESS.md           # Detailed QA documentation

build-dictionary.js         # Main build orchestrator
```

## Usage Examples

### Full Build Process
```bash
# Run complete build with QA
node build-dictionary.js
```

### QA Only (on existing dictionary)
```bash
# Run QA on current dictionary
node -e "require('./lib/dictionary-builder/qa-process').runComprehensiveQA()"
```

### Manual Merge (without QA)
```bash
# Just merge tranches
node -e "require('./lib/dictionary-builder/merge-process').mergeTranchesToUnified()"
```

## Current Status

### Dictionary v1.6.3
- **Total Entries**: 2,543
- **Source Files**: 20 tranche files
- **Duplicates Removed**: 56
- **Current QA Score**: 44% (below 95% threshold)

### Issues Identified
- **Collision Check**: 311 issues (duplicate Ancient/Modern forms)
- **Suffix/Laziness Audit**: 514 issues (lazy formations)
- **Compound/Hyphen Review**: 18 issues (problematic compounds)
- **Coverage Analysis**: 2 issues (imbalanced vocabulary)
- **Ruleset Compliance**: 24 issues (missing etymology)
- **Phrasebook Integration**: 6 issues (missing essential phrases)

## Next Steps

### For Linguistics Team
1. **Review** QA reports to understand specific issues
2. **Address** high-priority categories (Collision Check, Suffix Audit)
3. **Add** missing donor language notes and etymology
4. **Rebalance** vocabulary coverage (more verbs, fewer nouns)
5. **Re-run** QA process after corrections

### For Development Team
1. **Integrate** build system into CI/CD pipeline
2. **Set up** automated QA runs on new tranches
3. **Configure** 95% threshold enforcement
4. **Monitor** QA scores over time for trends

## Quality Assurance

### Automated Checks
- **Duplicate Detection**: Intelligent collision detection
- **Format Validation**: Ensures complete entry structure
- **Donor Language Verification**: Checks for authentic roots
- **Coverage Analysis**: Monitors vocabulary balance
- **Phrasebook Testing**: Validates real-world usability

### Manual Review Points
- **Semantic Justification**: Human review of homonyms
- **Cultural Grounding**: Validation of fictional world fit
- **Etymology Accuracy**: Verification of donor language connections
- **Usage Context**: Assessment of practical applicability

## Reporting

### JSON Reports
- **Detailed Issues**: Specific entries with problems
- **Category Breakdown**: Scores and issue counts per category
- **Metadata**: Timestamps, versions, file tracking
- **Recommendations**: Suggested actions for improvement

### CSV Reports
- **Summary View**: Category-level statistics
- **Issue Counts**: Quick overview of problem areas
- **Score Tracking**: Historical performance data
- **Team Communication**: Easy sharing with linguistics team

## Integration

### With Translator System
- **Automatic Updates**: New dictionary versions deployed automatically
- **Rollback Capability**: Previous versions maintained for safety
- **Version Tracking**: Clear versioning and metadata
- **Performance Monitoring**: Track translation quality over time

### With Development Workflow
- **Git Integration**: Version control for all dictionary files
- **CI/CD Pipeline**: Automated testing and deployment
- **Quality Gates**: 95% QA threshold enforcement
- **Documentation**: Comprehensive process documentation

## Success Metrics

### Quality Metrics
- **QA Score**: Maintain >95% overall score
- **Issue Resolution**: <24 hours for critical issues
- **Coverage Growth**: Steady expansion of vocabulary
- **Usability**: Successful phrasebook integration tests

### Process Metrics
- **Build Time**: <5 minutes for full process
- **Success Rate**: >90% first-pass approval rate
- **Team Adoption**: Linguistics team using system daily
- **Documentation**: Complete and up-to-date guides

## Future Enhancements

### Planned Features
- **Machine Learning**: AI-assisted donor language detection
- **Cultural Validation**: Automated fictional world consistency checks
- **Performance Optimization**: Faster QA processing for large dictionaries
- **Integration APIs**: REST endpoints for external tool integration

### Research Areas
- **Linguistic Analysis**: Advanced morphological analysis
- **Cultural Mapping**: Automated cultural context validation
- **Usage Analytics**: Real-world translation performance tracking
- **Collaborative Editing**: Multi-user tranche editing capabilities
