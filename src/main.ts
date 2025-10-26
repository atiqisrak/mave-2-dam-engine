import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as compression from 'compression';
import helmet from 'helmet';
import * as cors from 'cors';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { UnifiedConfigService } from './config/unified-config.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Get the unified config service and wait for initialization
  const configService = app.get(UnifiedConfigService);
  await configService.onModuleInit();
  const corsOrigin = configService.getCorsOrigin();
  
  // Enable API versioning with /api prefix
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'api/v',
  });

  // Global pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,
    transform: true,
  }));

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:", "http://167.71.201.117:3018", "http://127.0.0.1:3018"],
        fontSrc: ["'self'"],
        connectSrc: ["'self'", "http://167.71.201.117:3018", "http://127.0.0.1:3018"],
        mediaSrc: ["'self'", "http://167.71.201.117:3018", "http://127.0.0.1:3018"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    } : false, // Disable CSP in development
  }));
  
  // CORS configuration - Use unified config
  app.use(cors({
    origin: corsOrigin === '*' ? true : corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Access-Token'],
  }));
  app.use(compression());

  // Static file serving for media files
  const uploadDir = process.env.UPLOAD_DIR || 'uploads';
  app.useStaticAssets(join(__dirname, '..', '..', uploadDir), {
    prefix: '/uploads/',
    maxAge: '1y',
    etag: true,
    setHeaders: (res, path) => {
      // Add CORS headers for static files - Use unified config
      res.setHeader('Access-Control-Allow-Origin', corsOrigin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    },
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Oreo Media Management API')
    .setDescription('Media management platform for Engine Tom ecommerce engine')
    .setVersion('1.0')
    .addServer('http://167.71.201.117:3018/v1', 'Development Server v1')
    .addServer('http://167.71.201.117:3018/v1', 'Production Server v1')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3018;
  await app.listen(port);
  console.log(`🚀 Oreo Media Management Platform running on port ${port}`);
  console.log(`📚 API Documentation available at http://localhost:${port}/api`);
}

bootstrap();
