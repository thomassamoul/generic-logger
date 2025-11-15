#!/usr/bin/env node
/**
 * Create Tag and Release Script
 * 
 * Automatically creates a git tag and GitHub release after PR merge to main.
 * Follows the project workflow: merge PR → tag → release
 * 
 * Usage:
 *   node scripts/create-tag-and-release.js
 *   node scripts/create-tag-and-release.js 0.3.0
 *   node scripts/create-tag-and-release.js --dry-run
 * 
 * Requirements:
 *   - GitHub CLI (gh) must be installed and authenticated
 *   - Run: gh auth login
 *   - Must be on main branch with latest changes
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { extractHighlightsFromChangelog } = require('./extract-changelog-highlights');

const packageJsonPath = path.join(__dirname, '..', 'package.json');

function getPackageVersion() {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version;
}

function getCurrentBranch() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    return branch;
  } catch (error) {
    console.error('❌ Error getting current branch:', error.message);
    process.exit(1);
  }
}

function checkTagExists(tag) {
  try {
    execSync(`git rev-parse ${tag}`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

function checkRemoteTagExists(tag) {
  try {
    execSync(`git ls-remote --tags origin ${tag}`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

function ensureMainBranch() {
  const branch = getCurrentBranch();
  if (branch !== 'main' && branch !== 'master') {
    console.error(`❌ Must be on main/master branch, currently on: ${branch}`);
    console.error(`   Switch to main: git checkout main && git pull origin main`);
    process.exit(1);
  }
  
  // Pull latest changes
  try {
    console.log('📥 Pulling latest changes from main...');
    execSync('git pull origin main', { stdio: 'inherit' });
  } catch (error) {
    console.warn('⚠️  Warning: Could not pull latest changes:', error.message);
  }
}

function createTag(version, dryRun = false) {
  const tag = `v${version}`;
  
  if (checkTagExists(tag)) {
    console.error(`❌ Tag ${tag} already exists locally`);
    process.exit(1);
  }
  
  if (checkRemoteTagExists(tag)) {
    console.error(`❌ Tag ${tag} already exists on remote`);
    process.exit(1);
  }
  
  if (dryRun) {
    console.log(`[DRY RUN] Would create tag: ${tag}`);
    return tag;
  }
  
  try {
    console.log(`🏷️  Creating tag: ${tag}...`);
    execSync(`git tag -a ${tag} -m "Release ${version}"`, { stdio: 'inherit' });
    console.log(`✅ Created tag: ${tag}`);
    return tag;
  } catch (error) {
    console.error(`❌ Failed to create tag: ${error.message}`);
    process.exit(1);
  }
}

function pushTag(tag, dryRun = false) {
  if (dryRun) {
    console.log(`[DRY RUN] Would push tag: ${tag}`);
    return;
  }
  
  try {
    console.log(`📤 Pushing tag to remote: ${tag}...`);
    execSync(`git push origin ${tag}`, { stdio: 'inherit' });
    console.log(`✅ Pushed tag: ${tag}`);
  } catch (error) {
    console.error(`❌ Failed to push tag: ${error.message}`);
    process.exit(1);
  }
}

function createRelease(version, tag, dryRun = false) {
  if (dryRun) {
    console.log(`[DRY RUN] Would create GitHub release for ${tag}`);
    return;
  }
  
  // Check if GitHub CLI is available
  try {
    execSync('gh --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ GitHub CLI (gh) is not installed or not in PATH');
    console.error('   Install it from: https://cli.github.com/');
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
  
  // Extract highlights from CHANGELOG
  let highlights = '';
  try {
    highlights = extractHighlightsFromChangelog(version);
    if (!highlights || highlights.trim().length === 0) {
      highlights = '### Changes\nSee CHANGELOG.md for detailed changes.';
    }
  } catch (error) {
    console.warn('⚠️  Warning: Could not extract highlights from CHANGELOG:', error.message);
    highlights = '### Changes\nSee CHANGELOG.md for detailed changes.';
  }
  
  // Generate release body
  const body = `## Version ${version}

**Published to npm:** \`@thomassamoul/generic-logger@${version}\`

### Installation
\`\`\`bash
npm install @thomassamoul/generic-logger@${version}
\`\`\`

${highlights}

---
See [CHANGELOG.md](https://github.com/thomassamoul/generic-logger/blob/${tag}/CHANGELOG.md) for detailed changes.

*Automatically generated from tag ${tag}*`;
  
  try {
    console.log(`🚀 Creating GitHub release for ${tag}...`);
    execSync(`gh release create ${tag} --title "Release ${version}" --notes "${body}"`, {
      stdio: 'inherit'
    });
    console.log(`✅ Created GitHub release: ${tag}`);
  } catch (error) {
    console.error(`❌ Failed to create release: ${error.message}`);
    console.error('   Note: Release might have been created by GitHub Actions workflow');
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  
  let version = '';
  let dryRun = false;
  
  // Parse arguments
  for (const arg of args) {
    if (arg === '--dry-run' || arg === '-d') {
      dryRun = true;
    } else if (!version && !arg.startsWith('-')) {
      version = arg;
    }
  }
  
  // Get version from package.json if not provided
  if (!version) {
    version = getPackageVersion();
  }
  
  // Validate version format
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    console.error(`❌ Invalid version format: ${version}`);
    console.error('   Expected format: X.Y.Z (e.g., 0.3.0)');
    process.exit(1);
  }
  
  const tag = `v${version}`;
  
  console.log(`\n📦 Creating tag and release for version ${version}\n`);
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }
  
  // Ensure we're on main branch
  ensureMainBranch();
  
  // Create tag
  createTag(version, dryRun);
  
  // Push tag (this triggers GitHub Actions workflow)
  pushTag(tag, dryRun);
  
  // Note: GitHub Actions workflow will create the release automatically
  // But we can create it manually if needed
  console.log(`\n✅ Tag ${tag} created and pushed`);
  console.log(`   GitHub Actions workflow will automatically create the release`);
  console.log(`   View at: https://github.com/thomassamoul/generic-logger/releases/tag/${tag}\n`);
  
  if (!dryRun) {
    console.log('💡 To manually create release (if needed):');
    console.log(`   gh release create ${tag} --title "Release ${version}" --notes "..."\n`);
  }
}

main();

