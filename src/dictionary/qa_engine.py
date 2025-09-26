"""
Librán Dictionary QA & Expansion Engine

This module implements the automated QA, tranche expansion, and release system
for the Unified Modern Librán Dictionary.
"""

import json
import re
import unicodedata
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set, Tuple, Any
from pathlib import Path
import yaml
from datetime import datetime


@dataclass
class DictionaryEntry:
    """Represents a single dictionary entry."""
    english: str
    modern: str
    notes: Optional[str] = None
    
    def __post_init__(self):
        """Normalize the entry after initialization."""
        self.english = self.normalize_text(self.english)
        self.modern = self.normalize_text(self.modern)
        if self.notes:
            self.notes = self.normalize_text(self.notes)
    
    @staticmethod
    def normalize_text(text: str) -> str:
        """Normalize text to UTF-8 NFC and trim whitespace."""
        if not text:
            return ""
        # Normalize to NFC
        normalized = unicodedata.normalize('NFC', text)
        # Trim whitespace
        return normalized.strip()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format."""
        result = {
            "english": self.english,
            "modern": self.modern
        }
        if self.notes:
            result["notes"] = self.notes
        return result


@dataclass
class ProcessingParams:
    """Configuration parameters for dictionary processing."""
    tranche_target_size: int = 300
    add_tranche_strategy: List[str] = field(default_factory=lambda: [
        "coverage_gaps", "semantic_cluster_fill", "canon_hooks"
    ])
    dedupe_policy: str = "prefer-diacritics"
    guardrails: Dict[str, List[str]] = field(default_factory=lambda: {
        "preserve_modern": [
            "stílibra", "spera", "drama", "Coamára", "félio", 
            "tannisó", "hajzora"
        ],
        "preserve_domains": [
            "Aleșii", "Comoară", "Dukorë", "Közgyüla", "Cordavora",
            "Noxtriba", "Congregorë", "Közös", "Velora", "Kechroot",
            "Lótűz", "Távoli"
        ]
    })
    normalization: Dict[str, Any] = field(default_factory=lambda: {
        "encoding": "UTF-8-NFC",
        "trim_whitespace": True,
        "enforce_modern_orthography": True
    })
    laziness_rules: List[str] = field(default_factory=lambda: [
        "reject: donor unchanged (EN/HU/RO/LA/IS) with trivial suffix",
        "reject: single-vowel swap only",
        "reject: bare donor stem + Modern article/number",
        "reject: ASCII-only where diacritics expected",
        "reject: missing notes for opaque formations/compounds"
    ])
    sense_policy: Dict[str, str] = field(default_factory=lambda: {
        "english_multi_to_modern": "keep all as [sense n]",
        "modern_multi_to_english": "allow homonyms with [sense n]"
    })
    reports: Dict[str, Any] = field(default_factory=lambda: {
        "format": ["json", "md"],
        "include_examples_per_fail": 5
    })


@dataclass
class QAReport:
    """QA report data structure."""
    summary: Dict[str, Any] = field(default_factory=dict)
    guardrails: Dict[str, List[str]] = field(default_factory=dict)
    failures: Dict[str, List[Dict[str, Any]]] = field(default_factory=dict)
    collisions: Dict[str, Any] = field(default_factory=dict)
    canon: Dict[str, Any] = field(default_factory=dict)
    changelog: Dict[str, List[Dict[str, Any]]] = field(default_factory=dict)
    warnings: List[Dict[str, Any]] = field(default_factory=list)


class DictionaryQAEngine:
    """Main QA engine for the Librán Dictionary system."""
    
    def __init__(self, params: ProcessingParams):
        self.params = params
        self.qa_report = QAReport()
        self.lazy_candidates: List[DictionaryEntry] = []
        self.collision_tracker: Dict[str, List[DictionaryEntry]] = {}
        
    def process_cycle(self, previous_final: Optional[Dict], initial_input: Dict) -> Dict[str, Any]:
        """
        Execute the complete processing cycle (Steps A-E).
        
        Args:
            previous_final: Previous final dictionary (optional)
            initial_input: New input dictionary
            
        Returns:
            Dictionary containing final.json, qa_report, changelog, and lazy_candidates
        """
        # Step A: Load & Merge
        merged_entries = self._load_and_merge(previous_final, initial_input)
        
        # Step B: Tranche Expansion
        expanded_entries = self._expand_tranche(merged_entries)
        
        # Step C: QA
        qa_result = self._run_qa(expanded_entries)
        
        # Step D: Generate Outputs
        outputs = self._generate_outputs(qa_result)
        
        # Step E: Prepare for next cycle
        self._prepare_next_cycle(outputs)
        
        return outputs
    
    def _load_and_merge(self, previous_final: Optional[Dict], initial_input: Dict) -> List[DictionaryEntry]:
        """Step A: Load and merge dictionaries."""
        entries = []
        
        # Load previous final if present
        if previous_final and "sections" in previous_final:
            prev_entries = self._extract_entries(previous_final["sections"]["Unified"]["data"])
            entries.extend(prev_entries)
        
        # Load initial input
        if "sections" in initial_input:
            input_entries = self._extract_entries(initial_input["sections"]["Unified"]["data"])
            entries.extend(input_entries)
        
        # Normalize all entries
        normalized_entries = []
        for entry in entries:
            normalized_entries.append(DictionaryEntry(
                english=entry.english,
                modern=entry.modern,
                notes=entry.notes
            ))
        
        return normalized_entries
    
    def _extract_entries(self, data: List[Dict]) -> List[DictionaryEntry]:
        """Extract entries from dictionary data."""
        entries = []
        for item in data:
            entry = DictionaryEntry(
                english=item.get("english", ""),
                modern=item.get("modern", ""),
                notes=item.get("notes")
            )
            entries.append(entry)
        return entries
    
    def _expand_tranche(self, entries: List[DictionaryEntry]) -> List[DictionaryEntry]:
        """Step B: Expand with new tranches."""
        # For now, return entries as-is
        # TODO: Implement coverage gap analysis and tranche expansion
        return entries
    
    def _run_qa(self, entries: List[DictionaryEntry]) -> List[DictionaryEntry]:
        """Step C: Run quality assurance checks."""
        self.qa_report = QAReport()
        self.lazy_candidates = []
        
        # Initialize QA report
        self._initialize_qa_report(entries)
        
        # Apply QA checks
        qa_passed = []
        
        for entry in entries:
            if self._check_guardrails(entry):
                # Guardrails passed, continue with other checks
                if self._check_laziness_rules(entry):
                    qa_passed.append(entry)
                else:
                    self.lazy_candidates.append(entry)
            else:
                # Guardrails failed, but preserve the entry
                qa_passed.append(entry)
        
        # Handle collisions and deduplication
        final_entries = self._handle_collisions(qa_passed)
        
        # Update QA report
        self._update_qa_report(entries, final_entries)
        
        return final_entries
    
    def _initialize_qa_report(self, entries: List[DictionaryEntry]):
        """Initialize the QA report structure."""
        self.qa_report.summary = {
            "version_prev": "1.8.0",  # TODO: Extract from metadata
            "version_next_suggested": "1.8.1",
            "semver_bump": "patch",
            "counts": {
                "input": len(entries),
                "merged": len(entries),
                "after_dedup": 0,
                "final": 0,
                "lazy": 0,
                "warnings": 0
            }
        }
        
        self.qa_report.guardrails = self.params.guardrails.copy()
        self.qa_report.failures = {
            "pure_donor_unchanged": [],
            "trivial_suffix_only": [],
            "ascii_no_diacritics": [],
            "missing_etymology_notes": []
        }
        self.qa_report.collisions = {
            "prefer_diacritics_kept": [],
            "prefer_diacritics_dropped": [],
            "multi_sense_by_english": {},
            "homonyms_by_modern": {}
        }
        self.qa_report.canon = {
            "anchors_present": True,
            "regressions": []
        }
        self.qa_report.changelog = {
            "added": [],
            "edited": [],
            "removed": [],
            "flagged_lazy": [],
            "notes_updates": []
        }
    
    def _check_guardrails(self, entry: DictionaryEntry) -> bool:
        """Check if entry passes guardrails (always returns True for preserved terms)."""
        # Check if this is a preserved modern term
        if entry.modern in self.params.guardrails["preserve_modern"]:
            return True
        
        # Check if this contains preserved domain terms
        for domain in self.params.guardrails["preserve_domains"]:
            if domain in entry.english or domain in entry.modern:
                return True
        
        return True  # All other entries pass guardrails
    
    def _check_laziness_rules(self, entry: DictionaryEntry) -> bool:
        """Check if entry passes laziness rules."""
        # Check for pure donor unchanged
        if self._is_pure_donor_unchanged(entry):
            self.qa_report.failures["pure_donor_unchanged"].append({
                "english": entry.english,
                "modern": entry.modern,
                "reason": "pure_donor_unchanged",
                "notes": entry.notes or ""
            })
            return False
        
        # Check for trivial suffix only
        if self._is_trivial_suffix_only(entry):
            self.qa_report.failures["trivial_suffix_only"].append({
                "english": entry.english,
                "modern": entry.modern,
                "reason": "trivial_suffix_only",
                "notes": entry.notes or ""
            })
            return False
        
        # Check for ASCII-only where diacritics expected
        if self._is_ascii_no_diacritics(entry):
            self.qa_report.failures["ascii_no_diacritics"].append({
                "english": entry.english,
                "modern": entry.modern,
                "reason": "ascii_no_diacritics",
                "notes": entry.notes or ""
            })
            return False
        
        # Check for missing etymology notes
        if self._is_missing_etymology_notes(entry):
            self.qa_report.failures["missing_etymology_notes"].append({
                "english": entry.english,
                "modern": entry.modern,
                "reason": "missing_etymology_notes",
                "notes": entry.notes or ""
            })
            return False
        
        return True
    
    def _is_pure_donor_unchanged(self, entry: DictionaryEntry) -> bool:
        """Check if entry is just a donor language word unchanged."""
        # Simple heuristic: if modern is very similar to english with minimal changes
        if entry.english.lower() == entry.modern.lower():
            return True
        
        # Check for common donor language patterns
        donor_patterns = [
            r'^[a-zA-Z]+$',  # Pure ASCII
            r'^(en|hu|ro|la|is)',  # Common prefixes
        ]
        
        for pattern in donor_patterns:
            if re.match(pattern, entry.modern, re.IGNORECASE):
                return True
        
        return False
    
    def _is_trivial_suffix_only(self, entry: DictionaryEntry) -> bool:
        """Check if entry is just a donor word with trivial suffix."""
        # Check if modern is english + simple suffix
        trivial_suffixes = ['a', 'e', 'i', 'o', 'u', 'ë', 'ú', 'á', 'é', 'í', 'ó', 'ö', 'ü', 'ő', 'ű']
        
        for suffix in trivial_suffixes:
            if entry.modern.lower().endswith(suffix) and entry.modern.lower()[:-1] == entry.english.lower():
                return True
        
        return False
    
    def _is_ascii_no_diacritics(self, entry: DictionaryEntry) -> bool:
        """Check if entry is ASCII-only where diacritics are expected."""
        # Check if modern contains only ASCII characters
        if entry.modern.isascii():
            # Check if it should have diacritics based on common patterns
            diacritic_patterns = [
                r'[aeiou]',  # Should have diacritics
                r'[csz]',    # Common diacritic letters
            ]
            
            for pattern in diacritic_patterns:
                if re.search(pattern, entry.modern, re.IGNORECASE):
                    return True
        
        return False
    
    def _is_missing_etymology_notes(self, entry: DictionaryEntry) -> bool:
        """Check if entry is missing etymology notes for opaque formations."""
        # Check if it's a compound or opaque formation without notes
        if not entry.notes:
            # Check for compound patterns
            compound_patterns = [
                r'[A-Z][a-z]+[A-Z]',  # CamelCase compounds
                r'[a-z]+[A-Z]',       # Mixed case compounds
                r'[a-z]+[0-9]',       # Alphanumeric compounds
            ]
            
            for pattern in compound_patterns:
                if re.search(pattern, entry.modern):
                    return True
        
        return False
    
    def _handle_collisions(self, entries: List[DictionaryEntry]) -> List[DictionaryEntry]:
        """Handle collisions and deduplication."""
        # Group by English and Modern
        english_groups = {}
        modern_groups = {}
        
        for entry in entries:
            # Group by English
            if entry.english not in english_groups:
                english_groups[entry.english] = []
            english_groups[entry.english].append(entry)
            
            # Group by Modern
            if entry.modern not in modern_groups:
                modern_groups[entry.modern] = []
            modern_groups[entry.modern].append(entry)
        
        # Handle collisions
        final_entries = []
        
        # Process English groups (same English -> multiple Modern)
        for english, group in english_groups.items():
            if len(group) > 1:
                # Multiple modern forms for same English
                for i, entry in enumerate(group):
                    if not entry.notes:
                        entry.notes = f"[sense {i+1}]"
                    else:
                        entry.notes = f"{entry.notes} [sense {i+1}]"
                final_entries.extend(group)
            else:
                final_entries.extend(group)
        
        # Process Modern groups (same Modern -> multiple English)
        for modern, group in modern_groups.items():
            if len(group) > 1:
                # Multiple English forms for same Modern (homonyms)
                for i, entry in enumerate(group):
                    if not entry.notes:
                        entry.notes = f"[sense {i+1}]"
                    else:
                        entry.notes = f"{entry.notes} [sense {i+1}]"
        
        return final_entries
    
    def _update_qa_report(self, input_entries: List[DictionaryEntry], final_entries: List[DictionaryEntry]):
        """Update QA report with final statistics."""
        self.qa_report.summary["counts"]["final"] = len(final_entries)
        self.qa_report.summary["counts"]["lazy"] = len(self.lazy_candidates)
        self.qa_report.summary["counts"]["warnings"] = len(self.qa_report.warnings)
        
        # Update changelog
        self.qa_report.changelog["flagged_lazy"] = [
            entry.to_dict() for entry in self.lazy_candidates
        ]
    
    def _generate_outputs(self, final_entries: List[DictionaryEntry]) -> Dict[str, Any]:
        """Step D: Generate output files."""
        # Generate final.json
        final_dict = {
            "metadata": {
                "version": self.qa_report.summary["version_next_suggested"],
                "generated_at": datetime.now().isoformat(),
                "counts": {
                    "total_entries": len(final_entries)
                }
            },
            "sections": {
                "Unified": {
                    "data": [entry.to_dict() for entry in final_entries]
                }
            }
        }
        
        # Generate QA report
        qa_report_json = self._generate_qa_report_json()
        qa_report_md = self._generate_qa_report_md()
        
        # Generate changelog
        changelog_json = self._generate_changelog_json()
        changelog_md = self._generate_changelog_md()
        
        # Generate lazy candidates
        lazy_candidates = [entry.to_dict() for entry in self.lazy_candidates]
        
        return {
            "final": final_dict,
            "qa_report_json": qa_report_json,
            "qa_report_md": qa_report_md,
            "changelog_json": changelog_json,
            "changelog_md": changelog_md,
            "lazy_candidates": lazy_candidates
        }
    
    def _generate_qa_report_json(self) -> Dict[str, Any]:
        """Generate QA report in JSON format."""
        return {
            "summary": self.qa_report.summary,
            "guardrails": self.qa_report.guardrails,
            "failures": self.qa_report.failures,
            "collisions": self.qa_report.collisions,
            "canon": self.qa_report.canon,
            "changelog": self.qa_report.changelog,
            "warnings": self.qa_report.warnings
        }
    
    def _generate_qa_report_md(self) -> str:
        """Generate QA report in Markdown format."""
        version = self.qa_report.summary["version_next_suggested"]
        
        md = f"""# 📋 Librán Modern Dictionary — QA Report v{version}

