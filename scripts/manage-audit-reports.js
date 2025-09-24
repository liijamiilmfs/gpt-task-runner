#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Audit Report Management Script
 * 
 * Usage:
 *   node manage-audit-reports.js status     - Show current status
 *   node manage-audit-reports.js cleanup    - Run cleanup and organization
 *   node manage-audit-reports.js recent     - Show recent reports
 *   node manage-audit-reports.js archive    - Show archived reports
 */

const CONFIG = {
  baseDir: './audit-reports',
  recentDir: './audit-reports/recent',
  archiveDir: './audit-reports/archive',
  oldDir: './audit-reports/old'
};

function showStatus() {
  console.log('📊 AUDIT REPORTS STATUS');
  console.log('=' .repeat(40));
  
  const dirs = [
    { name: 'Recent', path: CONFIG.recentDir },
    { name: 'Archive', path: CONFIG.archiveDir },
    { name: 'Old', path: CONFIG.oldDir }
  ];
  
  dirs.forEach(dir => {
    if (fs.existsSync(dir.path)) {
      const files = fs.readdirSync(dir.path);
      const reportFiles = files.filter(f => f.startsWith('audit-') || f.startsWith('qa-'));
      console.log(`📁 ${dir.name}: ${reportFiles.length} files`);
    } else {
      console.log(`📁 ${dir.name}: Directory not found`);
    }
  });
  
  console.log('');
  
  // Show disk usage
  const totalSize = getDirectorySize(CONFIG.baseDir);
  console.log(`💾 Total disk usage: ${formatBytes(totalSize)}`);
}

function showRecentReports() {
  console.log('📌 RECENT AUDIT REPORTS');
  console.log('=' .repeat(40));
  
  if (!fs.existsSync(CONFIG.recentDir)) {
    console.log('No recent reports directory found');
    return;
  }
  
  const files = fs.readdirSync(CONFIG.recentDir);
  const reportFiles = files
    .filter(f => f.startsWith('audit-') || f.startsWith('qa-'))
    .sort()
    .reverse(); // Most recent first
  
  if (reportFiles.length === 0) {
    console.log('No recent reports found');
    return;
  }
  
  reportFiles.forEach(file => {
    const filePath = path.join(CONFIG.recentDir, file);
    const stats = fs.statSync(filePath);
    const size = formatBytes(stats.size);
    const modified = stats.mtime.toLocaleString();
    console.log(`   ${file} (${size}, ${modified})`);
  });
}

function showArchivedReports() {
  console.log('📦 ARCHIVED AUDIT REPORTS');
  console.log('=' .repeat(40));
  
  if (!fs.existsSync(CONFIG.archiveDir)) {
    console.log('No archive directory found');
    return;
  }
  
  const files = fs.readdirSync(CONFIG.archiveDir);
  const reportFiles = files
    .filter(f => f.startsWith('audit-') || f.startsWith('qa-'))
    .sort()
    .reverse(); // Most recent first
  
  if (reportFiles.length === 0) {
    console.log('No archived reports found');
    return;
  }
  
  reportFiles.forEach(file => {
    const filePath = path.join(CONFIG.archiveDir, file);
    const stats = fs.statSync(filePath);
    const size = formatBytes(stats.size);
    const modified = stats.mtime.toLocaleString();
    console.log(`   ${file} (${size}, ${modified})`);
  });
}

function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  if (!fs.existsSync(dirPath)) {
    return 0;
  }
  
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      totalSize += getDirectorySize(filePath);
    } else {
      totalSize += stats.size;
    }
  });
  
  return totalSize;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function runCleanup() {
  console.log('🧹 Running audit report cleanup...');
  
  // Import and run the cleanup script
  try {
    const { cleanupAuditReports } = require('./cleanup-audit-reports.js');
    cleanupAuditReports();
  } catch (error) {
    console.error('Error running cleanup:', error.message);
    process.exit(1);
  }
}

function showHelp() {
  console.log('🔧 AUDIT REPORT MANAGER');
  console.log('=' .repeat(40));
  console.log('');
  console.log('Usage:');
  console.log('  node manage-audit-reports.js <command>');
  console.log('');
  console.log('Commands:');
  console.log('  status    - Show current status of audit reports');
  console.log('  recent    - List recent audit reports');
  console.log('  archive   - List archived audit reports');
  console.log('  cleanup   - Run cleanup and organization');
  console.log('  help      - Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node manage-audit-reports.js status');
  console.log('  node manage-audit-reports.js recent');
  console.log('  node manage-audit-reports.js cleanup');
}

function main() {
  const command = process.argv[2] || 'status';
  
  switch (command.toLowerCase()) {
    case 'status':
      showStatus();
      break;
    case 'recent':
      showRecentReports();
      break;
    case 'archive':
      showArchivedReports();
      break;
    case 'cleanup':
      runCleanup();
      break;
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.log('Run "node manage-audit-reports.js help" for usage information');
      process.exit(1);
  }
}

// Run the script if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  showStatus,
  showRecentReports,
  showArchivedReports,
  runCleanup,
  CONFIG
};
