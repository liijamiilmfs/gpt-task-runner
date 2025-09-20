"""Tests for JSON dictionary importer."""

import pytest
import json
import tempfile
from pathlib import Path
from dict_importer.json_importer import JSONDictionaryImporter, import_json_dictionaries, create_sample_json_dictionary


class TestJSONDictionaryImporter:
    """Test the JSON dictionary importer."""
    
    def test_detect_simple_format(self):
        """Test detection of simple key-value format."""
        importer = JSONDictionaryImporter()
        
        data = {"word1": "trans1", "word2": "trans2"}
        format_type = importer._detect_format(data)
        assert format_type == "simple"
    
    def test_detect_detailed_format(self):
        """Test detection of detailed format with entry objects."""
        importer = JSONDictionaryImporter()
        
        data = {
            "word1": {"ancient": "trans1", "modern": "trans2"},
            "word2": {"ancient": "trans3", "modern": "trans4"}
        }
        format_type = importer._detect_format(data)
        assert format_type == "detailed"
    
    def test_detect_nested_format(self):
        """Test detection of nested format with variants as top-level keys."""
        importer = JSONDictionaryImporter()
        
        data = {
            "ancient": {"word1": "trans1", "word2": "trans2"},
            "modern": {"word1": "trans3", "word2": "trans4"}
        }
        format_type = importer._detect_format(data)
        assert format_type == "nested"
    
    def test_import_simple_format(self):
        """Test importing simple format."""
        importer = JSONDictionaryImporter()
        
        data = {
            "balance": "stílibra",
            "flame": "flamë",
            "memory": "memirë"
        }
        
        build = importer._import_simple_format(data, "ancient")
        
        assert len(build.ancient_entries) == 3
        assert build.ancient_entries["balance"] == "stílibra"
        assert build.ancient_entries["flame"] == "flamë"
        assert build.ancient_entries["memory"] == "memirë"
        assert len(build.modern_entries) == 0
    
    def test_import_detailed_format(self):
        """Test importing detailed format."""
        importer = JSONDictionaryImporter()
        
        data = {
            "balance": {
                "ancient": "stílibra",
                "modern": "stílibra",
                "pos": "n",
                "notes": "Core concept"
            },
            "flame": {
                "ancient": "flamë",
                "modern": "flamë"
            }
        }
        
        build = importer._import_detailed_format(data, "ancient")
        
        assert len(build.ancient_entries) == 2
        assert build.ancient_entries["balance"] == "stílibra"
        assert build.ancient_entries["flame"] == "flamë"
    
    def test_import_nested_format(self):
        """Test importing nested format."""
        importer = JSONDictionaryImporter()
        
        data = {
            "ancient": {
                "balance": "stílibra",
                "flame": "flamë"
            },
            "modern": {
                "balance": "stílibra",
                "flame": "flamë"
            }
        }
        
        build = importer._import_nested_format(data, "ancient")
        
        assert len(build.ancient_entries) == 2
        assert build.ancient_entries["balance"] == "stílibra"
        assert build.ancient_entries["flame"] == "flamë"
    
    def test_import_from_file(self):
        """Test importing from a file."""
        importer = JSONDictionaryImporter()
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump({
                "balance": "stílibra",
                "flame": "flamë"
            }, f)
            temp_file = f.name
        
        try:
            build = importer.import_from_file(temp_file, "ancient")
            
            assert len(build.ancient_entries) == 2
            assert build.ancient_entries["balance"] == "stílibra"
            assert build.ancient_entries["flame"] == "flamë"
        
        finally:
            Path(temp_file).unlink()
    
    def test_import_from_nonexistent_file(self):
        """Test importing from a nonexistent file."""
        importer = JSONDictionaryImporter()
        
        with pytest.raises(FileNotFoundError):
            importer.import_from_file("nonexistent.json", "ancient")
    
    def test_import_multiple_files(self):
        """Test importing from multiple files."""
        importer = JSONDictionaryImporter()
        
        # Create temporary files
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump({"word1": "trans1"}, f)
            file1 = f.name
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump({"word2": "trans2"}, f)
            file2 = f.name
        
        try:
            build = importer.import_multiple_files([file1, file2], ["ancient", "modern"])
            
            assert len(build.ancient_entries) == 2
            assert len(build.modern_entries) == 2
        
        finally:
            Path(file1).unlink()
            Path(file2).unlink()


class TestSampleCreation:
    """Test sample JSON dictionary creation."""
    
    def test_create_simple_sample(self):
        """Test creating simple format sample."""
        with tempfile.TemporaryDirectory() as temp_dir:
            output_path = Path(temp_dir) / "sample.json"
            create_sample_json_dictionary(str(output_path), "simple")
            
            assert output_path.exists()
            
            with open(output_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            assert isinstance(data, dict)
            assert "balance" in data
            assert data["balance"] == "stílibra"
    
    def test_create_detailed_sample(self):
        """Test creating detailed format sample."""
        with tempfile.TemporaryDirectory() as temp_dir:
            output_path = Path(temp_dir) / "sample.json"
            create_sample_json_dictionary(str(output_path), "detailed")
            
            assert output_path.exists()
            
            with open(output_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            assert isinstance(data, dict)
            assert "balance" in data
            assert isinstance(data["balance"], dict)
            assert "ancient" in data["balance"]
    
    def test_create_nested_sample(self):
        """Test creating nested format sample."""
        with tempfile.TemporaryDirectory() as temp_dir:
            output_path = Path(temp_dir) / "sample.json"
            create_sample_json_dictionary(str(output_path), "nested")
            
            assert output_path.exists()
            
            with open(output_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            assert isinstance(data, dict)
            assert "ancient" in data
            assert "modern" in data
            assert isinstance(data["ancient"], dict)
            assert isinstance(data["modern"], dict)


class TestImportDictionaries:
    """Test the import_json_dictionaries function."""
    
    def test_import_json_dictionaries(self):
        """Test importing both ancient and modern dictionaries."""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create sample files
            ancient_file = Path(temp_dir) / "ancient.json"
            modern_file = Path(temp_dir) / "modern.json"
            output_dir = Path(temp_dir) / "output"
            
            with open(ancient_file, 'w', encoding='utf-8') as f:
                json.dump({"balance": "stílibra"}, f)
            
            with open(modern_file, 'w', encoding='utf-8') as f:
                json.dump({"balance": "stílibra"}, f)
            
            # Import dictionaries
            build = import_json_dictionaries(
                str(ancient_file),
                str(modern_file),
                str(output_dir)
            )
            
            # Check results
            assert len(build.ancient_entries) == 1
            assert len(build.modern_entries) == 1
            assert build.ancient_entries["balance"] == "stílibra"
            assert build.modern_entries["balance"] == "stílibra"
            
            # Check output files
            assert (output_dir / "ancient.json").exists()
            assert (output_dir / "modern.json").exists()
            
            # Verify output files
            with open(output_dir / "ancient.json", 'r', encoding='utf-8') as f:
                ancient_data = json.load(f)
            assert ancient_data["balance"] == "stílibra"
            
            with open(output_dir / "modern.json", 'r', encoding='utf-8') as f:
                modern_data = json.load(f)
            assert modern_data["balance"] == "stílibra"
