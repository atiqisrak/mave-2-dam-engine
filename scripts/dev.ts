#!/usr/bin/env ts-node

import { spawn } from 'child_process';

class DevServer {
  private devProcess: any = null;

  async start(): Promise<void> {
    this.showWelcome();
    await this.startDevServer();
  }

  private showWelcome(): void {
    console.clear();
    console.log('🔥 Starting OREO Development Server');
    console.log('Hot Reload • TypeScript • Unified Configuration • API-First');
    console.log('');
  }

  private async startDevServer(): Promise<void> {
    console.log('🚀 Starting development server...');

    try {
      // Start the dev server
      this.devProcess = spawn('npm', ['run', 'start:debug'], {
        stdio: 'pipe',
        shell: true
      });

      // Handle process output
      this.devProcess.stdout?.on('data', (data: Buffer) => {
        const output = data.toString();
        console.log(output);
        
        if (output.includes('Application is running on')) {
          console.log('\n✅ Server started successfully!');
          this.showServerInfo();
        }
      });

      this.devProcess.stderr?.on('data', (data: Buffer) => {
        console.log(data.toString());
      });

      this.devProcess.on('close', (code: number) => {
        if (code !== 0) {
          console.log(`\n❌ Development server exited with code ${code}`);
        } else {
          console.log('\n✅ Development server stopped gracefully');
        }
      });

      // Handle Ctrl+C
      process.on('SIGINT', () => {
        console.log('\n\n🛑 Stopping development server...');
        if (this.devProcess) {
          this.devProcess.kill('SIGINT');
        }
        process.exit(0);
      });

    } catch (error) {
      console.error('Error starting dev server:', error);
      process.exit(1);
    }
  }

  private showServerInfo(): void {
    console.log('\n🌐 Server Information:');
    console.log('📍 URL: http://167.71.201.117:3018');
    console.log('📚 API Docs: http://167.71.201.117:3018/api');
    console.log('🔧 Config API: http://167.71.201.117:3018/api/config');
    console.log('🗄️ Migration: http://167.71.201.117:3018/api/config/migration');
    console.log('\nPress Ctrl+C to stop the server');
    console.log('✨ Development server is ready! ✨');
  }
}

// Run the dev server
const devServer = new DevServer();
devServer.start().catch(console.error);
