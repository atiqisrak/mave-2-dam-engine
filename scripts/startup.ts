#!/usr/bin/env ts-node

import chalk from 'chalk';
import figlet from 'figlet';
import boxen from 'boxen';
import gradient from 'gradient-string';
import inquirer from 'inquirer';

class OREOStartup {
  async showWelcome(): Promise<void> {
    console.clear();
    
    // ASCII Art
    const asciiArt = figlet.textSync('OREO', {
      font: 'ANSI Shadow',
      horizontalLayout: 'fitted',
      verticalLayout: 'fitted'
    });

    const gradientText = gradient.rainbow(asciiArt);
    console.log(gradientText);

    // Welcome box
    const welcomeBox = boxen(
      chalk.bold.white('🍪 Welcome to OREO Media Management Platform\n\n') +
      chalk.gray('A powerful, unified configuration system for media management\n') +
      chalk.gray('Built with NestJS • TypeScript • Prisma • Database-Driven Config\n\n') +
      chalk.cyan('✨ Features:\n') +
      chalk.gray('  • Unified Configuration Management\n') +
      chalk.gray('  • Database-Driven Settings\n') +
      chalk.gray('  • API-First Architecture\n') +
      chalk.gray('  • Cloud Storage Support\n') +
      chalk.gray('  • Real-time Configuration Updates\n') +
      chalk.gray('  • Encrypted Sensitive Data\n') +
      chalk.gray('  • Role-Based Access Control\n') +
      chalk.gray('  • Migration Tools\n') +
      chalk.gray('  • Beautiful CLI Interface'),
      {
        padding: 2,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'cyan',
        backgroundColor: '#0a0a1a'
      }
    );

    console.log(welcomeBox);

    // Show quick stats
    this.showQuickStats();
    
    // Show main menu
    await this.showMainMenu();
  }

  private showQuickStats(): void {
    const stats = [
      { label: 'Configuration Categories', value: '11', color: 'blue' },
      { label: 'API Endpoints', value: '25+', color: 'green' },
      { label: 'Storage Providers', value: '4', color: 'yellow' },
      { label: 'Security Features', value: '8', color: 'red' }
    ];

    console.log(chalk.bold.white('\n📊 Quick Stats:'));
    console.log(chalk.gray('┌─────────────────────────────────────────────────┐'));
    
    stats.forEach((stat, index) => {
      const label = stat.label.padEnd(25);
      const value = stat.value.padStart(8);
      const colorFn = chalk[stat.color as keyof typeof chalk] as typeof chalk.red;
      
      console.log(
        chalk.gray('│ ') +
        chalk.white(label) +
        colorFn(value) +
        chalk.gray(' │')
      );
    });
    
    console.log(chalk.gray('└─────────────────────────────────────────────────┘'));
  }

