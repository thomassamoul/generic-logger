#!/usr/bin/env node
/**
 * Extract Highlights from CHANGELOG.md
 * 
 * Extracts highlights from CHANGELOG.md for a specific version
 * Used by GitHub Actions workflow to generate release notes
 * 
 * Usage:
 *   node scripts/extract-changelog-highlights.js 0.2.0
 */

const fs = require('fs');
const path = require('path');

const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');

function extractHighlights(version) {
  try {
    if (!fs.existsSync(changelogPath)) {
      console.log('### Changes\nSee CHANGELOG.md for detailed changes.');
      return;
    }

    const changelog = fs.readFileSync(changelogPath, 'utf8');
    
    // Find the version section (e.g., "## [0.2.0] - 2025-11-15" or "## [0.2.0]")
    const escapedVersion = version.replace(/\./g, '\\.');
    // Match from version header until next version header or end of file
    const versionRegex = new RegExp(`## \\[${escapedVersion}\\][^]*?(?=\n## |$)`, 's');
    const match = changelog.match(versionRegex);
    
    if (!match || !match[0]) {
      // Try to find [Unreleased] if version not found
      const unreleasedMatch = changelog.match(/## \[Unreleased\][^]*?(?=\n## |$)/s);
      if (unreleasedMatch && unreleasedMatch[0]) {
        formatChangelogSection(unreleasedMatch[0]);
        return;
      }
      console.log('### Changes\nSee CHANGELOG.md for detailed changes.');
      return;
    }

    formatChangelogSection(match[0]);
  } catch (error) {
    console.error('Error extracting highlights:', error.message);
    console.log('### Changes\nSee CHANGELOG.md for detailed changes.');
  }
}

function formatChangelogSection(section) {
  // Extract sections (Added, Changed, Fixed, etc.)
  const sections = {};
  const sectionRegex = /### (Added|Changed|Fixed|Removed|Deprecated|Security|Documentation)\n([\s\S]*?)(?=\n### |\n## |$)/g;
  
  let match;
  while ((match = sectionRegex.exec(section)) !== null) {
    const sectionName = match[1];
    const sectionContent = match[2].trim();
    if (sectionContent) {
      sections[sectionName] = sectionContent.split('\n').filter(line => line.trim().startsWith('-'));
    }
  }

  // Build highlights section
  if (Object.keys(sections).length === 0) {
    console.log('### Changes\nSee CHANGELOG.md for detailed changes.');
    return;
  }

  let highlights = '### Highlights\n\n';
  
  // Prioritize Added, Changed, Fixed
  const priority = ['Added', 'Changed', 'Fixed', 'Removed', 'Deprecated', 'Security', 'Documentation'];
  
  for (const sectionName of priority) {
    if (sections[sectionName] && sections[sectionName].length > 0) {
      highlights += `**${sectionName}:**\n`;
      // Show first 3 items of each section, or all if 3 or fewer
      const items = sections[sectionName].slice(0, 3);
      items.forEach(item => {
        highlights += `${item.trim()}\n`;
      });
      if (sections[sectionName].length > 3) {
        highlights += `- _...and ${sections[sectionName].length - 3} more_\n`;
      }
      highlights += '\n';
    }
  }

  console.log(highlights.trim());
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node scripts/extract-changelog-highlights.js <version>');
    console.error('Example: node scripts/extract-changelog-highlights.js 0.2.0');
    process.exit(1);
  }

  const version = args[0];
  extractHighlights(version);
}

main();

