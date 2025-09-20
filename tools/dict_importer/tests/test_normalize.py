"""Tests for text normalization."""

import pytest
from dict_importer.normalize import (
    normalize_ligatures,
    normalize_whitespace,
    restore_hyphenated_words,
    clean_headword,
    clean_translation,
    is_hyphenated_word,
    normalize_text
)


def test_normalize_ligatures():
    """Test ligature normalization."""
    assert normalize_ligatures("ﬁre") == "fire"
    assert normalize_ligatures("ﬂow") == "flow"
    assert normalize_ligatures("ﬃne") == "ffine"
    assert normalize_ligatures("ﬄow") == "fflow"


def test_normalize_whitespace():
    """Test whitespace normalization."""
    assert normalize_whitespace("  hello   world  ") == "hello world"
    assert normalize_whitespace("hello\n\n\nworld") == "hello\nworld"
    assert normalize_whitespace("  \n  \n  ") == ""


def test_is_hyphenated_word():
    """Test hyphenated word detection."""
    assert is_hyphenated_word("self-aware") == True
    assert is_hyphenated_word("non-existent") == True
    assert is_hyphenated_word("pre-war") == True
    assert is_hyphenated_word("hello-world") == False
    assert is_hyphenated_word("New-York") == True


def test_restore_hyphenated_words():
    """Test hyphen restoration."""
    lines = [
        "self-aware",
        "hello-",
        "world",
        "test",
        "word"
    ]
    result = restore_hyphenated_words(lines)
    assert result == ["self-aware", "helloworld", "test", "word"]


def test_clean_headword():
    """Test headword cleaning."""
    assert clean_headword("  Hello!  ") == "Hello"
    assert clean_headword("don't") == "don't"
    assert clean_headword("...world...") == "world"
    assert clean_headword("ﬁre") == "fire"


def test_clean_translation():
    """Test translation cleaning."""
    assert clean_translation("  hello world  ") == "hello world"
    assert clean_translation("hello world...") == "hello world"
    assert clean_translation("ﬁre") == "fire"


def test_restore_hyphenated_words_comprehensive():
    """Test comprehensive hyphen restoration scenarios."""
    # Soft hyphens (should be joined) - test each pair separately
    lines = ["hello-", "world"]
    result = restore_hyphenated_words(lines)
    assert result == ["helloworld"]
    
    lines = ["trans-", "lation"]
    result = restore_hyphenated_words(lines)
    assert result == ["translation"]
    
    lines = ["under-", "standing"]
    result = restore_hyphenated_words(lines)
    assert result == ["understanding"]
    
    # Lexical hyphens (should be preserved)
    lines = [
        "self-aware",
        "non-existent",
        "pre-war",
        "co-operation"
    ]
    result = restore_hyphenated_words(lines)
    assert result == ["self-aware", "non-existent", "pre-war", "co-operation"]


def test_restore_hyphenated_words_mixed():
    """Test mixed soft and lexical hyphens."""
    # Test each pair separately since the function processes consecutive pairs
    lines = ["self-", "aware"]  # Should remain separate (lexical hyphen)
    result = restore_hyphenated_words(lines)
    assert result == ["self-", "aware"]
    
    lines = ["hello-", "world"]  # Should become helloworld (soft hyphen)
    result = restore_hyphenated_words(lines)
    assert result == ["helloworld"]
    
    lines = ["non-", "existent"]  # Should remain separate (lexical hyphen)
    result = restore_hyphenated_words(lines)
    assert result == ["non-", "existent"]


def test_restore_hyphenated_words_edge_cases():
    """Test edge cases for hyphen restoration."""
    # Empty lines (should be filtered out)
    lines = ["", "hello-", "", "world", ""]
    result = restore_hyphenated_words(lines)
    assert result == ["helloworld"]
    
    # Single word with hyphen at end
    lines = ["word-"]
    result = restore_hyphenated_words(lines)
    assert result == ["word-"]
    
    # Hyphen at start of line (gets filtered out)
    lines = ["-", "word"]
    result = restore_hyphenated_words(lines)
    assert result == ["word"]


def test_restore_hyphenated_words_real_examples():
    """Test with real dictionary examples."""
    # Test each pair separately
    lines = ["trans-", "lation"]
    result = restore_hyphenated_words(lines)
    assert result == ["translation"]
    
    lines = ["under-", "standing"]
    result = restore_hyphenated_words(lines)
    assert result == ["understanding"]
    
    lines = ["re-", "construction"]
    result = restore_hyphenated_words(lines)
    assert result == ["reconstruction"]


def test_is_hyphenated_word_comprehensive():
    """Test comprehensive hyphenated word detection."""
    # Known prefixes
    assert is_hyphenated_word("self-aware") == True
    assert is_hyphenated_word("non-existent") == True
    assert is_hyphenated_word("pre-war") == True
    assert is_hyphenated_word("co-operation") == True
    assert is_hyphenated_word("multi-purpose") == True
    assert is_hyphenated_word("sub-standard") == True
    
    # Compound words with capitalization
    assert is_hyphenated_word("New-York") == True
    assert is_hyphenated_word("Los-Angeles") == True
    
    # Regular words (not hyphenated)
    assert is_hyphenated_word("hello-world") == False
    assert is_hyphenated_word("good-bye") == False
    assert is_hyphenated_word("well-being") == False
    
    # Single words
    assert is_hyphenated_word("hello") == False
    assert is_hyphenated_word("world") == False


def test_normalize_text_pipeline():
    """Test complete text normalization pipeline."""
    text = """hello-
world

self-aware
non-
existent

trans-
lation"""
    
    result = normalize_text(text)
    
    # Should join soft hyphens and preserve lexical hyphens
    assert "helloworld" in result
    assert "self-aware" in result
    assert "non- existent" in result  # non- is lexical hyphen, so remains separate
    assert "translation" in result


def test_merge_continuation_lines():
    """Test merging of continuation lines."""
    from dict_importer.normalize import merge_continuation_lines
    
    lines = [
        "Hello world",
        "this is a continuation",
        "of the previous line",
        "New entry starts here",
        "with its own continuation"
    ]
    
    result = merge_continuation_lines(lines)
    
    # Should merge continuation lines but keep separate entries
    assert len(result) == 2
    assert "Hello world this is a continuation of the previous line" in result[0]
    assert "New entry starts here with its own continuation" in result[1]


def test_is_continuation_line():
    """Test continuation line detection."""
    from dict_importer.normalize import is_continuation_line
    
    # Continuation lines
    assert is_continuation_line("this is a continuation", "Hello world") == True
    assert is_continuation_line("of the previous line", "Hello world") == True
    
    # New entry lines
    assert is_continuation_line("New entry starts here", "Hello world") == False
    assert is_continuation_line("Another entry", "Hello world") == False
    
    # Empty lines
    assert is_continuation_line("", "Hello world") == False
    assert is_continuation_line("this is a continuation", "") == False
