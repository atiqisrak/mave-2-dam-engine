import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class OptimizeVideoDto {
  @IsOptional()
  @IsNumber()
  @Min(18)
  @Max(51)
  crf?: number = 28; // Quality setting (lower = better quality, larger file)

  @IsOptional()
  @IsString()
  audioBitrate?: string = '128k';

  @IsOptional()
  @IsString()
  thumbnailTimestamp?: string = '00:00:01';
}

