import chalk from 'chalk';
import boxen from 'boxen';

export function banner(): void {
  console.log(
    boxen(
      chalk.bold.cyan('SANDYKIT') +
        '\n' +
        chalk.dim('Ton assistant pour créer des projets logiciels complets'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
      }
    )
  );
}

export function stage(current: number, total: number, name: string): void {
  const progress = `[${current}/${total}]`;
  console.log(chalk.cyan(`\n${progress} `) + chalk.bold(name.toUpperCase()));
  console.log(chalk.dim('─'.repeat(40)));
}

export function success(msg: string): void {
  console.log(chalk.green('✓ ') + msg);
}

export function info(msg: string): void {
  console.log(chalk.blue('ℹ ') + msg);
}

export function warn(msg: string): void {
  console.log(chalk.yellow('⚠ ') + msg);
}

export function error(msg: string): void {
  console.log(chalk.red('✗ ') + msg);
}

export function section(title: string): void {
  console.log('\n' + chalk.bold.underline(title));
}

export function dim(msg: string): void {
  console.log(chalk.dim(msg));
}
