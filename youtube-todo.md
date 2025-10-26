# YouTube Media Fetcher Service Development Plan

## Overview

This document outlines the development plan for integrating a YouTube media fetcher service into the Oreo backend. The service will allow users to fetch, download, and manage YouTube videos with automatic expiry and download link generation.

## Progress Summary

**Phase 1: Core Foundation ✅ COMPLETED**

- Database schema implemented with YouTube models
- Module structure created with service, controller, and DTOs
- Core service with ytdl-core integration
- Basic API endpoints for video info, formats, and streaming
- Database migration completed

**Phase 2: User Management & Download System 🔄 IN PROGRESS**

- Authentication integration (pending)
- Download management system (pending)
- Storage integration (pending)
- Expiry system (pending)

## Phase 1: Core Foundation (Week 1-2)

### 1.1 Database Schema Design

- [x] Add `YouTubeVideo` model to Prisma schema
- [x] Add `YouTubeDownload` model for tracking user downloads
- [x] Add `YouTubeFormat` model for storing available formats
- [x] Add indexes for performance optimization
- [x] Create migration files

**Database Models:**

```prisma
model YouTubeVideo {
  id                String   @id @default(cuid())
  youtubeId         String   @unique
  title             String
  author            String
  description       String?
  thumbnailUrl      String
  duration          Int      // in seconds
  viewCount         Int
  publishedAt       DateTime
  isDownloaded      Boolean  @default(false)
  downloadedAt      DateTime?
  expiresAt         DateTime
  status            YouTubeVideoStatus @default(ACTIVE)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  downloads         YouTubeDownload[]
  formats           YouTubeFormat[]
  userId            String
  user              User     @relation(fields: [userId], references: [id])

  @@index([youtubeId])
  @@index([expiresAt])
  @@index([userId])
  @@map("youtube_videos")
}

model YouTubeDownload {
  id            String   @id @default(cuid())
  videoId       String
  video         YouTubeVideo @relation(fields: [videoId], references: [id])
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  formatId      String
  format        YouTubeFormat @relation(fields: [formatId], references: [id])
  downloadUrl   String
  filePath      String?
  fileSize      Int?
  status        DownloadStatus @default(PENDING)
  downloadedAt  DateTime?
  expiresAt     DateTime
  createdAt     DateTime @default(now())

  @@index([videoId])
  @@index([userId])
  @@index([expiresAt])
  @@map("youtube_downloads")
}

model YouTubeFormat {
  id            String   @id @default(cuid())
  videoId       String
  video         YouTubeVideo @relation(fields: [videoId], references: [id])
  formatId      String   // ytdl format ID
  qualityLabel  String
  container     String
  mimeType      String
  fileSize      Int?
  hasVideo      Boolean
  hasAudio      Boolean
  createdAt     DateTime @default(now())

  @@index([videoId])
  @@map("youtube_formats")
}
```

### 1.2 Module Structure

- [x] Create `youtube-media-fetcher` module directory
- [x] Create service, controller, and DTO files
- [x] Set up module imports and exports
- [x] Add to main app module

**File Structure:**

```
src/youtube-media-fetcher/
├── dto/
│   ├── fetch-video-info.dto.ts
│   ├── download-video.dto.ts
│   ├── get-formats.dto.ts
│   └── index.ts
├── entities/
│   ├── youtube-video.entity.ts
│   ├── youtube-download.entity.ts
│   └── youtube-format.entity.ts
├── youtube-media-fetcher.controller.ts
├── youtube-media-fetcher.service.ts
├── youtube-media-fetcher.module.ts
└── interfaces/
    └── youtube.interface.ts
```

### 1.3 Core Service Implementation

- [x] Implement video info fetching with ytdl-core
- [x] Implement format listing functionality
- [x] Implement streaming capabilities
- [x] Add URL validation and error handling
- [x] Add logging and monitoring

### 1.4 Basic API Endpoints

- [x] `POST /youtube/info` - Get video metadata
- [x] `GET /youtube/formats/:videoId` - List available formats
- [x] `GET /youtube/stream/:videoId` - Stream video content
- [x] `POST /youtube/download` - Initiate download
- [x] `GET /youtube/downloads` - Get user download history
- [x] `POST /youtube/cleanup` - Clean up expired videos

## Phase 2: User Management & Download System (Week 3-4)

