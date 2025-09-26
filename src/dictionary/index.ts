/**
 * TypeScript wrapper for the Librán Dictionary QA & Expansion Engine
 *
 * This module provides TypeScript interfaces and utilities for working with
 * the Python-based dictionary QA system.
 */

export interface DictionaryEntry {
  english: string;
  modern: string;
  notes?: string;
}

export interface ProcessingParams {
  tranche_target_size: number;
  add_tranche_strategy: string[];
  dedupe_policy: string;
  guardrails: {
    preserve_modern: string[];
    preserve_domains: string[];
  };
  normalization: {
    encoding: string;
    trim_whitespace: boolean;
    enforce_modern_orthography: boolean;
  };
  laziness_rules: string[];
  sense_policy: {
    english_multi_to_modern: string;
    modern_multi_to_english: string;
  };
  reports: {
    format: string[];
    include_examples_per_fail: number;
  };
}

export interface QAReport {
  summary: {
    version_prev: string;
    version_next_suggested: string;
    semver_bump: string;
    counts: {
      input: number;
      merged: number;
      after_dedup: number;
      final: number;
      lazy: number;
      warnings: number;
    };
  };
  guardrails: Record<string, string[]>;
  failures: Record<
    string,
    Array<{
      english: string;
      modern: string;
      reason: string;
      notes: string;
    }>
  >;
  collisions: Record<string, unknown>;
  canon: Record<string, unknown>;
  changelog: Record<string, unknown[]>;
  warnings: Array<Record<string, unknown>>;
}

export interface ProcessingResult {
  qa_report: QAReport;
  final_dictionary: unknown;
  changelog: unknown;
  lazy_candidates: DictionaryEntry[];
}

/**
 * Default processing parameters
 */
export const DEFAULT_PARAMS: ProcessingParams = {
  tranche_target_size: 300,
  add_tranche_strategy: [
    'coverage_gaps',
    'semantic_cluster_fill',
    'canon_hooks',
  ],
  dedupe_policy: 'prefer-diacritics',
  guardrails: {
    preserve_modern: [
      'stílibra',
      'spera',
      'drama',
      'Coamára',
      'félio',
      'tannisó',
      'hajzora',
    ],
    preserve_domains: [
      'Aleșii',
      'Comoară',
      'Dukorë',
      'Közgyüla',
      'Cordavora',
      'Noxtriba',
      'Congregorë',
      'Közös',
      'Velora',
      'Kechroot',
      'Lótűz',
      'Távoli',
    ],
  },
  normalization: {
    encoding: 'UTF-8-NFC',
    trim_whitespace: true,
    enforce_modern_orthography: true,
  },
  laziness_rules: [
    'reject: donor unchanged (EN/HU/RO/LA/IS) with trivial suffix',
    'reject: single-vowel swap only',
    'reject: bare donor stem + Modern article/number',
    'reject: ASCII-only where diacritics expected',
    'reject: missing notes for opaque formations/compounds',
  ],
  sense_policy: {
    english_multi_to_modern: 'keep all as [sense n]',
    modern_multi_to_english: 'allow homonyms with [sense n]',
  },
  reports: {
    format: ['json', 'md'],
    include_examples_per_fail: 5,
  },
};

/**
 * Dictionary QA Engine wrapper
 *
 * This class provides a TypeScript interface to the Python-based
 * dictionary QA system. It handles the communication between
 * TypeScript and Python processes.
 */
export class DictionaryQAEngine {
  private params: ProcessingParams;

  constructor(params: ProcessingParams = DEFAULT_PARAMS) {
    this.params = params;
  }

