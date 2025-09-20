# JSON Dictionary Import

This document describes how to import Librán dictionaries from JSON files, which provides more accuracy and control than PDF parsing.

## Quick Start

### Using npm script (Recommended)

```bash
# Import from JSON files
npm run dict:import -- --ancient data/ancient.json --modern data/modern.json

# Import with custom output directory
npm run dict:import -- --ancient data/ancient.json --modern data/modern.json --output build/dictionaries

# Show help
npm run dict:import -- --help
```

### Using Python CLI directly

```bash
# Navigate to the dict_importer directory
cd tools/dict_importer

# Import from JSON files
python -m dict_importer.cli import-json --ancient data/ancient.json --modern data/modern.json --out lib/translator/dictionaries

# Create sample JSON files
python -m dict_importer.cli create-sample --format simple --output data/sample.json
```

## Supported JSON Formats

### 1. Simple Format (Key-Value)

```json
{
  "balance": "stílibra",
  "flame": "flamë",
  "memory": "memirë",
  "shadow": "arnëa",
  "stone": "petrë",
  "void": "tómr",
  "anger": "íra",
  "courage": "corëa",
  "dream": "visira",
  "envy": "invidë"
}
```

### 2. Detailed Format (With Metadata)

```json
{
  "balance": {
    "ancient": "stílibra",
    "modern": "stílibra",
    "pos": "n",
    "notes": "Core sacred concept",
    "etymology": "Lat. statera"
  },
  "flame": {
    "ancient": "flamë",
    "modern": "flamë",
    "pos": "n",
    "notes": "Fire-flame",
    "etymology": "Lat. flamma"
  }
}
```

### 3. Nested Format (Variants as Top-Level Keys)

```json
{
  "ancient": {
    "balance": "stílibra",
    "flame": "flamë",
    "memory": "memirë",
    "shadow": "arnëa",
    "stone": "petrë"
  },
  "modern": {
    "balance": "stílibra",
    "flame": "flamë",
    "memory": "memirë",
    "shadow": "arnëa",
    "stone": "petrë"
  }
}
```

## Command Line Options

### `npm run dict:import` Options

| Option | Description | Default |
|--------|-------------|---------|
| `--ancient <path>` | Path to ancient JSON dictionary | `data/ancient.json` |
| `--modern <path>` | Path to modern JSON dictionary | `data/modern.json` |
| `--output <path>` | Output directory for dictionaries | `lib/translator/dictionaries` |
| `--help, -h` | Show help message | - |

### `python -m dict_importer.cli import-json` Options

| Option | Description | Required |
|--------|-------------|----------|
| `--ancient <path>` | Path to ancient JSON dictionary | Yes |
| `--modern <path>` | Path to modern JSON dictionary | Yes |
| `--out <path>` | Output directory for dictionaries | Yes |

### `python -m dict_importer.cli create-sample` Options

| Option | Description | Required |
|--------|-------------|----------|
| `--format <type>` | JSON format type (simple, detailed, nested) | Yes |
| `--output <path>` | Output file path | Yes |

## Examples

### Basic JSON Import

```bash
# Using npm script
npm run dict:import

# Using Python CLI
cd tools/dict_importer
python -m dict_importer.cli import-json --ancient data/ancient.json --modern data/modern.json --out lib/translator/dictionaries
```

### Advanced JSON Import

```bash
# Import with custom files and output directory
npm run dict:import -- \
  --ancient data/my-ancient-dict.json \
  --modern data/my-modern-dict.json \
  --output build/custom-dictionaries
```

### Create Sample Files

```bash
# Create simple format sample
cd tools/dict_importer
python -m dict_importer.cli create-sample --format simple --output data/sample_simple.json

# Create detailed format sample
python -m dict_importer.cli create-sample --format detailed --output data/sample_detailed.json

# Create nested format sample
python -m dict_importer.cli create-sample --format nested --output data/sample_nested.json
```

## Advantages of JSON Import

### 1. **Accuracy**
- No parsing errors from PDF text extraction
- Exact control over word mappings
- No ambiguity in word recognition

### 2. **Flexibility**
- Support for multiple JSON formats
- Easy to edit and maintain
- Version control friendly

### 3. **Metadata Support**
- Part of speech information
- Etymology and notes
- Additional linguistic data

### 4. **Performance**
- Faster than PDF parsing
- No complex text processing
- Direct dictionary loading

