"""Tests for table parsing."""

import pytest
from dict_importer.parse_tables import TableParser
from dict_importer.schema import Entry


def test_detect_columns():
    """Test column detection."""
    parser = TableParser()
    
    # Test pipe separator
    header = "English | Ancient | Modern"
    boundaries = parser.detect_columns(header)
    assert len(boundaries) > 0
    
    # Test space separator
    header = "English    Ancient    Modern"
    boundaries = parser.detect_columns(header)
    assert len(boundaries) > 0


def test_split_into_columns():
    """Test column splitting."""
    parser = TableParser()
    
    line = "hello | world | test"
    boundaries = [7, 15]
    columns = parser.split_into_columns(line, boundaries)
    assert len(columns) == 3
    assert columns[0] == "hello |"
    assert columns[1] == "world |"
    assert columns[2] == "test"


def test_is_entry_line():
    """Test entry line detection."""
    parser = TableParser()
    
    assert parser.is_entry_line("Hello world") == True
    assert parser.is_entry_line("Page 1") == False
    assert parser.is_entry_line("") == False
    assert parser.is_entry_line("a") == False


def test_parse_entry_line():
    """Test entry line parsing."""
    parser = TableParser()
    
    # Mock column info
    column_info = {
        'boundaries': [10, 20],
        'columns': {
            'english': 0,
            'ancient': 1,
            'modern': 2
        }
    }
    
    line = "hello     world     test"
    entry = parser.parse_entry_line(line, column_info)
    
    assert entry is not None
    assert entry.english == "hello"
    assert entry.ancient == "world"
    assert entry.modern == "test"


def test_parse_unstructured_entry():
    """Test unstructured entry parsing."""
    parser = TableParser()
    
    lines = ["Hello: world, test (noun)"]
    entry = parser.parse_unstructured_entry(lines)
    
    assert entry is not None
    assert entry.english == "Hello"
    assert entry.ancient == "world"
    assert entry.modern == "test"
    assert entry.notes == "noun"
