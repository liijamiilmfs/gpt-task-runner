#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Enhanced Data Priming System for Librán Dictionary
 * 
 * Handles multiple data formats (JSON, PDF, CSV, TXT) with intelligent
 * directory structure recognition and automatic data discovery.
 */

class EnhancedDataPrimingSystem {
  constructor() {
    this.dataCache = new Map();
    this.supportedFormats = ['.json', '.pdf', '.csv', '.txt'];
    this.directoryStructure = {
      dictionaries: ['current', 'baseline', 'archive'],
      tranches: ['core', 'concepts', 'living', 'society', 'craft', 'culture'],
      reference: ['pdfs', 'guides', 'samples'],
      training: ['csv', 'exclusions', 'validation'],
      workflow: ['approved', 'proposed', 'rejected']
    };
    this.dataPriorities = {
      high: ['dictionaries/current', 'tranches/core', 'reference/pdfs'],
      medium: ['tranches', 'training/csv', 'training/exclusions'],
      low: ['dictionaries/archive', 'reference/samples', 'workflow']
    };
  }

  /**
   * Initialize the enhanced data priming system
   */
  async initialize(options = {}) {
    console.log('🚀 Initializing Enhanced Data Priming System...');
    
    const dataDir = options.dataDir || './data';
    const useRecommendedStructure = options.useRecommendedStructure !== false;
    
    if (useRecommendedStructure) {
      console.log('📁 Using recommended directory structure');
      await this.loadFromRecommendedStructure(dataDir);
    } else {
      console.log('📁 Using legacy directory structure');
      await this.loadFromLegacyStructure(dataDir);
    }
    
    console.log(`✅ Enhanced Data Priming System initialized`);
    console.log(`   Total data sources: ${this.dataCache.size}`);
    
    return this.getDataStatistics();
  }

  /**
   * Load data from recommended directory structure
   */
  async loadFromRecommendedStructure(dataDir) {
    console.log('🔍 Scanning recommended directory structure...');
    
    // Load dictionaries
    await this.loadDictionaries(dataDir);
    
    // Load tranches
    await this.loadTranches(dataDir);
    
    // Load reference materials
    await this.loadReferenceMaterials(dataDir);
    
    // Load training data
    await this.loadTrainingData(dataDir);
    
    // Load workflow data
    await this.loadWorkflowData(dataDir);
  }

  /**
   * Load data from legacy directory structure
   */
  async loadFromLegacyStructure(dataDir) {
    console.log('🔍 Scanning legacy directory structure...');
    
    // Load all files recursively
    await this.loadAllFilesRecursively(dataDir);
  }

  /**
   * Load dictionary files
   */
  async loadDictionaries(dataDir) {
    const dictDir = path.join(dataDir, 'dictionaries');
    
    if (!fs.existsSync(dictDir)) {
      console.log('⚠️ Dictionaries directory not found, using legacy structure');
      return;
    }

    for (const subdir of this.directoryStructure.dictionaries) {
      const subdirPath = path.join(dictDir, subdir);
      if (fs.existsSync(subdirPath)) {
        await this.loadFilesFromDirectory(subdirPath, `dictionaries/${subdir}`, 'dictionary');
      }
    }
  }

  /**
   * Load tranche files
   */
  async loadTranches(dataDir) {
    const tranchesDir = path.join(dataDir, 'tranches');
    
    if (!fs.existsSync(tranchesDir)) {
      console.log('⚠️ Tranches directory not found, using legacy structure');
      return;
    }

    for (const category of this.directoryStructure.tranches) {
      const categoryPath = path.join(tranchesDir, category);
      if (fs.existsSync(categoryPath)) {
        await this.loadFilesFromDirectory(categoryPath, `tranches/${category}`, 'tranche');
      }
    }
  }

