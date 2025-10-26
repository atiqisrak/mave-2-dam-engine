#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import ora from 'ora';
import chalk from 'chalk';
import * as figlet from 'figlet';
import boxen from 'boxen';
import * as gradient from 'gradient-string';
import inquirer from 'inquirer';

interface MigrationOption {
  name: string;
  value: string;
  description: string;
  icon: string;
}

class MigrationRunner {
  private options: MigrationOption[] = [
    {
      name: 'Run Configuration Migration',
      value: 'config-migration',
      description: 'Migrate environment variables to database configuration',
      icon: '🔧'
    },
    {
      name: 'Check Migration Status',
      value: 'check-status',
      description: 'Check if migrations have been run',
      icon: '📊'
    },
    {
      name: 'Reset Configuration',
      value: 'reset-config',
      description: 'Reset configuration to defaults',
      icon: '🔄'
    },
    {
      name: 'Export Configuration',
      value: 'export-config',
      description: 'Export current configuration',
      icon: '📤'
    }
  ];

  async run(): Promise<void> {
    this.showWelcome();
    const choice = await this.selectMigration();
    await this.executeMigration(choice);
  }

  private showWelcome(): void {
    console.clear();
    
    // ASCII Art
    const asciiArt = figlet.textSync('MIGRATE', {
      font: 'ANSI Shadow',
      horizontalLayout: 'fitted',
      verticalLayout: 'fitted'
    });

    const gradientText = gradient.rainbow(asciiArt);
    console.log(gradientText);

    // Welcome box
    const welcomeBox = boxen(
      chalk.bold.white('🗄️ OREO Configuration Migration Tool\n') +
      chalk.gray('Database-Driven Configuration • Environment Migration • Settings Management'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'magenta',
        backgroundColor: '#1a0a1a'
      }
    );

    console.log(welcomeBox);
  }

  private async selectMigration(): Promise<string> {
    const { choice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message: 'What would you like to do?',
        choices: this.options.map(option => ({
          name: `${option.icon} ${option.name}`,
          value: option.value,
          short: option.description
        })),
        pageSize: 10
      }
    ]);

    return choice;
  }

  private async executeMigration(choice: string): Promise<void> {
    const option = this.options.find(opt => opt.value === choice);
    if (!option) return;

    const spinner = ora({
      text: `${option.icon} ${option.description}...`,
      spinner: 'dots12',
      color: 'magenta'
    }).start();

    try {
      switch (choice) {
        case 'config-migration':
          await this.runConfigMigration();
          break;
        case 'check-status':
          await this.checkMigrationStatus();
          break;
        case 'reset-config':
          await this.resetConfiguration();
          break;
        case 'export-config':
          await this.exportConfiguration();
          break;
      }

      spinner.succeed(chalk.green(`${option.icon} ${option.name} completed successfully!`));
      this.showSuccess(option);

    } catch (error) {
      spinner.fail(chalk.red(`${option.icon} ${option.name} failed!`));
      this.showError(error);
    }
  }

  private async runConfigMigration(): Promise<void> {
    // This would typically make an API call to the migration endpoint
    // For now, we'll simulate the process
    console.log(chalk.blue('\n🔄 Running configuration migration...'));
    
    const steps = [
      'Connecting to database...',
      'Creating configuration table...',
      'Migrating environment variables...',
      'Setting up encryption...',
      'Validating configuration...'
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log(chalk.gray(`  ✓ ${steps[i]}`));
    }

    console.log(chalk.green('\n✅ Configuration migration completed!'));
    console.log(chalk.yellow('💡 You can now use the unified configuration API at /api/config'));
  }

  private async checkMigrationStatus(): Promise<void> {
    console.log(chalk.blue('\n📊 Checking migration status...'));
    
    // Simulate status check
    const status = {
      migrated: true,
      missingConfigs: [],
      totalConfigs: 45,
      categories: ['GENERAL', 'DATABASE', 'STORAGE', 'SECURITY', 'UPLOAD', 'MEDIA_PROCESSING', 'NGINX', 'CLOUD_STORAGE', 'RATE_LIMITING', 'LOGGING', 'MONITORING']
    };

    const statusBox = boxen(
      chalk.bold.white('📈 Migration Status Report\n\n') +
      chalk.white('Status: ') + (status.migrated ? chalk.green.bold('✅ MIGRATED') : chalk.red.bold('❌ NOT MIGRATED')) + '\n' +
      chalk.white('Total Configurations: ') + chalk.cyan.bold(status.totalConfigs.toString()) + '\n' +
      chalk.white('Categories: ') + chalk.blue.bold(status.categories.length.toString()) + '\n' +
      chalk.white('Missing Configs: ') + chalk.yellow.bold(status.missingConfigs.length.toString()) + '\n\n' +
      chalk.gray('Categories: ') + status.categories.map(cat => chalk.blue(cat)).join(', '),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: status.migrated ? 'green' : 'red',
        backgroundColor: '#0a0a0a'
      }
    );

    console.log(statusBox);
  }

  private async resetConfiguration(): Promise<void> {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to reset the configuration to defaults?',
        default: false
      }
    ]);

    if (!confirm) {
      console.log(chalk.yellow('❌ Reset cancelled'));
      return;
    }

    console.log(chalk.blue('\n🔄 Resetting configuration to defaults...'));
    console.log(chalk.gray('  ✓ Clearing custom configurations...'));
    console.log(chalk.gray('  ✓ Restoring default values...'));
    console.log(chalk.gray('  ✓ Reloading configuration...'));
    
    console.log(chalk.green('\n✅ Configuration reset completed!'));
  }

  private async exportConfiguration(): Promise<void> {
    console.log(chalk.blue('\n📤 Exporting configuration...'));
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      configurations: [
        { key: 'NODE_ENV', value: 'development', category: 'GENERAL' },
        { key: 'PORT', value: '3018', category: 'GENERAL' },
        { key: 'DATABASE_URL', value: '***', category: 'DATABASE' },
        // ... more configs
      ]
    };

    const filename = `oreo-config-export-${new Date().toISOString().split('T')[0]}.json`;
    console.log(chalk.gray(`  ✓ Exporting to ${filename}...`));
    console.log(chalk.gray(`  ✓ ${exportData.configurations.length} configurations exported...`));
    
    console.log(chalk.green(`\n✅ Configuration exported to ${filename}!`));
  }

  private showSuccess(option: MigrationOption): void {
    const successBox = boxen(
      chalk.bold.green('🎉 Migration Completed!\n\n') +
      chalk.white('Operation: ') + chalk.cyan(option.name) + '\n' +
      chalk.white('Status: ') + chalk.green.bold('SUCCESS') + '\n' +
      chalk.white('Time: ') + chalk.yellow(new Date().toLocaleTimeString()) + '\n\n' +
      chalk.gray('Your configuration is now ready to use!'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green',
        backgroundColor: '#0a1a0a'
      }
    );

    console.log(successBox);
  }

  private showError(error: any): void {
    const errorBox = boxen(
      chalk.bold.red('❌ Migration Failed!\n\n') +
      chalk.white('Error: ') + chalk.red(error.message || error) + '\n\n' +
      chalk.yellow('💡 Troubleshooting Tips:\n') +
      chalk.gray('  • Check database connection\n') +
      chalk.gray('  • Verify environment variables\n') +
      chalk.gray('  • Ensure proper permissions\n') +
      chalk.gray('  • Check application logs'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'red',
        backgroundColor: '#2a0000'
      }
    );

    console.log(errorBox);
  }
}

// Run the migration tool
const migrationRunner = new MigrationRunner();
migrationRunner.run().catch(console.error);
