"""Validation for dictionary entries and parsing results."""

from typing import List, Dict, Any, Optional, Tuple
from .schema import Entry, ParsedPage, DictionaryBuild
import re


class ValidationError(Exception):
    """Raised when validation fails."""
    pass


class EntryValidator:
    """Validates dictionary entries according to schema rules."""
    
    def __init__(self):
        self.excluded_terms = {
            # Divine and pantheon terms
            'god', 'goddess', 'deity', 'divine', 'holy', 'sacred',
            'jesus', 'christ', 'allah', 'yahweh', 'zeus', 'odin',
            'heaven', 'hell', 'paradise', 'nirvana', 'valhalla',
            'prayer', 'worship', 'temple', 'church', 'mosque',
            
            # Proper names and cultural references
            'john', 'mary', 'muhammad', 'buddha',
            'rome', 'mecca', 'jerusalem', 'tibet',
            'christmas', 'ramadan', 'hanukkah', 'diwali',
            'coca-cola', 'mcdonalds', 'nike',
            
            # Technical and modern concepts
            'computer', 'internet', 'smartphone', 'wifi',
            'dna', 'quantum', 'laser', 'nuclear',
            'antibiotic', 'vaccine', 'surgery', 'chemotherapy',
            'democracy', 'capitalism', 'socialism', 'feminism',
            
            # Mystical entities
            'comoară', 'spiritus', 'mysticus', 'arcanum'
        }
        
        self.valid_pos_tags = {
            'noun', 'verb', 'adjective', 'adverb', 'preposition',
            'conjunction', 'interjection', 'pronoun', 'article',
            'n', 'v', 'adj', 'adv', 'prep', 'conj', 'int', 'pron', 'art'
        }
    
    def validate_entry(self, entry: Entry) -> Tuple[bool, List[str]]:
        """Validate a single entry and return (is_valid, errors)."""
        errors = []
        
        # Check required fields
        if not entry.english or not entry.english.strip():
            errors.append("English headword is required")
        
        if not entry.is_complete():
            errors.append("Entry must have at least one translation (ancient or modern)")
        
        # Check English headword
        if entry.english:
            english_errors = self._validate_english_headword(entry.english)
            errors.extend(english_errors)
        
        # Check translations
        if entry.ancient:
            ancient_errors = self._validate_translation(entry.ancient, "ancient")
            errors.extend(ancient_errors)
        
        if entry.modern:
            modern_errors = self._validate_translation(entry.modern, "modern")
            errors.extend(modern_errors)
        
        # Check part of speech
        if entry.pos:
            pos_errors = self._validate_pos(entry.pos)
            errors.extend(pos_errors)
        
        # Check for excluded terms
        if entry.english:
            excluded_errors = self._check_excluded_terms(entry.english)
            errors.extend(excluded_errors)
        
        # Check confidence score
        if not (0.0 <= entry.confidence <= 1.0):
            errors.append("Confidence must be between 0.0 and 1.0")
        
        return len(errors) == 0, errors
    
    def _validate_english_headword(self, headword: str) -> List[str]:
        """Validate English headword format."""
        errors = []
        
        # Check for valid characters
        if not re.match(r'^[a-zA-Z\s\'-]+$', headword):
            errors.append("English headword contains invalid characters")
        
        # Check length
        if len(headword) < 2:
            errors.append("English headword too short")
        
        if len(headword) > 50:
            errors.append("English headword too long")
        
        # Check for proper capitalization
        if not headword[0].isupper():
            errors.append("English headword should start with capital letter")
        
        return errors
    
    def _validate_translation(self, translation: str, variant: str) -> List[str]:
        """Validate Librán translation."""
        errors = []
        
        # Check for valid characters (allow diacritics)
        if not re.match(r'^[a-zA-Z\u00C0-\u017F\s\'-]+$', translation):
            errors.append(f"{variant.capitalize()} translation contains invalid characters")
        
        # Check length
        if len(translation) < 1:
            errors.append(f"{variant.capitalize()} translation too short")
        
        if len(translation) > 100:
            errors.append(f"{variant.capitalize()} translation too long")
        
        # Check for empty translation
        if not translation.strip():
            errors.append(f"{variant.capitalize()} translation is empty")
        
        return errors
    
    def _validate_pos(self, pos: str) -> List[str]:
        """Validate part of speech tag."""
        errors = []
        
        pos_lower = pos.lower().strip()
        if pos_lower not in self.valid_pos_tags:
            errors.append(f"Invalid part of speech: {pos}")
        
        return errors
    
    def _check_excluded_terms(self, headword: str) -> List[str]:
        """Check if headword contains excluded terms."""
        errors = []
        
        headword_lower = headword.lower()
        words = headword_lower.split()
        
        for word in words:
            # Clean word of punctuation
            clean_word = re.sub(r'[^\w]', '', word)
            if clean_word in self.excluded_terms:
                errors.append(f"Headword contains excluded term: {clean_word}")
        
        return errors
    
    def validate_page(self, page: ParsedPage) -> Tuple[bool, List[str]]:
        """Validate a parsed page."""
        errors = []
        
        if not page.entries:
            errors.append("Page has no entries")
        
        # Validate each entry
        for i, entry in enumerate(page.entries):
            is_valid, entry_errors = self.validate_entry(entry)
            if not is_valid:
                for error in entry_errors:
                    errors.append(f"Entry {i+1}: {error}")
        
        return len(errors) == 0, errors
    
    def validate_build(self, build: DictionaryBuild) -> Tuple[bool, List[str]]:
        """Validate a complete dictionary build."""
        errors = []
        
        # Check for duplicate entries
        ancient_keys = set(build.ancient_entries.keys())
        modern_keys = set(build.modern_entries.keys())
        
        # Check for conflicts between ancient and modern
        conflicts = ancient_keys.intersection(modern_keys)
        for key in conflicts:
            if build.ancient_entries[key] != build.modern_entries[key]:
                errors.append(f"Conflict between ancient and modern for '{key}'")
        
        # Check for empty dictionaries
        if not build.ancient_entries and not build.modern_entries:
            errors.append("No entries in either dictionary")
        
        # Validate excluded entries
        for entry in build.excluded_entries:
            is_valid, entry_errors = self.validate_entry(entry)
            if not is_valid:
                for error in entry_errors:
                    errors.append(f"Excluded entry '{entry.english}': {error}")
        
        return len(errors) == 0, errors
    
    def get_validation_summary(self, pages: List[ParsedPage]) -> Dict[str, Any]:
        """Get validation summary for multiple pages."""
        total_entries = 0
        valid_entries = 0
        total_errors = 0
        error_types = {}
        
        for page in pages:
            for entry in page.entries:
                total_entries += 1
                is_valid, errors = self.validate_entry(entry)
                
                if is_valid:
                    valid_entries += 1
                else:
                    total_errors += len(errors)
                    for error in errors:
                        error_type = error.split(':')[0] if ':' in error else error
                        error_types[error_type] = error_types.get(error_type, 0) + 1
        
        return {
            'total_entries': total_entries,
            'valid_entries': valid_entries,
            'invalid_entries': total_entries - valid_entries,
            'total_errors': total_errors,
            'error_types': error_types,
            'validation_rate': valid_entries / total_entries if total_entries > 0 else 0
        }


def validate_entries(entries: List[Entry]) -> List[Tuple[Entry, List[str]]]:
    """Validate a list of entries and return validation results."""
    validator = EntryValidator()
    results = []
    
    for entry in entries:
        is_valid, errors = validator.validate_entry(entry)
        results.append((entry, errors))
    
    return results


def filter_valid_entries(entries: List[Entry]) -> Tuple[List[Entry], List[Entry]]:
    """Separate valid and invalid entries."""
    validator = EntryValidator()
    valid_entries = []
    invalid_entries = []
    
    for entry in entries:
        is_valid, _ = validator.validate_entry(entry)
        if is_valid:
            valid_entries.append(entry)
        else:
            invalid_entries.append(entry)
    
    return valid_entries, invalid_entries
