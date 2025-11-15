#!/usr/bin/env node
/**
 * Create Pull Request Script
 * 
 * Automatically creates a PR for the current branch to main.
 * Follows the project workflow: create branch → commits → push → PR → squash merge
 * 
 * Usage:
 *   node scripts/create-pr.js
 *   node scripts/create-pr.js "feat: description"
 * 
 * Requirements:
 *   - GitHub CLI (gh) must be installed and authenticated
 *   - Run: gh auth login
 *   - Current branch must be pushed to remote
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');

function getPackageInfo() {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return {
    name: packageJson.name,
    version: packageJson.version,
  };
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

function checkBranchExistsOnRemote(branch) {
  try {
    execSync(`git ls-remote --heads origin ${branch}`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

function getLastCommitMessages(count = 5) {
  try {
    const commits = execSync(`git log --oneline -${count}`, { encoding: 'utf8' }).trim().split('\n');
    return commits;
  } catch (error) {
    return [];
  }
}

function getChangedFiles() {
  try {
    const mainBranch = 'main';
    const files = execSync(`git diff --name-only ${mainBranch}...HEAD`, { encoding: 'utf8' }).trim().split('\n').filter(f => f);
    return files;
  } catch (error) {
    return [];
  }
}

function generatePRBody(branch, commits, files) {
  const pkg = getPackageInfo();
  
  // Categorize files
  const newFiles = files.filter(f => {
    try {
      execSync(`git diff --quiet ${branch}...main -- ${f} 2>/dev/null`);
      return false;
    } catch {
      return true;
    }
  });
  
  const fileTypes = {
    'logger/': 'Code changes',
    '__tests__/': 'Tests',
    'docs/': 'Documentation',
    '.github/': 'CI/CD',
    'scripts/': 'Scripts',
    'CHANGELOG.md': 'CHANGELOG',
    'README.md': 'Documentation',
    'CONTRIBUTING.md': 'Documentation',
    'PROJECT_STRUCTURE.md': 'Documentation',
  };
  
  let body = `## Summary\n\n`;
  
  // Add commit summary
  if (commits.length > 0) {
    body += `### Commits (${commits.length})\n\n`;
    commits.slice(0, 10).forEach(commit => {
      body += `- ${commit}\n`;
    });
    if (commits.length > 10) {
      body += `- _...and ${commits.length - 10} more commits_\n`;
    }
    body += `\n`;
  }
  
  // Add file changes summary
  if (files.length > 0) {
    body += `### Files Changed (${files.length})\n\n`;
    const categories = {};
    files.forEach(file => {
      let category = 'Other';
      for (const [pattern, cat] of Object.entries(fileTypes)) {
        if (file.startsWith(pattern) || file === pattern) {
          category = cat;
          break;
        }
      }
      if (!categories[category]) categories[category] = [];
      categories[category].push(file);
    });
    
    for (const [category, files] of Object.entries(categories)) {
      body += `**${category}:** ${files.length} file(s)\n`;
    }
    body += `\n`;
  }
  
  // Add workflow note
  body += `### Git Workflow Followed\n\n`;
  body += `✅ Created feature branch: \`${branch}\`\n`;
  body += `✅ Made logical commits\n`;
  body += `✅ Pushed branch to remote\n`;
  body += `✅ Ready for squash and merge\n\n`;
  
  body += `### Next Steps\n\n`;
  body += `1. Review and approve this PR\n`;
  body += `2. Squash and merge to main (not regular merge)\n`;
  body += `3. After merge, create tag and release (tags created AFTER merge to main)\n`;
  
  return body;
}

function createPR(title, body) {
  // Check if gh CLI is available
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

  // Check if branch exists on remote
  const branch = getCurrentBranch();
  if (branch === 'main' || branch === 'master') {
    console.error('❌ Cannot create PR from main/master branch');
    console.error('   Create a feature branch first: git checkout -b feature/description');
    process.exit(1);
  }

  if (!checkBranchExistsOnRemote(branch)) {
    console.error(`❌ Branch ${branch} is not pushed to remote`);
    console.error(`   Push it first: git push -u origin ${branch}`);
    process.exit(1);
  }

  // Check if PR already exists
  try {
    const existing = execSync(`gh pr view ${branch} 2>&1`, { encoding: 'utf8' });
    console.log(`ℹ️  PR already exists for branch ${branch}:`);
    console.log(existing);
    console.log('   Use: gh pr view --web to open in browser');
    process.exit(0);
  } catch (error) {
    // PR doesn't exist, continue
  }

  // Generate PR body if not provided
  if (!body) {
    const commits = getLastCommitMessages(10);
    const files = getChangedFiles();
    body = generatePRBody(branch, commits, files);
  }

  // Create PR
  try {
    console.log(`🚀 Creating PR for branch: ${branch}...`);
    execSync(`gh pr create --title "${title}" --body "${body}" --base main`, {
      stdio: 'inherit'
    });
    console.log(`\n✅ Successfully created PR for ${branch}`);
    console.log(`   View at: https://github.com/thomassamoul/generic-logger/pull/new/${branch}`);
  } catch (error) {
    console.error('❌ Failed to create PR:', error.message);
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  
  let title = '';
  let body = '';

  if (args.length === 0) {
    // Auto-generate title from branch name
    const branch = getCurrentBranch();
    // Convert branch name to PR title
    // feature/my-feature -> feat: My Feature
    // fix/bug-fix -> fix: Bug Fix
    const parts = branch.split('/');
    if (parts.length >= 2) {
      const type = parts[0];
      const description = parts.slice(1).join('-');
      const typeMap = {
        'feature': 'feat',
        'fix': 'fix',
        'docs': 'docs',
        'test': 'test',
        'refactor': 'refactor',
        'chore': 'chore',
      };
      const prType = typeMap[type] || type;
      const words = description.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1));
      title = `${prType}: ${words.join(' ')}`;
    } else {
      title = `Update: ${branch}`;
    }
  } else {
    title = args[0];
    if (args.length > 1) {
      body = args.slice(1).join(' ');
    }
  }

  createPR(title, body);
}

main();

