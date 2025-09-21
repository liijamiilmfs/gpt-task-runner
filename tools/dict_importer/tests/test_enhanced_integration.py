"""
Enhanced integration tests for the complete parsing pipeline using pytest
Tests end-to-end workflows from PDF text to final dictionaries
"""

import pytest
from dict_importer.parse_tables import TableParser
from dict_importer.build_dicts import DictionaryBuilder
from dict_importer.normalize import normalize_text
from dict_importer.schema import Entry, ParsedPage


class TestEndToEndDictionaryProcessing:
    """Test end-to-end dictionary processing."""

    @pytest.fixture
    def parser(self):
        """Create a TableParser instance for testing."""
        return TableParser()

    @pytest.fixture
    def builder(self):
        """Create a DictionaryBuilder instance for testing."""
        return DictionaryBuilder()

    def test_process_complete_dual_table_page(self, parser, builder):
        """Test processing of complete dual table page."""
        page_text = """English | Ancient | Modern
balance | stílibra | stílibra
flame   | flamë    | flama
memory  | memoror  | memoria

English | Ancient | Modern
anger   | íra     | íra
fear    | felë    | felë"""

        # Parse the page
        parsed_page = parser.parse_page(page_text, 1)
        assert len(parsed_page.entries) == 5

        # Process entries through builder
        for entry in parsed_page.entries:
            builder.process_entry(entry)
        build = builder.build_dictionaries()

        # Verify results
        assert 'balance' in build.ancient_entries
        assert build.ancient_entries['balance'] == 'stílibra'
        assert 'flame' in build.ancient_entries
        assert build.ancient_entries['flame'] == 'flamë'
        assert 'memory' in build.ancient_entries
        assert build.ancient_entries['memory'] == 'memoror'
        assert 'anger' in build.ancient_entries
        assert build.ancient_entries['anger'] == 'íra'
        assert 'fear' in build.ancient_entries
        assert build.ancient_entries['fear'] == 'felë'

        assert 'balance' in build.modern_entries
        assert build.modern_entries['balance'] == 'stílibra'
        assert 'flame' in build.modern_entries
        assert build.modern_entries['flame'] == 'flama'
        assert 'memory' in build.modern_entries
        assert build.modern_entries['memory'] == 'memoria'
        assert 'anger' in build.modern_entries
        assert build.modern_entries['anger'] == 'íra'
        assert 'fear' in build.modern_entries
        assert build.modern_entries['fear'] == 'felë'

    def test_handle_mixed_table_layouts(self, parser, builder):
        """Test handling of mixed table layouts."""
        page_text = """English | Ancient
balance | stílibra
flame   | flamë

English | Modern
balance | stílibra
flame   | flama"""

        parsed_page = parser.parse_page(page_text, 1)
        assert len(parsed_page.entries) == 4

        for entry in parsed_page.entries:
            builder.process_entry(entry)
        build = builder.build_dictionaries()

        # Should merge entries with same English word
        assert 'balance' in build.ancient_entries
        assert build.ancient_entries['balance'] == 'stílibra'
        assert 'flame' in build.ancient_entries
        assert build.ancient_entries['flame'] == 'flamë'
        assert 'balance' in build.modern_entries
        assert build.modern_entries['balance'] == 'stílibra'
        assert 'flame' in build.modern_entries
        assert build.modern_entries['flame'] == 'flama'

    def test_handle_text_normalization_in_pipeline(self, parser, builder):
        """Test handling of text normalization in pipeline."""
        page_text = """English | Ancient | Modern
café    | stílibra | stílibra
naïve   | flamë    | flama
résumé  | memoror  | memoria"""

        # Normalize text first
        normalized_text = normalize_text(page_text)
        parsed_page = parser.parse_page(normalized_text, 1)
        
        assert len(parsed_page.entries) == 3
        assert parsed_page.entries[0].english == 'cafe'
        assert parsed_page.entries[1].english == 'naive'
        assert parsed_page.entries[2].english == 'resume'

    def test_handle_hyphen_restoration_in_pipeline(self, parser, builder):
        """Test handling of hyphen restoration in pipeline."""
        page_text = """English | Ancient | Modern
trans-  | stílibra | stílibra
lation  |         |
under-  | flamë    | flama
standing|         |"""

        parsed_page = parser.parse_page(page_text, 1)
        assert len(parsed_page.entries) == 2
        assert parsed_page.entries[0].english == 'translation'
        assert parsed_page.entries[1].english == 'understanding'


