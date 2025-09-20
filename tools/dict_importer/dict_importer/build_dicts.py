"""Dictionary building with conflict resolution."""

import json
import csv
from typing import List, Dict, Set, Tuple
from collections import defaultdict, Counter
from pathlib import Path

from .schema import Entry, DictionaryBuild, ParsedPage
from .normalize import clean_headword, clean_translation


class DictionaryBuilder:
    """Builds dictionaries from parsed entries."""
    
    def __init__(self, exclude_terms: Set[str] = None):
        self.exclude_terms = exclude_terms or set()
        self.build = DictionaryBuild()
        self.conflicts = defaultdict(list)
        self.variants = defaultdict(list)
        
        # Statistics
        self.stats = {
            'total_entries': 0,
            'ancient_entries': 0,
            'modern_entries': 0,
            'excluded_entries': 0,
            'conflicts': 0,
            'variants': 0,
            'pages_processed': 0
        }
        
        # Internal tracking
        self.ancient_entries = {}
        self.modern_entries = {}
        self.excluded_entries = []
        self.variant_entries = []
    
    def should_exclude(self, entry: Entry) -> Tuple[bool, str]:
        """Check if entry should be excluded."""
        english_lower = entry.english.lower()
        
        # Check against exclude list
        if english_lower in self.exclude_terms:
            return True, "In exclude list"
        
        # Exclude divine/tribal/pantheon names
        divine_terms = ['god', 'goddess', 'deity', 'divine', 'sacred', 'holy']
        if any(term in english_lower for term in divine_terms):
            return True, "Divine/religious term"
        
        # Exclude Comoară terms (if identifiable)
        if 'comoară' in english_lower or 'treasure' in english_lower:
            return True, "Comoară term"
        
        # Exclude emptys
        if not entry.english or entry.english.strip() == "":
            return True, "empty"
        
        # Exclude very short entries
        if len(entry.english) < 2:
            return True, "Too short"
        
        # Exclude entries with no translations
        if not entry.is_complete():
            return True, "No translations"
        
        return False, ""
    
    def resolve_conflict(self, english_key: str, entries: List[Entry]) -> Entry:
        """Resolve conflicts when multiple entries have same English key."""
        if len(entries) == 1:
            return entries[0]
        
        # Check for primary/standard markers
        for entry in entries:
            if entry.notes and 'primary' in entry.notes.lower():
                return entry
            if entry.notes and 'standard' in entry.notes.lower():
                return entry
        
        # Choose by confidence score (higher is better)
        best_entry = max(entries, key=lambda e: e.confidence)
        
        # If confidence is tied, choose the first complete entry
        if best_entry.confidence == entries[0].confidence:
            for entry in entries:
                if entry.is_complete():
                    return entry
        
        return best_entry
    
    def process_entry(self, entry: Entry) -> None:
        """Process a single entry."""
        self.stats['total_entries'] += 1
        
        # Check if should be excluded
        should_exclude, reason = self.should_exclude(entry)
        if should_exclude:
            entry.notes = f"EXCLUDED: {reason}"
            self.excluded_entries.append(entry)
            self.stats['excluded_entries'] += 1
            return
        
        # Clean the English key
        english_key = clean_headword(entry.english).lower()
        
        # Check for conflicts
        if english_key in self.conflicts:
            self.conflicts[english_key].append(entry)
            self.stats['conflicts'] += 1
            # Add all entries for this key to variants
            self.variants[english_key] = self.conflicts[english_key].copy()
        else:
            self.conflicts[english_key] = [entry]
            # Only add to dictionaries if no conflicts
            if entry.has_ancient():
                self.ancient_entries[english_key] = entry.ancient
                self.stats['ancient_entries'] += 1
            
            if entry.has_modern():
                self.modern_entries[english_key] = entry.modern
                self.stats['modern_entries'] += 1
    
    def process_page(self, page: ParsedPage) -> None:
        """Process a parsed page."""
        self.stats['pages_processed'] += 1
        
        for entry in page.entries:
            self.process_entry(entry)
    
    def build_dictionaries(self) -> DictionaryBuild:
        """Build final dictionaries from processed entries."""
        # Reset counters to avoid double counting
        self.stats['ancient_entries'] = 0
        self.stats['modern_entries'] = 0
        self.ancient_entries.clear()
        self.modern_entries.clear()
        
        # Resolve conflicts
        for english_key, entries in self.conflicts.items():
            if len(entries) > 1:
                # Multiple entries for same key
                primary_entry = self.resolve_conflict(english_key, entries)
                
                # Add primary entry to dictionaries
                if primary_entry.has_ancient():
                    self.ancient_entries[english_key] = primary_entry.ancient
                    self.stats['ancient_entries'] += 1
                
                if primary_entry.has_modern():
                    self.modern_entries[english_key] = primary_entry.modern
                    self.stats['modern_entries'] += 1
                
                # Add other entries as variants
                for entry in entries:
                    if entry != primary_entry:
                        self.variant_entries.append(entry)
                        self.stats['variants'] += 1
            else:
                # Single entry
                entry = entries[0]
                
                if entry.has_ancient():
                    self.ancient_entries[english_key] = entry.ancient
                    self.stats['ancient_entries'] += 1
                
                if entry.has_modern():
                    self.modern_entries[english_key] = entry.modern
                    self.stats['modern_entries'] += 1
        
        # Update build object
        self.build.ancient_entries = self.ancient_entries
        self.build.modern_entries = self.modern_entries
        self.build.excluded_entries = self.excluded_entries
        self.build.variant_entries = self.variant_entries
        self.build.build_stats = self.stats.copy()
        
        # Add missing keys for compatibility
        self.build.build_stats['total_ancient'] = self.stats['ancient_entries']
        self.build.build_stats['total_modern'] = self.stats['modern_entries']
        
        return self.build
    
    # Additional methods for enhanced conflict resolution tests
    
    def get_conflicts(self) -> Dict[str, List[Entry]]:
        """Get all conflicts."""
        return dict(self.conflicts)
    
    def get_excluded_entries(self) -> List[Entry]:
        """Get all excluded entries."""
        return self.excluded_entries
    
    def get_variants(self) -> Dict[str, List[Entry]]:
        """Get all variants."""
        return dict(self.variants)
    
    def resolve_conflicts(self) -> None:
        """Resolve all conflicts."""
        for english_key, entries in self.conflicts.items():
            if len(entries) > 1:
                primary_entry = self.resolve_conflict(english_key, entries)
                # Update the conflicts dict with resolved entry
                self.conflicts[english_key] = [primary_entry]
    
    def create_variants(self) -> List[Entry]:
        """Create variant entries for unresolved conflicts."""
        variants = []
        for english_key, entries in self.conflicts.items():
            if len(entries) > 1:
                # Keep all entries as variants
                variants.extend(entries)
        return variants
    
    def merge_entries(self, entry1: Entry, entry2: Entry) -> Entry:
        """Merge two entries."""
        merged = Entry(
            english=entry1.english,
            ancient=entry1.ancient or entry2.ancient,
            modern=entry1.modern or entry2.modern,
            pos=entry1.pos or entry2.pos,
            notes=entry1.notes or entry2.notes,
            sacred=entry1.sacred or entry2.sacred,
            source_page=entry1.source_page or entry2.source_page,
            confidence=max(entry1.confidence, entry2.confidence)
        )
        return merged
    
    def filter_low_confidence(self, threshold: float) -> None:
        """Filter out entries with low confidence."""
        filtered_conflicts = {}
        for english_key, entries in self.conflicts.items():
            filtered_entries = [e for e in entries if e.confidence >= threshold]
            if filtered_entries:
                filtered_conflicts[english_key] = filtered_entries
        self.conflicts = defaultdict(list, filtered_conflicts)
    
    def filter_incomplete_entries(self) -> None:
        """Filter out incomplete entries."""
        filtered_conflicts = {}
        for english_key, entries in self.conflicts.items():
            filtered_entries = [e for e in entries if e.is_complete()]
            if filtered_entries:
                filtered_conflicts[english_key] = filtered_entries
        self.conflicts = defaultdict(list, filtered_conflicts)
    
    def filter_placeholder_entries(self) -> None:
        """Filter out placeholder entries."""
        placeholders = {'—', '-', '...', 'TBD', 'TODO', 'N/A'}
        filtered_conflicts = {}
        for english_key, entries in self.conflicts.items():
            filtered_entries = []
            for entry in entries:
                if (entry.ancient not in placeholders and 
                    entry.modern not in placeholders):
                    filtered_entries.append(entry)
            if filtered_entries:
                filtered_conflicts[english_key] = filtered_entries
        self.conflicts = defaultdict(list, filtered_conflicts)
    
    def save_dictionaries(self, output_dir: Path) -> None:
        """Save dictionaries to JSON files."""
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Save ancient dictionary
        ancient_path = output_dir / "ancient.json"
        with open(ancient_path, 'w', encoding='utf-8') as f:
            json.dump(self.build.ancient_entries, f, ensure_ascii=False, indent=2)
        
        # Save modern dictionary
        modern_path = output_dir / "modern.json"
        with open(modern_path, 'w', encoding='utf-8') as f:
            json.dump(self.build.modern_entries, f, ensure_ascii=False, indent=2)
    
    def save_reports(self, output_dir: Path) -> None:
        """Save build reports."""
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Save excluded entries
        excluded_path = output_dir / "EXCLUDED.txt"
        with open(excluded_path, 'w', encoding='utf-8') as f:
            f.write("EXCLUDED ENTRIES\n")
            f.write("================\n\n")
            for entry in self.build.excluded_entries:
                f.write(f"English: {entry.english}\n")
                f.write(f"Reason: {entry.notes}\n")
                f.write(f"Page: {entry.source_page}\n")
                f.write("-" * 40 + "\n")
        
        # Save variants
        variants_path = output_dir / "VARIANTS.csv"
        with open(variants_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['English', 'Ancient', 'Modern', 'POS', 'Notes', 'Page'])
            for entry in self.build.variant_entries:
                writer.writerow([
                    entry.english,
                    entry.ancient or '',
                    entry.modern or '',
                    entry.pos or '',
                    entry.notes or '',
                    entry.source_page or ''
                ])
        
        # Save all rows
        all_rows_path = output_dir / "ALL_ROWS.csv"
        with open(all_rows_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['English', 'Ancient', 'Modern', 'POS', 'Notes', 'Page', 'Status'])
            
            # Add all entries
            for entry in self.build.excluded_entries:
                writer.writerow([
                    entry.english,
                    entry.ancient or '',
                    entry.modern or '',
                    entry.pos or '',
                    entry.notes or '',
                    entry.source_page or '',
                    'EXCLUDED'
                ])
            
            for entry in self.build.variant_entries:
                writer.writerow([
                    entry.english,
                    entry.ancient or '',
                    entry.modern or '',
                    entry.pos or '',
                    entry.notes or '',
                    entry.source_page or '',
                    'VARIANT'
                ])
        
        # Save build report
        report_path = output_dir / "REPORT.md"
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write("# Dictionary Build Report\n\n")
            f.write(f"**Build Date:** {self.stats.get('build_date', 'Unknown')}\n\n")
            f.write("## Statistics\n\n")
            f.write(f"- **Total Entries Processed:** {self.stats['total_entries']}\n")
            f.write(f"- **Pages Processed:** {self.stats['pages_processed']}\n")
            f.write(f"- **Ancient Entries:** {self.stats['ancient_entries']}\n")
            f.write(f"- **Modern Entries:** {self.stats['modern_entries']}\n")
            f.write(f"- **Excluded Entries:** {self.stats['excluded_entries']}\n")
            f.write(f"- **Conflicts Resolved:** {self.stats['conflicts']}\n")
            f.write(f"- **Variants Found:** {self.stats['variants']}\n\n")
            
            f.write("## Dictionary Coverage\n\n")
            ancient_count = len(self.build.ancient_entries)
            modern_count = len(self.build.modern_entries)
            f.write(f"- **Ancient Dictionary:** {ancient_count} entries\n")
            f.write(f"- **Modern Dictionary:** {modern_count} entries\n")
            f.write(f"- **Total Unique English Words:** {len(set(list(self.build.ancient_entries.keys()) + list(self.build.modern_entries.keys())))}\n\n")
            
            f.write("## Files Generated\n\n")
            f.write("- `ancient.json` - Ancient Librán dictionary\n")
            f.write("- `modern.json` - Modern Librán dictionary\n")
            f.write("- `EXCLUDED.txt` - Excluded entries with reasons\n")
            f.write("- `VARIANTS.csv` - Variant entries\n")
            f.write("- `ALL_ROWS.csv` - All processed entries\n")
            f.write("- `REPORT.md` - This report\n")


def build_dictionaries(
    parsed_pages: List[ParsedPage],
    output_dir: str,
    exclude_terms: Set[str] = None
) -> DictionaryBuild:
    """Build dictionaries from parsed pages."""
    builder = DictionaryBuilder(exclude_terms)
    output_dir = Path(output_dir)
    
    # Process all pages
    for page in parsed_pages:
        builder.process_page(page)
    
    # Build dictionaries
    builder.build_dictionaries()
    
    # Save outputs
    builder.save_dictionaries(output_dir)
    builder.save_reports(output_dir)
    
    return builder.build