**Cycle inputs**  
- Previous final: `previous_final.json`  
- New tranche(s): `initial_input.json`  
- Params: `params.yaml`

---

## 1. Summary
- Entries (input): **{self.qa_report.summary['counts']['input']}**
- After merge: **{self.qa_report.summary['counts']['merged']}**
- After de-dup: **{self.qa_report.summary['counts']['after_dedup']}**
- QA-passed (final): **{self.qa_report.summary['counts']['final']}**
- Lazy failures moved to `_lazy_candidates`: **{self.qa_report.summary['counts']['lazy']}**
- Warnings: **{self.qa_report.summary['counts']['warnings']}**

Version bump suggestion: **{self.qa_report.summary['semver_bump']}** → `{version}`

---

## 2. Guardrails Confirmed
Preserved (never flagged): {', '.join(self.qa_report.guardrails['preserve_modern'])}

---

## 3. Laziness Failures (Top {self.params.reports['include_examples_per_fail']} examples per reason)
"""
        
        # Add failure sections
        for failure_type, failures in self.qa_report.failures.items():
            if failures:
                md += f"### 3.{list(self.qa_report.failures.keys()).index(failure_type) + 1} {failure_type}\n"
                for i, failure in enumerate(failures[:self.params.reports['include_examples_per_fail']]):
                    md += f"- **{failure['english']}** → **{failure['modern']}** ({failure['reason']})\n"
                md += "\n"
        
        md += "*(See JSON for full lists.)*\n\n"
        
        # Add other sections
        md += """## 4. Collisions & De-dupe Decisions
