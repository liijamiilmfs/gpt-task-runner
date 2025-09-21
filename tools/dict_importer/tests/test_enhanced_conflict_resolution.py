"""
Enhanced tests for conflict resolution functionality using pytest
Tests conflict detection, resolution policies, and merge strategies
"""

import pytest
from dict_importer.build_dicts import DictionaryBuilder
from dict_importer.schema import Entry, DictionaryBuild


class TestConflictDetection:
    """Test conflict detection functionality."""

    @pytest.fixture
    def builder(self):
        """Create a DictionaryBuilder instance for testing."""
        return DictionaryBuilder()

    def test_detect_ancient_vs_modern_conflicts(self, builder):
        """Test detection of ancient vs modern conflicts."""
        entry1 = Entry(
            english='balance',
            ancient='stílibra',
            modern='stílibra'
        )
        
        entry2 = Entry(
            english='balance',
            ancient='stílibra_old',
            modern='stílibra_new'
        )

        builder.process_entry(entry1)
        builder.process_entry(entry2)

        conflicts = builder.get_conflicts()
        assert len(conflicts) == 1
        assert 'balance' in conflicts
        assert len(conflicts['balance']) == 2
        assert conflicts['balance'][0].english == 'balance'

    def test_detect_same_variant_conflicts(self, builder):
        """Test detection of same-variant conflicts."""
        entry1 = Entry(
            english='balance',
            ancient='stílibra',
            modern='stílibra'
        )
        
        entry2 = Entry(
            english='balance',
            ancient='stílibra_alt',
            modern='stílibra'
        )

        builder.process_entry(entry1)
        builder.process_entry(entry2)

        conflicts = builder.get_conflicts()
        assert len(conflicts) == 1

    def test_no_conflicts_for_different_words(self, builder):
        """Test that different words don't create conflicts."""
        entry1 = Entry(
            english='balance',
            ancient='stílibra',
            modern='stílibra'
        )
        
        entry2 = Entry(
            english='flame',
            ancient='flamë',
            modern='flama'
        )

        builder.process_entry(entry1)
        builder.process_entry(entry2)

        conflicts = builder.get_conflicts()
        assert len(conflicts) == 0

    def test_detect_multiple_conflicts(self, builder):
        """Test detection of multiple conflicts."""
        entries = [
            Entry(english='balance', ancient='stílibra', modern='stílibra'),
            Entry(english='balance', ancient='stílibra_alt', modern='stílibra_alt'),
            Entry(english='flame', ancient='flamë', modern='flama'),
            Entry(english='flame', ancient='flamë_alt', modern='flama_alt')
        ]

        for entry in entries:
            builder.process_entry(entry)

        conflicts = builder.get_conflicts()
        assert len(conflicts) == 2

    def test_detect_partial_conflicts(self, builder):
        """Test detection of partial conflicts."""
        entry1 = Entry(
            english='balance',
            ancient='stílibra',
            modern='stílibra'
        )
        
        entry2 = Entry(
            english='balance',
            ancient='stílibra',
            modern='stílibra_alt'
        )

        builder.process_entry(entry1)
        builder.process_entry(entry2)

        conflicts = builder.get_conflicts()
        assert len(conflicts) == 1


