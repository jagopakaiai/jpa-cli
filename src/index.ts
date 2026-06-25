import { Command } from 'commander';
import { loginCommand } from './commands/login.js';
import { detectCommand } from './commands/detect.js';
import { syncCommand } from './commands/sync.js';

const program = new Command();

program
  .name('jagopakai')
  .description('JagoPakaiAI Command Line Interface rules synchronizer')
  .version('1.0.0');

program
  .command('login')
  .description('Authenticate with your JagoPakaiAI API Key')
  .action(async () => {
    await loginCommand();
  });

program
  .command('detect')
  .description('Scan current workspace environment and files')
  .action(async () => {
    await detectCommand();
  });

program
  .command('sync')
  .argument('[skill-name]', 'Name/slug of the skill to sync rules for')
  .description('Pull rules for a skill and synchronize in workspace')
  .action(async (skillName) => {
    await syncCommand(skillName);
  });

program.parse(process.argv);
