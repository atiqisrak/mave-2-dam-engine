import { IsArray, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class MultipleThumbnailsDto {
  @Type(() => String)
  @IsArray()
  @IsString({ each: true })
  timestamps: string[]; // Array of timestamps (HH:MM:SS or seconds)
}