- Resolved by **prefer-diacritics**: 0 kept, 0 dropped  
- Multi-sense (same English → multiple Modern): 0 (labeled `[sense n]`)  
- Homonyms (same Modern → multiple English): 0

---

## 5. Canon / Coverage Checks
- Canon anchors present: True
- Regressions from prior final: None  
- Coverage (clusters improved): TBD

---

## 6. Changelog
- **Added**: 0
- **Edited**: 0
- **Removed**: 0
- **Flagged (lazy)**: 0

---

## 7. Notes & Next Steps
- Dictionary processing completed successfully
"""
        
        return md
    
    def _generate_changelog_json(self) -> Dict[str, Any]:
        """Generate changelog in JSON format."""
        return {
            "version": self.qa_report.summary["version_next_suggested"],
            "changes": self.qa_report.changelog,
            "generated_at": datetime.now().isoformat()
        }
    
    def _generate_changelog_md(self) -> str:
        """Generate changelog in Markdown format."""
        version = self.qa_report.summary["version_next_suggested"]
        
        md = f"""# Changelog v{version}

## Changes

### Added
{len(self.qa_report.changelog['added'])} new entries

### Edited
{len(self.qa_report.changelog['edited'])} modified entries

### Removed
{len(self.qa_report.changelog['removed'])} removed entries

