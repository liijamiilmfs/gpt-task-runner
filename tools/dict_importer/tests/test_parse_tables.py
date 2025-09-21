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
    assert columns[0] == "hello"
    assert columns[1] == "world"
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


def test_detect_table_type():
    """Test table type detection."""
    parser = TableParser()
    
    # Dual table
    columns = ["English", "Ancient", "Modern"]
    table_type = parser.detect_table_type(columns)
    assert table_type == "dual"
    
    # Single table (ancient only)
    columns = ["English", "Ancient"]
    table_type = parser.detect_table_type(columns)
    assert table_type == "single"
    
    # Single table (modern only)
    columns = ["English", "Modern"]
    table_type = parser.detect_table_type(columns)
    assert table_type == "single"
    
    # Unknown table
    columns = ["Word", "Meaning"]
    table_type = parser.detect_table_type(columns)
    assert table_type == "unknown"


def test_is_table_header():
    """Test table header detection."""
    parser = TableParser()
    
    assert parser.is_table_header("English | Ancient | Modern") == True
    assert parser.is_table_header("English    Ancient    Modern") == True
    assert parser.is_table_header("Hello world") == False
    assert parser.is_table_header("") == False


def test_parse_dual_table_layout():
    """Test dual table layout parsing."""
    parser = TableParser()
    
    lines = [
        "English | Ancient | Modern",
        "hello   | salaam  | marhaba",
        "world   | dunya   | alam"
    ]
    
    entries = parser.parse_dual_table_layout(lines)
    
    assert len(entries) == 2
    assert entries[0].english == "hello"
    assert entries[0].ancient == "salaam"
    assert entries[0].modern == "marhaba"
    assert entries[1].english == "world"
    assert entries[1].ancient == "dunya"
    assert entries[1].modern == "alam"


def test_parse_single_table_layout():
    """Test single table layout parsing."""
    parser = TableParser()
    
    lines = [
        "English | Ancient",
        "hello   | salaam",
        "world   | dunya"
    ]
    
    entries = parser.parse_single_table_layout(lines)
    
    assert len(entries) == 2
    assert entries[0].english == "hello"
    assert entries[0].ancient == "salaam"
    assert entries[0].modern is None
    assert entries[1].english == "world"
    assert entries[1].ancient == "dunya"
    assert entries[1].modern is None


def test_detect_dual_table_clusters():
    """Test detection of multiple table clusters."""
    parser = TableParser()
    
    lines = [
        "English | Ancient | Modern",
        "hello   | salaam  | marhaba",
        "",
        "English | Ancient",
        "world   | dunya"
    ]
    
    clusters = parser.detect_dual_table_clusters(lines)
    
    assert len(clusters) == 2
    assert len(clusters[0]['entries']) == 1
    assert len(clusters[1]['entries']) == 1
    assert clusters[0]['entries'][0].english == "hello"
    assert clusters[1]['entries'][0].english == "world"


def test_parse_page_with_dual_tables():
    """Test parsing page with dual table layout."""
    parser = TableParser()
    
    page_text = """English | Ancient | Modern
hello   | salaam  | marhaba
world   | dunya   | alam"""
    
    parsed_page = parser.parse_page(page_text, 1)
    
    assert len(parsed_page.entries) == 2
    assert parsed_page.entries[0].english == "hello"
    assert parsed_page.entries[0].ancient == "salaam"
    assert parsed_page.entries[0].modern == "marhaba"
    assert parsed_page.entries[0].source_page == 1


def test_parse_page_with_single_table():
    """Test parsing page with single table layout."""
    parser = TableParser()
    
    page_text = """English | Ancient
hello   | salaam
world   | dunya"""
    
    parsed_page = parser.parse_page(page_text, 1)
    
    assert len(parsed_page.entries) == 2
    assert parsed_page.entries[0].english == "hello"
    assert parsed_page.entries[0].ancient == "salaam"
    assert parsed_page.entries[0].modern is None
    assert parsed_page.entries[0].source_page == 1
