import { Module, forwardRef } from '@nestjs/common';
import { ImageProcessingService } from './image-processing.service';
import { ImageProcessingController } from './image-processing.controller';
import { RemoveBgService } from './remove-bg.service';
import { MediaModule } from '../media/media.module';
import { ProcessedMediaModule } from '../processed-media/processed-media.module';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [
    forwardRef(() => MediaModule),
    forwardRef(() => ProcessedMediaModule),
    ConfigModule,
  ],
  controllers: [ImageProcessingController],
  providers: [ImageProcessingService, RemoveBgService],
  exports: [ImageProcessingService, RemoveBgService],
})
export class ImageProcessingModule {}
