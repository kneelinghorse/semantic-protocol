#!/usr/bin/env node

/**
 * Semantic Protocol CLI
 * Main entry point for the command-line interface
 */

// Check Node.js version
const currentNodeVersion = process.versions.node;
const semver = currentNodeVersion.split('.');
const major = parseInt(semver[0]);

if (major < 16) {
  console.error(
    '\x1b[31m%s\x1b[0m',
    'Error: Semantic Protocol CLI requires Node.js 16 or higher.\n' +
    `You are running Node.js ${currentNodeVersion}.\n` +
    'Please upgrade your Node.js version.'
  );
  process.exit(1);
}

// Check for updates
const updateNotifier = require('update-notifier');
const pkg = require('../package.json');

updateNotifier({ pkg }).notify();

// Load the CLI
require('../dist/index.js');