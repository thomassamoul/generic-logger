#!/usr/bin/env node
/**
 * Manual GitHub Release Creation Script
 * 
 * Creates a GitHub release for an existing tag when the workflow fails.
 * 
 * Usage:
 *   node scripts/create-release.js v0.1.1
 * 
 * Requirements:
 *   - GitHub CLI (gh) must be installed and authenticated
 *   - Run: gh auth login
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');

function getPackageVersion() {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version;
}

function createRelease(tag) {
  // Validate tag format
  if (!tag.startsWith('v')) {
    console.error('❌ Tag must start with "v" (e.g., v0.1.1)');
    process.exit(1);
  }

  const version = tag.substring(1);
  const packageVersion = getPackageVersion();

  // Verify version matches
  if (version !== packageVersion) {
    console.warn(`⚠️  Warning: Tag version (${version}) does not match package.json version (${packageVersion})`);
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('Continue anyway? (y/N): ', (answer) => {
      readline.close();
      if (answer.toLowerCase() !== 'y') {
        process.exit(1);
      }
      doCreateRelease(tag, version);
    });
  } else {
    doCreateRelease(tag, version);
  }
}

function doCreateRelease(tag, version) {
  // Check if gh CLI is available
  try {
    execSync('gh --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ GitHub CLI (gh) is not installed or not in PATH');
    console.error('   Install it from: https://cli.github.com/');
    console.error('   Or run: brew install gh');
    process.exit(1);
  }

  // Check if authenticated
  try {
    execSync('gh auth status', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ GitHub CLI is not authenticated');
    console.error('   Run: gh auth login');
    process.exit(1);
  }

  // Check if tag exists
  try {
    execSync(`git rev-parse -q --verify "refs/tags/${tag}"`, { stdio: 'ignore' });
  } catch (error) {
    console.error(`❌ Tag ${tag} does not exist locally`);
    console.error('   Fetch tags: git fetch --tags');
    process.exit(1);
  }

  // Check if release already exists
  try {
    const existing = execSync(`gh release view ${tag} 2>&1`, { encoding: 'utf8' });
    console.log(`ℹ️  Release ${tag} already exists:`);
    console.log(existing);
    console.log('   Use GitHub web UI or gh release edit to update it');
    process.exit(0);
  } catch (error) {
    // Release doesn't exist, continue
  }

  // Create release body
  const body = `## Version ${version}

**Published to npm:** \`@thomassamoul/generic-logger@${version}\`

### Installation
\`\`\`bash
npm install @thomassamoul/generic-logger@${version}
\`\`\`

### Changes
See [CHANGELOG.md](https://github.com/thomassamoul/generic-logger/blob/${tag}/CHANGELOG.md) for detailed changes.

---
*Manually created for tag ${tag}*
`;

  // Create temporary file for release notes
  const tempFile = path.join(__dirname, '..', '.release-notes.txt');
  fs.writeFileSync(tempFile, body);

  try {
    console.log(`🚀 Creating GitHub release for ${tag}...`);
    execSync(`gh release create ${tag} --title "Release ${tag}" --notes-file "${tempFile}"`, {
      stdio: 'inherit'
    });
    console.log(`\n✅ Successfully created release: ${tag}`);
    console.log(`   View at: https://github.com/thomassamoul/generic-logger/releases/tag/${tag}`);
  } catch (error) {
    console.error('❌ Failed to create release:', error.message);
    process.exit(1);
  } finally {
    // Clean up temp file
    try {
      fs.unlinkSync(tempFile);
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    const version = getPackageVersion();
    console.log('Usage: node scripts/create-release.js [tag]');
    console.log(`\nCurrent package.json version: ${version}`);
    console.log(`\nExamples:`);
    console.log(`  node scripts/create-release.js v${version}`);
    console.log(`  node scripts/create-release.js v0.1.1`);
    process.exit(1);
  }

  const tag = args[0];
  createRelease(tag);
}

main();

