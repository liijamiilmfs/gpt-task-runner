"""Pydantic models for dictionary entries."""

from typing import Optional, List
from pydantic import BaseModel, Field


class Entry(BaseModel):
    """A dictionary entry with English and Librán translations."""
    
    english: str = Field(..., description="English headword")
    ancient: Optional[str] = Field(None, description="Ancient Librán translation")
    modern: Optional[str] = Field(None, description="Modern Librán translation")
    pos: Optional[str] = Field(None, description="Part of speech")
    notes: Optional[str] = Field(None, description="Additional notes")
    sacred: bool = Field(False, description="Whether this is a sacred variant")
    source_page: Optional[int] = Field(None, description="Source page number")
    confidence: float = Field(1.0, description="Parsing confidence (0-1)")
    
    def has_ancient(self) -> bool:
        """Check if entry has ancient translation."""
        return self.ancient is not None and self.ancient.strip() != ""
    
    def has_modern(self) -> bool:
        """Check if entry has modern translation."""
        return self.modern is not None and self.modern.strip() != ""
    
    def is_complete(self) -> bool:
        """Check if entry has at least one translation."""
        return self.has_ancient() or self.has_modern()
    
    def get_primary_translation(self, variant: str) -> Optional[str]:
        """Get primary translation for given variant."""
        if variant == "ancient":
            return self.ancient
        elif variant == "modern":
            return self.modern
        return None


class ParsedPage(BaseModel):
    """A parsed page with extracted entries."""
    
    page_number: int
    entries: List[Entry] = Field(default_factory=list)
    raw_text: str = ""
    parsing_notes: List[str] = Field(default_factory=list)
    
    def add_entry(self, entry: Entry) -> None:
        """Add an entry to this page."""
        self.entries.append(entry)
    
    def add_note(self, note: str) -> None:
        """Add a parsing note."""
        self.parsing_notes.append(note)


class DictionaryBuild(BaseModel):
    """Complete dictionary build with metadata."""
    
    ancient_entries: dict = Field(default_factory=dict)
    modern_entries: dict = Field(default_factory=dict)
    excluded_entries: List[Entry] = Field(default_factory=list)
    variant_entries: List[Entry] = Field(default_factory=list)
    build_stats: dict = Field(default_factory=dict)
    
    def add_ancient(self, english: str, libran: str) -> None:
        """Add ancient translation."""
        self.ancient_entries[english.lower()] = libran
    
    def add_modern(self, english: str, libran: str) -> None:
        """Add modern translation."""
        self.modern_entries[english.lower()] = libran
    
    def add_excluded(self, entry: Entry, reason: str) -> None:
        """Add excluded entry with reason."""
        entry.notes = f"EXCLUDED: {reason}"
        self.excluded_entries.append(entry)
    
    def add_variant(self, entry: Entry) -> None:
        """Add variant entry."""
        self.variant_entries.append(entry)
