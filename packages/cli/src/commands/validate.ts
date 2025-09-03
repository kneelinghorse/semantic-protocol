import fs from 'fs-extra';
import path from 'path';
import glob from 'glob';
import chokidar from 'chokidar';
import chalk from 'chalk';
import { SemanticProtocol, SemanticManifest, ValidationResult } from '@kneelinghorse/semantic-protocol';
import { logger } from '../utils/logger';
import { loadConfig } from '../utils/config';
import { table } from 'table';

interface ValidateOptions {
  fix?: boolean;
  strict?: boolean;
  watch?: boolean;
  json?: boolean;
  ignore?: string;
  semanticConfig?: any;
}

interface ValidationIssue {
  file: string;
  line?: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  rule?: string;
  fixable?: boolean;
}

export async function validateCommand(
  targetPath: string = '.',
  options: ValidateOptions
): Promise<void> {
  const protocol = new SemanticProtocol();
  const config = options.semanticConfig || await loadConfig();
  
  logger.heading('Semantic Protocol Validation');

  if (options.watch) {
    await watchMode(targetPath, options, protocol);
  } else {
    await validateOnce(targetPath, options, protocol);
  }
}

async function validateOnce(
  targetPath: string,
  options: ValidateOptions,
  protocol: SemanticProtocol
): Promise<void> {
  logger.startSpinner('Scanning for semantic manifests...');
  
  const files = await findSemanticFiles(targetPath, options.ignore);
  
  logger.updateSpinner(`Found ${files.length} files to validate`);
  
  const issues: ValidationIssue[] = [];
  let validCount = 0;
  let fixedCount = 0;

  for (const file of files) {
    const fileIssues = await validateFile(file, protocol, options);
    
    if (fileIssues.length === 0) {
      validCount++;
    } else {
      issues.push(...fileIssues);
      
      if (options.fix) {
        const fixed = await fixIssues(file, fileIssues);
        fixedCount += fixed;
      }
    }
  }

  logger.stopSpinner();

  // Output results
  if (options.json) {
    logger.json({
      totalFiles: files.length,
      validFiles: validCount,
      issues: issues,
      fixed: fixedCount
    });
  } else {
    displayResults(files.length, validCount, issues, fixedCount);
  }

  // Exit with error code if there are issues
  if (issues.filter(i => i.severity === 'error').length > 0) {
    process.exit(1);
  }
}

async function watchMode(
  targetPath: string,
  options: ValidateOptions,
  protocol: SemanticProtocol
): Promise<void> {
  logger.info('Starting watch mode...');
  logger.info('Press Ctrl+C to exit');
  
  const watcher = chokidar.watch(targetPath, {
    ignored: options.ignore ? options.ignore.split(',') : ['node_modules/**', 'dist/**'],
    persistent: true,
    ignoreInitial: false
  });

  watcher
    .on('add', (filePath) => handleFileChange(filePath, protocol, options))
    .on('change', (filePath) => handleFileChange(filePath, protocol, options))
    .on('unlink', (filePath) => {
      logger.info(`File removed: ${filePath}`);
    })
    .on('error', (error) => {
      logger.error('Watcher error:', error);
    });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    logger.info('\nStopping watch mode...');
    watcher.close();
    process.exit(0);
  });
}

async function handleFileChange(
  filePath: string,
  protocol: SemanticProtocol,
  options: ValidateOptions
): Promise<void> {
  if (!isSemanticFile(filePath)) return;
  
  logger.info(`Validating ${chalk.cyan(filePath)}...`);
  
  const issues = await validateFile(filePath, protocol, options);
  
  if (issues.length === 0) {
    logger.success(`✓ ${filePath} is valid`);
  } else {
    displayFileIssues(filePath, issues);
    
    if (options.fix) {
      const fixed = await fixIssues(filePath, issues);
      if (fixed > 0) {
        logger.success(`Fixed ${fixed} issue(s) in ${filePath}`);
      }
    }
  }
}