class TestResolutionPolicies:
    """Test conflict resolution policies."""

    @pytest.fixture
    def builder(self):
        """Create a DictionaryBuilder instance for testing."""
        return DictionaryBuilder()

    def test_resolve_by_confidence_score(self, builder):
        """Test resolution by confidence score."""
        entry1 = Entry(
            english='balance',
            ancient='stílibra',
            modern='stílibra',
            confidence=0.8
        )
        
        entry2 = Entry(
            english='balance',
            ancient='stílibra_alt',
            modern='stílibra_alt',
            confidence=0.9
        )

        builder.process_entry(entry1)
        builder.process_entry(entry2)

        resolved = builder.resolve_conflicts()
        assert len(resolved) == 1
        assert resolved[0].ancient == 'stílibra_alt'

    def test_resolve_by_source_page_priority(self, builder):
        """Test resolution by source page priority."""
        entry1 = Entry(
            english='balance',
            ancient='stílibra',
            modern='stílibra',
            source_page=1
        )
        
        entry2 = Entry(
            english='balance',
            ancient='stílibra_alt',
            modern='stílibra_alt',
            source_page=2
        )

        builder.process_entry(entry1)
        builder.process_entry(entry2)

        resolved = builder.resolve_conflicts()
        assert len(resolved) == 1
        assert resolved[0].source_page == 2

    def test_handle_ties_in_resolution_criteria(self, builder):
        """Test handling of ties in resolution criteria."""
        entry1 = Entry(
            english='balance',
            ancient='stílibra',
            modern='stílibra',
            confidence=0.8,
            source_page=1
        )
        
        entry2 = Entry(
            english='balance',
            ancient='stílibra_alt',
            modern='stílibra_alt',
            confidence=0.8,
            source_page=1
        )

        builder.process_entry(entry1)
        builder.process_entry(entry2)

        resolved = builder.resolve_conflicts()
        assert len(resolved) == 1
        # Should keep the first entry when tied
        assert resolved[0].ancient == 'stílibra'

    def test_resolve_multiple_conflicts(self, builder):
        """Test resolution of multiple conflicts."""
        entries = [
            Entry(english='balance', ancient='stílibra', modern='stílibra', confidence=0.8),
            Entry(english='balance', ancient='stílibra_alt', modern='stílibra_alt', confidence=0.9),
            Entry(english='flame', ancient='flamë', modern='flama', confidence=0.7),
            Entry(english='flame', ancient='flamë_alt', modern='flama_alt', confidence=0.8)
        ]

        for entry in entries:
            builder.process_entry(entry)

        resolved = builder.resolve_conflicts()
        assert len(resolved) == 2
        # Higher confidence entries should win
        assert resolved[0].ancient == 'stílibra_alt'
        assert resolved[1].ancient == 'flamë_alt'


class TestMergeStrategies:
    """Test merge strategies for entries."""

    @pytest.fixture
    def builder(self):
        """Create a DictionaryBuilder instance for testing."""
        return DictionaryBuilder()

    def test_merge_entries_with_complementary_data(self, builder):
        """Test merging entries with complementary data."""
        entry1 = Entry(
            english='balance',
            ancient='stílibra',
            modern=None,
            pos='n'
        )
        
        entry2 = Entry(
            english='balance',
            ancient=None,
            modern='stílibra',
            notes='Core concept'
        )

        builder.process_entry(entry1)
        builder.process_entry(entry2)

        merged = builder.merge_entries()
        assert len(merged) == 1
        assert merged[0].ancient == 'stílibra'
        assert merged[0].modern == 'stílibra'
        assert merged[0].pos == 'n'
        assert merged[0].notes == 'Core concept'

    def test_handle_partial_conflicts(self, builder):
        """Test handling of partial conflicts."""
        entry1 = Entry(
            english='balance',
            ancient='stílibra',
            modern='stílibra',
            confidence=0.8
        )
        
        entry2 = Entry(
            english='balance',
            ancient='stílibra',
            modern='stílibra_alt',
            confidence=0.9
        )

        builder.process_entry(entry1)
        builder.process_entry(entry2)

        merged = builder.merge_entries()
        assert len(merged) == 1
        assert merged[0].ancient == 'stílibra'
        assert merged[0].modern == 'stílibra_alt'  # Higher confidence wins

    def test_create_variant_entries_for_unresolved_conflicts(self, builder):
        """Test creation of variant entries for unresolved conflicts."""
        entry1 = Entry(
            english='balance',
            ancient='stílibra',
            modern='stílibra',
            confidence=0.8
        )
        
        entry2 = Entry(
            english='balance',
            ancient='stílibra_alt',
            modern='stílibra_alt',
            confidence=0.8
        )

        builder.process_entry(entry1)
        builder.process_entry(entry2)

        variants = builder.create_variants()
        assert len(variants) == 1
        assert variants[0].english == 'balance'

    def test_merge_with_different_pos_tags(self, builder):
        """Test merging entries with different POS tags."""
        entry1 = Entry(
            english='balance',
            ancient='stílibra',
            modern='stílibra',
            pos='n'
        )
        
        entry2 = Entry(
            english='balance',
            ancient='stílibra',
            modern='stílibra',
            pos='v'
        )

        builder.process_entry(entry1)
        builder.process_entry(entry2)

        merged = builder.merge_entries()
        assert len(merged) == 1
        # Should keep the first POS tag
        assert merged[0].pos == 'n'


