#!/usr/bin/env python3
"""
Test script for the fixed Librán dictionary importer.
"""

import sys
import os
from pathlib import Path

# Add the dict_importer to the path
sys.path.insert(0, str(Path(__file__).parent / 'tools' / 'dict_importer'))

from dict_importer.libran_json_importer_fixed import import_libran_dictionary_fixed

def main():
    """Test the fixed importer."""
    json_path = 'data/Unified_Libran_Dictionary_v1_4.json'
    output_dir = 'lib/translator/dictionaries'
    
    print("🔧 Testing FIXED Librán dictionary importer...")
    print(f"📁 Input: {json_path}")
    print(f"📁 Output: {output_dir}")
    
    try:
        build = import_libran_dictionary_fixed(json_path, output_dir)
        
        print("\n✅ SUCCESS! Fixed importer completed.")
        print(f"📊 Ancient entries: {build.build_stats['total_ancient']}")
        print(f"📊 Modern entries: {build.build_stats['total_modern']}")
        print(f"📊 Excluded entries: {build.build_stats['excluded']}")
        
        # Show some sample entries
        print("\n🔍 Sample Ancient Entries:")
        for i, (english, libran) in enumerate(list(build.ancient_entries.items())[:5]):
            print(f"  {english} → {libran}")
        
        print("\n🔍 Sample Modern Entries:")
        for i, (english, libran) in enumerate(list(build.modern_entries.items())[:5]):
            print(f"  {english} → {libran}")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return 1
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
