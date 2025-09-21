# Librán Dictionary Importer

A Python package for parsing PDF dictionaries and building JSON dictionaries for the Librán Voice Forge app.

## Features

- **PDF Extraction**: Uses pdfplumber with layout heuristics to extract text from PDFs
- **Text Normalization**: Handles diacritics, hyphenation, ligatures, and whitespace
- **Table Parsing**: Intelligent parsing of dictionary tables with column detection
- **Conflict Resolution**: Resolves conflicts when multiple translations exist
- **Exclusion Handling**: Filters out divine/religious terms and other excluded words
- **Comprehensive Reporting**: Generates detailed reports and statistics

## Installation

```bash
cd tools/dict_importer
pip install -e .
```

## Usage

### Basic Usage

```bash
python -m dict_importer.cli build \
    --pdf /path/to/Unified_Libran_Dictionary_Ancient_Modern_v1_2.pdf \
    --out ./lib/translator/dictionaries
```

### Advanced Usage

```bash
python -m dict_importer.cli build \
    --pdf /path/to/main.pdf \
    --support /path/to/support.pdf \
    --out ./lib/translator/dictionaries \
    --exclude-list data/exclude_terms.txt \
    --dump-csv build/ALL_ROWS.csv
```

When `--dump-csv` is provided, the CLI copies the generated `ALL_ROWS.csv`
report into the requested location after the build finishes. This makes it easy
to archive or inspect the complete row export without digging into the build
output directory.

### Testing PDF Parsing

```bash
python -m dict_importer.cli test --pdf /path/to/file.pdf --page 1
```

## Output Files

The tool generates the following files:

- `ancient.json` - Ancient Librán dictionary
- `modern.json` - Modern Librán dictionary
- `EXCLUDED.txt` - Excluded entries with reasons
- `VARIANTS.csv` - Variant entries
- `ALL_ROWS.csv` - All processed entries
- `REPORT.md` - Build report with statistics

## Configuration

### Exclude Terms

Create a text file with terms to exclude (one per line):

```
god
goddess
deity
divine
sacred
holy
```

### Column Detection

The parser automatically detects table columns using these patterns:

- `English | Ancient | Modern`
- `English | Ancient`
- `English | Modern`
- `Headword | Translation`
- `Word | Meaning`

## Text Normalization

The tool handles:

- **Diacritics**: Preserves UTF-8 diacritics exactly (á, é, í, ó, ö, ü, ű, ő, ă, ë)
- **Hyphenation**: Restores words split across lines
- **Ligatures**: Converts typographic ligatures (ﬁ → fi, ﬂ → fl)
- **Whitespace**: Normalizes multiple spaces and newlines

## Conflict Resolution

When multiple translations exist for the same English word:

1. Choose entry marked as "primary" or "standard"
2. Choose most frequent translation
3. Fallback to first complete entry
4. Other entries become variants

## Development

### Running Tests

```bash
pytest tests/
```

### Code Formatting

```bash
black dict_importer/
isort dict_importer/
```

## Project Structure

```
tools/dict_importer/
├── pyproject.toml
├── README.md
├── dict_importer/
│   ├── __init__.py
│   ├── pdf_extract.py        # PDF extraction
│   ├── normalize.py          # Text normalization
│   ├── parse_tables.py       # Table parsing
│   ├── schema.py             # Pydantic models
│   ├── build_dicts.py        # Dictionary building
│   └── cli.py                # CLI interface
└── tests/
    ├── test_normalize.py
    ├── test_parse_tables.py
    └── fixtures/
        └── sample_page.txt
```

## Dependencies

- pdfplumber: PDF text extraction
- pydantic: Data validation
- click: CLI interface
- regex: Advanced regex support
- unidecode: Unicode normalization (edge cases only)

## License

Part of the Librán Voice Forge project.
