"""Text normalization for dictionary entries."""

import re
import unicodedata
from typing import List, Tuple, Optional
from unidecode import unidecode


# Known hyphenated words that should be preserved
KNOWN_HYPHENATED = {
    "self-", "non-", "pre-", "post-", "anti-", "pro-", "co-", "ex-",
    "multi-", "sub-", "super-", "ultra-", "inter-", "intra-",
    "semi-", "pseudo-", "quasi-", "neo-", "proto-", "meta-", "para-",
    "counter-", "over-", "out-", "up-", "down-", "off-",
    "on-", "in-", "out-", "up-", "down-", "off-", "on-", "in-"
}

# Typographic ligatures to convert
LIGATURES = {
    "ﬁ": "fi",
    "ﬂ": "fl",
    "ﬀ": "ff",
    "ﬃ": "ffi",
    "ﬄ": "ffl",
    "ﬆ": "st",
    "ﬅ": "ft",
    "ﬄ": "ffl",
    "ﬄ": "ffl",
}


def normalize_ligatures(text: str) -> str:
    """Convert typographic ligatures to regular characters."""
    result = text
    for ligature, replacement in LIGATURES.items():
        result = result.replace(ligature, replacement)
    return result


def normalize_whitespace(text: str) -> str:
    """Normalize whitespace while preserving structure."""
    # Replace multiple spaces with single space
    text = re.sub(r' +', ' ', text)
    # Replace multiple newlines with single newline
    text = re.sub(r'\n+', '\n', text)
    # Strip leading/trailing whitespace
    text = text.strip()
    return text


def is_hyphenated_word(word: str) -> bool:
    """Check if word should remain hyphenated."""
    word_lower = word.lower()
    
    # Check against known hyphenated prefixes
    for prefix in KNOWN_HYPHENATED:
        if word_lower.startswith(prefix):
            return True
    
    # Check for compound words with capitalization pattern
    if '-' in word and len(word.split('-')) == 2:
        parts = word.split('-')
        if len(parts[0]) > 1 and len(parts[1]) > 1:
            # Check if it looks like a compound word
            if parts[0][0].isupper() and parts[1][0].isupper():
                return True
    
    return False


def restore_hyphenated_words(lines: List[str]) -> List[str]:
    """Restore hyphenated words that were split across lines."""
    # Filter out empty lines first
    non_empty_lines = [line.strip() for line in lines if line.strip()]
    
    result = []
    i = 0
    
    while i < len(non_empty_lines):
        line = non_empty_lines[i]
        
        # Check if line ends with hyphen and next line starts with lowercase
        if (line.endswith('-') and 
            i + 1 < len(non_empty_lines) and 
            non_empty_lines[i + 1][0].islower()):
            
            # Get the word without hyphen
            word_part = line[:-1].strip()
            next_line = non_empty_lines[i + 1]
            
            # Get first word of next line
            next_words = next_line.split()
            if next_words:
                first_word = next_words[0]
                potential_word = word_part + first_word
                
                # Check if this should be joined (not a known hyphenated word)
                if not is_hyphenated_word(word_part + '-' + first_word):
                    # Join the lines
                    joined = word_part + next_line
                    result.append(joined)
                    i += 2  # Skip next line
                else:
                    # Keep as hyphenated
                    result.append(line)
                    i += 1
            else:
                result.append(line)
                i += 1
        else:
            result.append(line)
            i += 1
    
    return result


def normalize_diacritics(text: str) -> str:
    """Preserve UTF-8 diacritics exactly."""
    # Don't use unidecode for diacritics - preserve them
    # Only normalize to NFD form for consistent handling
    return unicodedata.normalize('NFC', text)


def clean_headword(word: str) -> str:
    """Clean and normalize a headword."""
    # Remove leading/trailing punctuation except apostrophes
    word = re.sub(r'^[^\w\']+', '', word)
    word = re.sub(r'[^\w\']+$', '', word)
    
    # Normalize whitespace
    word = normalize_whitespace(word)
    
    # Preserve diacritics
    word = normalize_diacritics(word)
    
    # Convert ligatures
    word = normalize_ligatures(word)
    
    return word


def clean_translation(text: str) -> str:
    """Clean and normalize a translation."""
    # Normalize whitespace
    text = normalize_whitespace(text)
    
    # Preserve diacritics
    text = normalize_diacritics(text)
    
    # Convert ligatures
    text = normalize_ligatures(text)
    
    # Remove extra punctuation at end
    text = re.sub(r'[.,;:!?]+$', '', text)
    
    return text


def extract_english_headword(text: str) -> Optional[str]:
    """Extract English headword from text."""
    # Look for word that starts with capital letter
    words = text.split()
    for word in words:
        if word and word[0].isupper():
            return clean_headword(word)
    return None


def is_continuation_line(line: str, prev_line: str) -> bool:
    """Check if line is a continuation of previous line."""
    line = line.strip()
    prev_line = prev_line.strip()
    
    if not line or not prev_line:
        return False
    
    # If line doesn't start with capital letter, likely continuation
    if not line[0].isupper():
        return True
    
    # If line is very short and prev line doesn't end with punctuation
    if len(line) < 10 and not prev_line.endswith(('.', '!', '?', ':')):
        return True
    
    return False


def merge_continuation_lines(lines: List[str]) -> List[str]:
    """Merge continuation lines."""
    result = []
    i = 0
    
    while i < len(lines):
        line = lines[i].strip()
        
        # Collect continuation lines
        continuation_lines = [line]
        j = i + 1
        
        while (j < len(lines) and 
               lines[j].strip() and 
               is_continuation_line(lines[j], line)):
            continuation_lines.append(lines[j].strip())
            j += 1
        
        # Merge continuation lines
        if len(continuation_lines) > 1:
            merged = ' '.join(continuation_lines)
            result.append(merged)
        else:
            result.append(line)
        
        i = j
    
    return result


def normalize_text(text: str) -> str:
    """Complete text normalization pipeline."""
    # Split into lines
    lines = text.split('\n')
    
    # Remove empty lines
    lines = [line for line in lines if line.strip()]
    
    # Restore hyphenated words
    lines = restore_hyphenated_words(lines)
    
    # Merge continuation lines
    lines = merge_continuation_lines(lines)
    
    # Normalize whitespace
    lines = [normalize_whitespace(line) for line in lines]
    
    return '\n'.join(lines)
