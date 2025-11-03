#!/usr/bin/env node
/**
 * Version Bump Script
 * 
 * Automatically bumps version in package.json and creates a git tag.
 * 
 * Usage:
 *   node scripts/version-bump.js patch  # 0.1.0 -> 0.1.1
 *   node scripts/version-bump.js minor   # 0.1.0 -> 0.2.0
 *   node scripts/version-bump.js major   # 0.1.0 -> 1.0.0
 *   node scripts/version-bump.js 0.2.0  # Set specific version
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packageJsonPath = path.join(__dirname, '..', 'package.json');

function getCurrentVersion() {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version;
}

function bumpVersion(currentVersion, type) {
  const parts = currentVersion.split('.').map(Number);
  
  if (type === 'major') {
    return `${parts[0] + 1}.0.0`;
  } else if (type === 'minor') {
    return `${parts[0]}.${parts[1] + 1}.0`;
  } else if (type === 'patch') {
    return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
  } else if (/^\d+\.\d+\.\d+$/.test(type)) {
    return type; // Specific version provided
  } else {
    throw new Error(`Invalid version type: ${type}. Use 'major', 'minor', 'patch', or 'x.y.z'`);
  }
}

function updatePackageJson(newVersion) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  return packageJson;
}

function createGitTag(version) {
  const tagName = `v${version}`;
  try {
    // Check if tag already exists
    execSync(`git rev-parse -q --verify "refs/tags/${tagName}" > /dev/null 2>&1`, { stdio: 'ignore' });
    throw new Error(`Tag ${tagName} already exists!`);
  } catch (error) {
    if (error.message.includes('already exists')) {
      throw error;
    }
    // Tag doesn't exist, continue
  }
  
  // Check if there are uncommitted changes
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  if (status.trim()) {
    console.log('⚠️  Warning: You have uncommitted changes. Please commit them first.');
    console.log('\nTo proceed:');
    console.log(`  1. Commit your changes: git add . && git commit -m "Prepare release ${tagName}"`);
    console.log(`  2. Push to GitHub: git push origin main`);
    console.log(`  3. Create tag: git tag ${tagName}`);
    console.log(`  4. Push tag: git push origin ${tagName}`);
    process.exit(1);
  }
  
  // Create and push tag
  execSync(`git tag ${tagName}`, { stdio: 'inherit' });
  console.log(`\n✓ Created tag: ${tagName}`);
  console.log(`\nTo publish, push the tag:`);
  console.log(`  git push origin ${tagName}`);
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node scripts/version-bump.js [patch|minor|major|version]');
    console.log('\nExamples:');
    console.log('  node scripts/version-bump.js patch    # 0.1.0 -> 0.1.1');
    console.log('  node scripts/version-bump.js minor    # 0.1.0 -> 0.2.0');
    console.log('  node scripts/version-bump.js major    # 0.1.0 -> 1.0.0');
    console.log('  node scripts/version-bump.js 0.2.0    # Set to specific version');
    process.exit(1);
  }
  
  const versionType = args[0];
  const currentVersion = getCurrentVersion();
  const newVersion = bumpVersion(currentVersion, versionType);
  
  console.log(`\n📦 Current version: ${currentVersion}`);
  console.log(`📦 New version:     ${newVersion}\n`);
  
  updatePackageJson(newVersion);
  console.log(`✓ Updated package.json to version ${newVersion}`);
  
  console.log('\n📝 Next steps:');
  console.log(`  1. Commit the version change:`);
  console.log(`     git add package.json && git commit -m "Bump version to ${newVersion}"`);
  console.log(`  2. Push to GitHub:`);
  console.log(`     git push origin main`);
  console.log(`  3. Create and push tag (this will trigger publish workflow):`);
  console.log(`     git tag v${newVersion}`);
  console.log(`     git push origin v${newVersion}`);
  console.log('\n  Or run this script with --auto-tag flag to auto-create the tag:');
  console.log(`     node scripts/version-bump.js ${versionType} --auto-tag`);
  
  if (args.includes('--auto-tag')) {
    createGitTag(newVersion);
  }
}

main();

