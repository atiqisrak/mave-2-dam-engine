import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'User email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'User password (minimum 6 characters)' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ description: 'User role', enum: ['USER', 'ADMIN', 'MODERATOR'] })
  @IsOptional()
  @IsEnum(['USER', 'ADMIN', 'MODERATOR'])
  role?: 'USER' | 'ADMIN' | 'MODERATOR';
}
