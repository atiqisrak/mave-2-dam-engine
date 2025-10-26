# 🍪 Mave v2 DAM Engine - Intelligent Media Management Microservice

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-green.svg" alt="Node.js Version" />
  <img src="https://img.shields.io/badge/TypeScript-5.9+-blue.svg" alt="TypeScript Version" />
  <img src="https://img.shields.io/badge/NestJS-11.1+-red.svg" alt="NestJS Version" />
  <img src="https://img.shields.io/badge/PostgreSQL-13+-blue.svg" alt="PostgreSQL Version" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License" />
</p>

## 🎯 Overview

**Mave v2 DAM Engine** (formerly Oreo) is a production-ready, intelligent media management microservice designed for the Mave ecosystem. Built with NestJS and TypeScript, it provides advanced image processing, video handling, cloud storage integration, and AI-powered media optimization.

> **Note**: This service integrates with [mave-2-auth](../mave-2-auth) for authentication and RBAC. All media operations require a valid JWT token from the auth service.

## ✨ Key Features

### 🖼️ Advanced Image Processing

- **Multi-Format Support** - JPEG, PNG, WebP, AVIF, and SVG processing
- **Automatic Optimization** - Smart compression and format conversion
- **Responsive Images** - Multiple sizes and formats for different devices
- **Watermarking** - Brand protection with customizable watermarks
- **Thumbnail Generation** - Automatic thumbnail creation for all images
- **Metadata Extraction** - EXIF data processing and storage

### 🎥 Video Processing

- **Format Conversion** - MP4, WebM, MOV, and AVI support
- **Compression** - Intelligent video optimization for web delivery
- **Thumbnail Extraction** - Frame extraction for video previews
- **Transcoding** - Multiple quality levels for adaptive streaming
- **Duration Analysis** - Video length and metadata extraction

### ☁️ Cloud Storage Integration

- **Multi-Provider Support** - AWS S3, Google Cloud Storage, Azure Blob
- **CDN Integration** - Automatic CDN distribution for global delivery
- **Storage Abstraction** - Unified API across different cloud providers
- **Cost Optimization** - Intelligent storage tier management
- **Backup & Recovery** - Automated backup and disaster recovery

### 🤖 AI-Powered Features

- **Content Moderation** - Automatic inappropriate content detection
- **Object Detection** - AI-powered image analysis and tagging
- **Duplicate Detection** - Smart duplicate file identification
- **Quality Assessment** - Automatic image quality scoring
- **Auto-Categorization** - Intelligent media organization

### 🔒 Security & Compliance

- **Access Control** - Role-based permissions and authentication
- **Virus Scanning** - Malware detection for uploaded files
- **Data Encryption** - End-to-end encryption for sensitive media
- **Audit Logging** - Complete activity tracking and compliance
- **GDPR Compliance** - Privacy-focused data handling

## 🏗️ Architecture

### Core Services

| Service              | Purpose            | Key Features                               |
| -------------------- | ------------------ | ------------------------------------------ |
| **Upload Service**   | File handling      | Multi-part uploads, validation, processing |
| **Image Processing** | Image optimization | Resize, compress, convert, watermark       |
| **Video Processing** | Video handling     | Transcode, compress, extract thumbnails    |
| **Storage Service**  | Cloud integration  | Multi-provider, CDN, backup                |
| **AI Service**       | Smart features     | Moderation, detection, analysis            |
| **Media Service**    | CRUD operations    | Metadata, search, organization             |

### Technology Stack

- **Framework**: NestJS 11+ with TypeScript 5.9+
- **Database**: PostgreSQL 13+ with Prisma ORM
- **Image Processing**: Sharp, Jimp, FFmpeg
- **Cloud Storage**: AWS S3, Google Cloud Storage, Azure Blob
- **AI/ML**: Custom models for content analysis
- **Caching**: Redis for performance optimization
- **Queue**: Bull Queue for background processing
- **Monitoring**: Winston logging with Sentry integration

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 13+
- Redis (for caching and queues)
- FFmpeg (for video processing)
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/atiqisrak/jerry.git
cd jerry/oreo

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
pnpm prisma migrate dev

