# Audit Exclusion System Usage Guide

## Overview

The audit exclusion system allows you to preserve primordial Libran variations and canonical terms that intentionally break or bend core Librán morphology/phonotactics. This system respects your worldbuilding canon while maintaining quality standards for new entries.

## How It Works

### Matching Strategy
1. **Exact Match First**: Case-sensitive exact matching (preserves "A glyph" vs "a glyph" distinction)
2. **Alias Matching**: Supports multiple spelling/diacritic variants
3. **Normalization**: Optional normalization based on settings (currently disabled for maximum precision)

### Current Settings
- **Ignore Case**: `false` - Preserves case-sensitive style
- **Normalize Diacritics**: `false` - Doesn't auto-fix diacritics
- **Treat Hyphen-Dash Equal**: `true` - Avoids noise with "soul-lamp" variants

## Exclusion Categories

Your exclusion list contains **128 exclusions** across **11 categories**:

### World Core (8 items)
- Libra, Librán, Esőerdő, Cordavora, High Circle, Aleșii, Comoară, Comoară_Hiems

### Continents & Regions (9 items)
- Uszo, Arborias, Vizesesek, Sicco Terra, Az Ures, Steppe, Vulkanikus, Esodero, Mocsar

### Tribes, Clans & Orders (17 items)
- Oameni Cai, Rekettae, Viatorii, Grevanar, Telvadar, Uzsori, Fulger (clan), etc.

### Pantheon & Mythic (14 items)
- Fény, Sötét, Hajnal, Csaló, Égi, Ravasz, Hrossa, Noapte, etc.

### Factions & Symbols (8 items)
- Shadow Guild Council, Ascendancy, The Following, The Devoted, etc.

### Places & Sites (13 items)
- Council Chamber of the High Circle, The Grove That Remembers, Boilerbilges, etc.

### NPCs - Original (31 items)
- Valkora (Ghosteye), Rókavar, Revar Hrafna (Rotwing), Nissa Kung, etc.

### NPCs - Ravnica Canon (10 items)
- Teysa Karlov, Izoni, Vannifar, Kaya, Niv-Mizzet, etc.

### Creatures & Monsters (7 items)
- Soul Siphoner Arcanist, Helmed Horror, Deathlock, Specter, etc.

### Artifacts & Concepts (7 items)
- Living Relics, Ascension Crisis, The Stitching, Silent Infiltration, etc.

### Terminology & House Style (4 items)
- soul-lamp, soulflame, boiler-trap, memory-flame

## Usage Commands

### Search for Dictionary Entries
```bash
node manage-exclusions-v2.js search "Cordavora"
```
Finds entries in the dictionary that match your search term.

### Add New Exclusions
```bash
# Add to world core
node manage-exclusions-v2.js add world_core "New Place" "NP" "NewP" --note "Primordial variation"

# Add with multiple aliases
node manage-exclusions-v2.js add pantheon_mythic "New God" "NG" "GodNG" "NewG"

# Add to existing category
node manage-exclusions-v2.js add npcs_original "Character Name" "CN" --note "Original character"
```

### List Exclusions
```bash
# List all categories with counts
node manage-exclusions-v2.js list

# List specific category
node manage-exclusions-v2.js list world_core

# List with full details
node manage-exclusions-v2.js list pantheon_mythic
```

### Test Exclusions
```bash
node manage-exclusions-v2.js test
```
Shows which exclusions actually match dictionary entries.

### Show Available Categories
```bash
node manage-exclusions-v2.js categories
```

## Best Practices

### When to Add Exclusions
1. **Primordial Variations**: Terms created before formal language rules
2. **Canonical Names**: Established character, place, or faction names
3. **Cultural Exceptions**: Terms that fit your fictional world despite breaking rules
4. **House Style**: Specific terminology for your setting

### Future-Proofing
- Add new proper nouns immediately when creating them
- Include all anticipated spelling/diacritic variants as aliases
- Use descriptive notes for context
- Consider hyphen-dash variants for compound terms

### Category Selection
- **world_core**: Fundamental world elements (Libra, Cordavora, High Circle)
- **continents_regions**: Geographic locations
- **tribes_clans_orders**: Organizations and groups
- **pantheon_mythic**: Gods, spirits, and mythical beings
- **factions_symbols**: Political/religious groups
- **places_sites**: Specific locations and buildings
- **npcs_original**: Your original characters
- **npcs_ravnica_canon**: Referenced canon characters
- **creatures_monsters**: Monsters and creatures
- **artifacts_concepts**: Magical items and concepts
- **terminology_house_style**: Setting-specific terminology

## Integration with Audit Process

### Automatic Exclusion
The audit system automatically checks exclusions before flagging issues:
- **Suspicious Patterns**: Excluded terms won't be flagged for English-like formations
- **Cultural Anachronisms**: Canon terms won't be flagged as anachronistic
- **Etymological Issues**: Primordial variations won't need donor language notes

### Exclusion Logging
When exclusions are found, the audit system logs:
```
✓ Excluded: Cordavora (Exact match in world_core: Cordavora)
✓ Excluded: Aleșii (Exact match in world_core: Aleșii)
```

## Regex Allow-List Option

If you want even more control, you can request a regex allow-list with anchored patterns. This would let the auditor check specific patterns before applying strict morphology rules.

Example regex patterns:
- `^Cordavora$` - Exact match for Cordavora
- `^Aleșii|Alesii$` - Match with or without diacritics
- `soul-?lamp` - Match soul-lamp or soullamp

## Current Performance

### Test Results
- **128 total exclusions** loaded successfully
- **7 exact matches** found in current dictionary
- **0 alias matches** (most exclusions are proper nouns not in dictionary)
- **Normalization working** correctly (case-sensitive, diacritic-preserving)

### Audit Impact
- Reduced false positives for canonical terms
- Preserved primordial Libran variations
- Maintained quality standards for new entries
- Improved audit score accuracy

## Maintenance

### Regular Tasks
1. **Test exclusions** monthly to ensure they're working
2. **Add new terms** when creating new content
3. **Review categories** quarterly for organization
4. **Update notes** when context changes

### Troubleshooting
- If audit flags an excluded term, check the exclusion list format
- Verify exact spelling matches (case-sensitive)
- Ensure aliases are properly formatted
- Check normalization settings if needed

## Files

- **`data/audit-exclusions.json`** - Main exclusion list
- **`manage-exclusions-v2.js`** - Management tool
- **`lib/dictionary-builder/audit-process.js`** - Audit system with exclusions
- **`audit-dictionary.js`** - Standalone audit tool

The exclusion system ensures your worldbuilding canon is preserved while maintaining linguistic quality standards for new dictionary entries.
