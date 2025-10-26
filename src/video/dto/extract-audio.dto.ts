import { IsIn, IsOptional } from 'class-validator';

export class ExtractAudioDto {
  @IsOptional()
  @IsIn(['mp3', 'aac', 'wav'])
  format?: 'mp3' | 'aac' | 'wav' = 'mp3';
}

