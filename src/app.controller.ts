import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Frontend page' })
  @ApiResponse({ status: 200, description: 'Serves the frontend HTML' })
  serveFrontend(@Res() res: Response) {
    try {
      // When built, __dirname points to dist/src, so we need to go up to dist, then to public
      const htmlPath = join(__dirname, '..', '..', 'public', 'index.html');
      const html = readFileSync(htmlPath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('Error loading frontend:', error);
      res.status(500).send('Error loading frontend');
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  health(): { status: string; timestamp: string } {
    return this.appService.health();
  }
}
