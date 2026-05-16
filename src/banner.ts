import chalk from 'chalk';
import boxen from 'boxen';

const ASCII = `
 ░██████╗░█████╗░███╗░░██╗██████╗░██╗░░░██╗██╗░░██╗██╗████████╗
 ██╔════╝██╔══██╗████╗░██║██╔══██╗╚██╗░██╔╝██║░██╔╝██║╚══██╔══╝
 ╚█████╗░███████║██╔██╗██║██║░░██║░╚████╔╝░█████═╝░██║░░░██║░░░
 ░╚═══██╗██╔══██║██║╚████║██║░░██║░░╚██╔╝░░██╔═██╗░██║░░░██║░░░
 ██████╔╝██║░░██║██║░╚███║██████╔╝░░░██║░░░██║░╚██╗██║░░░██║░░░
 ╚═════╝░╚═╝░░╚═╝╚═╝░░╚══╝╚═════╝░░░╚═╝░░░╚═╝░░╚═╝╚═╝░░░╚═╝░░░`;

export function showBanner(): void {
  console.log(chalk.cyan(ASCII));
  console.log(
    boxen(
      chalk.bold.white('v2.0.0') +
        '  ' +
        chalk.dim('│') +
        '  ' +
        chalk.dim('Spec-Driven Development pour agents IA') +
        '\n' +
        chalk.dim('Claude Code · Cursor · GitHub Copilot'),
      {
        padding: { top: 0, bottom: 0, left: 2, right: 2 },
        margin: { top: 0, bottom: 1, left: 1, right: 1 },
        borderStyle: 'round',
        borderColor: 'cyan',
        textAlignment: 'center',
      }
    )
  );
}
