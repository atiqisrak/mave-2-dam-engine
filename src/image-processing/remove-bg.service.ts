import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UnifiedConfigService } from '../config/unified-config.service';
import * as FormData from 'form-data';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface RemoveBgOptions {
  size?: 'auto' | 'preview' | 'small' | 'regular' | 'medium' | 'hd' | 'full' | '4k' | '50MP';
  format?: 'png' | 'jpg' | 'zip';
  type?: 'auto' | 'person' | 'product' | 'car' | 'animal' | 'graphic' | 'transportation';
  typeLevel?: 'none' | '1' | '2' | 'latest';
  crop?: boolean;
  cropMargin?: number;
  scale?: number;
  position?: 'center' | 'original';
  channels?: 'rgba' | 'alpha';
  addShadow?: boolean;
  semitransparency?: boolean;
  bgColor?: string;
  bgImageUrl?: string;
  bgImageFile?: string;
  roi?: string;
  roiPct?: string;
  shadowType?: 'outer' | 'inner' | 'drop';
  shadowOpacity?: number;
}

export interface RemoveBgResult {
  success: boolean;
  imageBuffer: Buffer;
  creditsCharged?: number;
  foregroundTop?: number;
  foregroundLeft?: number;
  foregroundWidth?: number;
  foregroundHeight?: number;
  type?: string;
}

@Injectable()
export class RemoveBgService {
  private readonly logger = new Logger(RemoveBgService.name);
  private readonly apiUrl = 'https://api.remove.bg/v1.0/removebg';

  constructor(
    private readonly configService: ConfigService,
    private readonly unifiedConfigService: UnifiedConfigService,
  ) {}