### 2.1 Authentication Integration

- [ ] Add JWT authentication to YouTube endpoints
- [ ] Implement user permission checks
- [ ] Add rate limiting per user
- [ ] Create user quota management

### 2.2 Download Management System

- [ ] Implement download queue system
- [ ] Create download link generation
- [ ] Add download progress tracking
- [ ] Implement download history
- [ ] Add download analytics

### 2.3 Storage Integration

- [ ] Integrate with existing S3 storage
- [ ] Implement file upload to cloud storage
- [ ] Add local caching for temporary files
- [ ] Create storage cleanup mechanisms

### 2.4 Expiry System

- [ ] Implement automatic video expiry
- [ ] Create scheduled cleanup service
- [ ] Add expiry notifications
- [ ] Implement grace period for active downloads

## Phase 3: Advanced Features (Week 5-6)

### 3.1 Rate Limiting & Quotas

- [ ] Implement per-user rate limiting
- [ ] Add daily/monthly download quotas
- [ ] Create quota reset mechanisms
- [ ] Add quota usage notifications

### 3.2 Caching System

- [ ] Implement Redis caching for video metadata
- [ ] Add format information caching
- [ ] Create cache invalidation strategies
- [ ] Add cache performance monitoring

### 3.3 Batch Operations

- [ ] Add playlist processing
- [ ] Implement bulk download functionality
- [ ] Create batch format conversion
- [ ] Add batch expiry management

### 3.4 Monitoring & Analytics

- [ ] Add usage tracking
- [ ] Implement download analytics
- [ ] Create performance monitoring
- [ ] Add error tracking and alerting

## Phase 4: Frontend Integration & Documentation (Week 7-8)

### 4.1 Frontend Components

- [ ] Create YouTube video search component
- [ ] Implement video preview and metadata display
- [ ] Add format selection interface
- [ ] Create download management UI
- [ ] Add user quota display

### 4.2 API Documentation

- [ ] Add Swagger/OpenAPI documentation
- [ ] Create Postman collection
- [ ] Add API usage examples
- [ ] Create integration guides

### 4.3 Testing & Validation

- [ ] Create unit tests for all services
- [ ] Add integration tests for API endpoints
- [ ] Implement end-to-end testing
- [ ] Add performance testing
- [ ] Create load testing scenarios

## Phase 5: Production Readiness (Week 9-10)

### 5.1 Security Enhancements

- [ ] Add input sanitization
- [ ] Implement CSRF protection
- [ ] Add request validation
- [ ] Create security audit

### 5.2 Performance Optimization

- [ ] Optimize database queries
- [ ] Implement connection pooling
- [ ] Add response compression
- [ ] Create performance benchmarks

### 5.3 Deployment & Monitoring

- [ ] Create deployment scripts
- [ ] Add health checks
- [ ] Implement monitoring dashboards
- [ ] Create backup strategies

## Technical Requirements

### Dependencies

- `ytdl-core` (already installed)
- `@types/ytdl-core` (already installed)
- Redis for caching
- S3 SDK (already installed)

### Environment Variables

```env
# YouTube Service Configuration
YOUTUBE_CACHE_TTL=3600
YOUTUBE_DOWNLOAD_EXPIRY=86400
YOUTUBE_RATE_LIMIT_PER_USER=100
YOUTUBE_DAILY_QUOTA=10
YOUTUBE_MAX_FILE_SIZE=500MB
```

### API Rate Limits

- Video info fetching: 100 requests/hour per user
- Format listing: 200 requests/hour per user
- Download initiation: 10 requests/day per user
- Streaming: 50 requests/hour per user

## Success Metrics

- [ ] 99.9% uptime for YouTube service
- [ ] < 2s response time for video info
- [ ] < 5s response time for format listing
- [ ] 95% successful download completion rate
- [ ] Zero data leaks or security breaches

## Risk Mitigation

- [ ] Implement circuit breakers for external API calls
- [ ] Add fallback mechanisms for service failures
- [ ] Create data backup and recovery procedures
- [ ] Implement graceful degradation for high load

## Future Enhancements

- [ ] Support for other video platforms (Vimeo, Dailymotion)
- [ ] Advanced video processing (transcoding, compression)
- [ ] AI-powered content analysis
- [ ] Mobile app integration
- [ ] Real-time collaboration features
