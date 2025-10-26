import { Module } from '@nestjs/common';
import { CloudStorageService } from './cloud-storage.service';
import { LocalStorageService } from './local-storage.service';
import { StorageFactoryService } from './storage-factory.service';
import { StorageController } from './storage.controller';
import { StorageConfigService } from '../config/config.service';

@Module({
  controllers: [StorageController],
  providers: [
    CloudStorageService,
    LocalStorageService,
    StorageFactoryService,
    StorageConfigService,
  ],
  exports: [
    CloudStorageService,
    LocalStorageService,
    StorageFactoryService,
    StorageConfigService,
  ],
})
export class StorageModule {}