  /**
   * Load reference materials
   */
  async loadReferenceMaterials(dataDir) {
    const refDir = path.join(dataDir, 'reference');
    
    if (!fs.existsSync(refDir)) {
      console.log('⚠️ Reference directory not found, using legacy structure');
      return;
    }

    for (const subdir of this.directoryStructure.reference) {
      const subdirPath = path.join(refDir, subdir);
      if (fs.existsSync(subdirPath)) {
        const type = subdir === 'pdfs' ? 'pdf' : 'reference';
        await this.loadFilesFromDirectory(subdirPath, `reference/${subdir}`, type);
      }
    }
  }

  /**
   * Load training data
   */
  async loadTrainingData(dataDir) {
    const trainingDir = path.join(dataDir, 'training');
    
    if (!fs.existsSync(trainingDir)) {
      console.log('⚠️ Training directory not found, using legacy structure');
      return;
    }

    for (const subdir of this.directoryStructure.training) {
      const subdirPath = path.join(trainingDir, subdir);
      if (fs.existsSync(subdirPath)) {
        await this.loadFilesFromDirectory(subdirPath, `training/${subdir}`, 'training');
      }
    }
  }

  /**
   * Load workflow data
   */
  async loadWorkflowData(dataDir) {
    const workflowDir = path.join(dataDir, 'workflow');
    
    if (!fs.existsSync(workflowDir)) {
      console.log('⚠️ Workflow directory not found, using legacy structure');
      return;
    }

    for (const subdir of this.directoryStructure.workflow) {
      const subdirPath = path.join(workflowDir, subdir);
      if (fs.existsSync(subdirPath)) {
        await this.loadFilesFromDirectory(subdirPath, `workflow/${subdir}`, 'workflow');
      }
    }
  }

  /**
   * Load all files recursively (legacy mode)
   */
  async loadAllFilesRecursively(dataDir) {
    const scanDirectory = async (dir, relativePath = '') => {
      try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            await scanDirectory(fullPath, path.join(relativePath, item));
          } else if (stat.isFile()) {
            const ext = path.extname(item).toLowerCase();
            if (this.supportedFormats.includes(ext)) {
              await this.loadFile(fullPath, relativePath, this.getFileType(ext));
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Could not scan directory ${dir}: ${error.message}`);
      }
    };
    
    await scanDirectory(dataDir);
  }

  /**
   * Load files from a specific directory
   */
  async loadFilesFromDirectory(dirPath, category, type) {
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          if (this.supportedFormats.includes(ext)) {
            await this.loadFile(fullPath, category, type);
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not load files from ${dirPath}: ${error.message}`);
    }
  }

