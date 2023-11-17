/* eslint-disable @typescript-eslint/no-var-requires */
import * as yargs from 'yargs';
import * as chalk from 'chalk';

import { CreateWorkspaceOptions } from 'create-nx-workspace/';
import {
  getPackageManagerCommand,
  detectPackageManager,
} from 'nx/src/utils/package-manager';
import { output } from 'create-nx-workspace/src/utils/output';
import { readFileSync, writeFileSync, rmSync } from 'fs';
import { execSync } from 'child_process';

interface Arguments extends CreateWorkspaceOptions {
  installMaterialExample: boolean;
}

export const commandsObject: yargs.Argv<Arguments> = yargs
  .wrap(yargs.terminalWidth())
  .parserConfiguration({
    'strip-dashed': true,
    'dot-notation': true,
  })
  .command<Arguments>(
    // this is the default and only command
    '$0 [options]',
    'Add Angular to the Qwik workspace',
    (yargs) => [
      yargs.option('installMaterialExample', {
        describe: chalk.dim`Add dependencies for the Angular Material and qwikified example component, that uses it`,
        type: 'boolean',
      }),
    ],

    async (argv: yargs.ArgumentsCamelCase<Arguments>) => {
      await main(argv).catch((error) => {
        const { version } = require('../package.json');
        output.error({
          title: `Something went wrong! v${version}`,
        });
        throw error;
      });
    }
  )
  .help('help', chalk.dim`Show help`)
  .version(
    'version',
    chalk.dim`Show version`,
    require('../package.json').version
  ) as yargs.Argv<Arguments>;

async function main(parsedArgs: yargs.Arguments<Arguments>) {
  let isQwikNxInstalled = false;
  const pm = getRelevantPackageManagerCommand();

  output.log({
    title: `Adding Angular to your workspace.`,
    bodyLines: [
      'To make sure the command works reliably in all environments, and that the integration is applied correctly,',
      `We will run "${pm.install}" several times. Please wait.`,
    ],
  });

  try {
    // letting Nx think that's an Nx repo
    writeFileSync(
      'project.json',
      JSON.stringify({
        name: 'temp-project',
        sourceRoot: 'src',
        projectType: 'application',
        targets: {},
      })
    );

    isQwikNxInstalled = checkIfPackageInstalled('qwik-nx');

    if (!isQwikNxInstalled) {
      execSync(`${pm.add} qwik-nx@latest nx@latest`, { stdio: [0, 1, 2] });
    }
    const installMaterialExample = parsedArgs['installMaterialExample'];
    const installMaterialExampleFlag =
      installMaterialExample === true || installMaterialExample === false
        ? `--installMaterialExample=${parsedArgs['installMaterialExample']}`
        : undefined;

    const cmd = [
      'npx nx g qwik-nx:angular-in-app',
      '--project=temp-project',
      installMaterialExampleFlag,
      '--skipFormat',
    ].filter(Boolean);
    execSync(cmd.join(' '), { stdio: [0, 1, 2] });
  } catch (error) {
    output.error({
      title: 'Failed to add angular to your repo',
      bodyLines: ['Reverting changes.', 'See original printed error above.'],
    });
    cleanup(isQwikNxInstalled, pm.uninstall);
    process.exit(1);
  }

  cleanup(isQwikNxInstalled, pm.uninstall);

  output.log({
    title: `Successfully added Angular integration to your repo`,
  });
}

function checkIfPackageInstalled(pkg: string): boolean {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
  return (
    !!packageJson['dependencies']?.[pkg] ||
    !!packageJson['devDependencies']?.[pkg]
  );
}

function getRelevantPackageManagerCommand() {
  const pm = detectPackageManager();
  const pmc = getPackageManagerCommand(pm);
  let uninstall: string;
  if (pm === 'npm') {
    uninstall = 'npm uninstall';
  } else if (pm === 'yarn') {
    uninstall = 'yarn remove';
  } else {
    uninstall = 'pnpm remove';
  }

  return {
    install: pmc.install,
    add: pmc.add,
    uninstall,
  };
}

function cleanup(isQwikNxInstalled: boolean, uninstallCmd: string) {
  rmSync('.nx', { force: true, recursive: true });
  rmSync('project.json');
  if (!isQwikNxInstalled) {
    execSync(`${uninstallCmd} qwik-nx nx`, { stdio: [0, 1, 2] });
  }
}
