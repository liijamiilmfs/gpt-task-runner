const fs = require('fs');
const path = require('path');

/**
 * Baseline Reference Dictionary System
 * 
 * Uses UnifiedLibranDictionaryv1.3Baseline.json as a stable reference
 * for quality assurance and consistency checking in future dictionary builds.
 */

class BaselineReference {
  constructor() {
    this.baselinePath = './data/UnifiedLibranDictionaryv1.3Baseline.json';
    this.baselineData = null;
    this.ancientEntries = new Map();
    this.modernEntries = new Map();
    this.englishToEntries = new Map();
  }

  /**
   * Load the baseline reference dictionary
   */
  async loadBaseline() {
    try {
      if (!fs.existsSync(this.baselinePath)) {
        throw new Error(`Baseline reference not found: ${this.baselinePath}`);
      }

      const rawData = fs.readFileSync(this.baselinePath, 'utf8');
      this.baselineData = JSON.parse(rawData);
      
      console.log(`📚 Loaded baseline reference: ${this.baselineData.title}`);
      console.log(`   Total clusters: ${Object.keys(this.baselineData.clusters).length}`);
      
      this.indexEntries();
      return true;
    } catch (error) {
      console.error('Failed to load baseline reference:', error.message);
      return false;
    }
  }

  /**
   * Index entries for fast lookup
   */
  indexEntries() {
    let totalEntries = 0;

    Object.entries(this.baselineData.clusters).forEach(([clusterName, cluster]) => {
      // Handle both array format and object format
      const ancientEntries = Array.isArray(cluster.ancient) ? cluster.ancient : 
                           (cluster.ancient && Array.isArray(cluster.ancient)) ? cluster.ancient : [];
      const modernEntries = Array.isArray(cluster.modern) ? cluster.modern : 
                           (cluster.modern && Array.isArray(cluster.modern)) ? cluster.modern : [];

      ancientEntries.forEach(entry => {
        if (entry && entry.english && entry.ancient) {
          this.ancientEntries.set(entry.ancient.toLowerCase(), entry);
          this.englishToEntries.set(entry.english.toLowerCase(), entry);
          totalEntries++;
        }
      });

      modernEntries.forEach(entry => {
        if (entry && entry.english && entry.modern) {
          this.modernEntries.set(entry.modern.toLowerCase(), entry);
          this.englishToEntries.set(entry.english.toLowerCase(), entry);
          totalEntries++;
        }
      });
    });

    console.log(`   Indexed ${totalEntries} baseline entries`);
  }

  /**
   * Check if a new entry follows baseline patterns
   */
  checkEntryConsistency(newEntry) {
    const issues = [];
    const suggestions = [];

    // Check if English word exists in baseline
    const baselineEntry = this.englishToEntries.get(newEntry.english.toLowerCase());
    
    if (baselineEntry) {
      // Found in baseline - check for consistency
      if (newEntry.ancient && baselineEntry.ancient) {
        if (newEntry.ancient.toLowerCase() !== baselineEntry.ancient.toLowerCase()) {
          issues.push({
            type: 'ancient_mismatch',
            severity: 'high',
            message: `Ancient form differs from baseline: "${newEntry.ancient}" vs "${baselineEntry.ancient}"`,
            baseline: baselineEntry.ancient,
            new: newEntry.ancient
          });
        }
      }

      if (newEntry.modern && baselineEntry.modern) {
        if (newEntry.modern.toLowerCase() !== baselineEntry.modern.toLowerCase()) {
          issues.push({
            type: 'modern_mismatch',
            severity: 'high',
            message: `Modern form differs from baseline: "${newEntry.modern}" vs "${baselineEntry.modern}"`,
            baseline: baselineEntry.modern,
            new: newEntry.modern
          });
        }
      }

      // Check if notes are consistent
      if (baselineEntry.notes && !newEntry.notes) {
        suggestions.push({
          type: 'missing_notes',
          severity: 'medium',
          message: `Baseline has notes that could inform this entry: "${baselineEntry.notes}"`
        });
      }
    } else {
      // New word not in baseline - check for similar patterns
      const similarEntries = this.findSimilarEntries(newEntry.english);
      if (similarEntries.length > 0) {
        suggestions.push({
          type: 'similar_baseline_entries',
          severity: 'low',
          message: `Found ${similarEntries.length} similar entries in baseline for reference`,
          examples: similarEntries.slice(0, 3)
        });
      }
    }

    return {
      issues,
      suggestions,
      hasBaselineReference: !!baselineEntry
    };
  }

