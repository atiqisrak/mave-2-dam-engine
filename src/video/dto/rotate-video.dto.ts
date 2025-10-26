import { IsIn } from 'class-validator';

export class RotateVideoDto {
  @IsIn([90, 180, 270])
  rotation: 90 | 180 | 270;
}

