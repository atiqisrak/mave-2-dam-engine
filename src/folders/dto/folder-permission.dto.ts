import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { PermissionType } from '../../common/enums/permission-type.enum';

export class GrantFolderPermissionDto {
  @ApiProperty({ description: 'User ID to grant permission to' })
  @IsString()
  userId: string;

  @ApiProperty({ 
    description: 'Permission type', 
    enum: PermissionType,
    example: PermissionType.READ 
  })
  @IsEnum(PermissionType)
  permission: PermissionType;

  @ApiProperty({ description: 'Permission expiration date', required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class GrantMediaPermissionDto {
  @ApiProperty({ description: 'User ID to grant permission to' })
  @IsString()
  userId: string;

  @ApiProperty({ 
    description: 'Permission type', 
    enum: PermissionType,
    example: PermissionType.READ 
  })
  @IsEnum(PermissionType)
  permission: PermissionType;

  @ApiProperty({ description: 'Permission expiration date', required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