  /**
   * Find entries similar to a given English word
   */
  findSimilarEntries(english) {
    const word = english.toLowerCase();
    const similar = [];

    for (const [key, entry] of this.englishToEntries) {
      // Check for prefix/suffix matches
      if (key.includes(word) || word.includes(key)) {
        similar.push(entry);
      }
      
      // Check for word stem matches
      const wordStem = this.getWordStem(word);
      const entryStem = this.getWordStem(key);
      if (wordStem && entryStem && wordStem === entryStem) {
        similar.push(entry);
      }
    }

    return similar.slice(0, 10); // Limit results
  }

  /**
   * Simple word stemming for comparison
   */
  getWordStem(word) {
    // Remove common English suffixes
    return word.replace(/(ing|ed|er|est|ly|s)$/, '');
  }

  /**
   * Get baseline statistics for a specific cluster or overall
   */
  getBaselineStats(clusterName = null) {
    if (!this.baselineData) {
      return null;
    }

    if (clusterName) {
      const cluster = this.baselineData.clusters[clusterName];
      if (!cluster) return null;
      
      // Handle both number and array formats
      const ancientCount = typeof cluster.ancient === 'number' ? cluster.ancient : 
                          (Array.isArray(cluster.ancient) ? cluster.ancient.length : 0);
      const modernCount = typeof cluster.modern === 'number' ? cluster.modern : 
                         (Array.isArray(cluster.modern) ? cluster.modern.length : 0);
      
      return {
        ancient: ancientCount,
        modern: modernCount,
        total: cluster.total || (ancientCount + modernCount)
      };
    }

    // Overall stats
    let totalAncient = 0;
    let totalModern = 0;
    let totalClusters = 0;

    Object.values(this.baselineData.clusters).forEach(cluster => {
      if (cluster.ancient || cluster.modern) {
        const ancientCount = typeof cluster.ancient === 'number' ? cluster.ancient : 
                            (Array.isArray(cluster.ancient) ? cluster.ancient.length : 0);
        const modernCount = typeof cluster.modern === 'number' ? cluster.modern : 
                           (Array.isArray(cluster.modern) ? cluster.modern.length : 0);
        
        totalAncient += ancientCount;
        totalModern += modernCount;
        totalClusters++;
      }
    });

    return {
      totalAncient,
      totalModern,
      totalEntries: totalAncient + totalModern,
      totalClusters
    };
  }

  /**
   * Validate new dictionary against baseline patterns
   */
  validateNewDictionary(newDictionary) {
    const results = {
      totalChecked: 0,
      baselineMatches: 0,
      inconsistencies: [],
      suggestions: [],
      summary: {}
    };

    // Check each entry in the new dictionary
    Object.values(newDictionary.entries || {}).forEach(entry => {
      results.totalChecked++;
      
      const check = this.checkEntryConsistency(entry);
      
      if (check.hasBaselineReference) {
        results.baselineMatches++;
      }
      
      results.inconsistencies.push(...check.issues);
      results.suggestions.push(...check.suggestions);
    });

    // Generate summary
    results.summary = {
      baselineCoverage: results.totalChecked > 0 ? (results.baselineMatches / results.totalChecked * 100).toFixed(1) : 0,
      totalIssues: results.inconsistencies.length,
      totalSuggestions: results.suggestions.length,
      highSeverityIssues: results.inconsistencies.filter(i => i.severity === 'high').length
    };

    return results;
  }

  /**
   * Get cluster information for a specific entry
   */
  getClusterInfo(englishWord) {
    const baselineEntry = this.englishToEntries.get(englishWord.toLowerCase());
    if (!baselineEntry) return null;

    // Find which cluster contains this entry
    for (const [clusterName, cluster] of Object.entries(this.baselineData.clusters)) {
      if (cluster.ancient && cluster.ancient.includes(baselineEntry)) {
        return {
          clusterName,
          clusterType: 'ancient',
          commentary: cluster.commentary || ''
        };
      }
      if (cluster.modern && cluster.modern.includes(baselineEntry)) {
        return {
          clusterName,
          clusterType: 'modern', 
          commentary: cluster.commentary || ''
        };
      }
    }

    return null;
  }
}

module.exports = {
  BaselineReference
};
