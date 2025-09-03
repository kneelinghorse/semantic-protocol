import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { execa } from 'execa';
import { logger } from '../utils/logger';
import { createConfig, detectProjectType, SemanticConfig } from '../utils/config';
import { generateComponent } from './generate';

interface InitOptions {
  framework?: string;
  typescript?: boolean;
  examples?: boolean;
  git?: boolean;
  yes?: boolean;
}

export async function initCommand(options: InitOptions): Promise<void> {
  logger.box(
    'Welcome to Semantic Protocol!\n\n' +
    'This wizard will help you set up Semantic Protocol in your project.',
    '🚀 Initialization Wizard'
  );

  const cwd = process.cwd();
  
  // Check if already initialized
  if (await fs.pathExists(path.join(cwd, '.semanticrc.json'))) {
    const { overwrite } = await inquirer.prompt([{
      type: 'confirm',
      name: 'overwrite',
      message: 'Semantic Protocol is already initialized. Overwrite configuration?',
      default: false
    }]);
    
    if (!overwrite) {
      logger.info('Initialization cancelled');
      return;
    }
  }

  // Detect project type
  logger.startSpinner('Detecting project configuration...');
  const detected = await detectProjectType();
  logger.succeedSpinner('Project configuration detected');

  let config: Partial<SemanticConfig>;

  if (options.yes) {
    // Use defaults with detected values
    config = {
      ...detected,
      framework: options.framework || detected.framework || 'vanilla',
      typescript: options.typescript ?? detected.typescript ?? false
    };
  } else {
    // Interactive prompts
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'framework',
        message: 'Which framework are you using?',
        choices: [
          { name: 'React', value: 'react' },
          { name: 'Vue 3', value: 'vue' },
          { name: 'Angular', value: 'angular' },
          { name: 'Vanilla JavaScript', value: 'vanilla' }
        ],
        default: options.framework || detected.framework || 'vanilla'
      },
      {
        type: 'confirm',
        name: 'typescript',
        message: 'Are you using TypeScript?',
        default: options.typescript ?? detected.typescript ?? false
      },
      {
        type: 'input',
        name: 'componentsPath',
        message: 'Where are your components located?',
        default: detected.paths?.components || './src/components'
      },
      {
        type: 'list',
        name: 'validation',
        message: 'Which validation mode would you like to use?',
        choices: [
          { name: 'Strict - All rules enforced', value: 'strict' },
          { name: 'Loose - Warnings only', value: 'loose' },
          { name: 'None - No validation', value: 'none' }
        ],
        default: 'strict'
      },
      {
        type: 'confirm',
        name: 'examples',
        message: 'Would you like to include example components?',
        default: options.examples ?? true
      },
      {
        type: 'confirm',
        name: 'git',
        message: 'Would you like to set up git hooks for validation?',
        default: options.git ?? false
      }
    ]);

    config = {
      framework: answers.framework,
      typescript: answers.typescript,
      paths: {
        components: answers.componentsPath,
        manifests: path.join(answers.componentsPath, 'manifests'),
        output: './generated'
      },
      rules: {
        validation: answers.validation,
        naming: answers.framework === 'vue' ? 'kebab-case' : 'PascalCase',
        required: ['element.type']
      }
    };

    options.examples = answers.examples;
    options.git = answers.git;
  }

  // Create configuration file
  logger.startSpinner('Creating configuration file...');
  await createConfig(config as SemanticConfig, cwd);
  logger.succeedSpinner('Configuration file created');

  // Install dependencies
  logger.startSpinner('Installing dependencies...');
  await installDependencies(config.framework!, config.typescript!);
  logger.succeedSpinner('Dependencies installed');

  // Create example components if requested
  if (options.examples) {
    logger.startSpinner('Creating example components...');
    await createExamples(config as SemanticConfig);
    logger.succeedSpinner('Example components created');
  }

  // Set up git hooks if requested
  if (options.git) {
    logger.startSpinner('Setting up git hooks...');
    await setupGitHooks();
    logger.succeedSpinner('Git hooks configured');
  }

  // Create VS Code settings
  await createVSCodeSettings(config.typescript!);

  // Display success message
  logger.newline();
  logger.box(
    `${chalk.green('✨ Semantic Protocol initialized successfully!')}\n\n` +
    `${chalk.bold('Next steps:')}\n\n` +
    `  1. ${chalk.cyan('semantic validate')} - Validate your components\n` +
    `  2. ${chalk.cyan('semantic analyze')} - Analyze semantic coverage\n` +
    `  3. ${chalk.cyan('semantic serve')} - Start the playground server\n\n` +
    `${chalk.gray('Run')} ${chalk.cyan('semantic --help')} ${chalk.gray('for more commands')}`,
    '🎉 Setup Complete'
  );
}

