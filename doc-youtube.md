# Educational YouTube Media Fetcher API

## Overview

This project demonstrates how to build a lightweight, educational API using **NestJS** to fetch and stream publicly available media information from YouTube videos. It's designed for learning purposes, such as understanding video metadata handling, streaming protocols, and API design patterns.

**Important Ethical Note**: This tool is strictly for educational and personal, non-commercial use. It respects content creators by promoting fair use—always ensure you have permission to access and use the media. YouTube's Terms of Service encourage embedding videos where possible; this API is not intended for redistribution or bypassing official features. By using this, you agree to comply with all applicable laws and platform policies. If in doubt, consult legal advice or use official YouTube APIs for production apps.

The API allows:

- Retrieving video metadata (e.g., title, duration).
- Listing available media formats (video resolutions and audio qualities) for informed selection.
- Streaming selected formats for personal viewing or archiving.

We'll use `ytdl-core`, a community-maintained library that parses publicly accessible YouTube data responsibly.

## Prerequisites

- Node.js (v18 or higher) and npm/yarn.
- Basic familiarity with TypeScript, NestJS, and REST APIs.
- For development: Install the NestJS CLI globally: `npm i -g @nestjs/cli`.

## Project Setup

1. **Create the Project**:

   ```
   nest new educational-youtube-fetcher
   cd educational-youtube-fetcher
   ```

2. **Install Dependencies**:

   ```
   npm install ytdl-core
   npm install --save-dev @types/ytdl-core @types/node
   ```

   - `ytdl-core`: Handles ethical parsing of YouTube video info and streams (no unauthorized scraping).
   - Type definitions ensure type-safe code.

3. **Generate Scaffolding**:

   ```
   nest generate module media-fetcher
   nest generate controller media-fetcher
   nest generate service media-fetcher
   ```

   This creates organized files in `src/media-fetcher/`.

4. **Configure Modules**:
   - In `src/media-fetcher/media-fetcher.module.ts`:

     ```typescript
     import { Module } from '@nestjs/common';
     import { MediaFetcherController } from './media-fetcher.controller';
     import { MediaFetcherService } from './media-fetcher.service';

     @Module({
       controllers: [MediaFetcherController],
       providers: [MediaFetcherService],
     })
     export class MediaFetcherModule {}
     ```

   - Import it in `src/app.module.ts`:

     ```typescript
     import { Module } from '@nestjs/common';
     import { AppController } from './app.controller';
     import { AppService } from './app.service';
     import { MediaFetcherModule } from './media-fetcher/media-fetcher.module';

     @Module({
       imports: [MediaFetcherModule],
       controllers: [AppController],
       providers: [AppService],
     })
     export class AppModule {}
     ```

## Core Implementation

### Media Fetcher Service (`media-fetcher.service.ts`)

This service encapsulates the logic for fetching info, formats, and streams. It includes validation to ensure only valid, public URLs are processed.

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import ytdl, { videoFormat } from 'ytdl-core';

