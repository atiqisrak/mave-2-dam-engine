import { IsString, IsOptional } from 'class-validator';

export class TrimVideoDto {
  @IsString()
  startTime: string; // Format: HH:MM:SS or seconds

  @IsOptional()
  @IsString()
  duration?: string; // Format: HH:MM:SS or seconds
}