class TestConflictResolutionPipeline:
    """Test conflict resolution pipeline."""

    @pytest.fixture
    def parser(self):
        """Create a TableParser instance for testing."""
        return TableParser()

    @pytest.fixture
    def builder(self):
        """Create a DictionaryBuilder instance for testing."""
        return DictionaryBuilder()

    def test_resolve_conflicts_in_complete_pipeline(self, parser, builder):
        """Test resolution of conflicts in complete pipeline."""
        page1_text = """English | Ancient | Modern
balance | stílibra | stílibra
flame   | flamë    | flama"""

        page2_text = """English | Ancient | Modern
balance | stílibra_alt | stílibra_alt
flame   | flamë_alt    | flama_alt"""

        # Parse both pages
        page1 = parser.parse_page(page1_text, 1)
        page2 = parser.parse_page(page2_text, 2)

        # Process all entries
        all_entries = page1.entries + page2.entries
        for entry in all_entries:
            builder.process_entry(entry)

        # Resolve conflicts
        resolved = builder.resolve_conflicts()
        build = builder.build_dictionaries()

        # Should have resolved conflicts (higher page number wins)
        assert 'balance' in build.ancient_entries
        assert build.ancient_entries['balance'] == 'stílibra_alt'
        assert 'flame' in build.ancient_entries
        assert build.ancient_entries['flame'] == 'flamë_alt'
        assert 'balance' in build.modern_entries
        assert build.modern_entries['balance'] == 'stílibra_alt'
        assert 'flame' in build.modern_entries
        assert build.modern_entries['flame'] == 'flama_alt'

    def test_create_variants_for_unresolved_conflicts(self, parser, builder):
        """Test creation of variants for unresolved conflicts."""
        page1_text = """English | Ancient | Modern
balance | stílibra | stílibra"""

        page2_text = """English | Ancient | Modern
balance | stílibra_alt | stílibra_alt"""

        page1 = parser.parse_page(page1_text, 1)
        page2 = parser.parse_page(page2_text, 2)

        all_entries = page1.entries + page2.entries
        for entry in all_entries:
            builder.process_entry(entry)

        variants = builder.create_variants()
        build = builder.build_dictionaries()

        assert len(variants) == 1
        assert variants[0].english == 'balance'
        assert len(build.variant_entries) == 1


class TestExclusionPipeline:
    """Test exclusion pipeline."""

    @pytest.fixture
    def parser(self):
        """Create a TableParser instance for testing."""
        return TableParser()

    def test_exclude_terms_throughout_pipeline(self, parser):
        """Test exclusion of terms throughout pipeline."""
        exclude_terms = {'test', 'example'}
        builder = DictionaryBuilder(exclude_terms)

        page_text = """English | Ancient | Modern
balance | stílibra | stílibra
test    | test_libran | test_libran
flame   | flamë    | flama
example | example_libran | example_libran"""

        parsed_page = parser.parse_page(page_text, 1)
        for entry in parsed_page.entries:
            builder.process_entry(entry)

        build = builder.build_dictionaries()
        excluded = builder.get_excluded_entries()

        assert 'balance' in build.ancient_entries
        assert build.ancient_entries['balance'] == 'stílibra'
        assert 'flame' in build.ancient_entries
        assert build.ancient_entries['flame'] == 'flamë'
        assert 'test' not in build.ancient_entries
        assert 'example' not in build.ancient_entries

        assert len(excluded) == 2
        assert any(e.english == 'test' for e in excluded)
        assert any(e.english == 'example' for e in excluded)

    def test_filter_low_confidence_entries(self, parser):
        """Test filtering of low confidence entries."""
        builder = DictionaryBuilder()
        page_text = """English | Ancient | Modern
balance | stílibra | stílibra
flame   | flamë    | flama"""

        parsed_page = parser.parse_page(page_text, 1)
        
        # Manually set low confidence
        parsed_page.entries[0].confidence = 0.3
        parsed_page.entries[1].confidence = 0.8

        for entry in parsed_page.entries:
            builder.process_entry(entry)
        builder.filter_low_confidence(0.5)

        build = builder.build_dictionaries()
        excluded = builder.get_excluded_entries()

        assert 'flame' in build.ancient_entries
        assert build.ancient_entries['flame'] == 'flamë'
        assert 'balance' not in build.ancient_entries
        assert len(excluded) == 1
        assert excluded[0].english == 'balance'


