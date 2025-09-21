#!/usr/bin/env python3
"""Debug script for Librán dictionary parsing."""

from dict_importer.pdf_extract import extract_pages
from dict_importer.schema import Entry
import re

def parse_libran_dictionary_page(page_text: str, page_num: int):
    """Parse a page of Librán dictionary with custom logic."""
    lines = page_text.split('\n')
    entries = []
    
    print(f"Page {page_num} - {len(lines)} lines")
    
    # Look for the table structure
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Check if this is a header line
        if 'English' in line and 'Ancient' in line:
            print(f"Found header: {line}")
            
            # Look for data rows after the header
            i += 1
            while i < len(lines):
                data_line = lines[i].strip()
                if not data_line:
                    i += 1
                    continue
                
                # Check if this is another header (start of Modern section)
                if 'English' in data_line and 'Modern' in data_line:
                    print(f"Found Modern header: {data_line}")
                    i += 1
                    continue
                
                # Try to parse the data line
                if data_line and not data_line.startswith('English'):
                    print(f"Data line: {repr(data_line)}")
                    
                    # Split by common patterns
                    # Look for English word at the start
                    words = data_line.split()
                    if words:
                        english = words[0]
                        
                        # Look for Librán words (containing special characters)
                        libran_words = []
                        for word in words[1:]:
                            if any(char in word for char in ['á', 'é', 'í', 'ó', 'ú', 'ë', 'ñ', 'ç', 'ü']):
                                libran_words.append(word)
                        
                        if libran_words:
                            libran = ' '.join(libran_words)
                            entry = Entry(
                                english=english,
                                ancient=libran if 'Ancient' in line else None,
                                modern=libran if 'Modern' in line else None,
                                source_page=page_num
                            )
                            entries.append(entry)
                            print(f"  Parsed: {english} -> {libran}")
                
                i += 1
        else:
            i += 1
    
    return entries

def main():
    pdf_path = r'C:\Projects\Worldbuilding\english-to-libran-text-to-voice\data\Unified_Libran_Dictionary_Ancient_Modern_v1_2.pdf'
    
    print("Parsing Librán dictionary...")
    
    all_entries = []
    for page_num, page_text in extract_pages(pdf_path):
        if page_num > 10:  # Only process first 10 pages for debugging
            break
            
        entries = parse_libran_dictionary_page(page_text, page_num)
        all_entries.extend(entries)
        
        if entries:
            print(f"Page {page_num}: Found {len(entries)} entries")
        else:
            print(f"Page {page_num}: No entries found")
    
    print(f"\nTotal entries found: {len(all_entries)}")
    
    # Show sample entries
    for i, entry in enumerate(all_entries[:10]):
        print(f"{i+1}. {entry.english} -> {entry.ancient} | {entry.modern}")

if __name__ == '__main__':
    main()
