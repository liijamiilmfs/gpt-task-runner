#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Clean up and organize audit reports
 * - Creates organized folder structure
 * - Moves recent reports to special folders
 * - Removes old reports
 * - Updates audit system configuration
 */

const CONFIG = {
  // Keep the 3 most recent reports in the "recent" folder
  keepRecent: 3,
  
  // Keep reports from the last 7 days in "archive" folder
  keepArchiveDays: 7,
  
  // Folder structure
  folders: {
    recent: './audit-reports/recent',
    archive: './audit-reports/archive',
    old: './audit-reports/old'
  }
};

function createDirectoryStructure() {
  console.log('📁 Creating audit report directory structure...');
  
  Object.values(CONFIG.folders).forEach(folder => {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
      console.log(`   Created: ${folder}`);
    } else {
      console.log(`   Exists: ${folder}`);
    }
  });
}

function getAuditReportFiles() {
  const files = fs.readdirSync('.');
  
  return files.filter(file => {
    return file.startsWith('audit-report-') || 
           file.startsWith('audit-detailed-') ||
           file.startsWith('qa-report-');
  });
}

function parseTimestamp(filename) {
  // Extract timestamp from filename like: audit-report-2025-09-23T01-42-19-197Z.json
  // The actual format appears to be: YYYY-MM-DDTHH-MM-SS-mmmZ
  const match = filename.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/);
  if (match) {
    const timestamp = match[1];
    
    // Convert the format from YYYY-MM-DDTHH-MM-SS-mmmZ to YYYY-MM-DDTHH:MM:SS.mmmZ
    const isoString = timestamp
      .replace(/(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2})-(\d{3}Z)/, '$1:$2:$3.$4');
    
    const date = new Date(isoString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn(`   Warning: Invalid timestamp in ${filename}: ${timestamp} → ${isoString}`);
      return null;
    }
    
    return date;
  }
  return null;
}

function groupReportsByTimestamp(reportFiles) {
  const groups = new Map();
  
  reportFiles.forEach(file => {
    const timestamp = parseTimestamp(file);
    if (timestamp) {
      const timestampKey = timestamp.toISOString();
      if (!groups.has(timestampKey)) {
        groups.set(timestampKey, {
          timestamp,
          files: []
        });
      }
      groups.get(timestampKey).files.push(file);
    }
  });
  
  return groups;
}

function moveFiles(files, destination) {
  files.forEach(file => {
    const sourcePath = file;
    const destPath = path.join(destination, file);
    
    try {
      fs.renameSync(sourcePath, destPath);
      console.log(`   Moved: ${file} → ${destination}/`);
    } catch (error) {
      console.error(`   Error moving ${file}: ${error.message}`);
    }
  });
}

function cleanupAuditReports() {
  console.log('🧹 Cleaning up audit reports...');
  
  const reportFiles = getAuditReportFiles();
  console.log(`   Found ${reportFiles.length} audit report files`);
  
  if (reportFiles.length === 0) {
    console.log('   No audit reports to clean up');
    return;
  }
  
  // Group reports by timestamp
  const reportGroups = groupReportsByTimestamp(reportFiles);
  const sortedGroups = Array.from(reportGroups.entries())
    .sort(([a], [b]) => new Date(b) - new Date(a)); // Most recent first
  
  console.log(`   Found ${sortedGroups.length} report groups`);
  
  const now = new Date();
  const archiveCutoff = new Date(now.getTime() - (CONFIG.keepArchiveDays * 24 * 60 * 60 * 1000));
  
  let recentCount = 0;
  let archiveCount = 0;
  let oldCount = 0;
  
  sortedGroups.forEach(([timestampKey, group], index) => {
    const { timestamp, files } = group;
    
    if (index < CONFIG.keepRecent) {
      // Move to recent folder
      console.log(`   📌 Recent (${timestamp.toISOString()}): ${files.length} files`);
      moveFiles(files, CONFIG.folders.recent);
      recentCount += files.length;
    } else if (timestamp > archiveCutoff) {
      // Move to archive folder
      console.log(`   📦 Archive (${timestamp.toISOString()}): ${files.length} files`);
      moveFiles(files, CONFIG.folders.archive);
      archiveCount += files.length;
    } else {
      // Move to old folder
      console.log(`   🗄️  Old (${timestamp.toISOString()}): ${files.length} files`);
      moveFiles(files, CONFIG.folders.old);
      oldCount += files.length;
    }
  });
  
  console.log('\n📊 Cleanup Summary:');
  console.log(`   Recent reports: ${recentCount} files`);
  console.log(`   Archived reports: ${archiveCount} files`);
  console.log(`   Old reports: ${oldCount} files`);
  console.log(`   Total organized: ${recentCount + archiveCount + oldCount} files`);
}

function createReadme() {
  const readmeContent = `# Audit Reports

This directory contains organized audit reports from the Librán Dictionary system.

## Folder Structure

- **recent/**: Contains the ${CONFIG.keepRecent} most recent audit reports
- **archive/**: Contains reports from the last ${CONFIG.keepArchiveDays} days
- **old/**: Contains older reports that are kept for historical reference

## Report Types

Each audit run generates three types of reports:
- \`audit-report-{timestamp}.json\` - Structured JSON data for programmatic analysis
- \`audit-report-{timestamp}.csv\` - Spreadsheet-friendly format for manual review
- \`audit-detailed-{timestamp}.txt\` - Human-readable detailed report

## File Naming

Reports are named with ISO 8601 timestamps to ensure proper chronological ordering:
\`audit-report-2025-09-23T01-45-29-268Z.json\`

## Cleanup Policy

- Only the ${CONFIG.keepRecent} most recent reports are kept in the "recent" folder
- Reports older than ${CONFIG.keepArchiveDays} days are moved to "old"
- Use the \`cleanup-audit-reports.js\` script to reorganize reports

## Usage

To run a cleanup:
\`\`\`bash
node cleanup-audit-reports.js
\`\`\`
`;

  const readmePath = './audit-reports/README.md';
  fs.writeFileSync(readmePath, readmeContent);
  console.log(`📝 Created README: ${readmePath}`);
}

function updateAuditSystemConfig() {
  console.log('⚙️  Updating audit system configuration...');
  
  // Update the audit process to use the new folder structure
  const auditProcessPath = './lib/dictionary-builder/audit-process.js';
  
  if (fs.existsSync(auditProcessPath)) {
    let content = fs.readFileSync(auditProcessPath, 'utf8');
    
    // Update the audits directory path
    content = content.replace(
      /const auditsDir = '\.\/audits';/,
      "const auditsDir = './audit-reports/recent';"
    );
    
    fs.writeFileSync(auditProcessPath, content);
    console.log('   Updated audit process to use new folder structure');
  }
}

function main() {
  console.log('🧹 AUDIT REPORT CLEANUP AND ORGANIZATION');
  console.log('=' .repeat(50));
  
  try {
    createDirectoryStructure();
    console.log('');
    
    cleanupAuditReports();
    console.log('');
    
    createReadme();
    console.log('');
    
    updateAuditSystemConfig();
    console.log('');
    
    console.log('✅ Audit report cleanup completed successfully!');
    console.log('');
    console.log('📁 New folder structure:');
    console.log(`   ${CONFIG.folders.recent} - Most recent reports`);
    console.log(`   ${CONFIG.folders.archive} - Recent archive`);
    console.log(`   ${CONFIG.folders.old} - Historical reports`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  cleanupAuditReports,
  createDirectoryStructure,
  CONFIG
};
