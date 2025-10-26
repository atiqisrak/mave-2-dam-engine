import { IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SpeedVideoDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0.25)
  @Max(4.0)
  speed: number;
}

