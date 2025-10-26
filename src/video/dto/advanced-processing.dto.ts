import { IsString, IsOptional, IsIn, IsNumber, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ConcatenateVideosDto {
  @IsArray()
  @IsString({ each: true })
  mediaIds: string[];

  @IsOptional()
  @IsString()
  folderId?: string;
}

export class ConvertFormatDto {
  @IsString()
  mediaId: string;

  @IsIn(['mp4', 'avi', 'mov', 'mkv'])
  targetFormat: 'mp4' | 'avi' | 'mov' | 'mkv';

  @IsOptional()
  @IsIn(['nvenc', 'videotoolbox', 'vaapi'])
  hwAccel?: 'nvenc' | 'videotoolbox' | 'vaapi';

  @IsOptional()
  @IsString()
  folderId?: string;
}

export class BitrateCompressDto {
  @IsString()
  mediaId: string;

  @IsIn(['cbr', 'vbr', 'abr'])
  bitrateMode: 'cbr' | 'vbr' | 'abr';

  @IsString()
  bitrate: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(18)
  @Max(51)
  crf?: number;

  @IsOptional()
  @IsString()
  folderId?: string;
}

export class TwoPassEncodeDto {
  @IsString()
  mediaId: string;

  @IsString()
  bitrate: string;

  @IsOptional()
  @IsString()
  resolution?: string;

  @IsOptional()
  @IsString()
  folderId?: string;
}

export class DetectResolutionDto {
  @IsString()
  mediaId: string;
}

export class ValidateVideoDto {
  @IsString()
  mediaId: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minWidth?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minHeight?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxDuration?: number;
}

