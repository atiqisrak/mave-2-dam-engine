import { IsString, IsOptional, IsIn, IsNumber, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class OptimizeByIdDto {
  @IsString()
  mediaId: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(18)
  @Max(51)
  crf?: number = 28;

  @IsOptional()
  @IsString()
  audioBitrate?: string = '128k';

  @IsOptional()
  @IsString()
  thumbnailTimestamp?: string = '00:00:01';

  @IsOptional()
  @IsString()
  folderId?: string; // Save processed video to this folder
}

export class TrimByIdDto {
  @IsString()
  mediaId: string;

  @IsString()
  startTime: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  folderId?: string;
}

export class RotateByIdDto {
  @IsString()
  mediaId: string;

  @IsIn([90, 180, 270])
  rotation: 90 | 180 | 270;

  @IsOptional()
  @IsString()
  folderId?: string;
}

export class SpeedByIdDto {
  @IsString()
  mediaId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.25)
  @Max(4.0)
  speed: number;

  @IsOptional()
  @IsString()
  folderId?: string;
}

export class ExtractAudioByIdDto {
  @IsString()
  mediaId: string;

  @IsOptional()
  @IsIn(['mp3', 'aac', 'wav'])
  format?: 'mp3' | 'aac' | 'wav' = 'mp3';

  @IsOptional()
  @IsString()
  folderId?: string;
}

export class WatermarkByIdDto {
  @IsString()
  mediaId: string;

  @IsString()
  text: string;

  @IsOptional()
  @IsIn(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'])
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' = 'bottom-right';

  @IsOptional()
  @IsString()
  folderId?: string;
}

export class MultipleThumbnailsByIdDto {
  @IsString()
  mediaId: string;

  @Type(() => String)
  @IsArray()
  @IsString({ each: true })
  timestamps: string[];

  @IsOptional()
  @IsString()
  folderId?: string;
}

export class MultiQualityByIdDto {
  @IsString()
  mediaId: string;

  @IsOptional()
  @IsString()
  folderId?: string;
}

export class ConvertToWebmByIdDto {
  @IsString()
  mediaId: string;

  @IsOptional()
  @IsString()
  folderId?: string;
}