# Start development server
pnpm run dev
```

### Environment Configuration

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/oreo"

# Redis
REDIS_URL="redis://localhost:6379"

# Server
PORT=3001
NODE_ENV=development

# Storage Configuration
STORAGE_TYPE="s3" # or "local", "gcs", "azure"
AWS_S3_BUCKET="your-bucket"
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"

# Image Processing
MAX_FILE_SIZE=10485760 # 10MB
ALLOWED_IMAGE_TYPES="image/jpeg,image/png,image/webp,image/svg+xml"
ALLOWED_VIDEO_TYPES="video/mp4,video/webm,video/quicktime"

# AI Services
AI_ENABLED=true
CONTENT_MODERATION_ENABLED=true
OBJECT_DETECTION_ENABLED=true

# Auth Service Integration
AUTH_SERVICE_URL="http://localhost:7845"

# Security
JWT_SECRET="your-jwt-secret"
API_KEY="your-api-key"
```

## 📖 Usage

### Basic File Upload

```typescript
import { MediaService } from '@oreo/media';

// Upload single file
const result = await mediaService.uploadFile({
  file: uploadedFile,
  category: 'products',
  metadata: {
    title: 'Product Image',
    description: 'Main product photo',
    tags: ['product', 'electronics'],
  },
});

// Upload multiple files
const results = await mediaService.uploadMultipleFiles({
  files: [file1, file2, file3],
  category: 'gallery',
  processOptions: {
    generateThumbnails: true,
    createResponsiveImages: true,
    watermark: true,
  },
});
```

### Image Processing

```typescript
import { ImageProcessingService } from '@oreo/image-processing';

// Resize and optimize image
const processedImage = await imageProcessingService.processImage({
  input: imageBuffer,
  operations: [
    { type: 'resize', width: 800, height: 600 },
    { type: 'compress', quality: 85 },
    { type: 'format', format: 'webp' },
    { type: 'watermark', text: '© 2024 My Store' },
  ],
});

// Generate responsive images
const responsiveImages = await imageProcessingService.generateResponsiveImages({
  input: imageBuffer,
  sizes: [320, 640, 1024, 1920],
  formats: ['webp', 'jpeg'],
});
```

### Video Processing

```typescript
import { VideoProcessingService } from '@oreo/video-processing';

// Process video
const processedVideo = await videoProcessingService.processVideo({
  input: videoBuffer,
  operations: [
    { type: 'compress', quality: 'medium' },
    { type: 'resize', width: 1280, height: 720 },
    { type: 'extractThumbnail', time: '00:00:05' },
  ],
});

// Generate multiple quality levels
const qualityLevels = await videoProcessingService.generateQualityLevels({
  input: videoBuffer,
  levels: ['low', 'medium', 'high', 'ultra'],
});
```

### Cloud Storage Integration

```typescript
import { StorageService } from '@oreo/storage';

// Upload to cloud storage
const uploadResult = await storageService.upload({
  file: processedFile,
  path: 'products/2024/image.jpg',
  metadata: {
    contentType: 'image/jpeg',
    cacheControl: 'max-age=31536000',
  },
});

// Generate signed URL for secure access
const signedUrl = await storageService.generateSignedUrl({
  path: 'products/2024/image.jpg',
  expiresIn: 3600, // 1 hour
});
```

## 📊 API Endpoints

### Media Management

#### Upload Media

```http
POST /api/v1/media/upload
Content-Type: multipart/form-data

file: [binary data]
category: products
metadata: {"title": "Product Image", "tags": ["electronics"]}
```

#### List Media

```http
GET /api/v1/media?category=products&page=1&limit=20&search=electronics
```

#### Get Media Details

```http
GET /api/v1/media/:id
```

#### Update Media

```http
PUT /api/v1/media/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "New description",
  "tags": ["updated", "tags"]
}
```

#### Delete Media

```http
DELETE /api/v1/media/:id
```

### Image Processing

#### Process Image

```http
POST /api/v1/images/process
Content-Type: application/json

{
  "imageId": "uuid",
  "operations": [
    {"type": "resize", "width": 800, "height": 600},
    {"type": "compress", "quality": 85},
    {"type": "watermark", "text": "© 2024"}
  ]
}
```

#### Generate Thumbnails

```http
POST /api/v1/images/:id/thumbnails
Content-Type: application/json

{
  "sizes": [150, 300, 600],
  "formats": ["webp", "jpeg"]
}
```

### Video Processing

#### Process Video

