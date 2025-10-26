import { Controller, Post, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MigrationService } from './migration.service';

@ApiTags('Configuration Migration')
@Controller('api/config/migration')
export class MigrationController {
  constructor(private readonly migrationService: MigrationService) {}

  @Post('run')
  @ApiOperation({ summary: 'Run configuration migration' })
  @ApiResponse({ status: 200, description: 'Migration completed successfully' })
  async runMigration() {
    await this.migrationService.migrateEnvironmentToDatabase();
    return { message: 'Configuration migration completed successfully' };
  }

  @Get('status')
  @ApiOperation({ summary: 'Check migration status' })
  @ApiResponse({ status: 200, description: 'Migration status retrieved successfully' })
  async getMigrationStatus() {
    return this.migrationService.checkMigrationStatus();
  }
}
