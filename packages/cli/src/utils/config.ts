import { cosmiconfigSync } from 'cosmiconfig';
import fs from 'fs-extra';
import path from 'path';
import { logger } from './logger';

export interface SemanticConfig {
  version?: string;
  framework?: 'react' | 'vue' | 'angular' | 'vanilla';
  typescript?: boolean;
  paths?: {
    components?: string;
    manifests?: string;
    output?: string;
  };
  rules?: {
    validation?: 'strict' | 'loose' | 'none';
    naming?: 'camelCase' | 'kebab-case' | 'PascalCase';
    required?: string[];
  };
  plugins?: string[];
  exclude?: string[];
  include?: string[];
}

const DEFAULT_CONFIG: SemanticConfig = {
  version: '2.0.0',
  framework: 'vanilla',
  typescript: false,
  paths: {
    components: './src/components',
    manifests: './src/manifests',
    output: './generated'
  },
  rules: {
    validation: 'strict',
    naming: 'PascalCase',
    required: ['element.type', 'element.intent']
  },
  plugins: [],
  exclude: ['node_modules/**', 'dist/**', 'build/**'],
  include: ['src/**/*.{js,jsx,ts,tsx,vue}']
};

const CONFIG_FILE_NAME = '.semanticrc';
const MODULE_NAME = 'semantic';

export async function loadConfig(configPath?: string): Promise<SemanticConfig | null> {
  try {
    const explorer = cosmiconfigSync(MODULE_NAME, {
      searchPlaces: [
        'package.json',
        `${CONFIG_FILE_NAME}`,
        `${CONFIG_FILE_NAME}.json`,
        `${CONFIG_FILE_NAME}.js`,
        `${CONFIG_FILE_NAME}.yaml`,
        `${CONFIG_FILE_NAME}.yml`,
        `${CONFIG_FILE_NAME}.config.js`
      ]
    });

    const result = configPath 
      ? explorer.load(configPath)
      : explorer.search();

    if (result) {
      logger.debug('Loaded config from:', result.filepath);
      return { ...DEFAULT_CONFIG, ...result.config };
    }

    return null;
  } catch (error) {
    logger.debug('No config file found, using defaults');
    return DEFAULT_CONFIG;
  }
}

export async function createConfig(
  options: Partial<SemanticConfig> = {},
  targetPath: string = process.cwd()
): Promise<void> {
  const config: SemanticConfig = {
    ...DEFAULT_CONFIG,
    ...options
  };

  const configPath = path.join(targetPath, `${CONFIG_FILE_NAME}.json`);
  
  await fs.writeJSON(configPath, config, { spaces: 2 });
  logger.success(`Created config file: ${configPath}`);
}

export async function updateConfig(
  key: string,
  value: any,
  configPath?: string
): Promise<void> {
  const config = await loadConfig(configPath) || DEFAULT_CONFIG;
  
  // Handle nested keys (e.g., 'paths.components')
  const keys = key.split('.');
  let current: any = config;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!(k in current)) {
      current[k] = {};
    }
    current = current[k];
  }
  
  current[keys[keys.length - 1]] = value;
  
  const targetPath = configPath || path.join(process.cwd(), `${CONFIG_FILE_NAME}.json`);
  await fs.writeJSON(targetPath, config, { spaces: 2 });
  
  logger.success(`Updated config: ${key} = ${value}`);
}

export function validateConfig(config: SemanticConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate version
  if (config.version && !isValidVersion(config.version)) {
    errors.push(`Invalid version: ${config.version}`);
  }

  // Validate framework
  const validFrameworks = ['react', 'vue', 'angular', 'vanilla'];
  if (config.framework && !validFrameworks.includes(config.framework)) {
    errors.push(`Invalid framework: ${config.framework}. Must be one of: ${validFrameworks.join(', ')}`);
  }

  // Validate paths
  if (config.paths) {
    Object.entries(config.paths).forEach(([key, value]) => {
      if (value && typeof value !== 'string') {
        errors.push(`Invalid path for ${key}: must be a string`);
      }
    });
  }

  // Validate rules
  if (config.rules) {
    if (config.rules.validation && 
        !['strict', 'loose', 'none'].includes(config.rules.validation)) {
      errors.push('Invalid validation rule: must be strict, loose, or none');
    }
    
    if (config.rules.naming && 
        !['camelCase', 'kebab-case', 'PascalCase'].includes(config.rules.naming)) {
      errors.push('Invalid naming rule: must be camelCase, kebab-case, or PascalCase');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function isValidVersion(version: string): boolean {
  const versionRegex = /^\d+\.\d+\.\d+(-\w+(\.\d+)?)?$/;
  return versionRegex.test(version);
}

export async function detectProjectType(): Promise<Partial<SemanticConfig>> {
  const cwd = process.cwd();
  const packageJsonPath = path.join(cwd, 'package.json');
  
  if (!await fs.pathExists(packageJsonPath)) {
    return {};
  }

  const packageJson = await fs.readJSON(packageJsonPath);
  const config: Partial<SemanticConfig> = {};

  // Detect TypeScript
  if (packageJson.devDependencies?.typescript || 
      await fs.pathExists(path.join(cwd, 'tsconfig.json'))) {
    config.typescript = true;
  }

  // Detect framework
  const deps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };

  if (deps.react || deps['react-dom']) {
    config.framework = 'react';
  } else if (deps.vue) {
    config.framework = 'vue';
  } else if (deps['@angular/core']) {
    config.framework = 'angular';
  } else {
    config.framework = 'vanilla';
  }

  // Detect common paths
  if (await fs.pathExists(path.join(cwd, 'src/components'))) {
    config.paths = { components: './src/components' };
  } else if (await fs.pathExists(path.join(cwd, 'components'))) {
    config.paths = { components: './components' };
  }

  return config;
}

export default {
  loadConfig,
  createConfig,
  updateConfig,
  validateConfig,
  detectProjectType,
  DEFAULT_CONFIG
};