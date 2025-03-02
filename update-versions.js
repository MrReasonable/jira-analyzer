#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read the versions file
const versionsPath = path.join(__dirname, 'versions.json');
const versions = JSON.parse(fs.readFileSync(versionsPath, 'utf8'));

console.log('Using versions:', versions);

// Update GitHub Actions workflows
const workflowsDir = path.join(__dirname, '.github', 'workflows');
const workflowFiles = fs.readdirSync(workflowsDir).filter(file => file.endsWith('.yml'));

workflowFiles.forEach(file => {
  const filePath = path.join(workflowsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Update Node.js version
  content = content.replace(
    /node-version: ['"](\d+)['"]/,
    `node-version: '${versions.node}'`
  );

  // Update Python version
  content = content.replace(
    /python-version: ['"](\d+\.\d+)['"]/,
    `python-version: '${versions.python}'`
  );

  // Update PNPM version
  content = content.replace(
    /version: ['"](\d+\.\d+\.\d+)['"]/,
    `version: '${versions.pnpm}'`
  );

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
});

// Update Dockerfiles
const updateDockerfile = (filePath) => {
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');

  // Update Node.js version in frontend Dockerfile
  if (filePath.includes('frontend')) {
    content = content.replace(
      /FROM node:(\d+)-slim/,
      `FROM node:${versions.node}-slim`
    );

    content = content.replace(
      /ARG PNPM_VERSION=(\d+\.\d+\.\d+)/,
      `ARG PNPM_VERSION=${versions.pnpm}`
    );
  }

  // Update Python version in backend Dockerfile
  if (filePath.includes('backend')) {
    content = content.replace(
      /FROM python:(\d+\.\d+)-slim/,
      `FROM python:${versions.python}-slim`
    );

    content = content.replace(
      /FROM python:(\d+\.\d+)-alpine/,
      `FROM python:${versions.python}-alpine`
    );
  }

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${filePath}`);
};

updateDockerfile(path.join(__dirname, 'frontend', 'Dockerfile'));
updateDockerfile(path.join(__dirname, 'backend', 'Dockerfile'));

// Update mise.toml
const misePath = path.join(__dirname, 'mise.toml');
if (fs.existsSync(misePath)) {
  let content = fs.readFileSync(misePath, 'utf8');

  // Update Node.js version
  content = content.replace(
    /node = "(\d+)"/,
    `node = "${versions.node}"`
  );

  // Update Python version
  content = content.replace(
    /python = "(\d+\.\d+)"/,
    `python = "${versions.python}"`
  );

  fs.writeFileSync(misePath, content);
  console.log(`Updated mise.toml`);
}

console.log('All files updated successfully!');
console.log('');
console.log('To verify the changes, you can run:');
console.log('  git diff');