class TestErrorRecovery:
    """Test error recovery functionality."""

    @pytest.fixture
    def parser(self):
        """Create a TableParser instance for testing."""
        return TableParser()

    def test_handle_malformed_table_data_gracefully(self, parser):
        """Test graceful handling of malformed table data."""
        page_text = """English | Ancient | Modern
| | 
balance | stílibra | stílibra
| | stílibra
flame   | flamë    | flama
| | | | |"""

        parsed_page = parser.parse_page(page_text, 1)
        assert len(parsed_page.entries) == 2
        assert parsed_page.entries[0].english == 'balance'
        assert parsed_page.entries[1].english == 'flame'

    def test_handle_empty_pages(self, parser):
        """Test handling of empty pages."""
        page_text = """This is just some text
with no table structure
at all."""

        parsed_page = parser.parse_page(page_text, 1)
        assert len(parsed_page.entries) == 0

    def test_handle_pages_with_only_headers(self, parser):
        """Test handling of pages with only headers."""
        page_text = """English | Ancient | Modern"""

        parsed_page = parser.parse_page(page_text, 1)
        assert len(parsed_page.entries) == 0

    def test_handle_pages_with_mixed_content(self, parser):
        """Test handling of pages with mixed content."""
        page_text = """Some header text
English | Ancient | Modern
balance | stílibra | stílibra
flame   | flamë    | flama
Some footer text"""

        parsed_page = parser.parse_page(page_text, 1)
        assert len(parsed_page.entries) == 2
        assert parsed_page.entries[0].english == 'balance'
        assert parsed_page.entries[1].english == 'flame'


class TestPerformanceAndScalability:
    """Test performance and scalability."""

    @pytest.fixture
    def parser(self):
        """Create a TableParser instance for testing."""
        return TableParser()

    @pytest.fixture
    def builder(self):
        """Create a DictionaryBuilder instance for testing."""
        return DictionaryBuilder()

    def test_handle_large_page_processing(self, parser, builder):
        """Test handling of large page processing."""
        entries = []
        for i in range(100):
            entries.append(f"word{i:03d} | libran{i:03d}Ancient | libran{i:03d}Modern")

        page_text = f"English | Ancient | Modern\n{chr(10).join(entries)}"
        parsed_page = parser.parse_page(page_text, 1)

        assert len(parsed_page.entries) == 100
        
        for entry in parsed_page.entries:
            builder.process_entry(entry)
        build = builder.build_dictionaries()

        assert 'word000' in build.ancient_entries
        assert build.ancient_entries['word000'] == 'libran000Ancient'
        assert 'word099' in build.ancient_entries
        assert build.ancient_entries['word099'] == 'libran099Ancient'

    def test_handle_multiple_pages_efficiently(self, parser, builder):
        """Test handling of multiple pages efficiently."""
        pages = []
        for page_num in range(1, 11):
            entries = []
            for i in range(10):
                word_num = (page_num - 1) * 10 + i
                entries.append(f"word{word_num:03d} | libran{word_num:03d}Ancient | libran{word_num:03d}Modern")
            pages.append(f"English | Ancient | Modern\n{chr(10).join(entries)}")

        all_entries = []
        for page_text in pages:
            parsed_page = parser.parse_page(page_text, pages.index(page_text) + 1)
            all_entries.extend(parsed_page.entries)

        assert len(all_entries) == 100
        
        for entry in all_entries:
            builder.process_entry(entry)
        build = builder.build_dictionaries()

        assert 'word000' in build.ancient_entries
        assert build.ancient_entries['word000'] == 'libran000Ancient'
        assert 'word099' in build.ancient_entries
        assert build.ancient_entries['word099'] == 'libran099Ancient'

    def test_handle_memory_efficiently(self, parser, builder):
        """Test memory-efficient processing."""
        # Process many entries without running out of memory
        for page_num in range(1, 21):  # 20 pages
            entries = []
            for i in range(50):  # 50 entries per page
                word_num = (page_num - 1) * 50 + i
                entries.append(f"word{word_num:04d} | libran{word_num:04d}Ancient | libran{word_num:04d}Modern")
            
            page_text = f"English | Ancient | Modern\n{chr(10).join(entries)}"
            parsed_page = parser.parse_page(page_text, page_num)
            
            for entry in parsed_page.entries:
                builder.process_entry(entry)

        build = builder.build_dictionaries()
        assert len(build.ancient_entries) == 1000  # 20 pages * 50 entries


