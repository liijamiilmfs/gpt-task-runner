"""
Simplified tests for conflict resolution functionality using pytest
Tests the actual DictionaryBuilder implementation
"""

import pytest
from dict_importer.build_dicts import DictionaryBuilder
from dict_importer.schema import Entry, DictionaryBuild


class TestDictionaryBuilder:
    """Test DictionaryBuilder functionality."""

    @pytest.fixture
    def builder(self):
        """Create a DictionaryBuilder instance for testing."""
        return DictionaryBuilder()

    def test_process_single_entry(self, builder):
        """Test processing a single entry."""
        entry = Entry(
            english='balance',
            ancient='stílibra',
            modern='stílibra'
        )

        builder.process_entry(entry)
        assert len(builder.ancient_entries) == 1
        assert len(builder.modern_entries) == 1
        assert 'balance' in builder.ancient_entries
        assert builder.ancient_entries['balance'] == 'stílibra'
        assert 'balance' in builder.modern_entries
        assert builder.modern_entries['balance'] == 'stílibra'

    def test_process_multiple_entries(self, builder):
        """Test processing multiple entries."""
        entries = [
            Entry(english='balance', ancient='stílibra', modern='stílibra'),
            Entry(english='flame', ancient='flamë', modern='flama'),
            Entry(english='memory', ancient='memoror', modern='memoria')
        ]

        for entry in entries:
            builder.process_entry(entry)

        assert len(builder.ancient_entries) == 3
        assert len(builder.modern_entries) == 3
        assert 'balance' in builder.ancient_entries
        assert 'flame' in builder.ancient_entries
        assert 'memory' in builder.ancient_entries

    def test_process_mixed_ancient_modern_entries(self, builder):
        """Test processing mixed ancient/modern entries."""
        entries = [
            Entry(english='balance', ancient='stílibra', modern=None),
            Entry(english='flame', ancient=None, modern='flama')
        ]

        for entry in entries:
            builder.process_entry(entry)

        assert len(builder.ancient_entries) == 1
        assert len(builder.modern_entries) == 1
        assert 'balance' in builder.ancient_entries
        assert 'flame' not in builder.ancient_entries
        assert 'flame' in builder.modern_entries
        assert 'balance' not in builder.modern_entries

    def test_should_exclude_with_exclude_terms(self):
        """Test exclusion based on exclude terms."""
        exclude_terms = {'test', 'example'}
        builder = DictionaryBuilder(exclude_terms)

        entry1 = Entry(english='balance', ancient='stílibra', modern='stílibra')
        entry2 = Entry(english='test', ancient='test_libran', modern='test_libran')

        should_exclude1, reason1 = builder.should_exclude(entry1)
        should_exclude2, reason2 = builder.should_exclude(entry2)

        assert not should_exclude1
        assert should_exclude2
        assert 'exclude list' in reason2

    def test_should_exclude_empty_english(self, builder):
        """Test exclusion of entries with empty English words."""
        entry = Entry(english='', ancient='stílibra', modern='stílibra')
        should_exclude, reason = builder.should_exclude(entry)
        assert should_exclude
        assert 'empty' in reason

    def test_should_exclude_no_translations(self, builder):
        """Test exclusion of entries with no translations."""
        entry = Entry(english='balance', ancient=None, modern=None)
        should_exclude, reason = builder.should_exclude(entry)
        assert should_exclude
        assert 'translation' in reason

    def test_resolve_conflict_same_entries(self, builder):
        """Test conflict resolution with identical entries."""
        entry1 = Entry(english='balance', ancient='stílibra', modern='stílibra')
        entry2 = Entry(english='balance', ancient='stílibra', modern='stílibra')

        resolved = builder.resolve_conflict('balance', [entry1, entry2])
        assert resolved.english == 'balance'
        assert resolved.ancient == 'stílibra'
        assert resolved.modern == 'stílibra'

    def test_resolve_conflict_different_confidence(self, builder):
        """Test conflict resolution with different confidence scores."""
        entry1 = Entry(english='balance', ancient='stílibra', modern='stílibra', confidence=0.8)
        entry2 = Entry(english='balance', ancient='stílibra_alt', modern='stílibra_alt', confidence=0.9)

        resolved = builder.resolve_conflict('balance', [entry1, entry2])
        assert resolved.english == 'balance'
        # Should keep the higher confidence entry
        assert resolved.ancient == 'stílibra_alt'
        assert resolved.modern == 'stílibra_alt'

    def test_process_page(self, builder):
        """Test processing a parsed page."""
        from dict_importer.schema import ParsedPage

        entries = [
            Entry(english='balance', ancient='stílibra', modern='stílibra'),
            Entry(english='flame', ancient='flamë', modern='flama')
        ]
        page = ParsedPage(page_number=1, entries=entries)

        builder.process_page(page)
        assert len(builder.ancient_entries) == 2
        assert len(builder.modern_entries) == 2

    def test_build_dictionaries(self, builder):
        """Test building dictionaries."""
        entries = [
            Entry(english='balance', ancient='stílibra', modern='stílibra'),
            Entry(english='flame', ancient='flamë', modern='flama')
        ]

        for entry in entries:
            builder.process_entry(entry)

        builder.build_dictionaries()
        assert builder.build is not None
        assert len(builder.build.ancient_entries) == 2
        assert len(builder.build.modern_entries) == 2

    def test_handle_duplicate_entries(self, builder):
        """Test handling of duplicate entries."""
        entry = Entry(english='balance', ancient='stílibra', modern='stílibra')

        builder.process_entry(entry)
        builder.process_entry(entry)  # Duplicate

        assert len(builder.ancient_entries) == 1
        assert len(builder.modern_entries) == 1
        assert 'balance' in builder.ancient_entries

    def test_handle_conflicts(self, builder):
        """Test handling of conflicting entries."""
        entry1 = Entry(english='balance', ancient='stílibra', modern='stílibra')
        entry2 = Entry(english='balance', ancient='stílibra_alt', modern='stílibra_alt')

        builder.process_entry(entry1)
        builder.process_entry(entry2)

        # Should have conflicts
        assert 'balance' in builder.conflicts
        assert len(builder.conflicts['balance']) == 2

    def test_handle_variants(self, builder):
        """Test handling of variant entries."""
        entry1 = Entry(english='balance', ancient='stílibra', modern='stílibra')
        entry2 = Entry(english='balance', ancient='stílibra_alt', modern='stílibra_alt')

        builder.process_entry(entry1)
        builder.process_entry(entry2)

        # Should have variants
        assert 'balance' in builder.variants
        assert len(builder.variants['balance']) == 2

    def test_build_statistics(self, builder):
        """Test build statistics generation."""
        entries = [
            Entry(english='balance', ancient='stílibra', modern='stílibra'),
            Entry(english='flame', ancient='flamë', modern='flama')
        ]

        for entry in entries:
            builder.process_entry(entry)

        builder.build_dictionaries()
        assert builder.build is not None
        assert builder.build.build_stats['total_ancient'] == 2
        assert builder.build.build_stats['total_modern'] == 2

    def test_exclude_terms_functionality(self):
        """Test exclude terms functionality."""
        exclude_terms = {'test', 'example', 'debug'}
        builder = DictionaryBuilder(exclude_terms)

        entries = [
            Entry(english='balance', ancient='stílibra', modern='stílibra'),
            Entry(english='test', ancient='test_libran', modern='test_libran'),
            Entry(english='example', ancient='example_libran', modern='example_libran'),
            Entry(english='flame', ancient='flamë', modern='flama')
        ]

        for entry in entries:
            builder.process_entry(entry)

        # Only non-excluded entries should be processed
        assert 'balance' in builder.ancient_entries
        assert 'flame' in builder.ancient_entries
        assert 'test' not in builder.ancient_entries
        assert 'example' not in builder.ancient_entries

    def test_error_handling(self, builder):
        """Test error handling for malformed entries."""
        # Test with None values
        entry = Entry(english='balance', ancient=None, modern=None)
        builder.process_entry(entry)
        
        # Should not crash, but entry should be excluded
        assert 'balance' not in builder.ancient_entries
        assert 'balance' not in builder.modern_entries

    def test_confidence_handling(self, builder):
        """Test confidence score handling."""
        entry1 = Entry(english='balance', ancient='stílibra', modern='stílibra', confidence=0.8)
        entry2 = Entry(english='flame', ancient='flamë', modern='flama', confidence=0.9)

        builder.process_entry(entry1)
        builder.process_entry(entry2)

        assert len(builder.ancient_entries) == 2
        assert len(builder.modern_entries) == 2

    def test_source_page_handling(self, builder):
        """Test source page handling."""
        entry1 = Entry(english='balance', ancient='stílibra', modern='stílibra', source_page=1)
        entry2 = Entry(english='flame', ancient='flamë', modern='flama', source_page=2)

        builder.process_entry(entry1)
        builder.process_entry(entry2)

        assert len(builder.ancient_entries) == 2
        assert len(builder.modern_entries) == 2