  /**
   * Remove background from image using remove.bg API
   */
  async removeBackground(
    imageBuffer: Buffer,
    options: RemoveBgOptions = {},
  ): Promise<RemoveBgResult> {
    try {
      const apiKey = this.unifiedConfigService.getConfig().removeBgApiKey;
      
      if (!apiKey) {
        throw new BadRequestException('Remove.bg API key not configured');
      }

      const formData = new FormData();
      
      // Add image file
      formData.append('image_file', imageBuffer, {
        filename: 'image.jpg',
        contentType: 'image/jpeg',
      });

      // Add options
      formData.append('size', options.size || 'auto');
      
      if (options.format) {
        formData.append('format', options.format);
      }
      
      if (options.type) {
        formData.append('type', options.type);
      }
      
      if (options.typeLevel) {
        formData.append('type_level', options.typeLevel);
      }
      
      if (options.crop !== undefined) {
        formData.append('crop', options.crop.toString());
      }
      
      if (options.cropMargin !== undefined) {
        formData.append('crop_margin', options.cropMargin.toString());
      }
      
      if (options.scale !== undefined) {
        formData.append('scale', options.scale.toString());
      }
      
      if (options.position) {
        formData.append('position', options.position);
      }
      
      if (options.channels) {
        formData.append('channels', options.channels);
      }
      
      if (options.addShadow !== undefined) {
        formData.append('add_shadow', options.addShadow.toString());
      }
      
      if (options.semitransparency !== undefined) {
        formData.append('semitransparency', options.semitransparency.toString());
      }
      
      if (options.bgColor) {
        formData.append('bg_color', options.bgColor);
      }
      
      if (options.bgImageUrl) {
        formData.append('bg_image_url', options.bgImageUrl);
      }
      
      if (options.roi) {
        formData.append('roi', options.roi);
      }
      
      if (options.roiPct) {
        formData.append('roi_pct', options.roiPct);
      }
      
      if (options.shadowType) {
        formData.append('shadow_type', options.shadowType);
      }
      
      if (options.shadowOpacity !== undefined) {
        formData.append('shadow_opacity', options.shadowOpacity.toString());
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
          ...formData.getHeaders(),
        },
        body: formData as any,
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Remove.bg API error: ${response.status} - ${errorText}`);
        throw new BadRequestException(`Remove.bg API error: ${response.status} - ${errorText}`);
      }

      const resultBuffer = Buffer.from(await response.arrayBuffer());
      
      // Extract metadata from response headers
      const creditsCharged = response.headers.get('X-Credits-Charged');
      const foregroundTop = response.headers.get('X-Foreground-Top');
      const foregroundLeft = response.headers.get('X-Foreground-Left');
      const foregroundWidth = response.headers.get('X-Foreground-Width');
      const foregroundHeight = response.headers.get('X-Foreground-Height');
      const type = response.headers.get('X-Type');

      return {
        success: true,
        imageBuffer: resultBuffer,
        creditsCharged: creditsCharged ? parseInt(creditsCharged) : undefined,
        foregroundTop: foregroundTop ? parseInt(foregroundTop) : undefined,
        foregroundLeft: foregroundLeft ? parseInt(foregroundLeft) : undefined,
        foregroundWidth: foregroundWidth ? parseInt(foregroundWidth) : undefined,
        foregroundHeight: foregroundHeight ? parseInt(foregroundHeight) : undefined,
        type: type || undefined,
      };
    } catch (error) {
      this.logger.error('Failed to remove background:', error);
      throw error;
    }
  }

  /**
   * Remove background from image file
   */
  async removeBackgroundFromFile(
    filePath: string,
    outputPath: string,
    options: RemoveBgOptions = {},
  ): Promise<{ path: string; size: number; result: RemoveBgResult }> {
    try {
      const imageBuffer = await fs.readFile(filePath);
      const result = await this.removeBackground(imageBuffer, options);
      
      // Ensure output directory exists
      await fs.ensureDir(path.dirname(outputPath));
      
      // Save result
      await fs.writeFile(outputPath, result.imageBuffer);
      
      const stats = await fs.stat(outputPath);
      
      return {
        path: outputPath,
        size: stats.size,
        result,
      };
    } catch (error) {
      this.logger.error(`Failed to remove background from file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Remove background from image URL
   */
  async removeBackgroundFromUrl(
    imageUrl: string,
    options: RemoveBgOptions = {},
  ): Promise<RemoveBgResult> {
    try {
      const apiKey = this.unifiedConfigService.getConfig().removeBgApiKey;
      
      if (!apiKey) {
        throw new BadRequestException('Remove.bg API key not configured');
      }

      const formData = new FormData();
      formData.append('image_url', imageUrl);
      formData.append('size', options.size || 'auto');
      
      if (options.format) {
        formData.append('format', options.format);
      }
      
      if (options.type) {
        formData.append('type', options.type);
      }
      
      if (options.typeLevel) {
        formData.append('type_level', options.typeLevel);
      }
      
      if (options.crop !== undefined) {
        formData.append('crop', options.crop.toString());
      }
      
      if (options.cropMargin !== undefined) {
        formData.append('crop_margin', options.cropMargin.toString());
      }
      
      if (options.scale !== undefined) {
        formData.append('scale', options.scale.toString());
      }
      
      if (options.position) {
        formData.append('position', options.position);
      }
      
      if (options.channels) {
        formData.append('channels', options.channels);
      }
      
      if (options.addShadow !== undefined) {
        formData.append('add_shadow', options.addShadow.toString());
      }
      
      if (options.semitransparency !== undefined) {
        formData.append('semitransparency', options.semitransparency.toString());
      }
      
      if (options.bgColor) {
        formData.append('bg_color', options.bgColor);
      }
      
      if (options.bgImageUrl) {
        formData.append('bg_image_url', options.bgImageUrl);
      }
      
      if (options.roi) {
        formData.append('roi', options.roi);
      }
      
      if (options.roiPct) {
        formData.append('roi_pct', options.roiPct);
      }
      
      if (options.shadowType) {
        formData.append('shadow_type', options.shadowType);
      }
      
      if (options.shadowOpacity !== undefined) {
        formData.append('shadow_opacity', options.shadowOpacity.toString());
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
          ...formData.getHeaders(),
        },
        body: formData as any,
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Remove.bg API error: ${response.status} - ${errorText}`);
        throw new BadRequestException(`Remove.bg API error: ${response.status} - ${errorText}`);
      }

      const resultBuffer = Buffer.from(await response.arrayBuffer());
      
      // Extract metadata from response headers
      const creditsCharged = response.headers.get('X-Credits-Charged');
      const foregroundTop = response.headers.get('X-Foreground-Top');
      const foregroundLeft = response.headers.get('X-Foreground-Left');
      const foregroundWidth = response.headers.get('X-Foreground-Width');
      const foregroundHeight = response.headers.get('X-Foreground-Height');
      const type = response.headers.get('X-Type');

      return {
        success: true,
        imageBuffer: resultBuffer,
        creditsCharged: creditsCharged ? parseInt(creditsCharged) : undefined,
        foregroundTop: foregroundTop ? parseInt(foregroundTop) : undefined,
        foregroundLeft: foregroundLeft ? parseInt(foregroundLeft) : undefined,
        foregroundWidth: foregroundWidth ? parseInt(foregroundWidth) : undefined,
        foregroundHeight: foregroundHeight ? parseInt(foregroundHeight) : undefined,
        type: type || undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to remove background from URL ${imageUrl}:`, error);
      throw error;
    }
  }

  /**
   * Get account information and credit balance
   */
  async getAccountInfo(): Promise<{
    credits: number;
    enterpriseCredits?: number;
    apiCalls: number;
    apiCallsRemaining: number;
  }> {
    try {
      const apiKey = this.unifiedConfigService.getConfig().removeBgApiKey;
      
      if (!apiKey) {
        throw new BadRequestException('Remove.bg API key not configured');
      }

      const response = await fetch('https://api.remove.bg/v1.0/account', {
        method: 'GET',
        headers: {
          'X-Api-Key': apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Remove.bg account API error: ${response.status} - ${errorText}`);
        throw new BadRequestException(`Remove.bg account API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      return {
        credits: data.data.attributes.credits,
        enterpriseCredits: data.data.attributes.enterprise_credits,
        apiCalls: data.data.attributes.api_calls,
        apiCallsRemaining: data.data.attributes.api_calls_remaining,
      };
    } catch (error) {
      this.logger.error('Failed to get account info:', error);
      throw error;
    }
  }
}