async function installDependencies(
  framework: string,
  typescript: boolean
): Promise<void> {
  const deps: string[] = ['@kneelinghorse/semantic-protocol'];
  const devDeps: string[] = [];

  // Add framework-specific packages
  switch (framework) {
    case 'react':
      deps.push('@semantic-protocol/react');
      if (typescript) {
        devDeps.push('@types/react', '@types/react-dom');
      }
      break;
    case 'vue':
      deps.push('@semantic-protocol/vue');
      break;
    case 'angular':
      deps.push('@semantic-protocol/angular');
      break;
    default:
      deps.push('@semantic-protocol/web-components');
  }

  // Detect package manager
  const packageManager = await detectPackageManager();

  // Install dependencies
  if (deps.length > 0) {
    const installCmd = getInstallCommand(packageManager, false);
    await execa(packageManager, [...installCmd.split(' '), ...deps]);
  }

  // Install dev dependencies
  if (devDeps.length > 0) {
    const installCmd = getInstallCommand(packageManager, true);
    await execa(packageManager, [...installCmd.split(' '), ...devDeps]);
  }
}

async function detectPackageManager(): Promise<string> {
  const cwd = process.cwd();
  
  if (await fs.pathExists(path.join(cwd, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  if (await fs.pathExists(path.join(cwd, 'yarn.lock'))) {
    return 'yarn';
  }
  return 'npm';
}

function getInstallCommand(pm: string, dev: boolean): string {
  const devFlag = dev ? '-D' : '';
  
  switch (pm) {
    case 'pnpm':
      return `add ${devFlag}`;
    case 'yarn':
      return `add ${devFlag}`;
    default:
      return `install ${devFlag}`;
  }
}

async function createExamples(config: SemanticConfig): Promise<void> {
  const componentsPath = config.paths?.components || './src/components';
  const examplesPath = path.join(componentsPath, 'examples');
  
  await fs.ensureDir(examplesPath);

  // Create example based on framework
  switch (config.framework) {
    case 'react':
      await createReactExample(examplesPath, config.typescript!);
      break;
    case 'vue':
      await createVueExample(examplesPath, config.typescript!);
      break;
    case 'angular':
      await createAngularExample(examplesPath, config.typescript!);
      break;
    default:
      await createVanillaExample(examplesPath, config.typescript!);
  }
}

async function createReactExample(dir: string, typescript: boolean): Promise<void> {
  const ext = typescript ? 'tsx' : 'jsx';
  const content = `import React from 'react';
import { useSemantics } from '@semantic-protocol/react';

const SemanticButton = ({ children, onClick }) => {
  const { semanticProps } = useSemantics({
    manifest: {
      name: 'SemanticButton',
      version: '1.0.0',
      purpose: 'Trigger user actions',
      element: {
        type: 'action',
        intent: 'submit',
        label: 'Submit Button'
      },
      capabilities: ['click', 'submit'],
      metadata: {
        tags: ['button', 'action', 'example']
      }
    }
  });

  return (
    <button {...semanticProps} onClick={onClick}>
      {children}
    </button>
  );
};

export default SemanticButton;`;

  await fs.writeFile(path.join(dir, `SemanticButton.${ext}`), content);
}

async function createVueExample(dir: string, typescript: boolean): Promise<void> {
  const content = `<template>
  <button v-semantics="manifest" @click="handleClick">
    <slot />
  </button>
</template>

<script${typescript ? ' lang="ts"' : ''}>
import { defineComponent } from 'vue';
import { useSemantics } from '@semantic-protocol/vue';

export default defineComponent({
  name: 'SemanticButton',
  setup() {
    const { manifest, analyze } = useSemantics({
      name: 'SemanticButton',
      version: '1.0.0',
      element: {
        type: 'action',
        intent: 'submit'
      }
    });

    const handleClick = () => {
      analyze();
      // Handle click
    };

    return {
      manifest,
      handleClick
    };
  }
});
</script>`;

  await fs.writeFile(path.join(dir, 'SemanticButton.vue'), content);
}

async function createAngularExample(dir: string, typescript: boolean): Promise<void> {
  const content = `import { Component } from '@angular/core';
import { SemanticService } from '@semantic-protocol/angular';

@Component({
  selector: 'semantic-button',
  template: \`
    <button [semanticManifest]="manifest" (click)="handleClick()">
      <ng-content></ng-content>
    </button>
  \`
})
export class SemanticButtonComponent {
  manifest = {
    name: 'SemanticButton',
    version: '1.0.0',
    element: {
      type: 'action',
      intent: 'submit'
    }
  };

  constructor(private semantic: SemanticService) {}

  handleClick(): void {
    this.semantic.analyze(this.manifest);
  }
}`;

  await fs.writeFile(path.join(dir, 'semantic-button.component.ts'), content);
}

async function createVanillaExample(dir: string, typescript: boolean): Promise<void> {
  const ext = typescript ? 'ts' : 'js';
  const content = `import { SemanticElement } from '@semantic-protocol/web-components';

class SemanticButton extends SemanticElement {
  getManifest() {
    return {
      protocol: 'semantic-ui/v2',
      element: {
        type: 'action',
        intent: 'submit',
        label: 'Submit Button'
      },
      metadata: {
        version: '1.0.0',
        tags: ['button', 'action', 'example']
      }
    };
  }

  render() {
    return \`
      <button class="semantic-button">
        <slot></slot>
      </button>
    \`;
  }
}

customElements.define('semantic-button', SemanticButton);
export default SemanticButton;`;

  await fs.writeFile(path.join(dir, `SemanticButton.${ext}`), content);
}

async function setupGitHooks(): Promise<void> {
  const huskyInstalled = await fs.pathExists(path.join(process.cwd(), '.husky'));
  
  if (!huskyInstalled) {
    // Install husky
    const pm = await detectPackageManager();
    await execa(pm, [pm === 'npm' ? 'install' : 'add', '-D', 'husky']);
    await execa('npx', ['husky', 'install']);
  }

  // Create pre-commit hook
  const hookContent = `#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx semantic validate --strict
`;

  await fs.writeFile(
    path.join(process.cwd(), '.husky/pre-commit'),
    hookContent,
    { mode: 0o755 }
  );
}

async function createVSCodeSettings(typescript: boolean): Promise<void> {
  const vscodeDir = path.join(process.cwd(), '.vscode');
  await fs.ensureDir(vscodeDir);

  const settings = {
    'semantic-protocol.enable': true,
    'semantic-protocol.validation': 'strict',
    'semantic-protocol.autoComplete': true,
    'editor.formatOnSave': true,
    'files.associations': {
      '*.semantic.json': 'json'
    }
  };

  if (typescript) {
    Object.assign(settings, {
      'typescript.tsdk': 'node_modules/typescript/lib',
      'typescript.enablePromptUseWorkspaceTsdk': true
    });
  }

  const settingsPath = path.join(vscodeDir, 'settings.json');
  
  if (await fs.pathExists(settingsPath)) {
    const existing = await fs.readJSON(settingsPath);
    await fs.writeJSON(settingsPath, { ...existing, ...settings }, { spaces: 2 });
  } else {
    await fs.writeJSON(settingsPath, settings, { spaces: 2 });
  }

  // Create extensions recommendations
  const extensions = [
    'semantic-protocol.vscode',
    'dbaeumer.vscode-eslint',
    'esbenp.prettier-vscode'
  ];

  await fs.writeJSON(
    path.join(vscodeDir, 'extensions.json'),
    { recommendations: extensions },
    { spaces: 2 }
  );
}