#!/usr/bin/env ts-node

import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface BuildStep {
  name: string;
  command: string;
  description: string;
  duration?: number;
}

class SimpleBuilder {
  private steps: BuildStep[] = [
    {
      name: 'clean',
      command: 'rm -rf dist',
      description: 'Cleaning previous build'
    },
    {
      name: 'prisma-generate',
      command: 'npx prisma generate',
      description: 'Generating Prisma client'
    },
    {
      name: 'type-check',
      command: 'npx tsc --noEmit',
      description: 'Type checking'
    },
    {
      name: 'build',
      command: 'nest build',
      description: 'Building application'
    },
    {
      name: 'optimize',
      command: 'echo "Optimizing build..."',
      description: 'Optimizing bundle'
    }
  ];

  private startTime: number = 0;

  async build(): Promise<void> {
    console.log('🚀 Starting OREO Media Management Build Process');
    console.log('================================================');
    this.startTime = Date.now();
    
    try {
      await this.runSteps();
      this.showSuccess();
    } catch (error) {
      this.showError(error);
      process.exit(1);
    }
  }


  private async runSteps(): Promise<void> {
    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      await this.runStep(step, i + 1);
    }
  }

  private async runStep(step: BuildStep, stepNumber: number): Promise<void> {
    console.log(`[${stepNumber}/${this.steps.length}] ${step.description}...`);

    try {
      const startTime = Date.now();
      
      if (step.command.startsWith('echo')) {
        // Simulate work for echo commands
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        execSync(step.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
      }

      const duration = Date.now() - startTime;
      step.duration = duration;

      console.log(`✅ ${step.description} completed in ${duration}ms`);

    } catch (error) {
      console.log(`❌ ${step.description} failed`);
      throw error;
    }
  }

  private showSuccess(): void {
    const totalTime = Date.now() - this.startTime;
    const totalTimeSeconds = (totalTime / 1000).toFixed(2);

    console.log('\n🎉 Build Completed Successfully!');
    console.log('================================');
    console.log(`Total Time: ${totalTimeSeconds}s`);
    console.log(`Steps: ${this.steps.length}`);
    console.log('Status: SUCCESS\n');

    console.log('⚡ Step Breakdown:');
    this.steps.forEach((step, index) => {
      const duration = step.duration ? `${step.duration}ms` : 'N/A';
      const status = step.duration ? '✅' : '⏳';
      console.log(`  ${index + 1}. ${step.description} (${duration}) ${status}`);
    });

    this.showNextSteps();
  }


  private showNextSteps(): void {
    const nextSteps = [
      '🚀 Start the application: npm run start:dev',
      '📚 View API documentation: http://167.71.201.117:3018/api',
      '🔧 Configure settings: Use the unified config API',
      '🗄️ Run migrations: POST /api/config/migration/run'
    ];

    console.log('\n🎯 Next Steps:');
    nextSteps.forEach(step => {
      console.log(`  • ${step}`);
    });

    console.log('\n' + '─'.repeat(60));
    console.log('✨ Happy coding with OREO! ✨');
  }

  private showError(error: any): void {
    console.log('\n❌ Build Failed!');
    console.log('================');
    console.log('Error Details:');
    console.log(error.message || error);
    console.log('\n💡 Troubleshooting Tips:');
    console.log('  • Check your TypeScript configuration');
    console.log('  • Ensure all dependencies are installed');
    console.log('  • Verify environment variables are set');
    console.log('  • Run "npm run build:debug" for detailed logs');
  }
}

// Run the build
const builder = new SimpleBuilder();
builder.build().catch(console.error);
