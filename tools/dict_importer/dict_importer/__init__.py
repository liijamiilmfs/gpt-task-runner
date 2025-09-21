"""Librán Dictionary Importer Package."""

__version__ = "1.0.0"
__author__ = "Librán Voice Forge Team"

from .schema import Entry, ParsedPage, DictionaryBuild
from .pdf_extract import extract_pages, extract_page_with_metadata
from .normalize import normalize_text, clean_headword, clean_translation
from .parse_tables import parse_pdf_pages, TableParser
from .build_dicts import build_dictionaries, DictionaryBuilder
from .cli import main

__all__ = [
    'Entry',
    'ParsedPage', 
    'DictionaryBuild',
    'extract_pages',
    'extract_page_with_metadata',
    'normalize_text',
    'clean_headword',
    'clean_translation',
    'parse_pdf_pages',
    'TableParser',
    'build_dictionaries',
    'DictionaryBuilder',
    'main'
]