@Injectable()
export class MediaFetcherService {
  // Fetch basic video metadata for educational preview
  async getVideoInfo(url: string) {
    if (!ytdl.validateURL(url)) {
      throw new BadRequestException(
        'Please provide a valid public YouTube URL for educational use.',
      );
    }
    const info = await ytdl.getInfo(url);
    return {
      title: info.videoDetails.title,
      author: info.videoDetails.author.name,
      durationSeconds: info.videoDetails.lengthSeconds,
      thumbnailUrl:
        info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1]
          ?.url || info.videoDetails.thumbnails[0].url,
      viewCount: parseInt(info.videoDetails.viewCount, 10),
    };
  }

  // List available formats to help users choose responsibly (e.g., lower quality for faster loads)
  async getFormats(
    url: string,
    filterType?: 'audioonly' | 'videoonly' | 'all',
  ) {
    if (!ytdl.validateURL(url)) {
      throw new BadRequestException(
        'Please provide a valid public YouTube URL for educational use.',
      );
    }
    const info = await ytdl.getInfo(url);
    let formats: videoFormat[] = [];

    switch (filterType) {
      case 'audioonly':
        formats = ytdl.filterFormats(info.formats, 'audioonly');
        break;
      case 'videoonly':
        formats = ytdl.filterFormats(info.formats, 'videoonly');
        break;
      default:
        formats = ytdl.filterFormats(info.formats, 'audioandvideo');
    }

    return formats
      .map((f) => ({
        formatId: f.itag,
        qualityLabel: f.qualityLabel || f.audioQuality || 'Unknown',
        container: f.container || 'mp4',
        mimeType: f.mimeType || 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
        approximateSize: f.contentLength
          ? `${(Number(f.contentLength) / 1024 / 1024).toFixed(2)} MB`
          : 'Varies',
        hasVideo: !!f.qualityLabel,
        hasAudio: !!f.audioCodec,
      }))
      .sort((a, b) =>
        (b.qualityLabel || '').localeCompare(a.qualityLabel || ''),
      );
  }

  // Create a stream for the selected format (streams directly to avoid full downloads where possible)
  createStream(
    url: string,
    quality: string = 'highest',
    filter: 'audioonly' | 'all' = 'all',
  ) {
    if (!ytdl.validateURL(url)) {
      throw new BadRequestException(
        'Please provide a valid public YouTube URL for educational use.',
      );
    }
    // Use requestOptions for polite rate-limiting if needed
    return ytdl(url, {
      quality,
      filter,
      requestOptions: {
        headers: {
          'User-Agent': 'Educational-Fetcher/1.0 (for learning purposes)',
        },
      },
    });
  }
}
```

**Key Features**:

- **Validation**: Ensures URLs are public and valid to promote responsible use.
- **Format Filtering**: Supports audio-only (e.g., for podcasts) or video+audio, with quality labels like "720p" or "128kbps".
- **Sorting**: Formats are sorted by quality descending for easy selection.
- **Headers**: Custom User-Agent to signal educational intent.

### Media Fetcher Controller (`media-fetcher.controller.ts`)

Defines RESTful endpoints. Use URL-encoding for YouTube URLs in params (e.g., `%3A` for `:`).

```typescript
import { Controller, Get, Param, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { MediaFetcherService } from './media-fetcher.service';

@Controller('media-fetcher')
export class MediaFetcherController {
  constructor(private readonly mediaFetcherService: MediaFetcherService) {}

  @Get('info/:url')
  async getInfo(@Param('url') encodedUrl: string) {
    const url = decodeURIComponent(encodedUrl);
    return this.mediaFetcherService.getVideoInfo(url);
  }

  @Get('formats/:url')
  async getFormats(
    @Param('url') encodedUrl: string,
    @Query('filter') filter?: 'audioonly' | 'videoonly' | 'all',
  ) {
    const url = decodeURIComponent(encodedUrl);
    return this.mediaFetcherService.getFormats(url, filter || 'all');
  }

  @Get('stream/:url')
  async streamMedia(
    @Param('url') encodedUrl: string,
    @Query('quality') quality: string,
    @Query('filter') filter: 'audioonly' | 'all',
    @Res() res: Response,
  ) {
    const url = decodeURIComponent(encodedUrl);
    const stream = this.mediaFetcherService.createStream(
      url,
      quality || 'highest',
      filter || 'all',
    );

    // Set headers for safe, temporary streaming
    res.status(HttpStatus.OK);
    res.set({
      'Content-Type': 'video/mp4', // Default; adjust dynamically if needed
      'Content-Disposition': 'inline; filename="educational-media.mp4"', // Inline for preview
      'Cache-Control': 'no-cache', // Prevent unnecessary storage
    });

    // Handle stream errors gracefully
    stream.on('error', (err) => {
      res.status(500).send('Stream unavailable—please try a different format.');
    });

    stream.pipe(res);
  }
}
```

**API Endpoints**:
| Endpoint | Method | Description | Parameters | Example |
|----------|--------|-------------|------------|---------|
| `/media-fetcher/info/:url` | GET | Get metadata for educational preview. | `url` (encoded YouTube URL) | `GET /media-fetcher/info/https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ` |
| `/media-fetcher/formats/:url?filter=all` | GET | List formats (qualities) for selection. | `url` (encoded), `filter` (audioonly/videoonly/all) | `GET /media-fetcher/formats/https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ?filter=audioonly` |
| `/media-fetcher/stream/:url?quality=highest&filter=all` | GET | Stream selected format inline. | `url` (encoded), `quality` (e.g., "720p", itag like "22"), `filter` | `GET /media-fetcher/stream/https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ?quality=18` |

- **Quality Selection**: Use labels like "highest", "480p", or format IDs from `/formats`.
- **Audio-Only**: Set `filter=audioonly` for lighter streams (e.g., for offline listening in personal projects).

## Running the Project

1. **Start Development Server**:

   ```
   npm run start:dev
   ```

   The app runs on `http://localhost:3000`.

2. **Testing**:
   - Use tools like Postman, curl, or a browser.
   - Example curl for info:
     ```
     curl "http://localhost:3000/media-fetcher/info/https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ"
     ```
   - For streaming: Open the stream URL in a browser—it'll play inline or prompt download.

3. **Error Handling**: Built-in validation returns friendly 400/500 errors.

## Enhancements for Learning

- **API Documentation**: Add Swagger with `npm i @nestjs/swagger`. Decorate endpoints with `@ApiOperation` for auto-docs at `/api`.
- **Rate Limiting**: Install `@nestjs/throttler` to simulate real-world API guards: `@UseGuards(ThrottlerGuard), @Throttle(10, 60)` on controller.
- **Logging**: Use NestJS's built-in logger for monitoring requests ethically.
- **Frontend Integration**: Pair with a simple React app to select formats via dropdowns—great for full-stack practice.
- **Advanced Merging**: For high-quality video+audio separation, integrate `fluent-ffmpeg` (npm install) to merge streams responsibly.

## Contributing & Disclaimer

This is an open-source inspired educational tool—fork and improve it! Contributions welcome via PRs, focusing on better error messages or TypeScript refinements.

**Reminder**: Always prioritize ethical use. This API enhances learning about media protocols without encouraging misuse. For official integrations, explore YouTube's Data API v3.

Happy coding—build responsibly! 🚀
