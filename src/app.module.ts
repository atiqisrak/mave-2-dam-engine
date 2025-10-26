import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MediaModule } from './media/media.module';
import { UploadModule } from './upload/upload.module';
import { ImageProcessingModule } from './image-processing/image-processing.module';
import { ProcessedMediaModule } from './processed-media/processed-media.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from './config/config.module';
import { StorageModule } from './storage/storage.module';
import { AuthModule } from './auth/auth.module';
import { FoldersModule } from './folders/folders.module';
import { AccessTokensModule } from './access-tokens/access-tokens.module';
import { VideoModule } from './video/video.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'env.unified'],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    ConfigModule,
    StorageModule,
    AuthModule,
    FoldersModule,
    AccessTokensModule,
    MediaModule,
    UploadModule,
    ImageProcessingModule,
    ProcessedMediaModule,
    VideoModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
