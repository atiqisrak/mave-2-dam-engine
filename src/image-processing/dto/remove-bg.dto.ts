import { IsOptional, IsString, IsBoolean, IsNumber, IsIn, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class RemoveBgDto {
  @ApiProperty({ 
    description: 'Output size', 
    enum: ['auto', 'preview', 'small', 'regular', 'medium', 'hd', 'full', '4k', '50MP'],
    default: 'auto',
    required: false 
  })
  @IsOptional()
  @IsIn(['auto', 'preview', 'small', 'regular', 'medium', 'hd', 'full', '4k', '50MP'])
  size?: 'auto' | 'preview' | 'small' | 'regular' | 'medium' | 'hd' | 'full' | '4k' | '50MP';

  @ApiProperty({ 
    description: 'Output format', 
    enum: ['png', 'jpg', 'zip'],
    default: 'png',
    required: false 
  })
  @IsOptional()
  @IsIn(['png', 'jpg', 'zip'])
  format?: 'png' | 'jpg' | 'zip';

  @ApiProperty({ 
    description: 'Image type for better processing', 
    enum: ['auto', 'person', 'product', 'car', 'animal', 'graphic', 'transportation'],
    default: 'auto',
    required: false 
  })
  @IsOptional()
  @IsIn(['auto', 'person', 'product', 'car', 'animal', 'graphic', 'transportation'])
  type?: 'auto' | 'person' | 'product' | 'car' | 'animal' | 'graphic' | 'transportation';

  @ApiProperty({ 
    description: 'Type level for processing', 
    enum: ['none', '1', '2', 'latest'],
    default: 'none',
    required: false 
  })
  @IsOptional()
  @IsIn(['none', '1', '2', 'latest'])
  typeLevel?: 'none' | '1' | '2' | 'latest';

  @ApiProperty({ 
    description: 'Crop empty regions', 
    default: false,
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  @IsBoolean()
  crop?: boolean;

  @ApiProperty({ 
    description: 'Crop margin in pixels', 
    minimum: 0,
    maximum: 100,
    default: 0,
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  cropMargin?: number;

  @ApiProperty({ 
    description: 'Scale factor', 
    minimum: 0.1,
    maximum: 10,
    default: 1,
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(10)
  scale?: number;

  @ApiProperty({ 
    description: 'Position of foreground', 
    enum: ['center', 'original'],
    default: 'center',
    required: false 
  })
  @IsOptional()
  @IsIn(['center', 'original'])
  position?: 'center' | 'original';

  @ApiProperty({ 
    description: 'Output channels', 
    enum: ['rgba', 'alpha'],
    default: 'rgba',
    required: false 
  })
  @IsOptional()
  @IsIn(['rgba', 'alpha'])
  channels?: 'rgba' | 'alpha';

  @ApiProperty({ 
    description: 'Add shadow to result', 
    default: false,
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  @IsBoolean()
  addShadow?: boolean;

  @ApiProperty({ 
    description: 'Enable semitransparency', 
    default: false,
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  @IsBoolean()
  semitransparency?: boolean;

  @ApiProperty({ 
    description: 'Background color (hex)', 
    example: '#ffffff',
    required: false 
  })
  @IsOptional()
  @IsString()
  bgColor?: string;

  @ApiProperty({ 
    description: 'Background image URL', 
    required: false 
  })
  @IsOptional()
  @IsString()
  bgImageUrl?: string;

  @ApiProperty({ 
    description: 'Region of interest (x,y,width,height)', 
    example: '100,100,200,200',
    required: false 
  })
  @IsOptional()
  @IsString()
  roi?: string;

  @ApiProperty({ 
    description: 'Region of interest percentage (x%,y%,width%,height%)', 
    example: '10%,10%,80%,80%',
    required: false 
  })
  @IsOptional()
  @IsString()
  roiPct?: string;

  @ApiProperty({ 
    description: 'Shadow type', 
    enum: ['outer', 'inner', 'drop'],
    default: 'outer',
    required: false 
  })
  @IsOptional()
  @IsIn(['outer', 'inner', 'drop'])
  shadowType?: 'outer' | 'inner' | 'drop';

  @ApiProperty({ 
    description: 'Shadow opacity', 
    minimum: 0,
    maximum: 1,
    default: 0.5,
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  shadowOpacity?: number;

  @ApiProperty({ 
    description: 'Expiration date for processed media', 
    required: false 
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty({ 
    description: 'Expiration days for processed media', 
    minimum: 1,
    maximum: 365,
    default: 1,
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : 1)
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(365)
  expiryDays?: number;
}

export class RemoveBgFromUrlDto {
  @ApiProperty({ 
    description: 'Image URL to process', 
    example: 'https://example.com/image.jpg',
    required: true 
  })
  @IsString()
  imageUrl: string;

  @ApiProperty({ 
    description: 'Output size', 
    enum: ['auto', 'preview', 'small', 'regular', 'medium', 'hd', 'full', '4k', '50MP'],
    default: 'auto',
    required: false 
  })
  @IsOptional()
  @IsIn(['auto', 'preview', 'small', 'regular', 'medium', 'hd', 'full', '4k', '50MP'])
  size?: 'auto' | 'preview' | 'small' | 'regular' | 'medium' | 'hd' | 'full' | '4k' | '50MP';

  @ApiProperty({ 
    description: 'Output format', 
    enum: ['png', 'jpg', 'zip'],
    default: 'png',
    required: false 
  })
  @IsOptional()
  @IsIn(['png', 'jpg', 'zip'])
  format?: 'png' | 'jpg' | 'zip';

  @ApiProperty({ 
    description: 'Image type for better processing', 
    enum: ['auto', 'person', 'product', 'car', 'animal', 'graphic', 'transportation'],
    default: 'auto',
    required: false 
  })
  @IsOptional()
  @IsIn(['auto', 'person', 'product', 'car', 'animal', 'graphic', 'transportation'])
  type?: 'auto' | 'person' | 'product' | 'car' | 'animal' | 'graphic' | 'transportation';

  @ApiProperty({ 
    description: 'Type level for processing', 
    enum: ['none', '1', '2', 'latest'],
    default: 'none',
    required: false 
  })
  @IsOptional()
  @IsIn(['none', '1', '2', 'latest'])
  typeLevel?: 'none' | '1' | '2' | 'latest';

  @ApiProperty({ 
    description: 'Crop empty regions', 
    default: false,
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  @IsBoolean()
  crop?: boolean;

  @ApiProperty({ 
    description: 'Crop margin in pixels', 
    minimum: 0,
    maximum: 100,
    default: 0,
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  cropMargin?: number;

  @ApiProperty({ 
    description: 'Scale factor', 
    minimum: 0.1,
    maximum: 10,
    default: 1,
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(10)
  scale?: number;

  @ApiProperty({ 
    description: 'Position of foreground', 
    enum: ['center', 'original'],
    default: 'center',
    required: false 
  })
  @IsOptional()
  @IsIn(['center', 'original'])
  position?: 'center' | 'original';

  @ApiProperty({ 
    description: 'Output channels', 
    enum: ['rgba', 'alpha'],
    default: 'rgba',
    required: false 
  })
  @IsOptional()
  @IsIn(['rgba', 'alpha'])
  channels?: 'rgba' | 'alpha';

  @ApiProperty({ 
    description: 'Add shadow to result', 
    default: false,
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  @IsBoolean()
  addShadow?: boolean;

  @ApiProperty({ 
    description: 'Enable semitransparency', 
    default: false,
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  @IsBoolean()
  semitransparency?: boolean;

  @ApiProperty({ 
    description: 'Background color (hex)', 
    example: '#ffffff',
    required: false 
  })
  @IsOptional()
  @IsString()
  bgColor?: string;

  @ApiProperty({ 
    description: 'Background image URL', 
    required: false 
  })
  @IsOptional()
  @IsString()
  bgImageUrl?: string;

  @ApiProperty({ 
    description: 'Region of interest (x,y,width,height)', 
    example: '100,100,200,200',
    required: false 
  })
  @IsOptional()
  @IsString()
  roi?: string;

  @ApiProperty({ 
    description: 'Region of interest percentage (x%,y%,width%,height%)', 
    example: '10%,10%,80%,80%',
    required: false 
  })
  @IsOptional()
  @IsString()
  roiPct?: string;

  @ApiProperty({ 
    description: 'Shadow type', 
    enum: ['outer', 'inner', 'drop'],
    default: 'outer',
    required: false 
  })
  @IsOptional()
  @IsIn(['outer', 'inner', 'drop'])
  shadowType?: 'outer' | 'inner' | 'drop';

  @ApiProperty({ 
    description: 'Shadow opacity', 
    minimum: 0,
    maximum: 1,
    default: 0.5,
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  shadowOpacity?: number;

  @ApiProperty({ 
    description: 'Expiration date for processed media', 
    required: false 
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty({ 
    description: 'Expiration days for processed media', 
    minimum: 1,
    maximum: 365,
    default: 1,
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : 1)
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(365)
  expiryDays?: number;
}

export class RemoveBgFromMediaIdDto {
  @ApiProperty({ 
    description: 'Output size', 
    enum: ['auto', 'preview', 'small', 'regular', 'medium', 'hd', 'full', '4k', '50MP'],
    default: 'auto',
    required: false 
  })
  @IsOptional()
  @IsIn(['auto', 'preview', 'small', 'regular', 'medium', 'hd', 'full', '4k', '50MP'])
  size?: 'auto' | 'preview' | 'small' | 'regular' | 'medium' | 'hd' | 'full' | '4k' | '50MP';

  @ApiProperty({ 
    description: 'Output format', 
    enum: ['png', 'jpg', 'zip'],
    default: 'png',
    required: false 
  })
  @IsOptional()
  @IsIn(['png', 'jpg', 'zip'])
  format?: 'png' | 'jpg' | 'zip';

  @ApiProperty({ 
    description: 'Image type for better processing', 
    enum: ['auto', 'person', 'product', 'car', 'animal', 'graphic', 'transportation'],
    default: 'auto',
    required: false 
  })
  @IsOptional()
  @IsIn(['auto', 'person', 'product', 'car', 'animal', 'graphic', 'transportation'])
  type?: 'auto' | 'person' | 'product' | 'car' | 'animal' | 'graphic' | 'transportation';

  @ApiProperty({ 
    description: 'Type level for processing', 
    enum: ['none', '1', '2', 'latest'],
    default: 'none',
    required: false 
  })
  @IsOptional()
  @IsIn(['none', '1', '2', 'latest'])
  typeLevel?: 'none' | '1' | '2' | 'latest';

  @ApiProperty({ 
    description: 'Crop empty regions', 
    default: false,
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  @IsBoolean()
  crop?: boolean;

  @ApiProperty({ 
    description: 'Crop margin in pixels', 
    minimum: 0,
    maximum: 100,
    default: 0,
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  cropMargin?: number;

  @ApiProperty({ 
    description: 'Scale factor', 
    minimum: 0.1,
    maximum: 10,
    default: 1,
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(10)
  scale?: number;

  @ApiProperty({ 
    description: 'Position of foreground', 
    enum: ['center', 'original'],
    default: 'center',
    required: false 
  })
  @IsOptional()
  @IsIn(['center', 'original'])
  position?: 'center' | 'original';

  @ApiProperty({ 
    description: 'Output channels', 
    enum: ['rgba', 'alpha'],
    default: 'rgba',
    required: false 
  })
  @IsOptional()
  @IsIn(['rgba', 'alpha'])
  channels?: 'rgba' | 'alpha';

  @ApiProperty({ 
    description: 'Add shadow to result', 
    default: false,
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  @IsBoolean()
  addShadow?: boolean;

  @ApiProperty({ 
    description: 'Enable semitransparency', 
    default: false,
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  @IsBoolean()
  semitransparency?: boolean;

  @ApiProperty({ 
    description: 'Background color (hex)', 
    example: '#ffffff',
    required: false 
  })
  @IsOptional()
  @IsString()
  bgColor?: string;

  @ApiProperty({ 
    description: 'Background image URL', 
    required: false 
  })
  @IsOptional()
  @IsString()
  bgImageUrl?: string;

  @ApiProperty({ 
    description: 'Region of interest (x,y,width,height)', 
    example: '100,100,200,200',
    required: false 
  })
  @IsOptional()
  @IsString()
  roi?: string;

  @ApiProperty({ 
    description: 'Region of interest percentage (x%,y%,width%,height%)', 
    example: '10%,10%,80%,80%',
    required: false 
  })
  @IsOptional()
  @IsString()
  roiPct?: string;

  @ApiProperty({ 
    description: 'Shadow type', 
    enum: ['outer', 'inner', 'drop'],
    default: 'outer',
    required: false 
  })
  @IsOptional()
  @IsIn(['outer', 'inner', 'drop'])
  shadowType?: 'outer' | 'inner' | 'drop';

  @ApiProperty({ 
    description: 'Shadow opacity', 
    minimum: 0,
    maximum: 1,
    default: 0.5,
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  shadowOpacity?: number;

  @ApiProperty({ 
    description: 'Expiration date for processed media', 
    required: false 
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty({ 
    description: 'Expiration days for processed media', 
    minimum: 1,
    maximum: 365,
    default: 1,
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : 1)
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(365)
  expiryDays?: number;
}