## Workflow

### 1. Create JSON Dictionaries

```bash
# Create sample files to get started
cd tools/dict_importer
python -m dict_importer.cli create-sample --format simple --output data/ancient.json
python -m dict_importer.cli create-sample --format simple --output data/modern.json
```

### 2. Edit Your Dictionaries

```json
{
  "balance": "stílibra",
  "flame": "flamë",
  "memory": "memirë",
  "shadow": "arnëa",
  "stone": "petrë",
  "void": "tómr",
  "anger": "íra",
  "courage": "corëa",
  "dream": "visira",
  "envy": "invidë",
  "faith": "fidë",
  "fear": "felë",
  "hope": "sperë",
  "joy": "bucorë",
  "love": "dramë",
  "mercy": "milëa",
  "vision": "visiora",
  "ancestor": "ancesa",
  "father": "patera",
  "mother": "matera",
  "brother": "fratra",
  "sister": "sorora",
  "child": "infana",
  "warrior": "bellatora",
  "priest": "sacerdota",
  "king": "rexora",
  "queen": "regina",
  "lord": "domina",
  "lady": "domina"
}
```

### 3. Import to System

```bash
# Import your dictionaries
npm run dict:import -- --ancient data/ancient.json --modern data/modern.json
```

### 4. Test the Frontend

```bash
# Start the development server
npm run dev
```

Visit `http://localhost:3000` and test your translations!

## Error Handling

The JSON import provides comprehensive error handling:

- **File Not Found**: Clear error messages when JSON files are missing
- **Invalid JSON**: Syntax error detection and reporting
- **Format Detection**: Automatic format detection with fallbacks
- **Validation**: Entry validation and error reporting

## Integration

The JSON import integrates seamlessly with the existing system:

1. **Output Format**: Generates the same `ancient.json` and `modern.json` files
2. **API Compatibility**: Works with existing translation APIs
3. **Frontend Integration**: No changes needed to the frontend
4. **Backward Compatibility**: Can be used alongside PDF parsing

## Best Practices

### 1. **File Organization**
```
data/
├── ancient.json          # Ancient Librán dictionary
├── modern.json           # Modern Librán dictionary
├── backup/               # Backup files
│   ├── ancient_v1.json
│   └── modern_v1.json
└── samples/              # Sample files
    ├── simple.json
    ├── detailed.json
    └── nested.json
```

### 2. **Version Control**
- Keep JSON files in version control
- Use meaningful commit messages
- Tag releases for dictionary updates

### 3. **Backup Strategy**
- Regular backups of dictionary files
- Test imports before deploying
- Keep multiple format versions

### 4. **Quality Assurance**
- Validate JSON syntax before importing
- Test translations after import
- Review generated dictionaries

## Troubleshooting

### Common Issues

1. **JSON Syntax Errors**
   ```
   Error: Invalid JSON syntax in file
   ```
   **Solution**: Validate JSON syntax using a JSON validator

2. **File Not Found**
   ```
   Error: Ancient JSON file not found
   ```
   **Solution**: Check file paths and ensure files exist

3. **Format Detection Issues**
   ```
   Error: Unsupported JSON format
   ```
   **Solution**: Use one of the supported formats (simple, detailed, nested)

4. **Import Failures**
   ```
   Error: Failed to import dictionaries
   ```
   **Solution**: Check file permissions and disk space

### Debug Mode

For detailed debugging, you can run the Python CLI directly:

```bash
cd tools/dict_importer
python -m dict_importer.cli import-json --ancient data/ancient.json --modern data/modern.json --out lib/translator/dictionaries
```

This will provide verbose output and help identify issues.

## Examples

### Complete Workflow

```bash
# 1. Create sample dictionaries
cd tools/dict_importer
python -m dict_importer.cli create-sample --format simple --output ../data/ancient.json
python -m dict_importer.cli create-sample --format simple --output ../data/modern.json

# 2. Edit the dictionaries with your words
# (Edit data/ancient.json and data/modern.json)

# 3. Import to the system
cd ..
npm run dict:import

# 4. Test the frontend
npm run dev
```

### Custom Configuration

```bash
# Import with custom settings
npm run dict:import -- \
  --ancient data/my-custom-ancient.json \
  --modern data/my-custom-modern.json \
  --output build/custom-dictionaries
```

This will create the dictionaries in `build/custom-dictionaries/` using your custom files.
