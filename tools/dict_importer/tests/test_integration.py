"""Integration tests for complete PDF parsing pipeline."""

import pytest
from dict_importer.parse_tables import TableParser, parse_pdf_pages
from dict_importer.validation import EntryValidator, validate_entries, filter_valid_entries
from dict_importer.schema import Entry, ParsedPage, DictionaryBuild
from dict_importer.normalize import normalize_text


def test_complete_parsing_pipeline():
    """Test complete parsing pipeline from raw text to validated entries."""
    # Sample page text with mixed content
    page_text = """English | Ancient | Modern
    Hello   | salaam  | marhaba
    World   | dunya   | alam

    English | Ancient
    Peace   | aman
    Water   | maa"""

    parser = TableParser()
    parsed_page = parser.parse_page(page_text, 1)

    # Should have parsed entries from both table clusters
    assert len(parsed_page.entries) == 4

    # Validate entries
    validator = EntryValidator()
    valid_entries, invalid_entries = filter_valid_entries(parsed_page.entries)
    
    assert len(valid_entries) == 4
    assert len(invalid_entries) == 0
    
    # Check specific entries
    entry_dict = {entry.english: entry for entry in valid_entries}
    
    assert "Hello" in entry_dict
    assert entry_dict["Hello"].ancient == "salaam"
    assert entry_dict["Hello"].modern == "marhaba"
    
    assert "World" in entry_dict
    assert entry_dict["World"].ancient == "dunya"
    assert entry_dict["World"].modern == "alam"
    
    assert "Peace" in entry_dict
    assert entry_dict["Peace"].ancient == "aman"
    assert entry_dict["Peace"].modern is None
    
    assert "Water" in entry_dict
    assert entry_dict["Water"].ancient == "maa"
    assert entry_dict["Water"].modern is None


def test_parsing_with_hyphen_restoration():
    """Test parsing with hyphen restoration."""
    page_text = """English | Ancient | Modern
trans-  | tarjama | tarjama
lation  |        |
under-  | fahm    | fahm
standing|        |"""

    parser = TableParser()
    parsed_page = parser.parse_page(page_text, 1)
    
    # Should have restored hyphens
    assert len(parsed_page.entries) == 2
    
    entry_dict = {entry.english: entry for entry in parsed_page.entries}
    
    assert "translation" in entry_dict
    assert entry_dict["translation"].ancient == "tarjama"
    assert entry_dict["translation"].modern == "tarjama"
    
    assert "understanding" in entry_dict
    assert entry_dict["understanding"].ancient == "fahm"
    assert entry_dict["understanding"].modern == "fahm"


def test_parsing_with_validation_errors():
    """Test parsing with validation errors."""
    page_text = """English | Ancient | Modern
    hello   | salaam  | marhaba
            | dunya   | alam
    God     | allah   | allah"""

    parser = TableParser()
    parsed_page = parser.parse_page(page_text, 1)

    # Should have parsed entries (empty English word line is skipped)
    assert len(parsed_page.entries) == 2
    
    # Validate entries
    valid_entries, invalid_entries = filter_valid_entries(parsed_page.entries)
    
    # Should have 0 valid entries (hello needs capitalization, God is excluded)
    assert len(valid_entries) == 0
    assert len(invalid_entries) == 2
    
    # Check invalid entries
    invalid_english = [entry.english for entry in invalid_entries]
    assert "hello" in invalid_english  # Needs capitalization
    assert "God" in invalid_english  # Excluded term


def test_dictionary_build_integration():
    """Test integration with dictionary building."""
    page_text = """English | Ancient | Modern
hello   | salaam  | marhaba
world   | dunya   | alam
peace   | aman    | aman"""

    parser = TableParser()
    parsed_page = parser.parse_page(page_text, 1)
    
    # Build dictionaries
    build = DictionaryBuild()
    
    for entry in parsed_page.entries:
        if entry.ancient:
            build.add_ancient(entry.english, entry.ancient)
        if entry.modern:
            build.add_modern(entry.english, entry.modern)
    
    # Check built dictionaries
    assert "hello" in build.ancient_entries
    assert build.ancient_entries["hello"] == "salaam"
    assert "hello" in build.modern_entries
    assert build.modern_entries["hello"] == "marhaba"
    
    assert "world" in build.ancient_entries
    assert build.ancient_entries["world"] == "dunya"
    assert "world" in build.modern_entries
    assert build.modern_entries["world"] == "alam"
    
    assert "peace" in build.ancient_entries
    assert build.ancient_entries["peace"] == "aman"
    assert "peace" in build.modern_entries
    assert build.modern_entries["peace"] == "aman"


def test_validation_summary():
    """Test validation summary generation."""
    page_text = """English | Ancient | Modern
hello   | salaam  | marhaba
world   | dunya   | alam
        | aman    | aman
God     | allah   | allah"""

    parser = TableParser()
    parsed_page = parser.parse_page(page_text, 1)
    
    validator = EntryValidator()
    summary = validator.get_validation_summary([parsed_page])
    
    assert summary['total_entries'] == 3  # Empty English word line is skipped
    assert summary['valid_entries'] == 0  # All entries have validation issues
    assert summary['invalid_entries'] == 3
    assert summary['total_errors'] > 0
    assert summary['validation_rate'] == 0.0


def test_multiple_pages_parsing():
    """Test parsing multiple pages."""
    pages_text = [
        """English | Ancient | Modern
hello   | salaam  | marhaba
world   | dunya   | alam""",
        
        """English | Ancient
peace   | aman
water   | maa"""
    ]
    
    parser = TableParser()
    parsed_pages = []
    
    for i, page_text in enumerate(pages_text, 1):
        parsed_page = parser.parse_page(page_text, i)
        parsed_pages.append(parsed_page)
    
    # Should have parsed both pages
    assert len(parsed_pages) == 2
    assert len(parsed_pages[0].entries) == 2
    assert len(parsed_pages[1].entries) == 2
    
    # Check page numbers
    assert parsed_pages[0].page_number == 1
    assert parsed_pages[1].page_number == 2
    
    # Check entries have correct source pages
    for entry in parsed_pages[0].entries:
        assert entry.source_page == 1
    
    for entry in parsed_pages[1].entries:
        assert entry.source_page == 2


def test_error_handling():
    """Test error handling in parsing pipeline."""
    # Test with malformed text
    page_text = """Invalid text
with no structure
at all"""
    
    parser = TableParser()
    parsed_page = parser.parse_page(page_text, 1)
    
    # Should handle gracefully
    assert isinstance(parsed_page, ParsedPage)
    assert parsed_page.page_number == 1
    # May or may not have entries depending on unstructured parsing


def test_performance_with_large_text():
    """Test performance with larger text."""
    # Generate large text with realistic dictionary entries
    lines = ["English | Ancient | Modern"]
    for i in range(100):
        lines.append(f"word{i:03d} | salaam{i:03d} | marhaba{i:03d}")       

    page_text = "\n".join(lines)

    parser = TableParser()
    parsed_page = parser.parse_page(page_text, 1)

    # Should parse all entries
    assert len(parsed_page.entries) == 100

    # Note: Validation will fail for test data with numbers, but parsing should work
    # In real usage, dictionary entries would be properly formatted
