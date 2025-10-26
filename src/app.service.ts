import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome to Oreo Media Management Platform! 🍪';
  }

  health(): { 
    status: string; 
    timestamp: string;
    version?: string;
    environment?: string;
    database?: string;
    redis?: string;
    storage?: string;
    ai?: string;
    contentModeration?: string;
    objectDetection?: string;
  } {
    return {
      status: 'All services are running properly',
      version: process.env.API_VERSION,
      environment: process.env.NODE_ENV,
      database: process.env.DATABASE,
      redis: process.env.REDIS_URL,
      storage: process.env.STORAGE_PROVIDER,
      ai: process.env.AI_ENABLED,
      contentModeration: process.env.CONTENT_MODERATION_ENABLED,
      objectDetection: process.env.OBJECT_DETECTION_ENABLED,
      timestamp: new Date().toISOString(),
    };
  }
}
