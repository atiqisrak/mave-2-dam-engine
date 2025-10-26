import { Module } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { StorageConfigService } from './config.service';
import { ConfigController } from './config.controller';
import { UnifiedConfigService } from './unified-config.service';
import { UnifiedConfigController } from './unified-config.controller';
import { MigrationService } from './migration.service';
import { MigrationController } from './migration.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ConfigController, UnifiedConfigController, MigrationController],
  providers: [StorageConfigService, UnifiedConfigService, MigrationService, NestConfigService],
  exports: [StorageConfigService, UnifiedConfigService, MigrationService],
})
export class ConfigModule {}