  private async showMainMenu(): Promise<void> {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          {
            name: '🚀 Start Development Server',
            value: 'dev',
            short: 'Start the development server with hot reload'
          },
          {
            name: '🔨 Build Application',
            value: 'build',
            short: 'Build the application for production'
          },
          {
            name: '🗄️ Run Migrations',
            value: 'migrate',
            short: 'Run configuration migrations'
          },
          {
            name: '📚 View API Documentation',
            value: 'docs',
            short: 'Open API documentation'
          },
          {
            name: '⚙️ Configuration Management',
            value: 'config',
            short: 'Manage application configuration'
          },
          {
            name: '🧪 Run Tests',
            value: 'test',
            short: 'Run the test suite'
          },
          {
            name: '📊 Database Management',
            value: 'database',
            short: 'Manage database operations'
          },
          {
            name: '❓ Help & Information',
            value: 'help',
            short: 'Get help and information'
          },
          {
            name: '🚪 Exit',
            value: 'exit',
            short: 'Exit the application'
          }
        ],
        pageSize: 10
      }
    ]);

    await this.handleAction(action);
  }

  private async handleAction(action: string): Promise<void> {
    switch (action) {
      case 'dev':
        await this.startDevServer();
        break;
      case 'build':
        await this.buildApplication();
        break;
      case 'migrate':
        await this.runMigrations();
        break;
      case 'docs':
        this.showDocumentation();
        break;
      case 'config':
        await this.showConfigMenu();
        break;
      case 'test':
        await this.runTests();
        break;
      case 'database':
        await this.showDatabaseMenu();
        break;
      case 'help':
        this.showHelp();
        break;
      case 'exit':
        this.showGoodbye();
        break;
    }
  }

  private async startDevServer(): Promise<void> {
    console.log(chalk.blue('\n🚀 Starting development server...'));
    console.log(chalk.gray('This will start the server with hot reload enabled.\n'));
    
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Start the development server?',
        default: true
      }
    ]);

    if (confirm) {
      console.log(chalk.green('✅ Starting development server...'));
      // In a real implementation, this would spawn the dev server
      console.log(chalk.yellow('💡 Run "npm run dev" to start the development server'));
    }
  }

  private async buildApplication(): Promise<void> {
    console.log(chalk.blue('\n🔨 Building application...'));
    console.log(chalk.gray('This will compile TypeScript and create production build.\n'));
    
    const { buildType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'buildType',
        message: 'Select build type:',
        choices: [
          { name: '🎨 Colorful Build (Recommended)', value: 'colorful' },
          { name: '⚡ Basic Build (Fast)', value: 'basic' },
          { name: '🐛 Debug Build (Verbose)', value: 'debug' }
        ]
      }
    ]);

    console.log(chalk.green(`✅ Starting ${buildType} build...`));
    console.log(chalk.yellow(`💡 Run "npm run build" for colorful build or "npm run build:${buildType}" for ${buildType} build`));
  }

  private async runMigrations(): Promise<void> {
    console.log(chalk.blue('\n🗄️ Running migrations...'));
    console.log(chalk.gray('This will migrate environment variables to database configuration.\n'));
    
    const { migrateType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'migrateType',
        message: 'Select migration action:',
        choices: [
          { name: '🔧 Run Configuration Migration', value: 'config' },
          { name: '📊 Check Migration Status', value: 'status' },
          { name: '🔄 Reset Configuration', value: 'reset' },
          { name: '📤 Export Configuration', value: 'export' }
        ]
      }
    ]);

    console.log(chalk.green(`✅ Running ${migrateType} migration...`));
    console.log(chalk.yellow(`💡 Run "npm run migrate" for interactive migration or "npm run migrate:${migrateType}" for direct action`));
  }

  private showDocumentation(): void {
    const docsBox = boxen(
      chalk.bold.white('📚 API Documentation\n\n') +
      chalk.cyan('🌐 Swagger UI: ') + chalk.white('http://167.71.201.117:3018/api\n') +
      chalk.cyan('🔧 Config API: ') + chalk.white('http://167.71.201.117:3018/api/config\n') +
      chalk.cyan('🗄️ Migration API: ') + chalk.white('http://167.71.201.117:3018/api/config/migration\n\n') +
      chalk.gray('Available Endpoints:\n') +
      chalk.green('  GET    /api/config              - Get unified configuration\n') +
      chalk.green('  GET    /api/config/storage      - Get storage settings\n') +
      chalk.green('  GET    /api/config/upload       - Get upload settings\n') +
      chalk.green('  PUT    /api/config              - Update configuration\n') +
      chalk.green('  POST   /api/config/migration/run - Run migration\n') +
      chalk.green('  GET    /api/config/categories   - Get config by categories'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'blue',
        backgroundColor: '#0a0a1a'
      }
    );

    console.log(docsBox);
  }

  private async showConfigMenu(): Promise<void> {
    console.log(chalk.blue('\n⚙️ Configuration Management'));
    console.log(chalk.gray('Manage your application configuration settings.\n'));
    
    const { configAction } = await inquirer.prompt([
      {
        type: 'list',
        name: 'configAction',
        message: 'Select configuration action:',
        choices: [
          { name: '👀 View Current Configuration', value: 'view' },
          { name: '✏️ Edit Configuration', value: 'edit' },
          { name: '🔄 Reset to Defaults', value: 'reset' },
          { name: '📤 Export Configuration', value: 'export' },
          { name: '📥 Import Configuration', value: 'import' }
        ]
      }
    ]);

    console.log(chalk.green(`✅ ${configAction} configuration...`));
    console.log(chalk.yellow('💡 Use the API endpoints to manage configuration programmatically'));
  }

  private async runTests(): Promise<void> {
    console.log(chalk.blue('\n🧪 Running tests...'));
    console.log(chalk.gray('This will run the test suite.\n'));
    
    const { testType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'testType',
        message: 'Select test type:',
        choices: [
          { name: '🧪 Unit Tests', value: 'unit' },
          { name: '🔗 Integration Tests', value: 'integration' },
          { name: '🌐 E2E Tests', value: 'e2e' },
          { name: '📊 Coverage Report', value: 'coverage' }
        ]
      }
    ]);

    console.log(chalk.green(`✅ Running ${testType} tests...`));
    console.log(chalk.yellow(`💡 Run "npm run test" for unit tests or "npm run test:${testType}" for ${testType} tests`));
  }

  private async showDatabaseMenu(): Promise<void> {
    console.log(chalk.blue('\n📊 Database Management'));
    console.log(chalk.gray('Manage your database operations.\n'));
    
    const { dbAction } = await inquirer.prompt([
      {
        type: 'list',
        name: 'dbAction',
        message: 'Select database action:',
        choices: [
          { name: '🗄️ Generate Prisma Client', value: 'generate' },
          { name: '🔄 Run Migrations', value: 'migrate' },
          { name: '🌱 Seed Database', value: 'seed' },
          { name: '🎨 Open Prisma Studio', value: 'studio' }
        ]
      }
    ]);

    console.log(chalk.green(`✅ ${dbAction} database...`));
    console.log(chalk.yellow(`💡 Run "npm run prisma:${dbAction}" for database operations`));
  }

  private showHelp(): void {
    const helpBox = boxen(
      chalk.bold.white('❓ Help & Information\n\n') +
      chalk.cyan('📖 Available Commands:\n') +
      chalk.gray('  npm run dev          - Start development server\n') +
      chalk.gray('  npm run build        - Build application\n') +
      chalk.gray('  npm run migrate      - Run migrations\n') +
      chalk.gray('  npm run test         - Run tests\n') +
      chalk.gray('  npm run setup        - Initial setup\n') +
      chalk.gray('  npm run fresh        - Fresh start\n\n') +
      chalk.cyan('🔗 Useful Links:\n') +
      chalk.gray('  • Documentation: http://167.71.201.117:3018/api\n') +
      chalk.gray('  • Configuration: http://167.71.201.117:3018/api/config\n') +
      chalk.gray('  • GitHub: https://github.com/your-repo/oreo\n\n') +
      chalk.cyan('💡 Tips:\n') +
      chalk.gray('  • Use the colorful build for better experience\n') +
      chalk.gray('  • Check migration status before deploying\n') +
      chalk.gray('  • Use the API to manage configuration\n') +
      chalk.gray('  • Run tests before committing changes'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'yellow',
        backgroundColor: '#1a1a0a'
      }
    );

    console.log(helpBox);
  }

  private showGoodbye(): void {
    const goodbyeBox = boxen(
      chalk.bold.white('👋 Goodbye!\n\n') +
      chalk.gray('Thanks for using OREO Media Management Platform\n') +
      chalk.gray('Happy coding! 🚀'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green',
        backgroundColor: '#0a1a0a'
      }
    );

    console.log(goodbyeBox);
    process.exit(0);
  }
}

// Run the startup
const startup = new OREOStartup();
startup.showWelcome().catch(console.error);
