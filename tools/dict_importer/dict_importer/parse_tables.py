"""Table and row parsing for dictionary entries."""

import re
from typing import List, Tuple, Optional, Dict, Any
from .schema import Entry, ParsedPage
from .normalize import normalize_text, clean_headword, clean_translation


class TableParser:
    """Parser for dictionary tables."""
    
    def __init__(self):
        self.column_patterns = [
            r'English\s*\|?\s*Ancient\s*\|?\s*Modern',
            r'English\s*\|?\s*Ancient',
            r'English\s*\|?\s*Modern',
            r'Headword\s*\|?\s*Translation',
            r'Word\s*\|?\s*Meaning',
        ]
        
        # Patterns for detecting column boundaries
        self.column_separators = [
            r'\s+\|\s+',  # Pipe separator
            r'\s{3,}',    # Multiple spaces
            r'\t+',       # Tabs
        ]
    
    def detect_columns(self, header_line: str) -> List[int]:
        """Detect column boundaries from header line."""
        boundaries = []
        
        # Try different separator patterns
        for pattern in self.column_separators:
            matches = list(re.finditer(pattern, header_line))
            if matches:
                boundaries = [m.start() for m in matches]
                break
        
        # Fallback: split by multiple spaces
        if not boundaries:
            words = header_line.split()
            if len(words) >= 2:
                # Estimate column positions
                pos = 0
                for i, word in enumerate(words[:-1]):
                    pos += len(word) + 1
                    if i < len(words) - 1:
                        boundaries.append(pos)
        
        return boundaries
    
    def split_into_columns(self, line: str, boundaries: List[int]) -> List[str]:
        """Split line into columns based on boundaries."""
        if not boundaries:
            return [line.strip()]
        
        columns = []
        start = 0
        
        for boundary in boundaries:
            # Include the boundary character in the previous column
            columns.append(line[start:boundary].strip())
            start = boundary
        
        # Add remaining text as last column
        columns.append(line[start:].strip())
        
        return columns
    
    def parse_header(self, lines: List[str]) -> Optional[Dict[str, int]]:
        """Parse table header to identify column positions."""
        for i, line in enumerate(lines[:5]):  # Check first 5 lines
            line_lower = line.lower().strip()
            
            # Check if this looks like a header
            for pattern in self.column_patterns:
                if re.search(pattern, line_lower):
                    boundaries = self.detect_columns(line)
                    columns = self.split_into_columns(line, boundaries)
                    
                    # Map column names to indices
                    column_map = {}
                    for j, col in enumerate(columns):
                        col_lower = col.lower().strip()
                        if 'english' in col_lower or 'headword' in col_lower or 'word' in col_lower:
                            column_map['english'] = j
                        elif 'ancient' in col_lower:
                            column_map['ancient'] = j
                        elif 'modern' in col_lower:
                            column_map['modern'] = j
                        elif 'pos' in col_lower or 'part' in col_lower:
                            column_map['pos'] = j
                        elif 'note' in col_lower or 'comment' in col_lower:
                            column_map['notes'] = j
                    
                    return {
                        'boundaries': boundaries,
                        'columns': column_map,
                        'header_line': i
                    }
        
        return None
    
    def is_entry_line(self, line: str) -> bool:
        """Check if line looks like a dictionary entry."""
        line = line.strip()
        
        # Skip empty lines
        if not line:
            return False
        
        # Skip lines that are clearly not entries
        if (line.startswith('Page ') or 
            line.startswith('Chapter ') or
            line.startswith('Section ') or
            len(line) < 3):
            return False
        
        # Look for word that starts with capital letter
        words = line.split()
        for word in words:
            if word and word[0].isupper() and len(word) > 1:
                return True
        
        return False
    
    def parse_entry_line(self, line: str, column_info: Dict[str, Any]) -> Optional[Entry]:
        """Parse a single entry line."""
        boundaries = column_info['boundaries']
        columns = column_info['columns']
        
        # Split line into columns
        column_values = self.split_into_columns(line, boundaries)
        
        # Extract values
        english = None
        ancient = None
        modern = None
        pos = None
        notes = None
        
        if 'english' in columns:
            english_idx = columns['english']
            if english_idx < len(column_values):
                english = clean_headword(column_values[english_idx])
        
        if 'ancient' in columns:
            ancient_idx = columns['ancient']
            if ancient_idx < len(column_values):
                ancient = clean_translation(column_values[ancient_idx])
        
        if 'modern' in columns:
            modern_idx = columns['modern']
            if modern_idx < len(column_values):
                modern = clean_translation(column_values[modern_idx])
        
        if 'pos' in columns:
            pos_idx = columns['pos']
            if pos_idx < len(column_values):
                pos = column_values[pos_idx].strip()
        
        if 'notes' in columns:
            notes_idx = columns['notes']
            if notes_idx < len(column_values):
                notes = column_values[notes_idx].strip()
        
        # Must have English and at least one translation
        if not english or (not ancient and not modern):
            return None
        
        return Entry(
            english=english,
            ancient=ancient,
            modern=modern,
            pos=pos,
            notes=notes
        )
    
    def parse_page(self, page_text: str, page_number: int) -> ParsedPage:
        """Parse a page of text into entries."""
        lines = page_text.split('\n')
        parsed_page = ParsedPage(page_number=page_number, raw_text=page_text)
        
        # Normalize text first
        normalized_text = normalize_text(page_text)
        normalized_lines = normalized_text.split('\n')
        
        # Try to find table structure
        column_info = self.parse_header(normalized_lines)
        
        if column_info:
            # Parse as structured table
            start_line = column_info['header_line'] + 1
            
            for i, line in enumerate(normalized_lines[start_line:], start_line):
                if self.is_entry_line(line):
                    entry = self.parse_entry_line(line, column_info)
                    if entry:
                        entry.source_page = page_number
                        parsed_page.add_entry(entry)
        else:
            # Fallback: parse as unstructured text
            self.parse_unstructured_text(normalized_lines, parsed_page)
        
        return parsed_page
    
    def parse_unstructured_text(self, lines: List[str], parsed_page: ParsedPage) -> None:
        """Parse unstructured text looking for entry patterns."""
        i = 0
        
        while i < len(lines):
            line = lines[i].strip()
            
            if self.is_entry_line(line):
                # Try to extract entry from this line and following lines
                entry_lines = [line]
                j = i + 1
                
                # Collect continuation lines
                while (j < len(lines) and 
                       lines[j].strip() and 
                       not self.is_entry_line(lines[j])):
                    entry_lines.append(lines[j].strip())
                    j += 1
                
                # Parse the collected lines
                entry = self.parse_unstructured_entry(entry_lines)
                if entry:
                    entry.source_page = parsed_page.page_number
                    parsed_page.add_entry(entry)
                
                i = j
            else:
                i += 1
    
    def parse_unstructured_entry(self, lines: List[str]) -> Optional[Entry]:
        """Parse entry from unstructured lines."""
        if not lines:
            return None
        
        # Join all lines
        full_text = ' '.join(lines)
        
        # Look for patterns like "English: Ancient, Modern" or "English - Ancient"
        patterns = [
            r'^([A-Z][a-zA-Z\s\'-]+?)\s*[:—\-]\s*([^,]+?)(?:,\s*([^,]+?))?(?:\s*\(([^)]+)\))?$',
            r'^([A-Z][a-zA-Z\s\'-]+?)\s+([^,]+?)(?:,\s*([^,]+?))?(?:\s*\(([^)]+)\))?$',
        ]
        
        for pattern in patterns:
            match = re.match(pattern, full_text)
            if match:
                english = clean_headword(match.group(1))
                ancient = clean_translation(match.group(2)) if match.group(2) else None
                modern = clean_translation(match.group(3)) if match.group(3) else None
                notes = match.group(4) if match.group(4) else None
                
                if english and (ancient or modern):
                    return Entry(
                        english=english,
                        ancient=ancient,
                        modern=modern,
                        notes=notes
                    )
        
        return None


def parse_pdf_pages(pdf_path: str) -> List[ParsedPage]:
    """Parse all pages in PDF."""
    from .pdf_extract import extract_pages
    
    parser = TableParser()
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