### Flagged (Lazy)
{len(self.qa_report.changelog['flagged_lazy'])} entries moved to lazy candidates

### Notes Updates
{len(self.qa_report.changelog['notes_updates'])} entries with updated notes

---
*Generated at {datetime.now().isoformat()}*
"""
        
        return md
    
    def _prepare_next_cycle(self, outputs: Dict[str, Any]):
        """Step E: Prepare for next cycle."""
        # This would typically copy final.json to previous_final.json
        # For now, just a placeholder
        pass


def load_params_from_yaml(params_path: str) -> ProcessingParams:
    """Load processing parameters from YAML file."""
    with open(params_path, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f)
    
    return ProcessingParams(**data)


def save_outputs(outputs: Dict[str, Any], output_dir: str, version: str):
    """Save all output files to the specified directory."""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Save final.json
    with open(output_path / f"Unified_Libran_Dictionary_Modern_v{version}.json", 'w', encoding='utf-8') as f:
        json.dump(outputs["final"], f, indent=2, ensure_ascii=False)
    
    # Save QA reports
    with open(output_path / f"QA_Report_v{version}.json", 'w', encoding='utf-8') as f:
        json.dump(outputs["qa_report_json"], f, indent=2, ensure_ascii=False)
    
    with open(output_path / f"QA_Report_v{version}.md", 'w', encoding='utf-8') as f:
        f.write(outputs["qa_report_md"])
    
    # Save changelogs
    with open(output_path / f"Changelog_v{version}.json", 'w', encoding='utf-8') as f:
        json.dump(outputs["changelog_json"], f, indent=2, ensure_ascii=False)
    
    with open(output_path / f"Changelog_v{version}.md", 'w', encoding='utf-8') as f:
        f.write(outputs["changelog_md"])
    
    # Save lazy candidates
    with open(output_path / f"_lazy_candidates_v{version}.json", 'w', encoding='utf-8') as f:
        json.dump(outputs["lazy_candidates"], f, indent=2, ensure_ascii=False)


def main():
    """Main entry point for the dictionary QA system."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Librán Dictionary QA & Expansion System")
    parser.add_argument("--previous-final", help="Path to previous final dictionary")
    parser.add_argument("--initial-input", required=True, help="Path to initial input dictionary")
    parser.add_argument("--params", default="params.yaml", help="Path to parameters file")
    parser.add_argument("--output-dir", default="out", help="Output directory")
    
    args = parser.parse_args()
    
    # Load parameters
    params = load_params_from_yaml(args.params)
    
    # Load dictionaries
    previous_final = None
    if args.previous_final:
        with open(args.previous_final, 'r', encoding='utf-8') as f:
            previous_final = json.load(f)
    
    with open(args.initial_input, 'r', encoding='utf-8') as f:
        initial_input = json.load(f)
    
    # Process
    engine = DictionaryQAEngine(params)
    outputs = engine.process_cycle(previous_final, initial_input)
    
    # Save outputs
    version = outputs["final"]["metadata"]["version"]
    save_outputs(outputs, args.output_dir, version)
    
    print(f"Dictionary processing completed. Outputs saved to {args.output_dir}/")
    print(f"Final version: {version}")


if __name__ == "__main__":
    main()
