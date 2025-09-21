"""Specialized importer for the Librán dictionary JSON format."""

import json
from pathlib import Path
from typing import Dict, List, Optional, Any
from .schema import Entry, ParsedPage, DictionaryBuild


class LibranJSONImporter:
    """Importer for the specialized Librán dictionary JSON format."""
    
    def __init__(self):
        self.ancient_entries = {}
        self.modern_entries = {}
        self.excluded_entries = []
        self.stats = {
            'total_ancient': 0,
            'total_modern': 0,
            'excluded': 0,
            'clusters_processed': 0
        }
    
    def import_from_file(self, file_path: str) -> DictionaryBuild:
        """Import dictionary from the specialized Librán JSON format."""
        file_path = Path(file_path)
        
        if not file_path.exists():
            raise FileNotFoundError(f"JSON file not found: {file_path}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        return self.import_from_file_data(data)
    
    def import_from_file_data(self, data: Dict[str, Any]) -> DictionaryBuild:
        """Import dictionary from data directly."""
        # Process the clusters
        self._process_clusters(data.get('clusters', {}))
        
        # Create the build result
        build = DictionaryBuild()
        build.ancient_entries = self.ancient_entries
        build.modern_entries = self.modern_entries
        build.excluded_entries = self.excluded_entries
        build.build_stats = self.stats
        
        return build
    
    def _process_clusters(self, clusters: Dict[str, Any]) -> None:
        """Process all clusters in the dictionary."""
        for cluster_name, cluster_data in clusters.items():
            if not isinstance(cluster_data, dict):
                continue
                
            self.stats['clusters_processed'] += 1
            
            # Process ancient entries
            ancient_entries = cluster_data.get('ancient', [])
            for entry in ancient_entries:
                self._process_entry(entry, 'ancient', cluster_name)
            
            # Process modern entries
            modern_entries = cluster_data.get('modern', [])
            for entry in modern_entries:
                self._process_entry(entry, 'modern', cluster_name)
    
    def _process_entry(self, entry: Dict[str, Any], variant: str, cluster: str) -> None:
        """Process a single dictionary entry."""
        english = entry.get('english', '').strip()
        libran = entry.get(variant, '').strip()
        source = entry.get('source', '').strip()
        notes = entry.get('notes', '').strip()
        
        # Skip entries without English word or Librán translation
        if not english or not libran or libran == '—':
            self.stats['excluded'] += 1
            self.excluded_entries.append(Entry(
                english=english,
                ancient=libran if variant == 'ancient' else None,
                modern=libran if variant == 'modern' else None,
                notes=f"EXCLUDED: No {variant} translation",
                source_page=0,
                confidence=0.0
            ))
            return
        
        # Clean up the English word (capitalize first letter)
        english_clean = english.capitalize()
        
        # Clean up the Librán word
        libran_clean = self._clean_libran_word(libran)
        
        if not libran_clean:
            self.stats['excluded'] += 1
            self.excluded_entries.append(Entry(
                english=english_clean,
                ancient=libran if variant == 'ancient' else None,
                modern=libran if variant == 'modern' else None,
                notes=f"EXCLUDED: Invalid Librán word",
                source_page=0,
                confidence=0.0
            ))
            return
        
        # Add to appropriate dictionary
        if variant == 'ancient':
            self.ancient_entries[english_clean.lower()] = libran_clean
            self.stats['total_ancient'] += 1
        else:
            self.modern_entries[english_clean.lower()] = libran_clean
            self.stats['total_modern'] += 1
    
    def _clean_libran_word(self, word: str) -> str:
        """Clean up a Librán word."""
        if not word or word == '—':
            return ""
        
        # Remove common prefixes and suffixes that might be metadata
        word = word.strip()
        
        # Remove parenthetical information
        import re
        word = re.sub(r'\([^)]*\)', '', word)
        
        # Remove English words that might be mixed in (with hyphen handling) - do this first
        word = re.sub(r'^(Core|Sacred|Fate|Fire|flame|Concealment|Foundation|Wrath|Heart|force|Prophecy|Jealousy|Trust|belief|Dread|Blessing|Celebration|Affection|bond|Compassion|Grief|Prophetic|sight|Lineal|spirit|Revered|dead|Forebears|Bow|warrior|Singer|history|Kinship|Innocent|Bloodline|Collective|Old|age|wisdom|Opponent|Foe|Family|group|Weavers|destiny|kin|term|Tribal|patriarch|Champion|Brave|person|Our)(?=-|$)', '', word, flags=re.IGNORECASE)
        
        # Remove common metadata patterns (with hyphen handling)
        word = re.sub(r'^(statera|fatum|flamma|memoria|petra|ira|cor|vis|bucurie|milă|sorg|manes|sagittarius|bardus|frater|infans|antecessor|ætt|gens|aldri|hostis|nornir|pater|heros|rokon)-?', '', word, flags=re.IGNORECASE)
        
        # Remove leading hyphens that might be left over
        word = word.lstrip('-')
        
        # Clean up punctuation but keep Librán special characters
        word = re.sub(r'[^\wáéíóúëñçüÁÉÍÓÚËÑÇÜ\-]', '', word)
        
        # Remove very short words
        if len(word) < 2:
            return ""
        
        return word
    
    def save_dictionaries(self, output_dir: str) -> None:
        """Save the imported dictionaries to files."""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Save ancient dictionary
        ancient_output = output_path / "ancient.json"
        with open(ancient_output, 'w', encoding='utf-8') as f:
            json.dump(self.ancient_entries, f, ensure_ascii=False, indent=2)
        
        # Save modern dictionary
        modern_output = output_path / "modern.json"
        with open(modern_output, 'w', encoding='utf-8') as f:
            json.dump(self.modern_entries, f, ensure_ascii=False, indent=2)
        
        # Save report
        self._save_report(output_path)
    
    def _save_report(self, output_path: Path) -> None:
        """Save an import report."""
        report_path = output_path / "IMPORT_REPORT.md"
        
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write("# Librán Dictionary Import Report\n\n")
            f.write(f"**Import Date**: {Path().cwd()}\n")
            f.write(f"**Total Ancient Entries**: {self.stats['total_ancient']}\n")
            f.write(f"**Total Modern Entries**: {self.stats['total_modern']}\n")
            f.write(f"**Excluded Entries**: {self.stats['excluded']}\n")
            f.write(f"**Clusters Processed**: {self.stats['clusters_processed']}\n\n")
            
            f.write("## Sample Ancient Entries\n")
            for i, (english, libran) in enumerate(list(self.ancient_entries.items())[:20]):
                f.write(f"- {english} → {libran}\n")
            
            f.write("\n## Sample Modern Entries\n")
            for i, (english, libran) in enumerate(list(self.modern_entries.items())[:20]):
                f.write(f"- {english} → {libran}\n")
            
            if self.excluded_entries:
                f.write("\n## Excluded Entries\n")
                for entry in self.excluded_entries[:10]:
                    f.write(f"- {entry.english}: {entry.notes}\n")


def import_libran_dictionary(json_path: str, output_dir: str) -> DictionaryBuild:
    """Import the Librán dictionary from JSON and save to output directory."""
    importer = LibranJSONImporter()
    build = importer.import_from_file(json_path)
    importer.save_dictionaries(output_dir)
    
    print(f"✅ Imported {build.build_stats['total_ancient']} ancient entries")
    print(f"✅ Imported {build.build_stats['total_modern']} modern entries")
    print(f"⚠️  Excluded {build.build_stats['excluded']} entries")
    print(f"📁 Saved to: {output_dir}")
    
    return build