class TestExclusionHandling:
    """Test exclusion handling functionality."""

    def test_exclude_entries_based_on_exclude_list(self):
        """Test exclusion of entries based on exclude list."""
        exclude_terms = {'test', 'example'}
        builder = DictionaryBuilder(exclude_terms)

        entry1 = Entry(
            english='balance',
            ancient='stílibra',
            modern='stílibra'
        )
        
        entry2 = Entry(
            english='test',
            ancient='test_libran',
            modern='test_libran'
        )

        builder.process_entry(entry1)
        builder.process_entry(entry2)

        excluded = builder.get_excluded_entries()
        assert len(excluded) == 1
        assert excluded[0].english == 'test'

    def test_exclude_entries_with_low_confidence(self):
        """Test exclusion of entries with low confidence."""
        builder = DictionaryBuilder()
        entry = Entry(
            english='balance',
            ancient='stílibra',
            modern='stílibra',
            confidence=0.3
        )

        builder.process_entry(entry)
        builder.filter_low_confidence(0.5)

        excluded = builder.get_excluded_entries()
        assert len(excluded) == 1
        assert excluded[0].english == 'balance'

    def test_exclude_entries_with_missing_translations(self):
        """Test exclusion of entries with missing translations."""
        builder = DictionaryBuilder()
        entry = Entry(
            english='balance',
            ancient=None,
            modern=None
        )

        builder.process_entry(entry)
        builder.filter_incomplete_entries()

        excluded = builder.get_excluded_entries()
        assert len(excluded) == 1
        assert excluded[0].english == 'balance'

    def test_exclude_entries_with_empty_english(self):
        """Test exclusion of entries with empty English words."""
        builder = DictionaryBuilder()
        entry = Entry(
            english='',
            ancient='stílibra',
            modern='stílibra'
        )

        builder.process_entry(entry)
        builder.filter_incomplete_entries()

        excluded = builder.get_excluded_entries()
        assert len(excluded) == 1
        assert excluded[0].english == ''

    def test_exclude_entries_with_placeholder_translations(self):
        """Test exclusion of entries with placeholder translations."""
        builder = DictionaryBuilder()
        entry = Entry(
            english='balance',
            ancient='—',
            modern='N/A'
        )

        builder.process_entry(entry)
        builder.filter_placeholder_entries()

        excluded = builder.get_excluded_entries()
        assert len(excluded) == 1
        assert excluded[0].english == 'balance'


