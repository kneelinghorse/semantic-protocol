#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { initCommand } from './commands/init';
import { validateCommand } from './commands/validate';
import { generateCommand } from './commands/generate';
import { analyzeCommand } from './commands/analyze';
import { discoverCommand } from './commands/discover';
import { migrateCommand } from './commands/migrate';
import { serveCommand } from './commands/serve';
import { loadConfig } from './utils/config';
import { logger } from './utils/logger';

const program = new Command();
const packageJson = require('../package.json');

// Display banner
if (process.stdout.isTTY) {
  console.log(
    chalk.cyan(
      figlet.textSync('Semantic', {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default'
      })
    )
  );
  console.log(chalk.gray(`Protocol CLI v${packageJson.version}\n`));
}

// Main program configuration
program
  .name('semantic')
  .description('CLI for Semantic Protocol - Analyze, validate, and generate semantic UI components')
  .version(packageJson.version, '-v, --version', 'Display version number')
  .helpOption('-h, --help', 'Display help for command')
  .option('-c, --config <path>', 'Path to config file', '.semanticrc.json')
  .option('--no-color', 'Disable colored output')
  .option('--verbose', 'Verbose output')
  .option('--quiet', 'Minimal output')
  .hook('preAction', async (thisCommand) => {
    // Load configuration before executing commands
    const options = thisCommand.opts();
    if (options.verbose) {
      process.env.SEMANTIC_VERBOSE = 'true';
    }
    if (options.quiet) {
      process.env.SEMANTIC_QUIET = 'true';
    }
    
    // Load config
    const config = await loadConfig(options.config);
    if (config) {
      thisCommand.setOptionValue('semanticConfig', config);
    }
  });

// Initialize command
program
  .command('init')
  .description('Initialize Semantic Protocol in your project')
  .option('-f, --framework <type>', 'Framework type (react|vue|angular|vanilla)', 'vanilla')
  .option('-t, --typescript', 'Enable TypeScript support')
  .option('-e, --examples', 'Include example components')
  .option('-g, --git', 'Initialize git hooks')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .action(initCommand);

// Validate command
program
  .command('validate [path]')
  .description('Validate semantic manifests')
  .option('--fix', 'Auto-fix issues when possible')
  .option('--strict', 'Use strict validation mode')
  .option('-w, --watch', 'Watch files for changes')
  .option('--json', 'Output results as JSON')
  .option('--ignore <patterns>', 'Ignore patterns (comma-separated)')
  .action(validateCommand);

// Generate command
const generate = program
  .command('generate')
  .alias('gen')
  .description('Generate code from semantic definitions');

generate
  .command('component <name>')
  .description('Generate a component from manifest')
  .option('-t, --template <name>', 'Use specific template')
  .option('-o, --output <dir>', 'Output directory')
  .option('--force', 'Overwrite existing files')
  .action((name, options) => generateCommand('component', name, options));

generate
  .command('test <path>')
  .description('Generate tests from semantic definitions')
  .option('-f, --framework <type>', 'Test framework (jest|mocha|vitest)')
  .option('-o, --output <dir>', 'Output directory')
  .action((path, options) => generateCommand('test', path, options));

generate
  .command('docs [path]')
  .description('Generate documentation from semantics')
  .option('-f, --format <type>', 'Output format (markdown|html|json)')
  .option('-o, --output <file>', 'Output file')
  .action((path, options) => generateCommand('docs', path || '.', options));

generate
  .command('types [path]')
  .description('Generate TypeScript types from semantics')
  .option('-o, --output <file>', 'Output file', 'semantic-types.d.ts')
  .action((path, options) => generateCommand('types', path || '.', options));

// Analyze command
program
  .command('analyze [path]')
  .description('Analyze semantic coverage and quality')
  .option('-f, --format <type>', 'Output format (console|json|html|markdown)', 'console')
  .option('-o, --output <file>', 'Output file (for non-console formats)')
  .option('--coverage', 'Show coverage metrics')
  .option('--complexity', 'Show complexity analysis')
  .option('--suggestions', 'Show improvement suggestions')
  .action(analyzeCommand);

// Discover command
program
  .command('discover')
  .description('Discover components by semantic query')
  .option('-q, --query <query>', 'Semantic query string')
  .option('-t, --type <type>', 'Filter by element type')
  .option('-i, --intent <intent>', 'Filter by element intent')
  .option('--tags <tags>', 'Filter by tags (comma-separated)')
  .option('--graph', 'Show relationship graph')
  .option('--json', 'Output as JSON')
  .action(discoverCommand);

// Migrate command
program
  .command('migrate')
  .description('Migrate between Semantic Protocol versions')
  .option('--from <version>', 'Source protocol version')
  .option('--to <version>', 'Target protocol version', '2.0.0')
  .option('--dry-run', 'Preview changes without applying them')
  .option('--backup', 'Create backup before migration')
  .action(migrateCommand);

// Serve command
program
  .command('serve')
  .description('Start Semantic Protocol playground server')
  .option('-p, --port <number>', 'Server port', '3456')
  .option('--host <host>', 'Server host', 'localhost')
  .option('--open', 'Open browser automatically')
  .option('--hot', 'Enable hot reload')
  .action(serveCommand);

// Config command
program
  .command('config')
  .description('Manage Semantic Protocol configuration')
  .option('--init', 'Create default config file')
  .option('--get <key>', 'Get config value')
  .option('--set <key=value>', 'Set config value')
  .option('--list', 'List all config values')
  .action(async (options) => {
    const { configCommand } = await import('./commands/config');
    await configCommand(options);
  });

// Interactive mode
program
  .command('interactive')
  .alias('i')
  .description('Start interactive mode')
  .action(async () => {
    const { interactiveCommand } = await import('./commands/interactive');
    await interactiveCommand();
  });

// Error handling
program.exitOverride();

try {
  program.parse(process.argv);
  
  // Show help if no command provided
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
} catch (error: any) {
  if (error.code === 'commander.unknownCommand') {
    logger.error(`Unknown command: ${error.message}`);
    logger.info('Run "semantic --help" to see available commands');
  } else if (error.code === 'commander.help') {
    // Help was requested, exit gracefully
    process.exit(0);
  } else {
    logger.error('An unexpected error occurred:', error.message);
    if (process.env.SEMANTIC_VERBOSE === 'true') {
      console.error(error.stack);
    }
  }
  process.exit(1);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error.message);
  if (process.env.SEMANTIC_VERBOSE === 'true') {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});