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

function checkWorkingDirectory() {
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  const files = status.trim().split('\n').filter(line => line.trim());
  
  // Filter out only package.json and package-lock.json changes
  const otherFiles = files.filter(line => {
    const file = line.trim().substring(3).trim();
    return file !== 'package.json' && file !== 'package-lock.json';
  });
  
  if (otherFiles.length > 0) {
    console.log('⚠️  Warning: You have uncommitted changes besides package.json:');
    otherFiles.forEach(line => console.log(`   ${line.trim()}`));
    console.log('\nPlease commit or stash them first.');
    process.exit(1);
  }
  
  return files.filter(line => {
    const file = line.trim().substring(3).trim();
    return file === 'package.json' || file === 'package-lock.json';
  }).length > 0;
}

function createRelease(version) {
  const tagName = `v${version}`;
  
  // Check if tag already exists
  try {
    execSync(`git rev-parse -q --verify "refs/tags/${tagName}" > /dev/null 2>&1`, { stdio: 'ignore' });
    throw new Error(`Tag ${tagName} already exists!`);
  } catch (error) {
    if (error.message.includes('already exists')) {
      throw error;
    }
    // Tag doesn't exist, continue
  }
  
  // Check working directory
  const hasVersionChanges = checkWorkingDirectory();
  
  if (!hasVersionChanges) {
    console.log('ℹ️  No changes to package.json detected. Version may already be committed.');
  }
  
  // Commit version change if needed
  if (hasVersionChanges) {
    try {
      execSync('git add package.json package-lock.json', { stdio: 'inherit' });
      execSync(`git commit -m "chore: bump version to ${version}"`, { stdio: 'inherit' });
      console.log(`✓ Committed version change`);
    } catch (error) {
      console.error('Failed to commit version change:', error.message);
      process.exit(1);
    }
  }
  
  // Create tag
  try {
    execSync(`git tag -a ${tagName} -m "Release ${tagName}"`, { stdio: 'inherit' });
    console.log(`✓ Created tag: ${tagName}`);
  } catch (error) {
    console.error('Failed to create tag:', error.message);
    process.exit(1);
  }
  
  // Push commit (if there was a new commit)
  if (hasVersionChanges) {
    try {
      execSync('git push origin main', { stdio: 'inherit' });
      console.log(`✓ Pushed commit to main`);
    } catch (error) {
      console.error('Failed to push commit:', error.message);
      console.log('\n💡 You may need to push manually: git push origin main');
    }
  }
  
  // Push tag
  try {
    execSync(`git push origin ${tagName}`, { stdio: 'inherit' });
    console.log(`✓ Pushed tag ${tagName}`);
  } catch (error) {
    console.error('Failed to push tag:', error.message);
    console.log(`\n💡 You may need to push manually: git push origin ${tagName}`);
    process.exit(1);
  }
  
  console.log(`\n🎉 Release ${tagName} created and pushed!`);
  console.log(`📦 The GitHub workflow will now:`);
  console.log(`   1. Verify version matches`);
  console.log(`   2. Run tests`);
  console.log(`   3. Build package`);
  console.log(`   4. Publish to npm`);
  console.log(`   5. Create GitHub release`);
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
  
  // Check if user wants full automation
  const autoRelease = args.includes('--release') || args.includes('-r');
  
  if (autoRelease) {
    console.log('\n🚀 Starting automated release process...\n');
    createRelease(newVersion);
  } else {
    console.log('\n📝 Next steps:');
    console.log(`  1. Commit the version change:`);
    console.log(`     git add package.json && git commit -m "chore: bump version to ${newVersion}"`);
    console.log(`  2. Push to GitHub:`);
    console.log(`     git push origin main`);
    console.log(`  3. Create and push tag (this will trigger publish workflow):`);
    console.log(`     git tag -a v${newVersion} -m "Release v${newVersion}"`);
    console.log(`     git push origin v${newVersion}`);
    console.log('\n  Or run with --release flag to automate everything:');
    console.log(`     npm run version:patch -- --release`);
    console.log(`     npm run version:minor -- --release`);
    console.log(`     npm run version:major -- --release`);
  }
}

main();

