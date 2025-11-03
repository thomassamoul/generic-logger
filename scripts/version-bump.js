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
  
  if (files.length === 0) {
    return false; // No changes at all
  }
  
  // Parse git status output - format: "XY filename"
  // X = staged status, Y = unstaged status
  const versionFiles = [];
  const otherFiles = [];
  
  files.forEach(line => {
    const statusCode = line.trim().substring(0, 2);
    const file = line.trim().substring(2).trim();
    
    if (file === 'package.json' || file === 'package-lock.json') {
      versionFiles.push({ status: statusCode, file });
    } else {
      otherFiles.push({ status: statusCode, file });
    }
  });
  
  if (otherFiles.length > 0) {
    console.log('⚠️  Warning: You have uncommitted changes besides package.json:');
    otherFiles.forEach(({ file }) => console.log(`   ${file}`));
    console.log('\nPlease commit or stash them first.');
    process.exit(1);
  }
  
  return versionFiles.length > 0; // Return true if there are version file changes
}

function createRelease(version) {
  const tagName = `v${version}`;
  const releaseBranch = `release/${version}`;
  
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
  
  // Get current branch
  let currentBranch;
  try {
    currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    console.error('Failed to get current branch:', error.message);
    process.exit(1);
  }
  
  console.log(`📍 Current branch: ${currentBranch}`);
  
  // Check if release branch already exists locally
  let branchExists = false;
  try {
    execSync(`git rev-parse --verify "${releaseBranch}" > /dev/null 2>&1`, { stdio: 'ignore' });
    branchExists = true;
  } catch {
    // Branch doesn't exist, that's fine
  }
  
  // Check if release branch exists on remote
  let remoteBranchExists = false;
  try {
    execSync(`git ls-remote --heads origin "${releaseBranch}" > /dev/null 2>&1`, { stdio: 'ignore' });
    remoteBranchExists = true;
  } catch {
    // Branch doesn't exist on remote, that's fine
  }
  
  // Create or switch to release branch
  if (branchExists) {
    console.log(`ℹ️  Release branch ${releaseBranch} already exists locally.`);
    execSync(`git checkout ${releaseBranch}`, { stdio: 'inherit' });
    console.log(`✓ Switched to branch: ${releaseBranch}`);
  } else {
    // Create branch from current branch
    execSync(`git checkout -b ${releaseBranch}`, { stdio: 'inherit' });
    console.log(`✓ Created and switched to branch: ${releaseBranch}`);
  }
  
  // Check working directory for version changes
  const hasVersionChanges = checkWorkingDirectory();
  
  // Always ensure package.json is staged before checking/committing
  try {
    execSync('git add package.json package-lock.json 2>/dev/null || true', { stdio: 'pipe' });
  } catch (error) {
    // Ignore if files don't exist or aren't tracked
  }
  
  if (!hasVersionChanges) {
    console.log('ℹ️  No changes to package.json detected. Version may already be committed.');
    console.log('ℹ️  Creating tag on current commit...');
  } else {
    // Commit version change
    try {
      execSync(`git commit -m "chore: bump version to ${version}"`, { stdio: 'inherit' });
      console.log(`✓ Committed version change`);
    } catch (error) {
      // If commit fails (maybe nothing to commit), that's okay
      console.log('ℹ️  Version change already committed or no changes to commit');
    }
  }
  
  // Always create tag (on current HEAD of release branch)
  try {
    // Check if tag exists first
    try {
      execSync(`git rev-parse -q --verify "refs/tags/${tagName}" > /dev/null 2>&1`, { stdio: 'ignore' });
      console.log(`⚠️  Tag ${tagName} already exists locally. Skipping tag creation.`);
    } catch {
      // Tag doesn't exist, create it
      execSync(`git tag -a ${tagName} -m "Release ${tagName}"`, { stdio: 'inherit' });
      console.log(`✓ Created tag: ${tagName}`);
    }
  } catch (error) {
    console.error('Failed to create tag:', error.message);
    process.exit(1);
  }
  
  // Push release branch
  try {
    if (remoteBranchExists) {
      console.log(`ℹ️  Release branch ${releaseBranch} already exists on remote.`);
      execSync(`git push origin ${releaseBranch}`, { stdio: 'inherit' });
      console.log(`✓ Pushed release branch: ${releaseBranch}`);
    } else {
      execSync(`git push -u origin ${releaseBranch}`, { stdio: 'inherit' });
      console.log(`✓ Pushed release branch: ${releaseBranch} (with upstream)`);
    }
  } catch (error) {
    console.error('Failed to push release branch:', error.message);
    console.log(`\n💡 You may need to push manually: git push -u origin ${releaseBranch}`);
  }
  
  // Always push tag
  try {
    // Check if tag exists on remote
    try {
      execSync(`git ls-remote --tags origin ${tagName} > /dev/null 2>&1`, { stdio: 'ignore' });
      console.log(`⚠️  Tag ${tagName} already exists on remote. Skipping tag push.`);
    } catch {
      // Tag doesn't exist on remote, push it
      execSync(`git push origin ${tagName}`, { stdio: 'inherit' });
      console.log(`✓ Pushed tag ${tagName} to remote`);
    }
  } catch (error) {
    console.error('Failed to push tag:', error.message);
    console.log(`\n💡 You may need to push manually: git push origin ${tagName}`);
    process.exit(1);
  }
  
  // Switch back to original branch (or main if release branch)
  if (currentBranch !== releaseBranch) {
    try {
      execSync(`git checkout ${currentBranch}`, { stdio: 'inherit' });
      console.log(`✓ Switched back to branch: ${currentBranch}`);
    } catch (error) {
      console.log(`⚠️  Could not switch back to ${currentBranch}. You may need to switch manually.`);
    }
  } else {
    // If we were already on a release branch, switch to main
    try {
      execSync('git checkout main', { stdio: 'inherit' });
      console.log(`✓ Switched to branch: main`);
    } catch (error) {
      console.log(`⚠️  Could not switch to main. You may need to switch manually.`);
    }
  }
  
  console.log(`\n🎉 Release ${tagName} created and pushed!`);
  console.log(`📦 Release branch: ${releaseBranch}`);
  console.log(`📦 Tag: ${tagName}`);
  console.log(`\n📦 The GitHub workflow will now:`);
  console.log(`   1. Verify version matches`);
  console.log(`   2. Run tests`);
  console.log(`   3. Build package`);
  console.log(`   4. Publish to npm`);
  console.log(`   5. Create GitHub release`);
  console.log(`\n💡 Optional: Merge release branch to main:`);
  console.log(`   git checkout main`);
  console.log(`   git merge ${releaseBranch}`);
  console.log(`   git push origin main`);
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

