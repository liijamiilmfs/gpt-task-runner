"""Tests for entry validation."""

import pytest
from dict_importer.validation import EntryValidator, ValidationError, validate_entries, filter_valid_entries
from dict_importer.schema import Entry


def test_validate_valid_entry():
    """Test validation of a valid entry."""
    validator = EntryValidator()
    
    entry = Entry(
        english="Hello",
        ancient="salaam",
        modern="marhaba",
        pos="interjection",
        notes="Greeting"
    )
    
    is_valid, errors = validator.validate_entry(entry)
    assert is_valid
    assert len(errors) == 0


def test_validate_entry_missing_english():
    """Test validation of entry missing English headword."""
    validator = EntryValidator()
    
    entry = Entry(
        english="",
        ancient="salaam",
        modern="marhaba"
    )
    
    is_valid, errors = validator.validate_entry(entry)
    assert not is_valid
    assert "English headword is required" in errors


def test_validate_entry_no_translations():
    """Test validation of entry with no translations."""
    validator = EntryValidator()
    
    entry = Entry(
        english="Hello",
        ancient=None,
        modern=None
    )
    
    is_valid, errors = validator.validate_entry(entry)
    assert not is_valid
    assert "Entry must have at least one translation (ancient or modern)" in errors


def test_validate_entry_invalid_english():
    """Test validation of entry with invalid English headword."""
    validator = EntryValidator()
    
    entry = Entry(
        english="123hello",
        ancient="salaam"
    )
    
    is_valid, errors = validator.validate_entry(entry)
    assert not is_valid
    assert any("invalid characters" in error for error in errors)


def test_validate_entry_excluded_term():
    """Test validation of entry with excluded term."""
    validator = EntryValidator()
    
    entry = Entry(
        english="God",
        ancient="allah"
    )
    
    is_valid, errors = validator.validate_entry(entry)
    assert not is_valid
    assert any("excluded term" in error for error in errors)


def test_validate_entry_invalid_pos():
    """Test validation of entry with invalid part of speech."""
    validator = EntryValidator()
    
    entry = Entry(
        english="Hello",
        ancient="salaam",
        pos="invalid_pos"
    )
    
    is_valid, errors = validator.validate_entry(entry)
    assert not is_valid
    assert any("Invalid part of speech" in error for error in errors)


def test_validate_entry_invalid_confidence():
    """Test validation of entry with invalid confidence score."""
    validator = EntryValidator()
    
    entry = Entry(
        english="Hello",
        ancient="salaam",
        confidence=1.5
    )
    
    is_valid, errors = validator.validate_entry(entry)
    assert not is_valid
    assert any("Confidence must be between 0.0 and 1.0" in error for error in errors)


def test_validate_page():
    """Test validation of a parsed page."""
    validator = EntryValidator()
    
    from dict_importer.schema import ParsedPage
    
    page = ParsedPage(
        page_number=1,
        entries=[
            Entry(english="Hello", ancient="salaam"),
            Entry(english="World", modern="dunya")
        ]
    )
    
    is_valid, errors = validator.validate_page(page)
    assert is_valid
    assert len(errors) == 0


def test_validate_page_with_errors():
    """Test validation of page with invalid entries."""
    validator = EntryValidator()
    
    from dict_importer.schema import ParsedPage
    
    page = ParsedPage(
        page_number=1,
        entries=[
            Entry(english="Hello", ancient="salaam"),
            Entry(english="", ancient="salaam")  # Invalid: missing English
        ]
    )
    
    is_valid, errors = validator.validate_page(page)
    assert not is_valid
    assert len(errors) > 0


def test_validate_build():
    """Test validation of dictionary build."""
    validator = EntryValidator()
    
    from dict_importer.schema import DictionaryBuild
    
    build = DictionaryBuild()
    build.add_ancient("hello", "salaam")
    build.add_modern("world", "dunya")
    
    is_valid, errors = validator.validate_build(build)
    assert is_valid
    assert len(errors) == 0


def test_validate_build_conflict():
    """Test validation of build with conflicts."""
    validator = EntryValidator()
    
    from dict_importer.schema import DictionaryBuild
    
    build = DictionaryBuild()
    build.add_ancient("hello", "salaam")
    build.add_modern("hello", "marhaba")  # Different translation
    
    is_valid, errors = validator.validate_build(build)
    assert not is_valid
    assert any("Conflict between ancient and modern" in error for error in errors)


def test_get_validation_summary():
    """Test validation summary generation."""
    validator = EntryValidator()
    
    from dict_importer.schema import ParsedPage
    
    pages = [
        ParsedPage(
            page_number=1,
            entries=[
                Entry(english="Hello", ancient="salaam"),
                Entry(english="World", modern="dunya"),
                Entry(english="", ancient="salaam")  # Invalid
            ]
        )
    ]
    
    summary = validator.get_validation_summary(pages)
    
    assert summary['total_entries'] == 3
    assert summary['valid_entries'] == 2
    assert summary['invalid_entries'] == 1
    assert summary['total_errors'] > 0
    assert summary['validation_rate'] == 2/3


def test_validate_entries_function():
    """Test validate_entries function."""
    entries = [
        Entry(english="Hello", ancient="salaam"),
        Entry(english="", ancient="salaam")  # Invalid
    ]
    
    results = validate_entries(entries)
    
    assert len(results) == 2
    assert len(results[0][1]) == 0  # Valid entry
    assert len(results[1][1]) > 0   # Invalid entry


def test_filter_valid_entries():
    """Test filter_valid_entries function."""
    entries = [
        Entry(english="Hello", ancient="salaam"),
        Entry(english="", ancient="salaam")  # Invalid
    ]
    
    valid, invalid = filter_valid_entries(entries)
    
    assert len(valid) == 1
    assert len(invalid) == 1
    assert valid[0].english == "Hello"
    assert invalid[0].english == ""
