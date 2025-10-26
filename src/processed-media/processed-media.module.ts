import { Module, forwardRef } from '@nestjs/common';
import { ProcessedMediaService } from './processed-media.service';
import { ProcessedMediaController, ShareController } from './processed-media.controller';
import { ProcessedMediaCleanupService } from './processed-media-cleanup.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => MediaModule),
  ],
  controllers: [ProcessedMediaController, ShareController],
  providers: [ProcessedMediaService, ProcessedMediaCleanupService],
  exports: [ProcessedMediaService],
})
export class ProcessedMediaModule {}

