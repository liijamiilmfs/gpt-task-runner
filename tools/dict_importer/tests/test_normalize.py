"""Tests for text normalization."""

import pytest
from dict_importer.normalize import (
    normalize_ligatures,
    normalize_whitespace,
    restore_hyphenated_words,
    clean_headword,
    clean_translation,
    is_hyphenated_word
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
