import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password (minimum 6 characters)' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ description: 'User role', enum: ['USER', 'ADMIN', 'MODERATOR'], default: 'USER' })
  @IsOptional()
  @IsEnum(['USER', 'ADMIN', 'MODERATOR'])
  role?: 'USER' | 'ADMIN' | 'MODERATOR';
}
