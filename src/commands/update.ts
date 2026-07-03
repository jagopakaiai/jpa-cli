import { execSync } from 'child_process';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { CLI_VERSION } from '../version.js';

export async function updateCommand(autoInstall?: boolean) {
  p.intro('Check for Updates');

  const s = p.spinner();
  s.start('Checking npm registry for latest version...');

  try {
    const result = execSync('npm view @jagopakaiai/jpa-cli version 2>/dev/null', {
      encoding: 'utf-8',
      timeout: 10000,
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();

    const latestVersion = result;
    s.stop('Version check complete!');

    if (latestVersion === CLI_VERSION) {
      p.log.success(`You are using the latest version: ${pc.bold(`v${CLI_VERSION}`)}`);
      p.outro('No update needed.');
      return;
    }

    p.log.warn(`Current version: ${pc.bold(`v${CLI_VERSION}`)}`);
    p.log.warn(`Latest version:  ${pc.bold(`v${latestVersion}`)}`);

    if (autoInstall) {
      await installUpdate();
      return;
    }

    const shouldUpdate = await p.confirm({
      message: 'A newer version is available. Update now?',
      initialValue: true
    });

    if (p.isCancel(shouldUpdate) || !shouldUpdate) {
      p.outro('Update skipped.');
      p.log.info(`To update manually: ${pc.cyan('npm install -g @jagopakaiai/jpa-cli@latest')}`);
      return;
    }

    await installUpdate();
  } catch {
    s.stop('Version check failed!');
    p.log.warn('Could not reach npm registry. Check your internet connection.');
    p.log.info(`Current version: ${pc.bold(`v${CLI_VERSION}`)}`);
    p.outro('Update check failed.');
  }
}

async function installUpdate() {
  const s = p.spinner();
  s.start('Installing latest version...');
  try {
    execSync('npm install -g @jagopakaiai/jpa-cli@latest', {
      stdio: 'ignore',
      timeout: 60000
    });
    s.stop('Update installed successfully!');

    const newVersion = execSync('npm view @jagopakaiai/jpa-cli version 2>/dev/null', {
      encoding: 'utf-8',
      timeout: 10000
    }).trim();

    p.log.success(`Updated to v${newVersion}`);
    p.outro('JPA CLI has been updated!');
  } catch {
    s.stop('Update failed!');
    p.log.error('Could not install update. Try manually:');
    p.log.info(`${pc.cyan('npm install -g @jagopakaiai/jpa-cli@latest')}`);
    p.outro('Update failed.');
  }
}
