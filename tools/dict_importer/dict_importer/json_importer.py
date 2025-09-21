"""JSON dictionary importer for Librán dictionaries."""

import json
from pathlib import Path
from typing import Dict, List, Optional, Union, Any
from .schema import Entry, ParsedPage, DictionaryBuild


class JSONDictionaryImporter:
    """Importer for JSON-based Librán dictionaries."""
    
    def __init__(self):
        self.supported_formats = ['simple', 'detailed', 'nested']
    
    def import_from_file(self, file_path: str, variant: str = 'ancient') -> DictionaryBuild:
        """Import dictionary from JSON file."""
        file_path = Path(file_path)
        
        if not file_path.exists():
            raise FileNotFoundError(f"JSON file not found: {file_path}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Detect format and import accordingly
        format_type = self._detect_format(data)
        
        if format_type == 'simple':
            return self._import_simple_format(data, variant)
        elif format_type == 'detailed':
            return self._import_detailed_format(data, variant)
        elif format_type == 'nested':
            return self._import_nested_format(data, variant)
        else:
            raise ValueError(f"Unsupported JSON format: {format_type}")
    
    def _detect_format(self, data: Any) -> str:
        """Detect the format of the JSON data."""
        if isinstance(data, dict):
            # Check if it's a simple key-value dictionary
            if all(isinstance(v, str) for v in data.values()):
                return 'simple'
            
            # Check if it's a detailed format with entry objects
            if any(isinstance(v, dict) and 'ancient' in v or 'modern' in v for v in data.values()):
                return 'detailed'
            
            # Check if it's nested by variant
            if 'ancient' in data or 'modern' in data:
                return 'nested'
        
        return 'unknown'
    
    def _import_simple_format(self, data: Dict[str, str], variant: str) -> DictionaryBuild:
        """Import simple key-value format."""
        build = DictionaryBuild()
        
        for english, libran in data.items():
            if variant == 'ancient':
                build.add_ancient(english, libran)
            else:
                build.add_modern(english, libran)
        
        return build
    
    def _import_detailed_format(self, data: Dict[str, Dict], variant: str) -> DictionaryBuild:
        """Import detailed format with entry objects."""
        build = DictionaryBuild()
        
        for english, entry_data in data.items():
            if isinstance(entry_data, dict):
                if variant == 'ancient' and 'ancient' in entry_data:
                    build.add_ancient(english, entry_data['ancient'])
                elif variant == 'modern' and 'modern' in entry_data:
                    build.add_modern(english, entry_data['modern'])
        
        return build
    
    def _import_nested_format(self, data: Dict[str, Any], variant: str) -> DictionaryBuild:
        """Import nested format with variants as top-level keys."""
        build = DictionaryBuild()
        
        if variant in data and isinstance(data[variant], dict):
            for english, libran in data[variant].items():
                if variant == 'ancient':
                    build.add_ancient(english, libran)
                else:
                    build.add_modern(english, libran)
        
        return build
    
    def import_multiple_files(self, file_paths: List[str], variants: List[str] = None) -> DictionaryBuild:
        """Import from multiple JSON files."""
        if variants is None:
            variants = ['ancient', 'modern']
        
        build = DictionaryBuild()
        
        for file_path in file_paths:
            for variant in variants:
                try:
                    variant_build = self.import_from_file(file_path, variant)
                    
                    # Merge into main build
                    if variant == 'ancient':
                        build.ancient_entries.update(variant_build.ancient_entries)
                    else:
                        build.modern_entries.update(variant_build.modern_entries)
                        
                except Exception as e:
                    print(f"Warning: Failed to import {file_path} for {variant}: {e}")
                    continue
        
        return build


def create_sample_json_dictionary(output_path: str, format_type: str = 'simple'):
    """Create a sample JSON dictionary file."""
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    if format_type == 'simple':
        # Simple key-value format
        data = {
            "balance": "stílibra",
            "flame": "flamë",
            "memory": "memirë",
            "shadow": "arnëa",
            "stone": "petrë",
            "void": "tómr",
            "anger": "íra",
            "courage": "corëa",
            "dream": "visira",
            "envy": "invidë",
            "faith": "fidë",
            "fear": "felë",
            "hope": "sperë",
            "joy": "bucorë",
            "love": "dramë",
            "mercy": "milëa",
            "vision": "visiora",
            "ancestor": "ancesa",
            "father": "patera",
            "mother": "matera"
        }
    
    elif format_type == 'detailed':
        # Detailed format with additional metadata
        data = {
            "balance": {
                "ancient": "stílibra",
                "modern": "stílibra",
                "pos": "n",
                "notes": "Core sacred concept",
                "etymology": "Lat. statera"
            },
            "flame": {
                "ancient": "flamë",
                "modern": "flamë",
                "pos": "n",
                "notes": "Fire-flame",
                "etymology": "Lat. flamma"
            },
            "memory": {
                "ancient": "memirë",
                "modern": "memirë",
                "pos": "n",
                "notes": "Sacred remembrance",
                "etymology": "Lat. memoria"
            }
        }
    
    elif format_type == 'nested':
        # Nested format with variants as top-level keys
        data = {
            "ancient": {
                "balance": "stílibra",
                "flame": "flamë",
                "memory": "memirë",
                "shadow": "arnëa",
                "stone": "petrë",
                "void": "tómr",
                "anger": "íra",
                "courage": "corëa",
                "dream": "visira",
                "envy": "invidë"
            },
            "modern": {
                "balance": "stílibra",
                "flame": "flamë",
                "memory": "memirë",
                "shadow": "arnëa",
                "stone": "petrë",
                "void": "tómr",
                "anger": "íra",
                "courage": "corëa",
                "dream": "visira",
                "envy": "invidë"
            }
        }
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Sample {format_type} JSON dictionary created: {output_path}")


def import_json_dictionaries(ancient_path: str, modern_path: str, output_dir: str) -> DictionaryBuild:
    """Import both ancient and modern dictionaries from JSON files."""
    importer = JSONDictionaryImporter()
    
    # Import ancient dictionary
    ancient_build = importer.import_from_file(ancient_path, 'ancient')
    
    # Import modern dictionary
    modern_build = importer.import_from_file(modern_path, 'modern')
    
    # Merge builds
    build = DictionaryBuild()
    build.ancient_entries = ancient_build.ancient_entries
    build.modern_entries = modern_build.modern_entries
    
    # Save to output directory
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Save ancient dictionary
    ancient_output = output_path / "ancient.json"
    with open(ancient_output, 'w', encoding='utf-8') as f:
        json.dump(build.ancient_entries, f, ensure_ascii=False, indent=2)
    
    # Save modern dictionary
    modern_output = output_path / "modern.json"
    with open(modern_output, 'w', encoding='utf-8') as f:
        json.dump(build.modern_entries, f, ensure_ascii=False, indent=2)
    
    print(f"Imported {len(build.ancient_entries)} ancient entries")
    print(f"Imported {len(build.modern_entries)} modern entries")
    print(f"Saved to: {output_dir}")
    
    return build
