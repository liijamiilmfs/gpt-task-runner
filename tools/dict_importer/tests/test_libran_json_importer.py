"""Tests for Librán-specific JSON importer."""

import pytest
import json
import tempfile
from pathlib import Path
from dict_importer.libran_json_importer import LibranJSONImporter, import_libran_dictionary


class TestLibranJSONImporter:
    """Test the Librán-specific JSON importer."""
    
    def test_import_simple_cluster(self):
        """Test importing a simple cluster."""
        importer = LibranJSONImporter()
        
        data = {
            "clusters": {
                "Core Concepts": {
                    "commentary": "Test cluster",
                    "ancient": [
                        {
                            "english": "Balance",
                            "source": "Lat. statera",
                            "ancient": "Stílibror",
                            "notes": "Core concept"
                        },
                        {
                            "english": "Flame",
                            "source": "Lat. flamma",
                            "ancient": "Flamor",
                            "notes": "Fire concept"
                        }
                    ],
                    "modern": [
                        {
                            "english": "Balance",
                            "source": "Lat. statera",
                            "modern": "stílibra",
                            "notes": "Core concept"
                        },
                        {
                            "english": "Flame",
                            "source": "Lat. flamma",
                            "modern": "flama",
                            "notes": "Fire concept"
                        }
                    ]
                }
            }
        }
        
        build = importer.import_from_file_data(data)
        
        assert build.build_stats['total_ancient'] == 2
        assert build.build_stats['total_modern'] == 2
        assert build.build_stats['clusters_processed'] == 1
        assert build.build_stats['excluded'] == 0
        
        assert build.ancient_entries["balance"] == "Stílibror"
        assert build.ancient_entries["flame"] == "Flamor"
        assert build.modern_entries["balance"] == "stílibra"
        assert build.modern_entries["flame"] == "flama"
    
    def test_import_with_excluded_entries(self):
        """Test importing with entries that should be excluded."""
        importer = LibranJSONImporter()
        
        data = {
            "clusters": {
                "Test Cluster": {
                    "ancient": [
                        {
                            "english": "Valid Word",
                            "ancient": "ValidTranslation",
                            "notes": "Good entry"
                        },
                        {
                            "english": "No Translation",
                            "ancient": "—",
                            "notes": "Missing translation"
                        },
                        {
                            "english": "",
                            "ancient": "EmptyEnglish",
                            "notes": "Empty English"
                        }
                    ]
                }
            }
        }
        
        build = importer.import_from_file_data(data)
        
        assert build.build_stats['total_ancient'] == 1
        assert build.build_stats['excluded'] == 2
        assert build.ancient_entries["valid word"] == "ValidTranslation"
        assert len(build.excluded_entries) == 2
    
    def test_clean_libran_word(self):
        """Test cleaning Librán words."""
        importer = LibranJSONImporter()
        
        # Test normal word
        assert importer._clean_libran_word("stílibra") == "stílibra"
        
        # Test word with metadata
        assert importer._clean_libran_word("stílibra (definite)") == "stílibra"
        
        # Test word with Latin prefix
        assert importer._clean_libran_word("statera-stílibra") == "stílibra"
        
        # Test empty word
        assert importer._clean_libran_word("—") == ""
        
        # Test word with English contamination
        assert importer._clean_libran_word("Core-stílibra") == "stílibra"
        
        # Test very short word
        assert importer._clean_libran_word("a") == ""
    
    def test_import_from_file(self):
        """Test importing from a file."""
        importer = LibranJSONImporter()
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump({
                "clusters": {
                    "Test Cluster": {
                        "ancient": [
                            {
                                "english": "Test",
                                "ancient": "TestTranslation",
                                "notes": "Test entry"
                            }
                        ]
                    }
                }
            }, f)
            temp_file = f.name
        
        try:
            build = importer.import_from_file(temp_file)
            
            assert build.build_stats['total_ancient'] == 1
            assert build.ancient_entries["test"] == "TestTranslation"
        
        finally:
            Path(temp_file).unlink()
    
    def test_save_dictionaries(self):
        """Test saving dictionaries to files."""
        importer = LibranJSONImporter()
        
        # Set up some test data
        importer.ancient_entries = {"test": "ancient"}
        importer.modern_entries = {"test": "modern"}
        importer.stats = {
            'total_ancient': 1,
            'total_modern': 1,
            'excluded': 0,
            'clusters_processed': 1
        }
        
        with tempfile.TemporaryDirectory() as temp_dir:
            output_path = Path(temp_dir) / "output"
            importer.save_dictionaries(str(output_path))
            
            # Check files were created
            assert (output_path / "ancient.json").exists()
            assert (output_path / "modern.json").exists()
            assert (output_path / "IMPORT_REPORT.md").exists()
            
            # Check content
            with open(output_path / "ancient.json", 'r', encoding='utf-8') as f:
                ancient_data = json.load(f)
            assert ancient_data["test"] == "ancient"
            
            with open(output_path / "modern.json", 'r', encoding='utf-8') as f:
                modern_data = json.load(f)
            assert modern_data["test"] == "modern"
    
    def test_import_from_file_data(self):
        """Test importing from data directly."""
        importer = LibranJSONImporter()
        
        data = {
            "clusters": {
                "Test Cluster": {
                    "ancient": [
                        {
                            "english": "Test",
                            "ancient": "TestTranslation",
                            "notes": "Test entry"
                        }
                    ]
                }
            }
        }
        
        build = importer.import_from_file_data(data)
        
        assert build.build_stats['total_ancient'] == 1
        assert build.ancient_entries["test"] == "TestTranslation"


class TestImportLibranDictionary:
    """Test the import_libran_dictionary function."""
    
    def test_import_libran_dictionary(self):
        """Test the main import function."""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create test JSON file
            json_file = Path(temp_dir) / "test.json"
            output_dir = Path(temp_dir) / "output"
            
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump({
                    "clusters": {
                        "Test Cluster": {
                            "ancient": [
                                {
                                    "english": "Test",
                                    "ancient": "TestTranslation",
                                    "notes": "Test entry"
                                }
                            ],
                            "modern": [
                                {
                                    "english": "Test",
                                    "modern": "TestModern",
                                    "notes": "Test entry"
                                }
                            ]
                        }
                    }
                }, f)
            
            # Import dictionary
            build = import_libran_dictionary(str(json_file), str(output_dir))
            
            # Check results
            assert build.build_stats['total_ancient'] == 1
            assert build.build_stats['total_modern'] == 1
            assert build.ancient_entries["test"] == "TestTranslation"
            assert build.modern_entries["test"] == "TestModern"
            
            # Check output files
            assert (output_dir / "ancient.json").exists()
            assert (output_dir / "modern.json").exists()
            assert (output_dir / "IMPORT_REPORT.md").exists()
    
    def test_import_nonexistent_file(self):
        """Test importing from nonexistent file."""
        with tempfile.TemporaryDirectory() as temp_dir:
            output_dir = Path(temp_dir) / "output"
            
            with pytest.raises(FileNotFoundError):
                import_libran_dictionary("nonexistent.json", str(output_dir))
