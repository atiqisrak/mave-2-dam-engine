import { IsString, IsOptional, IsIn } from 'class-validator';

export class WatermarkDto {
  @IsString()
  text: string;

  @IsOptional()
  @IsIn(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'])
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' = 'bottom-right';
}

