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
        
        # If confidence is tied, choose by source page (higher is better)
        if best_entry.confidence == entries[0].confidence:
            # Check if all entries have the same confidence
            same_confidence = all(e.confidence == best_entry.confidence for e in entries)
            if same_confidence:
                # Choose by source page priority (higher page number wins)
                best_entry = max(entries, key=lambda e: e.source_page or 0)
                
                # If source page is also tied, choose by table order (higher table order wins)
                if all(e.source_page == best_entry.source_page for e in entries):
                    best_entry = max(entries, key=lambda e: e.table_order or 0)
            else:
                # Choose the first complete entry
                for entry in entries:
                    if entry.is_complete():
                        return entry
        
        return best_entry
    
    def _are_complementary(self, entry1: Entry, entry2: Entry) -> bool:
        """Check if two entries are complementary (one has ancient, other has modern)."""
        # They must have the same English word
        if entry1.english.lower() != entry2.english.lower():
            return False
        
        # One should have ancient and not modern, the other should have modern and not ancient
        entry1_has_ancient = entry1.has_ancient() and not entry1.has_modern()
        entry1_has_modern = entry1.has_modern() and not entry1.has_ancient()
        entry2_has_ancient = entry2.has_ancient() and not entry2.has_modern()
        entry2_has_modern = entry2.has_modern() and not entry2.has_ancient()
        
        return (entry1_has_ancient and entry2_has_modern) or (entry1_has_modern and entry2_has_ancient)
    
    def _merge_entries(self, entry1: Entry, entry2: Entry) -> Entry:
        """Merge two complementary entries into one."""
        # Create a new entry with both ancient and modern
        merged = Entry(
            english=entry1.english,  # Use the first entry's English
            ancient=entry1.ancient or entry2.ancient,
            modern=entry1.modern or entry2.modern,
            pos=entry1.pos or entry2.pos,
            notes=entry1.notes or entry2.notes,
            sacred=entry1.sacred or entry2.sacred,
            source_page=entry1.source_page or entry2.source_page,
            confidence=max(entry1.confidence, entry2.confidence)
        )
        return merged
    
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
            # Check if this is a duplicate of existing entries
            existing_entries = self.conflicts[english_key]
            is_duplicate = any(
                e.ancient == entry.ancient and e.modern == entry.modern and e.pos == entry.pos
                for e in existing_entries
            )
            
            if is_duplicate:
                # Skip duplicate entries
                return
            
            # Check if this is a complementary entry (one has ancient, other has modern)
            existing_entry = existing_entries[0]  # We only have one entry so far
            if self._are_complementary(existing_entry, entry):
                # Merge complementary entries
                merged_entry = self._merge_entries(existing_entry, entry)
                self.conflicts[english_key] = [merged_entry]
                
                # Update dictionaries
                if merged_entry.has_ancient():
                    self.ancient_entries[english_key] = merged_entry.ancient
                    self.stats['ancient_entries'] += 1
                
                if merged_entry.has_modern():
                    self.modern_entries[english_key] = merged_entry.modern
                    self.stats['modern_entries'] += 1
            else:
                # This is a conflict - multiple different entries for same English key
                self.conflicts[english_key].append(entry)
                self.stats['conflicts'] += 1
                # Add all entries for this key to variants
                self.variants[english_key] = self.conflicts[english_key].copy()
                # Remove from dictionaries since we have conflicts
                self.ancient_entries.pop(english_key, None)
                self.modern_entries.pop(english_key, None)
        else:
            # First entry for this key - add to dictionaries
            self.conflicts[english_key] = [entry]
            
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
        self.build.build_stats['conflicts_resolved'] = self.stats['conflicts']
        self.build.build_stats['entries_excluded'] = self.stats['excluded_entries']
        
        return self.build
    
    # Additional methods for enhanced conflict resolution tests
    
    def get_conflicts(self) -> Dict[str, List[Entry]]:
        """Get all conflicts (entries with multiple entries for same key)."""
        return {k: v for k, v in self.conflicts.items() if len(v) > 1}
    
    def get_excluded_entries(self) -> List[Entry]:
        """Get all excluded entries."""
        return self.excluded_entries
    
    def get_variants(self) -> Dict[str, List[Entry]]:
        """Get all variants."""
        return dict(self.variants)
    
    def resolve_conflicts(self) -> List[Entry]:
        """Resolve all conflicts and return resolved entries."""
        resolved_entries = []
        for english_key, entries in self.conflicts.items():
            if len(entries) > 1:
                primary_entry = self.resolve_conflict(english_key, entries)
                resolved_entries.append(primary_entry)
                # Update the conflicts dict with resolved entry
                self.conflicts[english_key] = [primary_entry]
        return resolved_entries
    
    def create_variants(self) -> List[Entry]:
        """Create variant entries for unresolved conflicts."""
        variants = []
        for english_key, entries in self.conflicts.items():
            if len(entries) > 1:
                # Choose primary entry and add others as variants
                primary_entry = self.resolve_conflict(english_key, entries)
                for entry in entries:
                    if entry != primary_entry:
                        variants.append(entry)
        return variants
    
    def merge_entries(self, entry1: Entry = None, entry2: Entry = None) -> List[Entry]:
        """Merge entries. If no arguments provided, merge all conflicts."""
        if entry1 is None and entry2 is None:
            # Merge all conflicts
            merged_entries = []
            for english_key, entries in self.conflicts.items():
                if len(entries) > 1:
                    # Check if these are complementary entries
                    if self._are_complementary(entries[0], entries[1]):
                        # Merge complementary entries
                        merged_entry = self._merge_entries(entries[0], entries[1])
                        merged_entries.append(merged_entry)
                        # Update conflicts with merged entry
                        self.conflicts[english_key] = [merged_entry]
                        
                        # Update dictionaries
                        if merged_entry.has_ancient():
                            self.ancient_entries[english_key] = merged_entry.ancient
                            self.stats['ancient_entries'] += 1
                        
                        if merged_entry.has_modern():
                            self.modern_entries[english_key] = merged_entry.modern
                            self.stats['modern_entries'] += 1
                    else:
                        # Merge conflicting entries (keep first, others become variants)
                        merged_entry = entries[0]
                        for entry in entries[1:]:
                            merged_entry = self._merge_two_entries(merged_entry, entry)
                        merged_entries.append(merged_entry)
                        # Update conflicts with merged entry
                        self.conflicts[english_key] = [merged_entry]
                elif len(entries) == 1:
                    # Single entry, just return it
                    merged_entries.append(entries[0])
            return merged_entries
        elif entry1 is not None and entry2 is not None:
            # Merge two specific entries
            return [self._merge_two_entries(entry1, entry2)]
        else:
            raise ValueError("Either provide both entry1 and entry2, or neither")
    
    def _merge_two_entries(self, entry1: Entry, entry2: Entry) -> Entry:
        """Merge two entries, with higher confidence entry taking precedence."""
        # Determine which entry has higher confidence
        if entry1.confidence >= entry2.confidence:
            primary, secondary = entry1, entry2
        else:
            primary, secondary = entry2, entry1
        
        merged = Entry(
            english=primary.english,
            ancient=primary.ancient or secondary.ancient,
            modern=primary.modern or secondary.modern,
            pos=primary.pos or secondary.pos,
            notes=primary.notes or secondary.notes,
            sacred=primary.sacred or secondary.sacred,
            source_page=primary.source_page or secondary.source_page,
            confidence=max(entry1.confidence, entry2.confidence)
        )
        return merged
    
    def filter_low_confidence(self, threshold: float) -> None:
        """Filter out entries with low confidence."""
        filtered_conflicts = {}
        for english_key, entries in self.conflicts.items():
            filtered_entries = []
            for entry in entries:
                if entry.confidence >= threshold:
                    filtered_entries.append(entry)
                else:
                    # Move to excluded entries
                    entry.notes = f"EXCLUDED: Low confidence ({entry.confidence} < {threshold})"
                    self.excluded_entries.append(entry)
                    self.stats['excluded_entries'] += 1
            if filtered_entries:
                filtered_conflicts[english_key] = filtered_entries
        self.conflicts = defaultdict(list, filtered_conflicts)
    
    def filter_incomplete_entries(self) -> None:
        """Filter out incomplete entries."""
        filtered_conflicts = {}
        for english_key, entries in self.conflicts.items():
            filtered_entries = []
            for entry in entries:
                if entry.is_complete():
                    filtered_entries.append(entry)
                else:
                    # Move to excluded entries
                    entry.notes = "EXCLUDED: Incomplete entry"
                    self.excluded_entries.append(entry)
                    self.stats['excluded_entries'] += 1
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
                else:
                    # Move to excluded entries
                    entry.notes = "EXCLUDED: Placeholder entry"
                    self.excluded_entries.append(entry)
                    self.stats['excluded_entries'] += 1
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