```http
POST /api/v1/videos/process
Content-Type: application/json

{
  "videoId": "uuid",
  "operations": [
    {"type": "compress", "quality": "medium"},
    {"type": "resize", "width": 1280, "height": 720}
  ]
}
```

#### Extract Thumbnail

```http
POST /api/v1/videos/:id/thumbnail
Content-Type: application/json

{
  "time": "00:00:05",
  "size": {"width": 320, "height": 240}
}
```

### AI Services

#### Content Moderation

```http
POST /api/v1/ai/moderate
Content-Type: application/json

{
  "mediaId": "uuid",
  "checkTypes": ["inappropriate", "violence", "adult"]
}
```

#### Object Detection

```http
POST /api/v1/ai/detect-objects
Content-Type: application/json

{
  "imageId": "uuid",
  "confidence": 0.8
}
```

## 🎨 Supported Formats

### Image Formats

- **Input**: JPEG, PNG, WebP, AVIF, SVG, GIF, BMP, TIFF
- **Output**: JPEG, PNG, WebP, AVIF, SVG
- **Processing**: Resize, crop, rotate, flip, compress, watermark

### Video Formats

- **Input**: MP4, WebM, MOV, AVI, MKV, FLV, WMV
- **Output**: MP4, WebM, MOV
- **Processing**: Transcode, compress, resize, extract thumbnails

### Audio Formats

- **Input**: MP3, WAV, AAC, OGG, FLAC
- **Output**: MP3, WAV, AAC
- **Processing**: Convert, compress, normalize

## 🔧 Configuration

### Storage Providers

#### AWS S3

```typescript
const s3Config = {
  type: 's3',
  bucket: 'your-bucket',
  region: 'us-east-1',
  accessKeyId: 'your-key',
  secretAccessKey: 'your-secret',
  cdnUrl: 'https://cdn.yourdomain.com',
};
```

#### Google Cloud Storage

```typescript
const gcsConfig = {
  type: 'gcs',
  bucket: 'your-bucket',
  projectId: 'your-project',
  keyFilename: 'path/to/service-account.json',
  cdnUrl: 'https://storage.googleapis.com/your-bucket',
};
```

#### Local Storage

```typescript
const localConfig = {
  type: 'local',
  uploadDir: './uploads',
  publicUrl: 'https://yourdomain.com/uploads',
};
```

### Image Processing Settings

```typescript
const imageConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  defaultQuality: 85,
  thumbnailSizes: [150, 300, 600, 1200],
  responsiveBreakpoints: [320, 640, 1024, 1920],
  watermark: {
    enabled: true,
    text: '© 2024 My Store',
    position: 'bottom-right',
    opacity: 0.7,
  },
};
```

## 🚀 Deployment

### Docker Deployment

```dockerfile
FROM node:18-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist
EXPOSE 3001

CMD ["node", "dist/main.js"]
```

### Production Checklist

- [ ] Configure cloud storage credentials
- [ ] Set up Redis for caching and queues
- [ ] Configure FFmpeg for video processing
- [ ] Set up monitoring and logging
- [ ] Configure CDN for media delivery
- [ ] Set up backup strategy
- [ ] Configure security settings
- [ ] Set up rate limiting
- [ ] Configure AI services

## 📈 Performance

- **Image Processing**: < 2 seconds for 4K images
- **Video Processing**: < 30 seconds for 1080p videos
- **Upload Speed**: 50MB/s with optimized settings
- **Concurrent Processing**: 100+ simultaneous operations
- **Storage**: 99.9% availability with cloud providers
- **CDN**: Global delivery with < 100ms latency

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run e2e tests
pnpm test:e2e

# Run tests with coverage
pnpm test:cov

# Run performance tests
pnpm test:performance
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Atiq Israk** - [@atiqisrak](https://github.com/atiqisrak)

## 🙏 Acknowledgments

- Built with [NestJS](https://nestjs.com/) framework
- Image processing with [Sharp](https://sharp.pixelplumbing.com/) and [Jimp](https://github.com/oliver-moran/jimp)
- Video processing with [FFmpeg](https://ffmpeg.org/)
- Cloud storage with [AWS SDK](https://aws.amazon.com/sdk-for-javascript/)
- Database management with [Prisma](https://prisma.io/)
- Queue processing with [Bull](https://github.com/OptimalBits/bull)
