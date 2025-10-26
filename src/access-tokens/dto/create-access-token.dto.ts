import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsDateString, IsOptional, IsEnum } from 'class-validator';

export class CreateAccessTokenDto {
  @ApiProperty({ description: 'Human-readable name for the token' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Token description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Array of permissions', 
    type: [String],
    example: ['read', 'write']
  })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];

  @ApiProperty({ description: 'Token expiration date' })
  @IsDateString()
  expiresAt: string;
}
