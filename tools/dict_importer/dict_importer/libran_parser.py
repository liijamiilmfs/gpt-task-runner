"""Custom parser for Librán dictionary PDF format."""

import re
from typing import List, Optional
from .schema import Entry, ParsedPage


class LibránParser:
    """Parser specifically designed for the Librán dictionary PDF format."""
    
    def __init__(self):
        # Pattern to identify Librán words (containing special characters)
        self.libran_pattern = re.compile(r'[áéíóúëñçüÁÉÍÓÚËÑÇÜ]')
        
        # Pattern to identify English words (start of line, before source)
        self.english_pattern = re.compile(r'^([A-Za-z][A-Za-z\s\-\(\)]+?)(?:Lat\.|Rom\.|IS\.|Hun\.)')
    
    def parse_page(self, page_text: str, page_num: int) -> ParsedPage:
        """Parse a page of Librán dictionary."""
        lines = page_text.split('\n')
        entries = []
        
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            # Look for table headers
            if 'English' in line and 'Ancient' in line:
                # Found Ancient table header
                i += 1
                while i < len(lines):
                    data_line = lines[i].strip()
                    if not data_line:
                        i += 1
                        continue
                    
                    # Check if this is the Modern table header
                    if 'English' in data_line and 'Modern' in data_line:
                        break
                    
                    # Parse Ancient entry
                    entry = self._parse_entry_line(data_line, page_num, variant='ancient')
                    if entry:
                        entries.append(entry)
                    
                    i += 1
                
                # Now parse Modern entries
                while i < len(lines):
                    data_line = lines[i].strip()
                    if not data_line:
                        i += 1
                        continue
                    
                    # Check if this is another table header
                    if 'English' in data_line and ('Ancient' in data_line or 'Modern' in data_line):
                        break
                    
                    # Parse Modern entry
                    entry = self._parse_entry_line(data_line, page_num, variant='modern')
                    if entry:
                        entries.append(entry)
                    
                    i += 1
            else:
                i += 1
        
        return ParsedPage(page_number=page_num, entries=entries, raw_text=page_text)
    
    def _parse_entry_line(self, line: str, page_num: int, variant: str) -> Optional[Entry]:
        """Parse a single entry line."""
        if not line or len(line) < 3:
            return None
        
        # Extract English word
        english_match = self.english_pattern.match(line)
        if not english_match:
            return None
        
        english = english_match.group(1).strip()
        
        # Clean up English word (remove extra spaces, parentheses content)
        english = re.sub(r'\s+', ' ', english)
        english = re.sub(r'\s*\([^)]*\)', '', english)  # Remove parenthetical content
        
        # Find Librán words in the line
        libran_words = self._extract_libran_words(line)
        if not libran_words:
            return None
        
        # Get the primary Librán word (usually the first one)
        libran = libran_words[0]
        
        # Clean up Librán word
        libran = self._clean_libran_word(libran)
        
        if not libran:
            return None
        
        # Create entry
        if variant == 'ancient':
            return Entry(
                english=english,
                ancient=libran,
                modern=None,
                source_page=page_num,
                confidence=0.9
            )
        else:  # modern
            return Entry(
                english=english,
                ancient=None,
                modern=libran,
                source_page=page_num,
                confidence=0.9
            )
    
    def _extract_libran_words(self, line: str) -> List[str]:
        """Extract Librán words from a line."""
        # Look for patterns like "Stílibror", "Coamáror", "tómr", etc.
        # These are usually standalone words or the first part of compound words
        
        # Split by common separators
        parts = re.split(r'[;,\s]+', line)
        libran_words = []
        
        for part in parts:
            part = part.strip()
            if not part:
                continue
                
            # Check if part contains Librán characters
            if self.libran_pattern.search(part):
                # Clean up the word
                cleaned = re.sub(r'[^\wáéíóúëñçüÁÉÍÓÚËÑÇÜ\-]', '', part)
                if cleaned and len(cleaned) > 1:
                    # Additional filtering - look for words that look like Librán
                    if self._is_likely_libran_word(cleaned):
                        libran_words.append(cleaned)
        
        return libran_words
    
    def _is_likely_libran_word(self, word: str) -> bool:
        """Check if a word is likely to be a Librán word."""
        if len(word) < 2:
            return False
        
        # Must contain Librán special characters
        if not self.libran_pattern.search(word):
            return False
        
        # Should not be mostly English/Latin words
        english_indicators = ['Core', 'Sacred', 'Fate', 'Fire', 'flame', 'Concealment', 
                             'Foundation', 'Wrath', 'Heart', 'force', 'Prophecy', 
                             'Jealousy', 'Trust', 'belief', 'Dread', 'Blessing', 
                             'Celebration', 'Affection', 'bond', 'Compassion', 'Grief']
        
        word_lower = word.lower()
        for indicator in english_indicators:
            if indicator.lower() in word_lower:
                return False
        
        return True
    
    def _clean_libran_word(self, word: str) -> str:
        """Clean up a Librán word."""
        # Remove common Latin/Romance source words that might be mixed in
        word = re.sub(r'^(statera|fatum|flamma|memoria|petra|ira|cor|vis|bucurie|milă|sorg|manes|sagittarius|bardus|frater|infans|antecessor|ætt|gens|aldri|hostis|nornir|pater|heros|rokon)', '', word, flags=re.IGNORECASE)
        
        # Remove common English words that might be mixed in
        word = re.sub(r'^(Core|Sacred|Fate|Fire|flame|Concealment|Foundation|Wrath|Heart|force|Prophecy|Jealousy|Trust|belief|Dread|Blessing|Celebration|Affection|bond|Compassion|Grief|Prophetic|sight|Lineal|spirit|Revered|dead|Forebears|Bow|warrior|Singer|history|Kinship|Innocent|Bloodline|Collective|Old|age|wisdom|Opponent|Foe|Family|group|Weavers|destiny|kin|term|Tribal|patriarch|Champion|Brave|person|Our)', '', word, flags=re.IGNORECASE)
        
        # Remove punctuation and extra characters, but keep Librán special characters
        word = re.sub(r'[^\wáéíóúëñçüÁÉÍÓÚËÑÇÜ]', '', word)
        
        # Remove very short words
        if len(word) < 2:
            return ""
        
        return word


def parse_libran_pdf_pages(pdf_path: str) -> List[ParsedPage]:
    """Parse all pages in Librán PDF."""
    from .pdf_extract import extract_pages
    
    parser = LibránParser()
    parsed_pages = []
    
    for page_num, page_text in extract_pages(pdf_path):
        try:
            parsed_page = parser.parse_page(page_text, page_num)
            if parsed_page.entries:
                parsed_pages.append(parsed_page)
        except Exception as e:
            print(f"Warning: Error parsing page {page_num}: {e}")
            continue
    
    return parsed_pages