  /**
   * Load a single file
   */
  async loadFile(filePath, category, type) {
    try {
      const ext = path.extname(filePath).toLowerCase();
      const filename = path.basename(filePath);
      const fileData = await this.processFile(filePath, ext);
      
      if (fileData) {
        const dataKey = `${category}/${filename}`;
        this.dataCache.set(dataKey, {
          file: filename,
          path: filePath,
          category: category,
          type: type,
          format: ext,
          data: fileData,
          size: fileData.size || 0,
          priority: this.getDataPriority(category)
        });
        
        console.log(`  ✓ Loaded ${filename} (${type}, ${this.formatSize(fileData.size || 0)})`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to load ${filePath}: ${error.message}`);
    }
  }

  /**
   * Process file based on format
   */
  async processFile(filePath, ext) {
    switch (ext) {
      case '.json':
        return this.processJSONFile(filePath);
      case '.pdf':
        return this.processPDFFile(filePath);
      case '.csv':
        return this.processCSVFile(filePath);
      case '.txt':
        return this.processTextFile(filePath);
      default:
        return null;
    }
  }

  /**
   * Process JSON file
   */
  processJSONFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      return {
        content: data,
        size: content.length,
        format: 'json'
      };
    } catch (error) {
      console.warn(`⚠️ Failed to parse JSON ${filePath}: ${error.message}`);
      return null;
    }
  }

  /**
   * Process PDF file
   */
  async processPDFFile(filePath) {
    try {
      // Check if pdf-parse is available
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      
      return {
        content: pdfData.text,
        size: pdfData.text.length,
        format: 'pdf',
        pageCount: pdfData.numpages,
        info: pdfData.info
      };
    } catch (error) {
      console.warn(`⚠️ Failed to process PDF ${filePath}: ${error.message}`);
      return null;
    }
  }

  /**
   * Process CSV file
   */
  processCSVFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const headers = lines[0].split(',');
      const data = lines.slice(1).map(line => {
        const values = line.split(',');
        const row = {};
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim() || '';
        });
        return row;
      });
      
      return {
        content: data,
        size: content.length,
        format: 'csv',
        headers: headers,
        rowCount: data.length
      };
    } catch (error) {
      console.warn(`⚠️ Failed to process CSV ${filePath}: ${error.message}`);
      return null;
    }
  }

  /**
   * Process text file
   */
  processTextFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return {
        content: content,
        size: content.length,
        format: 'text',
        lines: content.split('\n').length
      };
    } catch (error) {
      console.warn(`⚠️ Failed to process text ${filePath}: ${error.message}`);
      return null;
    }
  }

  /**
   * Get file type based on extension
   */
  getFileType(ext) {
    const typeMap = {
      '.json': 'dictionary',
      '.pdf': 'reference',
      '.csv': 'training',
      '.txt': 'config'
    };
    return typeMap[ext] || 'unknown';
  }

  /**
   * Get data priority based on category
   */
  getDataPriority(category) {
    for (const [priority, categories] of Object.entries(this.dataPriorities)) {
      for (const cat of categories) {
        if (category.startsWith(cat)) {
          return priority;
        }
      }
    }
    return 'low';
  }

  /**
   * Generate context for specific task types
   */
  generateContextForTask(taskType, options = {}) {
    const context = {
      taskType: taskType,
      sources: {
        high: [],
        medium: [],
        low: []
      },
      metadata: {
        totalSize: 0,
        sourceCount: 0,
        priorities: { high: 0, medium: 0, low: 0 }
      }
    };

    // Filter data based on task type and options
    for (const [key, data] of this.dataCache.entries()) {
      if (this.shouldIncludeData(data, taskType, options)) {
        context.sources[data.priority].push(data);
        context.metadata.totalSize += data.size;
        context.metadata.sourceCount++;
        context.metadata.priorities[data.priority]++;
      }
    }

    return context;
  }

  /**
   * Determine if data should be included for a task
   */
  shouldIncludeData(data, taskType, options) {
    // Always include high priority data
    if (data.priority === 'high') return true;
    
    // Include medium priority data for most tasks
    if (data.priority === 'medium' && taskType !== 'minimal') return true;
    
    // Include low priority data for comprehensive tasks
    if (data.priority === 'low' && taskType === 'comprehensive') return true;
    
    // Include specific categories if requested
    if (options.category && data.category.includes(options.category)) return true;
    
    // Include specific types if requested
    if (options.type && data.type === options.type) return true;
    
    return false;
  }

  /**
   * Get data statistics
   */
  getDataStatistics() {
    const stats = {
      totalSources: this.dataCache.size,
      totalSize: 0,
      byFormat: {},
      byPriority: { high: 0, medium: 0, low: 0 },
      byCategory: {},
      byType: {}
    };

    for (const [key, data] of this.dataCache.entries()) {
      stats.totalSize += data.size;
      
      // Count by format
      stats.byFormat[data.format] = (stats.byFormat[data.format] || 0) + 1;
      
      // Count by priority
      stats.byPriority[data.priority]++;
      
      // Count by category
      stats.byCategory[data.category] = (stats.byCategory[data.category] || 0) + 1;
      
      // Count by type
      stats.byType[data.type] = (stats.byType[data.type] || 0) + 1;
    }

    stats.formattedTotalSize = this.formatSize(stats.totalSize);
    return stats;
  }

  /**
   * Format file size for display
   */
  formatSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.dataCache.clear();
    console.log('🗑️ Data cache cleared');
  }
}

module.exports = EnhancedDataPrimingSystem;
