"""PDF extraction with layout heuristics."""

import re
import pdfplumber
from typing import List, Tuple, Optional, Iterator
from dataclasses import dataclass


@dataclass
class PageBounds:
    """Page boundary information for content extraction."""
    top_margin: float
    bottom_margin: float
    left_margin: float
    right_margin: float
    content_height: float
    content_width: float


def calculate_page_bounds(page) -> PageBounds:
    """Calculate content boundaries excluding headers/footers."""
    page_height = page.height
    page_width = page.width
    
    # Exclude top 8-10% and bottom 8-10%
    top_margin = page_height * 0.08
    bottom_margin = page_height * 0.92
    
    # Use small side margins
    left_margin = page_width * 0.05
    right_margin = page_width * 0.95
    
    return PageBounds(
        top_margin=top_margin,
        bottom_margin=bottom_margin,
        left_margin=left_margin,
        right_margin=right_margin,
        content_height=bottom_margin - top_margin,
        content_width=right_margin - left_margin
    )


def extract_text_from_page(page, bounds: PageBounds) -> str:
    """Extract text from page within content bounds."""
    # Extract text objects within bounds
    text_objects = []
    
    for obj in page.chars:
        if (bounds.left_margin <= obj['x0'] <= bounds.right_margin and
            bounds.top_margin <= obj['top'] <= bounds.bottom_margin):
            text_objects.append(obj)
    
    # Sort by top position, then left position
    text_objects.sort(key=lambda x: (x['top'], x['x0']))
    
    # Build text with proper spacing
    lines = []
    current_line = []
    current_y = None
    
    for char in text_objects:
        char_y = char['top']
        
        # New line if y position changed significantly
        if current_y is None or abs(char_y - current_y) > 2:
            if current_line:
                lines.append(''.join(current_line))
                current_line = []
            current_y = char_y
        
        current_line.append(char['text'])
    
    # Add last line
    if current_line:
        lines.append(''.join(current_line))
    
    return '\n'.join(lines)


def extract_tables_from_page(page, bounds: PageBounds) -> List[List[str]]:
    """Extract table data from page."""
    tables = []
    
    # Find table objects within bounds
    for table in page.find_tables():
        # Check if table is within content bounds
        if (bounds.left_margin <= table.bbox[0] <= bounds.right_margin and
            bounds.top_margin <= table.bbox[1] <= bounds.bottom_margin):
            
            # Extract table data
            table_data = table.extract()
            if table_data:
                tables.extend(table_data)
    
    return tables


def is_header_footer(text: str) -> bool:
    """Check if text is likely a header or footer."""
    text_lower = text.lower().strip()
    
    # Common header/footer patterns
    header_patterns = [
        r'^page \d+',
        r'^\d+$',
        r'^chapter \d+',
        r'^section \d+',
        r'^dictionary',
        r'^librán',
        r'^ancient',
        r'^modern',
    ]
    
    for pattern in header_patterns:
        if re.match(pattern, text_lower):
            return True
    
    # Very short lines are likely headers/footers
    if len(text.strip()) < 10:
        return True
    
    return False


def clean_extracted_text(text: str) -> str:
    """Clean extracted text."""
    lines = text.split('\n')
    cleaned_lines = []
    
    for line in lines:
        line = line.strip()
        
        # Skip empty lines
        if not line:
            continue
        
        # Skip header/footer lines
        if is_header_footer(line):
            continue
        
        cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines)


def extract_pages(pdf_path: str) -> Iterator[Tuple[int, str]]:
    """Extract text from all pages in PDF."""
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            try:
                # Calculate page bounds
                bounds = calculate_page_bounds(page)
                
                # Extract text
                text = extract_text_from_page(page, bounds)
                
                # Clean text
                cleaned_text = clean_extracted_text(text)
                
                if cleaned_text.strip():
                    yield page_num, cleaned_text
                    
            except Exception as e:
                print(f"Warning: Error processing page {page_num}: {e}")
                continue


def extract_page_with_metadata(pdf_path: str, page_num: int) -> Tuple[str, dict]:
    """Extract single page with metadata."""
    with pdfplumber.open(pdf_path) as pdf:
        if page_num > len(pdf.pages):
            raise ValueError(f"Page {page_num} not found in PDF")
        
        page = pdf.pages[page_num - 1]
        bounds = calculate_page_bounds(page)
        
        # Extract text
        text = extract_text_from_page(page, bounds)
        cleaned_text = clean_extracted_text(text)
        
        # Extract metadata
        metadata = {
            'page_number': page_num,
            'page_width': page.width,
            'page_height': page.height,
            'content_bounds': {
                'top': bounds.top_margin,
                'bottom': bounds.bottom_margin,
                'left': bounds.left_margin,
                'right': bounds.right_margin
            },
            'char_count': len(cleaned_text),
            'line_count': len(cleaned_text.split('\n'))
        }
        
        return cleaned_text, metadata


def extract_tables_from_pdf(pdf_path: str) -> List[Tuple[int, List[List[str]]]]:
    """Extract all tables from PDF."""
    tables = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            try:
                bounds = calculate_page_bounds(page)
                page_tables = extract_tables_from_page(page, bounds)
                
                if page_tables:
                    tables.append((page_num, page_tables))
                    
            except Exception as e:
                print(f"Warning: Error extracting tables from page {page_num}: {e}")
                continue
    
    return tables
