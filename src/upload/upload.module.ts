import { Module, forwardRef } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { MediaModule } from '../media/media.module';
import { ImageProcessingModule } from '../image-processing/image-processing.module';
import { ConfigModule } from '../config/config.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [forwardRef(() => MediaModule), ImageProcessingModule, ConfigModule, StorageModule],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
