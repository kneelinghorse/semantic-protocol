import chalk from 'chalk';
import ora, { Ora } from 'ora';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

class Logger {
  private spinner: Ora | null = null;
  private verbose: boolean = process.env.SEMANTIC_VERBOSE === 'true';
  private quiet: boolean = process.env.SEMANTIC_QUIET === 'true';

  debug(...args: any[]): void {
    if (this.verbose && !this.quiet) {
      console.log(chalk.gray('[DEBUG]'), ...args);
    }
  }

  info(...args: any[]): void {
    if (!this.quiet) {
      console.log(chalk.blue('ℹ'), ...args);
    }
  }

  warn(...args: any[]): void {
    if (!this.quiet) {
      console.warn(chalk.yellow('⚠'), ...args);
    }
  }

  error(...args: any[]): void {
    console.error(chalk.red('✖'), ...args);
  }

  success(...args: any[]): void {
    if (!this.quiet) {
      console.log(chalk.green('✔'), ...args);
    }
  }

  startSpinner(text: string): void {
    if (!this.quiet) {
      this.spinner = ora(text).start();
    }
  }

  updateSpinner(text: string): void {
    if (this.spinner) {
      this.spinner.text = text;
    }
  }

  succeedSpinner(text?: string): void {
    if (this.spinner) {
      this.spinner.succeed(text);
      this.spinner = null;
    }
  }

  failSpinner(text?: string): void {
    if (this.spinner) {
      this.spinner.fail(text);
      this.spinner = null;
    }
  }

  stopSpinner(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  table(data: any[]): void {
    if (!this.quiet) {
      console.table(data);
    }
  }

  json(data: any): void {
    console.log(JSON.stringify(data, null, 2));
  }

  box(content: string, title?: string): void {
    if (!this.quiet) {
      const boxen = require('boxen');
      console.log(
        boxen(content, {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'cyan',
          title,
          titleAlignment: 'center'
        })
      );
    }
  }

  heading(text: string): void {
    if (!this.quiet) {
      console.log('\n' + chalk.bold.underline(text) + '\n');
    }
  }

  list(items: string[], ordered: boolean = false): void {
    if (!this.quiet) {
      items.forEach((item, index) => {
        const prefix = ordered ? `${index + 1}.` : '•';
        console.log(`  ${chalk.gray(prefix)} ${item}`);
      });
    }
  }

  code(code: string, language?: string): void {
    if (!this.quiet) {
      console.log(chalk.gray(`\`\`\`${language || ''}`));
      console.log(code);
      console.log(chalk.gray('```'));
    }
  }

  divider(): void {
    if (!this.quiet) {
      console.log(chalk.gray('─'.repeat(process.stdout.columns || 80)));
    }
  }

  newline(): void {
    if (!this.quiet) {
      console.log();
    }
  }

  clear(): void {
    console.clear();
  }
}

export const logger = new Logger();

export default logger;