import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import { unlink, copyFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { MediaService } from '../media/media.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  private readonly ffmpegPath = ffmpegStatic;

  constructor(
    private readonly mediaService: MediaService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Runs an FFmpeg command with the provided arguments.
   * @param args The command-line arguments for FFmpeg.
   * @returns A Promise that resolves when the command completes successfully.
   */
  private async runFfmpegCommand(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpegProcess = spawn(this.ffmpegPath, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stderr = '';
      ffmpegProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpegProcess.on('close', (code) => {
        if (code === 0) {
          this.logger.log('FFmpeg command completed successfully.');
          resolve();
        } else {
          this.logger.error(`FFmpeg process exited with code ${code}.`);
          this.logger.error(`FFmpeg stderr: ${stderr}`);
          reject(new Error(`FFmpeg conversion failed: ${stderr}`));
        }
      });

      ffmpegProcess.on('error', (err) => {
        this.logger.error(`Failed to start FFmpeg process: ${err.message}`);
        reject(new Error(`Failed to start FFmpeg: ${err.message}`));
      });
    });
  }

  /**
   * Compresses a video file using a specific CRF value.
   * @param inputPath Path to the input video file.
   * @param outputPath Path where the compressed video will be saved.
   * @param crf Quality setting (lower is better quality, larger file size)
   * @param audioBitrate Audio bitrate setting
   */
  async compressVideo(
    inputPath: string,
    outputPath: string,
    crf: number = 28,
    audioBitrate: string = '128k',
  ): Promise<void> {
    const args = [
      '-i',
      inputPath,
      '-c:v',
      'libx264',
      '-crf',
      crf.toString(),
      '-c:a',
      'aac',
      '-b:a',
      audioBitrate,
      '-movflags',
      '+faststart',
      '-y', // Overwrite output file if it exists
      outputPath,
    ];

    this.logger.log(`Compressing video from ${inputPath} to ${outputPath}...`);
    await this.runFfmpegCommand(args);
  }

  /**
   * Creates a thumbnail from a video file.
   * @param inputPath Path to the video file.
   * @param outputPath Path where the thumbnail will be saved.
   * @param timestamp The timestamp to capture (e.g., '00:00:03' or '50%').
   */
  async createThumbnail(
    inputPath: string,
    outputPath: string,
    timestamp: string = '00:00:01',
  ): Promise<void> {
    const args = [
      '-i',
      inputPath,
      '-ss',
      timestamp,
      '-vframes',
      '1',
      '-y', // Overwrite output file if it exists
      outputPath,
    ];

    this.logger.log(
      `Creating thumbnail from ${inputPath} to ${outputPath} at ${timestamp}...`,
    );
    await this.runFfmpegCommand(args);
  }

  /**
   * Converts a video to a different format, e.g., MP4 to WebM.
   * @param inputPath Path to the video file.
   * @param outputPath Path where the converted video will be saved.
   */
  async convertToWebm(inputPath: string, outputPath: string): Promise<void> {
    const args = [
      '-i',
      inputPath,
      '-c:v',
      'libvpx-vp9',
      '-c:a',
      'libopus',
      '-y',
      outputPath,
    ];

    this.logger.log(`Converting video from ${inputPath} to ${outputPath}...`);
    await this.runFfmpegCommand(args);
  }

  /**
   * Trims a video between start and end time.
   * @param inputPath Path to the video file.
   * @param outputPath Path where the trimmed video will be saved.
   * @param startTime Start time (format: HH:MM:SS or seconds)
   * @param duration Duration to extract (format: HH:MM:SS or seconds)
   */
  async trimVideo(
    inputPath: string,
    outputPath: string,
    startTime: string,
    duration?: string,
  ): Promise<void> {
    const args = ['-i', inputPath, '-ss', startTime];

    if (duration) {
      args.push('-t', duration);
    }

    args.push('-c', 'copy', '-y', outputPath);

    this.logger.log(
      `Trimming video from ${inputPath} starting at ${startTime}${duration ? ` for ${duration}` : ''}...`,
    );
    await this.runFfmpegCommand(args);
  }

  /**
   * Rotates a video by specified degrees.
   * @param inputPath Path to the video file.
   * @param outputPath Path where the rotated video will be saved.
   * @param rotation Rotation angle (90, 180, 270)
   */
  async rotateVideo(
    inputPath: string,
    outputPath: string,
    rotation: 90 | 180 | 270,
  ): Promise<void> {
    // FFmpeg transpose values:
    // 1 = 90 clockwise
    // 2 = 90 counter-clockwise
    // 3 = 90 clockwise and flip vertical (180)
    let transposeValue: string;
    if (rotation === 90) {
      transposeValue = '1';
    } else if (rotation === 270) {
      transposeValue = '2';
    } else {
      // 180 degrees
      transposeValue = '2,transpose=2';
    }

    const args = [
      '-i',
      inputPath,
      '-vf',
      `transpose=${transposeValue}`,
      '-c:a',
      'copy',
      '-y',
      outputPath,
    ];

    this.logger.log(`Rotating video ${inputPath} by ${rotation} degrees...`);
    await this.runFfmpegCommand(args);
  }

  /**
   * Changes video playback speed.
   * @param inputPath Path to the video file.
   * @param outputPath Path where the output video will be saved.
   * @param speed Speed multiplier (0.25-4.0, where 1.0 is normal speed)
   */
  async changeSpeed(
    inputPath: string,
    outputPath: string,
    speed: number,
  ): Promise<void> {
    const videoSpeed = 1 / speed;
    const audioSpeed = speed;

    const args = [
      '-i',
      inputPath,
      '-filter_complex',
      `[0:v]setpts=${videoSpeed}*PTS[v];[0:a]atempo=${audioSpeed}[a]`,
      '-map',
      '[v]',
      '-map',
      '[a]',
      '-y',
      outputPath,
    ];

    this.logger.log(`Changing video speed to ${speed}x...`);
    await this.runFfmpegCommand(args);
  }

  /**
   * Extracts audio from video.
   * @param inputPath Path to the video file.
   * @param outputPath Path where the audio will be saved.
   * @param format Audio format (mp3, aac, wav)
   */
  async extractAudio(
    inputPath: string,
    outputPath: string,
    format: 'mp3' | 'aac' | 'wav' = 'mp3',
  ): Promise<void> {
    const codecMap = {
      mp3: 'libmp3lame',
      aac: 'aac',
      wav: 'pcm_s16le',
    };

    const args = [
      '-i',
      inputPath,
      '-vn',
      '-acodec',
      codecMap[format],
      '-y',
      outputPath,
    ];

    this.logger.log(`Extracting audio from ${inputPath} as ${format}...`);
    await this.runFfmpegCommand(args);
  }

  /**
   * Creates multiple thumbnails at different timestamps.
   * @param inputPath Path to the video file.
   * @param outputDir Directory where thumbnails will be saved.
   * @param timestamps Array of timestamps (format: HH:MM:SS or seconds)
   * @param baseFilename Base filename for thumbnails
   */
  async createMultipleThumbnails(
    inputPath: string,
    outputDir: string,
    timestamps: string[],
    baseFilename: string = 'thumbnail',
  ): Promise<string[]> {
    const thumbnailPaths: string[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      const outputPath = `${outputDir}/${baseFilename}-${i + 1}.png`;
      await this.createThumbnail(inputPath, outputPath, timestamps[i]);
      thumbnailPaths.push(outputPath);
    }

    return thumbnailPaths;
  }

  /**
   * Adds text watermark to video.
   * @param inputPath Path to the video file.
   * @param outputPath Path where the watermarked video will be saved.
   * @param text Watermark text
   * @param position Position (top-left, top-right, bottom-left, bottom-right, center)
   */
  async addTextWatermark(
    inputPath: string,
    outputPath: string,
    text: string,
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' = 'bottom-right',
  ): Promise<void> {
    const positionMap = {
      'top-left': 'x=10:y=10',
      'top-right': 'x=w-tw-10:y=10',
      'bottom-left': 'x=10:y=h-th-10',
      'bottom-right': 'x=w-tw-10:y=h-th-10',
      'center': 'x=(w-tw)/2:y=(h-th)/2',
    };

    const args = [
      '-i',
      inputPath,
      '-vf',
      `drawtext=text='${text}':fontcolor=white:fontsize=24:${positionMap[position]}`,
      '-c:a',
      'copy',
      '-y',
      outputPath,
    ];

    this.logger.log(`Adding text watermark "${text}" to video...`);
    await this.runFfmpegCommand(args);
  }

  /**
   * Generates video in multiple qualities.
   * @param inputPath Path to the video file.
   * @param outputDir Directory where output files will be saved.
   * @param baseFilename Base filename for outputs
   * @param qualities Array of quality presets
   */
  async generateMultipleQualities(
    inputPath: string,
    outputDir: string,
    baseFilename: string,
    qualities: Array<{ label: string; width: number; bitrate: string }>,
  ): Promise<Array<{ label: string; path: string }>> {
    const outputs: Array<{ label: string; path: string }> = [];

    for (const quality of qualities) {
      const outputPath = `${outputDir}/${baseFilename}-${quality.label}.mp4`;
      const args = [
        '-i',
        inputPath,
        '-vf',
        `scale=${quality.width}:-2`,
        '-c:v',
        'libx264',
        '-b:v',
        quality.bitrate,
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        '-y',
        outputPath,
      ];

      this.logger.log(
        `Generating ${quality.label} quality (${quality.width}p) video...`,
      );
      await this.runFfmpegCommand(args);
      outputs.push({ label: quality.label, path: outputPath });
    }

    return outputs;
  }

  /**
   * Deletes a file.
   * @param filePath Path to the file to delete.
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await unlink(filePath);
      this.logger.log(`File deleted: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Gets the local file path for a media by ID.
   * Downloads from cloud storage if necessary.
   * @param mediaId Media ID
   * @returns Local file path
   */
  async getLocalFilePath(mediaId: string): Promise<string> {
    const media = await this.mediaService.findOne(mediaId);
    
    if (!media) {
      throw new NotFoundException(`Media with ID ${mediaId} not found`);
    }

    // Check if file is stored locally
    if (media.path && existsSync(media.path)) {
      return media.path;
    }

    // If file has a local path but doesn't exist, try constructing full path
    if (media.path) {
      const fullPath = join(process.cwd(), media.path);
      if (existsSync(fullPath)) {
        return fullPath;
      }
    }

    // If publicUrl exists, we need to download it temporarily
    // For cloud storage, we'll need to download it
    // TODO: Implement cloud download logic when needed
    throw new NotFoundException(
      `Local file not found for media ${mediaId}. Cloud download not yet implemented.`,
    );
  }

  /**
   * Creates a new media entry for a processed video.
   */
  async createProcessedMediaEntry(
    originalMediaId: string,
    processedFilePath: string,
    processingType: string,
    userId: string,
    folderId?: string,
  ): Promise<any> {
    const originalMedia = await this.mediaService.findOne(originalMediaId);
    
    // Get the original media from database to access folderId
    const originalMediaDb = await this.prisma.media.findUnique({
      where: { id: originalMediaId },
    });
    
    const fs = require('fs');
    const stats = fs.statSync(processedFilePath);

    const fileName = processedFilePath.split('/').pop();
    const publicUrl = processedFilePath.replace('./uploads/', '/uploads/');

    return this.prisma.media.create({
      data: {
        originalName: `${processingType}-${originalMedia.originalName}`,
        storedFileName: fileName,
        mimeType: originalMedia.mimeType,
        fileSize: stats.size,
        filePath: processedFilePath,
        publicUrl: publicUrl,
        mediaType: 'VIDEO',
        width: originalMedia.width,
        height: originalMedia.height,
        metadata: {
          processedFrom: originalMediaId,
          processingType,
          originalMetadata: originalMedia.metadata,
        },
        uploadedBy: userId,
        folderId: folderId || originalMediaDb?.folderId,
        isPublic: originalMedia.isPublic,
        status: 'COMPLETED',
        title: `${processingType} - ${originalMedia.title || originalMedia.originalName}`,
        description: `Processed video (${processingType}) from ${originalMedia.originalName}`,
      },
    });
  }

  /**
   * Concatenates multiple videos into a single video.
   * @param inputPaths Array of paths to video files to concatenate
   * @param outputPath Path where the merged video will be saved
   */
  async concatenateVideos(
    inputPaths: string[],
    outputPath: string,
  ): Promise<void> {
    if (inputPaths.length < 2) {
      throw new Error('At least 2 videos are required for concatenation');
    }

    // Create a temporary file list for FFmpeg concat demuxer
    const fs = require('fs');
    const { writeFile, unlink } = require('fs/promises');
    const tmpListPath = join(process.cwd(), 'temp', `concat-${Date.now()}.txt`);
    
    // Ensure temp directory exists
    const tempDir = join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Create file list content
    const fileList = inputPaths.map(path => `file '${path}'`).join('\n');
    await writeFile(tmpListPath, fileList);

    try {
      const args = [
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        tmpListPath,
        '-c',
        'copy',
        '-y',
        outputPath,
      ];

      this.logger.log(`Concatenating ${inputPaths.length} videos...`);
      await this.runFfmpegCommand(args);
    } finally {
      // Clean up temp file
      try {
        await unlink(tmpListPath);
      } catch (error) {
        this.logger.warn(`Failed to delete temp file ${tmpListPath}`);
      }
    }
  }

  /**
   * Converts video to different formats (AVI, MOV, MKV to MP4).
   * @param inputPath Path to the video file
   * @param outputPath Path where the converted video will be saved
   * @param targetFormat Target format (mp4, avi, mov, mkv)
   * @param hwAccel Optional hardware acceleration type
   */
  async convertFormat(
    inputPath: string,
    outputPath: string,
    targetFormat: 'mp4' | 'avi' | 'mov' | 'mkv',
    hwAccel?: 'nvenc' | 'videotoolbox' | 'vaapi',
  ): Promise<void> {
    const args = ['-i', inputPath];

    // Add hardware acceleration if specified
    if (hwAccel) {
      this.addHardwareAcceleration(args, hwAccel);
    }

    // Set codec based on target format
    switch (targetFormat) {
      case 'mp4':
        args.push('-c:v', hwAccel ? this.getHwEncoder(hwAccel) : 'libx264');
        args.push('-c:a', 'aac');
        args.push('-movflags', '+faststart');
        break;
      case 'avi':
        args.push('-c:v', 'mpeg4');
        args.push('-c:a', 'libmp3lame');
        break;
      case 'mov':
        args.push('-c:v', hwAccel ? this.getHwEncoder(hwAccel) : 'libx264');
        args.push('-c:a', 'aac');
        break;
      case 'mkv':
        args.push('-c:v', hwAccel ? this.getHwEncoder(hwAccel) : 'libx264');
        args.push('-c:a', 'aac');
        break;
    }

    args.push('-y', outputPath);

    this.logger.log(
      `Converting video to ${targetFormat.toUpperCase()}${hwAccel ? ` with ${hwAccel}` : ''}...`,
    );
    await this.runFfmpegCommand(args);
  }

  /**
   * Adds hardware acceleration options to FFmpeg arguments.
   * @param args FFmpeg arguments array
   * @param hwAccel Hardware acceleration type
   */
  private addHardwareAcceleration(
    args: string[],
    hwAccel: 'nvenc' | 'videotoolbox' | 'vaapi',
  ): void {
    switch (hwAccel) {
      case 'nvenc':
        args.push('-hwaccel', 'cuda');
        args.push('-hwaccel_output_format', 'cuda');
        break;
      case 'videotoolbox':
        args.push('-hwaccel', 'videotoolbox');
        break;
      case 'vaapi':
        args.push('-hwaccel', 'vaapi');
        args.push('-hwaccel_device', '/dev/dri/renderD128');
        args.push('-hwaccel_output_format', 'vaapi');
        break;
    }
  }

  /**
   * Gets the appropriate hardware encoder for the acceleration type.
   * @param hwAccel Hardware acceleration type
   * @returns Encoder name
   */
  private getHwEncoder(hwAccel: 'nvenc' | 'videotoolbox' | 'vaapi'): string {
    switch (hwAccel) {
      case 'nvenc':
        return 'h264_nvenc';
      case 'videotoolbox':
        return 'h264_videotoolbox';
      case 'vaapi':
        return 'h264_vaapi';
    }
  }

  /**
   * Compresses video with configurable bitrate mode.
   * @param inputPath Path to the input video file
   * @param outputPath Path where the compressed video will be saved
   * @param bitrateMode Bitrate mode (CBR, VBR, ABR)
   * @param bitrate Target bitrate
   * @param crf Quality setting for VBR mode
   */
  async compressWithBitrateMode(
    inputPath: string,
    outputPath: string,
    bitrateMode: 'cbr' | 'vbr' | 'abr',
    bitrate: string,
    crf?: number,
  ): Promise<void> {
    const args = ['-i', inputPath, '-c:v', 'libx264'];

    switch (bitrateMode) {
      case 'cbr':
        // Constant Bitrate - consistent bitrate throughout
        args.push('-b:v', bitrate);
        args.push('-minrate', bitrate);
        args.push('-maxrate', bitrate);
        args.push('-bufsize', `${parseInt(bitrate) * 2}k`);
        break;
      case 'vbr':
        // Variable Bitrate - quality-based encoding
        args.push('-crf', (crf || 23).toString());
        args.push('-maxrate', bitrate);
        args.push('-bufsize', `${parseInt(bitrate) * 2}k`);
        break;
      case 'abr':
        // Average Bitrate - target average bitrate
        args.push('-b:v', bitrate);
        break;
    }

    args.push('-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', '-y', outputPath);

    this.logger.log(
      `Compressing video with ${bitrateMode.toUpperCase()} mode at ${bitrate}...`,
    );
    await this.runFfmpegCommand(args);
  }

  /**
   * Two-pass encoding for better quality.
   * @param inputPath Path to the input video file
   * @param outputPath Path where the output video will be saved
   * @param bitrate Target bitrate
   * @param resolution Optional resolution (e.g., '1920x1080')
   */
  async twoPassEncode(
    inputPath: string,
    outputPath: string,
    bitrate: string,
    resolution?: string,
  ): Promise<void> {
    const logFile = join(process.cwd(), 'temp', `ffmpeg2pass-${Date.now()}`);
    
    // Ensure temp directory exists
    const fs = require('fs');
    const tempDir = join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // First pass
    const pass1Args = [
      '-i',
      inputPath,
      '-c:v',
      'libx264',
      '-b:v',
      bitrate,
      '-pass',
      '1',
      '-passlogfile',
      logFile,
      '-an', // No audio in first pass
      '-f',
      'null',
    ];

    if (resolution) {
      pass1Args.push('-s', resolution);
    }

    pass1Args.push('/dev/null'); // Discard output

    this.logger.log('Starting first pass encoding...');
    await this.runFfmpegCommand(pass1Args);

    // Second pass
    const pass2Args = [
      '-i',
      inputPath,
      '-c:v',
      'libx264',
      '-b:v',
      bitrate,
      '-pass',
      '2',
      '-passlogfile',
      logFile,
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-movflags',
      '+faststart',
    ];

    if (resolution) {
      pass2Args.push('-s', resolution);
    }

    pass2Args.push('-y', outputPath);

    this.logger.log('Starting second pass encoding...');
    await this.runFfmpegCommand(pass2Args);

    // Clean up pass log files
    try {
      const { unlink } = require('fs/promises');
      await unlink(`${logFile}-0.log`);
      await unlink(`${logFile}-0.log.mbtree`);
    } catch (error) {
      this.logger.warn('Failed to clean up two-pass log files');
    }
  }

  /**
   * Detects and validates video resolution.
   * @param inputPath Path to the video file
   * @returns Video metadata including resolution
   */
  async detectVideoResolution(inputPath: string): Promise<{
    width: number;
    height: number;
    duration: number;
    bitrate: number;
    fps: number;
    codec: string;
    format: string;
  }> {
    return new Promise((resolve, reject) => {
      const args = [
        '-i',
        inputPath,
        '-hide_banner',
      ];

      const ffmpegProcess = spawn(this.ffmpegPath, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stderr = '';
      ffmpegProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpegProcess.on('close', () => {
        try {
          // Parse resolution
          const resolutionMatch = stderr.match(/(\d{2,5})x(\d{2,5})/);
          const width = resolutionMatch ? parseInt(resolutionMatch[1]) : 0;
          const height = resolutionMatch ? parseInt(resolutionMatch[2]) : 0;

          // Parse duration
          const durationMatch = stderr.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
          let duration = 0;
          if (durationMatch) {
            const hours = parseInt(durationMatch[1]);
            const minutes = parseInt(durationMatch[2]);
            const seconds = parseFloat(durationMatch[3]);
            duration = hours * 3600 + minutes * 60 + seconds;
          }

          // Parse bitrate
          const bitrateMatch = stderr.match(/bitrate: (\d+) kb\/s/);
          const bitrate = bitrateMatch ? parseInt(bitrateMatch[1]) : 0;

          // Parse FPS
          const fpsMatch = stderr.match(/(\d+\.?\d*) fps/);
          const fps = fpsMatch ? parseFloat(fpsMatch[1]) : 0;

          // Parse codec
          const codecMatch = stderr.match(/Video: (\w+)/);
          const codec = codecMatch ? codecMatch[1] : 'unknown';

          // Parse format
          const formatMatch = stderr.match(/Input #\d+, (\w+)/);
          const format = formatMatch ? formatMatch[1] : 'unknown';

          resolve({ width, height, duration, bitrate, fps, codec, format });
        } catch (error) {
          reject(new Error(`Failed to parse video metadata: ${error.message}`));
        }
      });

      ffmpegProcess.on('error', (err) => {
        reject(new Error(`Failed to probe video: ${err.message}`));
      });
    });
  }

  /**
   * Validates if video meets minimum requirements.
   * @param inputPath Path to the video file
   * @param minWidth Minimum width
   * @param minHeight Minimum height
   * @param maxDuration Maximum duration in seconds
   * @returns Validation result
   */
  async validateVideo(
    inputPath: string,
    minWidth?: number,
    minHeight?: number,
    maxDuration?: number,
  ): Promise<{ valid: boolean; errors: string[]; metadata: any }> {
    const errors: string[] = [];
    const metadata = await this.detectVideoResolution(inputPath);

    if (minWidth && metadata.width < minWidth) {
      errors.push(`Video width ${metadata.width}px is less than minimum ${minWidth}px`);
    }

    if (minHeight && metadata.height < minHeight) {
      errors.push(`Video height ${metadata.height}px is less than minimum ${minHeight}px`);
    }

    if (maxDuration && metadata.duration > maxDuration) {
      errors.push(
        `Video duration ${metadata.duration}s exceeds maximum ${maxDuration}s`,
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      metadata,
    };
  }
}

