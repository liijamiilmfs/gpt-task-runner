"""Table and row parsing for dictionary entries."""

import re
from typing import List, Tuple, Optional, Dict, Any
from .schema import Entry, ParsedPage
from .normalize import normalize_text, clean_headword, clean_translation


class TableParser:
    """Parser for dictionary tables."""
    
    def __init__(self):
        self.column_patterns = [
            r'english\s*\|?\s*ancient\s*\|?\s*modern',
            r'english\s*\|?\s*ancient',
            r'english\s*\|?\s*modern',
            r'headword\s*\|?\s*translation',
            r'word\s*\|?\s*meaning',
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
        
        # For pipe-separated data, split by pipes instead of using boundaries
        if '|' in line:
            columns = [col.strip() for col in line.split('|')]
            return columns
        
        # Fallback to boundary-based splitting
        columns = []
        start = 0
        
        for boundary in boundaries:
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
                        'header_line': i,
                        'table_type': self.detect_table_type(columns)
                    }
        
        return None
    
    def detect_table_type(self, columns: List[str]) -> str:
        """Detect whether this is a dual-table or single-table layout."""
        column_text = ' '.join(columns).lower()
        
        if 'ancient' in column_text and 'modern' in column_text:
            return 'dual'
        elif 'ancient' in column_text or 'modern' in column_text:
            return 'single'
        else:
            return 'unknown'
    
    def detect_dual_table_clusters(self, lines: List[str]) -> List[Dict[str, Any]]:
        """Detect multiple table clusters on the same page."""
        clusters = []
        current_cluster = None
        i = 0
        
        while i < len(lines):
            line = lines[i].strip()
            
            # Look for table headers
            if self.is_table_header(line):
                # Save previous cluster if exists
                if current_cluster:
                    clusters.append(current_cluster)
                
                # Start new cluster
                header_info = self.parse_header([line])
                if header_info:
                    current_cluster = {
                        'header_info': header_info,
                        'start_line': i,
                        'end_line': i,
                        'entries': []
                    }
            elif current_cluster and self.is_entry_line(line):
                # Add entry to current cluster
                entry = self.parse_entry_line(line, current_cluster['header_info'])
                if entry:
                    current_cluster['entries'].append(entry)
                current_cluster['end_line'] = i
            
            i += 1
        
        # Add final cluster
        if current_cluster:
            clusters.append(current_cluster)
        
        return clusters
    
    def is_table_header(self, line: str) -> bool:
        """Check if line is a table header."""
        line_lower = line.lower().strip()
        
        # Check for header patterns (exact matches)
        for pattern in self.column_patterns:
            if re.search(pattern, line_lower):
                return True
        
        # Check for common header indicators - must be at start of line or after pipe
        header_indicators = ['english', 'ancient', 'modern', 'headword']
        for indicator in header_indicators:
            if (line_lower.startswith(indicator) or 
                f'| {indicator}' in line_lower or 
                f' {indicator} |' in line_lower):
                return True
        
        # Check for "word" but only if it's the first word
        if line_lower.startswith('word '):
            return True
        
        return False
    
    def parse_dual_table_layout(self, lines: List[str]) -> List[Entry]:
        """Parse dual-table layout with Ancient and Modern columns."""
        entries = []
        
        # Find the main table header
        header_info = self.parse_header(lines)
        if not header_info or header_info['table_type'] != 'dual':
            return entries
        
        start_line = header_info['header_line'] + 1
        
        for i, line in enumerate(lines[start_line:], start_line):
            if self.is_entry_line(line):
                entry = self.parse_entry_line(line, header_info)
                if entry and entry.has_ancient() and entry.has_modern():
                    entries.append(entry)
        
        return entries
    
    def parse_single_table_layout(self, lines: List[str]) -> List[Entry]:
        """Parse single-table layout with only Ancient or Modern column."""
        entries = []
        
        # Find the main table header
        header_info = self.parse_header(lines)
        if not header_info or header_info['table_type'] != 'single':
            return entries
        
        start_line = header_info['header_line'] + 1
        
        for i, line in enumerate(lines[start_line:], start_line):
            if self.is_entry_line(line):
                entry = self.parse_entry_line(line, header_info)
                if entry and entry.is_complete():
                    entries.append(entry)
        
        return entries
    
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
        
        # Skip header lines (contain column names) - be more specific
        line_lower = line.lower()
        if any(keyword in line_lower for keyword in ['english', 'ancient', 'modern', 'headword']):
            return False
        
        # Look for word that starts with capital letter or is a valid entry
        words = line.split()
        for word in words:
            if word and len(word) > 1:
                # Check if it's a valid word (not just punctuation)
                if word[0].isalpha():
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
    
    def normalize_table_text(self, page_text: str) -> List[str]:
        """Normalize table text while preserving line structure."""
        lines = page_text.split('\n')
        
        # Apply hyphen restoration but preserve line structure
        from .normalize import restore_hyphenated_words
        normalized_lines = restore_hyphenated_words(lines)
        
        # Handle table-specific hyphenation where words span across table rows
        # Look for patterns like "word- | data" followed by "tion | data"
        i = 0
        while i < len(normalized_lines) - 1:
            current_line = normalized_lines[i].strip()
            next_line = normalized_lines[i + 1].strip()
            
            # Check if current line ends with hyphen in first column and next line starts with continuation
            if (current_line and next_line and 
                '|' in current_line and '|' in next_line):
                
                current_parts = current_line.split('|')
                next_parts = next_line.split('|')
                
                if (len(current_parts) >= 2 and len(next_parts) >= 2 and
                    current_parts[0].strip().endswith('-') and
                    next_parts[0].strip() and
                    not next_parts[0].strip()[0].isupper()):
                    
                    # Join the first columns
                    joined_first = current_parts[0].strip()[:-1] + next_parts[0].strip()
                    
                    # Create new line with joined first column
                    new_line = joined_first + ' |' + '|'.join(current_parts[1:])
                    normalized_lines[i] = new_line
                    
                    # Remove the next line
                    normalized_lines.pop(i + 1)
                    continue
            
            i += 1
        
        return normalized_lines

    def parse_page(self, page_text: str, page_number: int) -> ParsedPage:
        """Parse a page of text into entries."""
        lines = page_text.split('\n')
        parsed_page = ParsedPage(page_number=page_number, raw_text=page_text)
        
        # Apply selective normalization to handle hyphenated words while preserving table structure
        normalized_lines = self.normalize_table_text(page_text)
        
        # Try to detect table clusters first
        clusters = self.detect_dual_table_clusters(normalized_lines)
        
        if clusters:
            # Parse each cluster
            for cluster in clusters:
                for entry in cluster['entries']:
                    entry.source_page = page_number
                    parsed_page.add_entry(entry)
        else:
            # Try to find single table structure
            column_info = self.parse_header(normalized_lines)
            
            if column_info:
                if column_info['table_type'] == 'dual':
                    # Parse as dual-table layout
                    entries = self.parse_dual_table_layout(normalized_lines)
                    for entry in entries:
                        entry.source_page = page_number
                        parsed_page.add_entry(entry)
                elif column_info['table_type'] == 'single':
                    # Parse as single-table layout
                    entries = self.parse_single_table_layout(normalized_lines)
                    for entry in entries:
                        entry.source_page = page_number
                        parsed_page.add_entry(entry)
                else:
                    # Fallback: parse as structured table
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