class TestIntegrationFixtures:
    """Test with various integration fixtures."""

    @pytest.fixture
    def parser(self):
        """Create a TableParser instance for testing."""
        return TableParser()

    @pytest.fixture
    def builder(self):
        """Create a DictionaryBuilder instance for testing."""
        return DictionaryBuilder()

    @pytest.fixture
    def sample_complex_page_text(self):
        """Sample complex page text for testing."""
        return """English | Ancient | Modern
balance | stílibra | stílibra
flame   | flamë    | flama
memory  | memoror  | memoria

English | Ancient | Modern
anger   | íra     | íra
fear    | felë    | felë

English | Ancient
peace   | aman
water   | maa"""

    def test_parse_sample_complex_page(self, parser, builder, sample_complex_page_text):
        """Test parsing of sample complex page."""
        parsed_page = parser.parse_page(sample_complex_page_text, 1)
        assert len(parsed_page.entries) == 7

        for entry in parsed_page.entries:
            builder.process_entry(entry)
        build = builder.build_dictionaries()

        # Check specific entries
        assert 'balance' in build.ancient_entries
        assert build.ancient_entries['balance'] == 'stílibra'
        assert 'flame' in build.ancient_entries
        assert build.ancient_entries['flame'] == 'flamë'
        assert 'memory' in build.ancient_entries
        assert build.ancient_entries['memory'] == 'memoror'
        assert 'anger' in build.ancient_entries
        assert build.ancient_entries['anger'] == 'íra'
        assert 'fear' in build.ancient_entries
        assert build.ancient_entries['fear'] == 'felë'
        assert 'peace' in build.ancient_entries
        assert build.ancient_entries['peace'] == 'aman'
        assert 'water' in build.ancient_entries
        assert build.ancient_entries['water'] == 'maa'

        # Check modern entries
        assert 'balance' in build.modern_entries
        assert build.modern_entries['balance'] == 'stílibra'
        assert 'flame' in build.modern_entries
        assert build.modern_entries['flame'] == 'flama'
        assert 'memory' in build.modern_entries
        assert build.modern_entries['memory'] == 'memoria'
        assert 'anger' in build.modern_entries
        assert build.modern_entries['anger'] == 'íra'
        assert 'fear' in build.modern_entries
        assert build.modern_entries['fear'] == 'felë'
        # peace and water should not be in modern entries (ancient only)
        assert 'peace' not in build.modern_entries
        assert 'water' not in build.modern_entries

    @pytest.fixture
    def sample_conflict_page_text(self):
        """Sample conflict page text for testing."""
        return """English | Ancient | Modern
balance | stílibra | stílibra
flame   | flamë    | flama

English | Ancient | Modern
balance | stílibra_alt | stílibra_alt
flame   | flamë_alt    | flama_alt"""

    def test_parse_sample_conflict_page(self, parser, builder, sample_conflict_page_text):
        """Test parsing of sample conflict page."""
        parsed_page = parser.parse_page(sample_conflict_page_text, 1)
        assert len(parsed_page.entries) == 4

        for entry in parsed_page.entries:
            builder.process_entry(entry)

        # Should have conflicts
        conflicts = builder.get_conflicts()
        assert len(conflicts) == 2

        # Resolve conflicts
        resolved = builder.resolve_conflicts()
        build = builder.build_dictionaries()

        # Should have resolved conflicts (higher page number wins)
        assert 'balance' in build.ancient_entries
        assert build.ancient_entries['balance'] == 'stílibra_alt'
        assert 'flame' in build.ancient_entries
        assert build.ancient_entries['flame'] == 'flamë_alt'