  /**
   * Process a dictionary through the QA cycle
   */
  async process_cycle(
    _previous_final: unknown | null,
    initial_input: unknown
  ): Promise<ProcessingResult> {
    // For now, return a mock result
    // TODO: Implement actual Python process communication
    return {
      qa_report: {
        summary: {
          version_prev: '1.8.0',
          version_next_suggested: '1.8.1',
          semver_bump: 'patch',
          counts: {
            input: this.countEntries(initial_input),
            merged: this.countEntries(initial_input),
            after_dedup: this.countEntries(initial_input),
            final: this.countEntries(initial_input),
            lazy: 0,
            warnings: 0,
          },
        },
        guardrails: this.params.guardrails,
        failures: {
          pure_donor_unchanged: [],
          trivial_suffix_only: [],
          ascii_no_diacritics: [],
          missing_etymology_notes: [],
        },
        collisions: {
          prefer_diacritics_kept: [],
          prefer_diacritics_dropped: [],
          multi_sense_by_english: {},
          homonyms_by_modern: {},
        },
        canon: {
          anchors_present: true,
          regressions: [],
        },
        changelog: {
          added: [],
          edited: [],
          removed: [],
          flagged_lazy: [],
          notes_updates: [],
        },
        warnings: [],
      },
      final_dictionary: initial_input,
      changelog: {
        added: [],
        edited: [],
        removed: [],
        flagged_lazy: [],
        notes_updates: [],
      },
      lazy_candidates: [],
    };
  }

  /**
   * Generate a markdown report from QA results
   */
  generate_markdown_report(qaReport: QAReport): string {
    const { summary, failures } = qaReport;

    let report = `# Dictionary QA Report\n\n`;
    report += `## Summary\n\n`;
    report += `- **Version**: ${summary.version_prev} → ${summary.version_next_suggested}\n`;
    report += `- **Total Entries**: ${summary.counts.input}\n`;
    report += `- **Passed QA**: ${summary.counts.final}\n`;
    report += `- **Lazy Candidates**: ${summary.counts.lazy}\n`;
    report += `- **Warnings**: ${summary.counts.warnings}\n\n`;

    if (summary.counts.lazy > 0) {
      report += `## Lazy Candidates\n\n`;
      report += `The following entries failed laziness rules and need review:\n\n`;

      Object.entries(failures).forEach(([category, entries]) => {
        if (entries.length > 0) {
          report += `### ${category.replace(/_/g, ' ').toUpperCase()}\n\n`;
          entries.forEach((entry) => {
            report += `- **${entry.english}** → **${entry.modern}**\n`;
            if (entry.notes) {
              report += `  - Notes: ${entry.notes}\n`;
            }
            report += `  - Reason: ${entry.reason}\n\n`;
          });
        }
      });
    }

    if (summary.counts.warnings > 0) {
      report += `## Warnings\n\n`;
      report += `Please review the following warnings:\n\n`;
      // Add warning details here
    }

    return report;
  }

  private countEntries(dictionary: unknown): number {
    if (!dictionary || typeof dictionary !== 'object') {
      return 0;
    }

    const dict = dictionary as Record<string, unknown>;
    if (!dict.sections || typeof dict.sections !== 'object') {
      return 0;
    }

    const sections = dict.sections as Record<string, unknown>;
    if (!sections.Unified || typeof sections.Unified !== 'object') {
      return 0;
    }

    const unified = sections.Unified as Record<string, unknown>;
    if (!Array.isArray(unified.data)) {
      return 0;
    }

    return unified.data.length;
  }
}

/**
 * Create a new ProcessingParams instance with default values
 */
export function createProcessingParams(
  overrides: Partial<ProcessingParams> = {}
): ProcessingParams {
  return {
    ...DEFAULT_PARAMS,
    ...overrides,
  };
}

/**
 * Validate a dictionary entry
 */
export function validateDictionaryEntry(entry: DictionaryEntry): string[] {
  const errors: string[] = [];

  if (!entry.english || entry.english.trim() === '') {
    errors.push('English term is required');
  }

  if (!entry.modern || entry.modern.trim() === '') {
    errors.push('Modern Librán term is required');
  }

  // Check for pure donor unchanged
  if (entry.modern === entry.english) {
    errors.push('Modern term cannot be identical to English term');
  }

  // Check for trivial suffix only
  if (
    entry.modern.endsWith('a') &&
    entry.english.toLowerCase() === entry.modern.slice(0, -1)
  ) {
    errors.push('Modern term appears to be trivial suffix addition');
  }

  // Check for ASCII-only where diacritics expected
  if (
    !/[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/.test(entry.modern) &&
    entry.modern.length > 3 &&
    !['stílibra', 'spera', 'drama'].includes(entry.modern)
  ) {
    errors.push(
      'Modern term may need diacritics for proper Librán orthography'
    );
  }

  return errors;
}
