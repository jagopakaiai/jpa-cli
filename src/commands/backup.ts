import fs from 'fs';
import path from 'path';
import os from 'os';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { readConfig } from '../utils/config.js';
import { getDetectedRuleFiles } from './rules.js';
import { CLI_VERSION } from '../version.js';

const CONFIG_BACKUP_DIR = path.join(os.homedir(), '.config', 'jagopakaiai-cli', 'backups');

export async function backupAllCommand() {
  p.intro('Create Full Backup');

  const s = p.spinner();
  s.start('Collecting configuration files...');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const backupDir = path.join(CONFIG_BACKUP_DIR, `backup-${timestamp}`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  let totalFiles = 0;

  // 1. Backup JagoPakaiAI config
  const config = readConfig();
  fs.writeFileSync(path.join(backupDir, 'jagopakaiai-config.json'), JSON.stringify(config, null, 2));
  totalFiles++;

  // 2. Backup workspace rule files
  const rules = getDetectedRuleFiles(process.cwd());
  const ruleBackupDir = path.join(backupDir, 'workspace-rules');
  if (!fs.existsSync(ruleBackupDir)) {
    fs.mkdirSync(ruleBackupDir, { recursive: true });
  }
  for (const rule of rules) {
    const destPath = path.join(ruleBackupDir, rule.name.replace(/[/\\]/g, '_'));
    fs.copyFileSync(rule.path, destPath);
    totalFiles++;
  }

  // 3. Backup global skills
  const globalSkillsDir = path.join(os.homedir(), '.config', 'jagopakaiai-cli', 'skills');
  const skillBackupDir = path.join(backupDir, 'global-skills');
  if (fs.existsSync(globalSkillsDir)) {
    if (!fs.existsSync(skillBackupDir)) {
      fs.mkdirSync(skillBackupDir, { recursive: true });
    }
    const skillDirs = fs.readdirSync(globalSkillsDir);
    for (const dir of skillDirs) {
      const skillFile = path.join(globalSkillsDir, dir, 'SKILL.md');
      if (fs.existsSync(skillFile)) {
        const destSkillDir = path.join(skillBackupDir, dir);
        if (!fs.existsSync(destSkillDir)) {
          fs.mkdirSync(destSkillDir, { recursive: true });
        }
        fs.copyFileSync(skillFile, path.join(destSkillDir, 'SKILL.md'));
        totalFiles++;
      }
    }
  }

  // 4. Backup Claude Code MCP config
  const claudeConfigPath = path.join(os.homedir(), '.claudecode', 'config.json');
  if (fs.existsSync(claudeConfigPath)) {
    fs.copyFileSync(claudeConfigPath, path.join(backupDir, 'claudecode-config.json'));
    totalFiles++;
  }

  // Write manifest
  const manifest = {
    timestamp,
    version: CLI_VERSION,
    files: totalFiles,
    contents: {
      config: true,
      workspaceRules: rules.length,
      globalSkills: totalFiles - 1 - rules.length - (fs.existsSync(claudeConfigPath) ? 1 : 0),
      claudeConfig: fs.existsSync(claudeConfigPath)
    }
  };
  fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  s.stop(`Backed up ${totalFiles} files!`);
  p.log.success(`Backup location: ${backupDir}`);
  p.outro('Full backup completed successfully.');
}

export async function backupListCommand() {
  if (!fs.existsSync(CONFIG_BACKUP_DIR)) {
    p.log.warn('No backups found.');
    return;
  }

  const backups = fs.readdirSync(CONFIG_BACKUP_DIR)
    .filter(d => d.startsWith('backup-'))
    .sort()
    .reverse();

  if (backups.length === 0) {
    p.log.warn('No backups found.');
    return;
  }

  p.intro('Available Backups');
  const rows = backups.map(b => {
    const manifestPath = path.join(CONFIG_BACKUP_DIR, b, 'manifest.json');
    let info = 'unknown';
    if (fs.existsSync(manifestPath)) {
      try {
        const m = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        info = `${m.files} files`;
      } catch {}
    }
    const dateStr = b.replace('backup-', '').replace(/-/g, ':').substring(0, 19);
    return `  ${pc.cyan(dateStr)} ${pc.dim(`— ${info}`)}`;
  }).join('\n');
  p.note(rows, `Backups (${backups.length})`);
  p.outro(`To restore: ${pc.cyan('jagopakaiai-cli rules restore')}`);
}

export async function backupRestoreCommand(backupId?: string) {
  if (!fs.existsSync(CONFIG_BACKUP_DIR)) {
    p.log.warn('No backups found.');
    return;
  }

  const backups = fs.readdirSync(CONFIG_BACKUP_DIR)
    .filter(d => d.startsWith('backup-'))
    .sort()
    .reverse();

  if (backups.length === 0) {
    p.log.warn('No backups found.');
    return;
  }

  let selected: string;
  if (backupId) {
    selected = `backup-${backupId}`;
    if (!backups.includes(selected)) {
      p.log.error(`Backup "${backupId}" not found.`);
      return;
    }
  } else {
    const choice = await p.select({
      message: 'Select backup to restore:',
      options: backups.map(b => ({
        value: b,
        label: b.replace('backup-', '').substring(0, 19)
      }))
    });
    if (p.isCancel(choice)) return;
    selected = choice as string;
  }

  const backupDir = path.join(CONFIG_BACKUP_DIR, selected);
  const manifestPath = path.join(backupDir, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    p.log.error('Backup manifest not found.');
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  p.log.warn(`This will overwrite current configurations from backup "${selected.substring(0, 25)}".`);
  p.log.info(`Backup contains ${manifest.files} files.`);

  const confirm = await p.confirm({ message: 'Restore?', initialValue: false });
  if (p.isCancel(confirm) || !confirm) {
    p.cancel('Restore cancelled.');
    return;
  }

  const s = p.spinner();
  s.start('Restoring...');

  // Restore JagoPakaiAI config
  const configBackup = path.join(backupDir, 'jagopakaiai-config.json');
  if (fs.existsSync(configBackup)) {
    const data = JSON.parse(fs.readFileSync(configBackup, 'utf-8'));
    const { writeConfig } = await import('../utils/config.js');
    writeConfig(data);
    p.log.success('Restored JagoPakaiAI config.');
  }

  // Restore workspace rules
  const ruleBackupDir = path.join(backupDir, 'workspace-rules');
  if (fs.existsSync(ruleBackupDir)) {
    for (const file of fs.readdirSync(ruleBackupDir)) {
      const originalName = file.replace(/_/g, '/');
      const destPath = path.join(process.cwd(), originalName);
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(path.join(ruleBackupDir, file), destPath);
    }
    p.log.success('Restored workspace rule files.');
  }

  // Restore global skills
  const skillBackupDir = path.join(backupDir, 'global-skills');
  if (fs.existsSync(skillBackupDir)) {
    const skillsHome = path.join(os.homedir(), '.config', 'jagopakaiai-cli', 'skills');
    for (const dir of fs.readdirSync(skillBackupDir)) {
      const srcFile = path.join(skillBackupDir, dir, 'SKILL.md');
      if (fs.existsSync(srcFile)) {
        const destDir = path.join(skillsHome, dir);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(srcFile, path.join(destDir, 'SKILL.md'));
      }
    }
    p.log.success('Restored global skills.');
  }

  s.stop('Restore complete!');
  p.outro(`Restored from backup: ${selected.substring(0, 25)}`);
}