class TestDictionaryBuilding:
    """Test dictionary building functionality."""

    @pytest.fixture
    def builder(self):
        """Create a DictionaryBuilder instance for testing."""
        return DictionaryBuilder()

    def test_build_complete_dictionaries(self, builder):
        """Test building of complete dictionaries."""
        entries = [
            Entry(english='balance', ancient='stílibra', modern='stílibra'),
            Entry(english='flame', ancient='flamë', modern='flama')
        ]

        for entry in entries:
            builder.process_entry(entry)
        
        build = builder.build_dictionaries()

        assert 'balance' in build.ancient_entries
        assert build.ancient_entries['balance'] == 'stílibra'
        assert 'flame' in build.ancient_entries
        assert build.ancient_entries['flame'] == 'flamë'
        assert 'balance' in build.modern_entries
        assert build.modern_entries['balance'] == 'stílibra'
        assert 'flame' in build.modern_entries
        assert build.modern_entries['flame'] == 'flama'

    def test_handle_mixed_ancient_modern_entries(self, builder):
        """Test handling of mixed ancient/modern entries."""
        entries = [
            Entry(english='balance', ancient='stílibra', modern=None),
            Entry(english='flame', ancient=None, modern='flama')
        ]

        for entry in entries:
            builder.process_entry(entry)
        
        build = builder.build_dictionaries()

        assert 'balance' in build.ancient_entries
        assert 'balance' not in build.modern_entries
        assert 'flame' not in build.ancient_entries
        assert 'flame' in build.modern_entries

    def test_generate_build_statistics(self, builder):
        """Test generation of build statistics."""
        entries = [
            Entry(english='balance', ancient='stílibra', modern='stílibra'),
            Entry(english='flame', ancient='flamë', modern='flama')
        ]

        for entry in entries:
            builder.process_entry(entry)
        
        build = builder.build_dictionaries()

        assert build.build_stats['total_ancient'] == 2
        assert build.build_stats['total_modern'] == 2
        assert build.build_stats['conflicts_resolved'] == 0
        assert build.build_stats['entries_excluded'] == 0

    def test_handle_duplicate_entries(self, builder):
        """Test handling of duplicate entries."""
        entry = Entry(english='balance', ancient='stílibra', modern='stílibra')

        builder.process_entry(entry)
        builder.process_entry(entry)  # Duplicate

        build = builder.build_dictionaries()
        assert 'balance' in build.ancient_entries
        assert build.ancient_entries['balance'] == 'stílibra'

    def test_build_with_conflicts_and_resolution(self, builder):
        """Test building with conflicts and resolution."""
        entries = [
            Entry(english='balance', ancient='stílibra', modern='stílibra', confidence=0.8),
            Entry(english='balance', ancient='stílibra_alt', modern='stílibra_alt', confidence=0.9)
        ]

        for entry in entries:
            builder.process_entry(entry)

        builder.resolve_conflicts()
        build = builder.build_dictionaries()

        assert 'balance' in build.ancient_entries
        assert build.ancient_entries['balance'] == 'stílibra_alt'  # Higher confidence wins
        assert build.build_stats['conflicts_resolved'] == 1


class TestErrorHandling:
    """Test error handling functionality."""

    @pytest.fixture
    def builder(self):
        """Create a DictionaryBuilder instance for testing."""
        return DictionaryBuilder()

    def test_handle_malformed_entries_gracefully(self, builder):
        """Test graceful handling of malformed entries."""
        entry = Entry(english='', ancient='stílibra', modern='stílibra')

        # Should not raise an exception
        builder.process_entry(entry)
        excluded = builder.get_excluded_entries()
        assert len(excluded) == 1

    def test_handle_duplicate_processing(self, builder):
        """Test handling of duplicate processing."""
        entry = Entry(english='balance', ancient='stílibra', modern='stílibra')

        builder.process_entry(entry)
        builder.process_entry(entry)  # Duplicate

        conflicts = builder.get_conflicts()
        assert len(conflicts) == 0  # Should not create self-conflict

    def test_handle_none_values(self, builder):
        """Test handling of None values."""
        entry = Entry(english='balance', ancient=None, modern=None)

        builder.process_entry(entry)
        excluded = builder.get_excluded_entries()
        assert len(excluded) == 1

    def test_handle_invalid_confidence_values(self, builder):
        """Test handling of invalid confidence values."""
        entry = Entry(
            english='balance',
            ancient='stílibra',
            modern='stílibra',
            confidence=-0.5  # Invalid confidence
        )

        builder.process_entry(entry)
        # Should handle gracefully
        assert True  # If we get here, no exception was raised
