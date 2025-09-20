# Dictionary Importer CLI

This document describes how to use the dictionary importer CLI to build JSON dictionaries from PDF files.

## Quick Start

### Using npm script (Recommended)

```bash
# Build dictionaries with default settings
npm run dict:build

# Build with custom PDF file
npm run dict:build -- --pdf data/my-dictionary.pdf

# Build with custom output directory
npm run dict:build -- --output build/dictionaries

# Build with support PDF and exclude terms
npm run dict:build -- --pdf data/main.pdf --support data/support.pdf --exclude data/exclude.txt

# Show help
npm run dict:build -- --help
```

### Using Python CLI directly

```bash
# Navigate to the dict_importer directory
cd tools/dict_importer

# Build dictionaries
python -m dict_importer.cli build --pdf data/dictionary.pdf --out lib/translator/dictionaries

# Build with support PDF
python -m dict_importer.cli build --pdf data/main.pdf --support data/support.pdf --out output/

# Build with exclude terms
python -m dict_importer.cli build --pdf data/dictionary.pdf --out output/ --exclude-list data/exclude.txt

# Test PDF parsing
python -m dict_importer.cli test --pdf data/dictionary.pdf --page 1
```

## Command Line Options

### `npm run dict:build` Options

| Option | Description | Default |
|--------|-------------|---------|
| `--pdf <path>` | Path to main PDF file | `data/Unified_Libran_Dictionary_Ancient_Modern_v1_2.pdf` |
| `--support <path>` | Path to support PDF file | `data/LibránLexiconReferenceGuide.pdf` |
| `--output <path>` | Output directory for dictionaries | `lib/translator/dictionaries` |
| `--exclude <path>` | Path to exclude terms file | `data/exclude_terms.txt` |
| `--help, -h` | Show help message | - |

### `python -m dict_importer.cli build` Options

| Option | Description | Required |
|--------|-------------|----------|
| `--pdf <path>` | Path to main PDF file | Yes |
| `--out <path>` | Output directory for dictionaries | Yes |
| `--support <path>` | Path to support PDF file | No |
| `--exclude-list <path>` | Path to exclude terms file | No |
| `--dump-csv <path>` | Path to dump all rows CSV | No |

## Output Files

The CLI generates the following files in the output directory:

- **`ancient.json`** - Ancient Librán dictionary (English → Ancient Librán)
- **`modern.json`** - Modern Librán dictionary (English → Modern Librán)
- **`ALL_ROWS.csv`** - All processed entries with metadata
- **`VARIANTS.csv`** - Variant entries (entries with multiple translations)
- **`EXCLUDED.txt`** - Excluded entries with reasons
- **`REPORT.md`** - Detailed build report with statistics

## Example Usage

### Basic Dictionary Build

```bash
# Using npm script
npm run dict:build

# Using Python CLI
cd tools/dict_importer
python -m dict_importer.cli build --pdf data/dictionary.pdf --out lib/translator/dictionaries
```

### Advanced Dictionary Build

```bash
# Build with support PDF and exclude terms
npm run dict:build -- \
  --pdf data/Unified_Libran_Dictionary_Ancient_Modern_v1_2.pdf \
  --support data/LibránLexiconReferenceGuide.pdf \
  --output build/dictionaries \
  --exclude data/exclude_terms.txt
```

### Testing PDF Parsing

```bash
# Test specific page
cd tools/dict_importer
python -m dict_importer.cli test --pdf data/dictionary.pdf --page 5

# Test first few pages
python -m dict_importer.cli test --pdf data/dictionary.pdf
```

## Configuration

### Default File Locations

The CLI looks for files in the following default locations:

- **Main PDF**: `data/Unified_Libran_Dictionary_Ancient_Modern_v1_2.pdf`
- **Support PDF**: `data/LibránLexiconReferenceGuide.pdf`
- **Exclude Terms**: `data/exclude_terms.txt`
- **Output Directory**: `lib/translator/dictionaries`

### Exclude Terms File Format

The exclude terms file should contain one term per line:

```
God
Allah
Jesus
Christ
Buddha
Muhammad
Krishna
Zeus
Odin
Thor
```

## Error Handling

The CLI provides comprehensive error handling:

- **File Not Found**: Clear error messages when PDF or exclude files are missing
- **Python Environment**: Automatic detection of Python installation
- **Module Import**: Validation that the dictionary importer is properly installed
- **PDF Parsing**: Graceful handling of PDF parsing errors with warnings
- **Output Validation**: Verification that output files are created successfully

## Troubleshooting

### Common Issues

1. **Python not found**
   ```
   Error: Python not found. Please install Python 3.8+ and ensure it's in your PATH.
   ```
   **Solution**: Install Python 3.8+ and ensure it's in your system PATH.

2. **Dictionary importer not found**
   ```
   Error: Dictionary importer not properly installed: ModuleNotFoundError
   ```
   **Solution**: Ensure you're running from the correct directory and the dict_importer package is properly installed.

3. **PDF file not found**
   ```
   Error: PDF file not found: data/dictionary.pdf
   ```
   **Solution**: Check the file path and ensure the PDF file exists.

4. **Permission denied**
   ```
   Error: Permission denied when creating output directory
   ```
   **Solution**: Ensure you have write permissions to the output directory.

### Debug Mode

For detailed debugging, you can run the Python CLI directly with verbose output:

```bash
cd tools/dict_importer
python -m dict_importer.cli build --pdf data/dictionary.pdf --out output/ --exclude-list data/exclude.txt
```

## Integration

The CLI is designed to integrate seamlessly with the main application:

1. **Output Location**: By default, dictionaries are saved to `lib/translator/dictionaries/`
2. **File Format**: Generated JSON files are compatible with the existing translator
3. **Error Handling**: Errors are logged and don't crash the application
4. **Validation**: Built-in validation ensures data quality

## Performance

The CLI is optimized for performance:

- **Parallel Processing**: Multiple pages are processed concurrently
- **Memory Efficient**: Large PDFs are processed page by page
- **Progress Reporting**: Real-time progress updates during processing
- **Error Recovery**: Continues processing even if individual pages fail

## Examples

### Complete Workflow

```bash
# 1. Prepare your PDF files
mkdir -p data
cp your-dictionary.pdf data/Unified_Libran_Dictionary_Ancient_Modern_v1_2.pdf

# 2. Create exclude terms file (optional)
echo "God" > data/exclude_terms.txt
echo "Allah" >> data/exclude_terms.txt

# 3. Build dictionaries
npm run dict:build

# 4. Verify output
ls lib/translator/dictionaries/
# Should show: ancient.json, modern.json, ALL_ROWS.csv, etc.

# 5. Test the application
npm run dev
```

### Custom Configuration

```bash
# Build with custom settings
npm run dict:build -- \
  --pdf data/my-custom-dictionary.pdf \
  --support data/my-support-guide.pdf \
  --output build/custom-dictionaries \
  --exclude data/my-exclude-terms.txt
```

This will create the dictionaries in `build/custom-dictionaries/` using your custom files.