async function findSemanticFiles(
  targetPath: string,
  ignore?: string
): Promise<string[]> {
  const patterns = [
    '**/*.semantic.json',
    '**/*.manifest.json',
    '**/semantic-*.json'
  ];

  const ignorePatterns = ignore 
    ? ignore.split(',')
    : ['node_modules/**', 'dist/**', 'build/**'];

  const files: string[] = [];

  for (const pattern of patterns) {
    const matches = glob.sync(path.join(targetPath, pattern), {
      ignore: ignorePatterns
    });
    files.push(...matches);
  }

  // Also check for inline manifests in source files
  const sourcePatterns = [
    '**/*.{js,jsx,ts,tsx}',
    '**/*.vue',
    '**/*.svelte'
  ];

  for (const pattern of sourcePatterns) {
    const matches = glob.sync(path.join(targetPath, pattern), {
      ignore: ignorePatterns
    });
    
    for (const file of matches) {
      if (await hasInlineManifest(file)) {
        files.push(file);
      }
    }
  }

  return [...new Set(files)];
}

async function hasInlineManifest(filePath: string): Promise<boolean> {
  const content = await fs.readFile(filePath, 'utf-8');
  
  // Look for semantic manifest patterns
  const patterns = [
    /getManifest\s*\(\)/,
    /manifest\s*[:=]\s*{[\s\S]*?protocol\s*:/,
    /useSemantics\s*\(/,
    /@semantic-manifest/,
    /data-semantic-/
  ];

  return patterns.some(pattern => pattern.test(content));
}

function isSemanticFile(filePath: string): boolean {
  return filePath.includes('semantic') || 
         filePath.includes('manifest') ||
         /\.(jsx?|tsx?|vue|svelte)$/.test(filePath);
}

async function validateFile(
  filePath: string,
  protocol: SemanticProtocol,
  options: ValidateOptions
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    let manifests: SemanticManifest[] = [];

    // Extract manifests based on file type
    if (filePath.endsWith('.json')) {
      try {
        const data = JSON.parse(content);
        manifests = Array.isArray(data) ? data : [data];
      } catch (error) {
        issues.push({
          file: filePath,
          severity: 'error',
          message: 'Invalid JSON syntax',
          line: 1
        });
        return issues;
      }
    } else {
      manifests = extractInlineManifests(content);
    }

    // Validate each manifest
    for (const manifest of manifests) {
      const result = await protocol.validate(manifest);
      
      if (!result.valid) {
        result.errors?.forEach(error => {
          issues.push({
            file: filePath,
            severity: options.strict ? 'error' : 'warning',
            message: error,
            rule: 'manifest-validation'
          });
        });
      }

      // Additional checks
      const additionalIssues = performAdditionalChecks(manifest, options);
      issues.push(...additionalIssues.map(issue => ({
        ...issue,
        file: filePath
      })));
    }

  } catch (error) {
    issues.push({
      file: filePath,
      severity: 'error',
      message: `Failed to read file: ${(error as Error).message}`
    });
  }

  return issues;
}

function extractInlineManifests(content: string): SemanticManifest[] {
  const manifests: SemanticManifest[] = [];
  
  // Regex patterns to extract manifests from code
  const patterns = [
    /getManifest\s*\(\)\s*{\s*return\s*({[\s\S]*?});/g,
    /manifest\s*[:=]\s*({[\s\S]*?});/g,
    /useSemantics\s*\(\s*{[\s\S]*?manifest:\s*({[\s\S]*?})/g
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      try {
        // Clean up the matched string
        let manifestStr = match[1] || match[0];
        manifestStr = manifestStr
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
          .replace(/\/\/.*/g, '') // Remove line comments
          .replace(/(['"])(\w+)\1:/g, '"$2":') // Quote keys
          .replace(/,\s*}/, '}') // Remove trailing commas
          .replace(/,\s*]/, ']');

        // Try to parse as JSON
        const manifest = eval(`(${manifestStr})`);
        if (manifest && typeof manifest === 'object') {
          manifests.push(manifest);
        }
      } catch (error) {
        // Ignore parse errors for now
      }
    }
  });

  return manifests;
}

function performAdditionalChecks(
  manifest: SemanticManifest,
  options: ValidateOptions
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check for required fields
  if (!manifest.element?.type) {
    issues.push({
      file: '',
      severity: 'error',
      message: 'Missing required field: element.type',
      rule: 'required-field',
      fixable: false
    });
  }

  // Check for deprecated fields
  if ((manifest as any).deprecated) {
    issues.push({
      file: '',
      severity: 'warning',
      message: 'Using deprecated field: deprecated',
      rule: 'no-deprecated',
      fixable: true
    });
  }

  // Check naming conventions
  if (manifest.element?.type && !/^[a-z-]+$/.test(manifest.element.type)) {
    issues.push({
      file: '',
      severity: 'warning',
      message: `Invalid element type format: ${manifest.element.type}. Use lowercase with hyphens.`,
      rule: 'naming-convention',
      fixable: true
    });
  }

  // Check for circular dependencies
  if (manifest.relationships) {
    const deps = [
      ...(manifest.relationships as any).dependencies || [],
      ...(manifest.relationships as any).children || []
    ];
    
    // Simple circular check (would need more complex graph traversal in real implementation)
    if (deps.includes(manifest.metadata?.id)) {
      issues.push({
        file: '',
        severity: 'error',
        message: 'Circular dependency detected',
        rule: 'no-circular',
        fixable: false
      });
    }
  }

  return issues;
}

async function fixIssues(
  filePath: string,
  issues: ValidationIssue[]
): Promise<number> {
  const fixableIssues = issues.filter(i => i.fixable);
  if (fixableIssues.length === 0) return 0;

  let content = await fs.readFile(filePath, 'utf-8');
  let fixedCount = 0;

  for (const issue of fixableIssues) {
    switch (issue.rule) {
      case 'no-deprecated':
        content = content.replace(/["']deprecated["']\s*:\s*[^,}]+,?/g, '');
        fixedCount++;
        break;
      
      case 'naming-convention':
        // Fix element type to lowercase
        content = content.replace(
          /["']type["']\s*:\s*["']([^"']+)["']/g,
          (match, type) => `"type": "${type.toLowerCase().replace(/[A-Z]/g, '-$&')}"`
        );
        fixedCount++;
        break;
      
      // Add more fix rules as needed
    }
  }

  if (fixedCount > 0) {
    await fs.writeFile(filePath, content);
  }

  return fixedCount;
}

function displayResults(
  totalFiles: number,
  validFiles: number,
  issues: ValidationIssue[],
  fixedCount: number
): void {
  logger.newline();
  
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  const info = issues.filter(i => i.severity === 'info');

  // Summary table
  const summaryData = [
    ['Metric', 'Value'],
    ['Total Files', totalFiles.toString()],
    ['Valid Files', chalk.green(validFiles.toString())],
    ['Errors', errors.length > 0 ? chalk.red(errors.length.toString()) : '0'],
    ['Warnings', warnings.length > 0 ? chalk.yellow(warnings.length.toString()) : '0'],
    ['Info', info.length.toString()]
  ];

  if (fixedCount > 0) {
    summaryData.push(['Fixed Issues', chalk.green(fixedCount.toString())]);
  }

  console.log(table(summaryData, {
    header: {
      alignment: 'center',
      content: chalk.bold('Validation Summary')
    }
  }));

  // Display issues by file
  if (issues.length > 0) {
    logger.heading('Issues Found');
    
    const issuesByFile = new Map<string, ValidationIssue[]>();
    issues.forEach(issue => {
      if (!issuesByFile.has(issue.file)) {
        issuesByFile.set(issue.file, []);
      }
      issuesByFile.get(issue.file)!.push(issue);
    });

    issuesByFile.forEach((fileIssues, file) => {
      displayFileIssues(file, fileIssues);
    });
  } else {
    logger.success('✨ All files are valid!');
  }
}

function displayFileIssues(file: string, issues: ValidationIssue[]): void {
  logger.info(chalk.underline(file));
  
  issues.forEach(issue => {
    const icon = issue.severity === 'error' ? '✖' :
                 issue.severity === 'warning' ? '⚠' : 'ℹ';
    const color = issue.severity === 'error' ? chalk.red :
                  issue.severity === 'warning' ? chalk.yellow : chalk.blue;
    
    const location = issue.line ? `:${issue.line}${issue.column ? `:${issue.column}` : ''}` : '';
    const fixable = issue.fixable ? chalk.gray(' (fixable)') : '';
    
    console.log(`  ${color(icon)} ${issue.message}${location}${fixable}`);
    
    if (issue.rule) {
      console.log(chalk.gray(`     Rule: ${issue.rule}`));
    }
  });
  
  logger.newline();
}