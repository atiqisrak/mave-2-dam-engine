import { ApiProperty } from '@nestjs/swagger';

export class AccessToken {
  @ApiProperty({ description: 'Token ID' })
  id: string;

  @ApiProperty({ description: 'Token value (only shown on creation)' })
  token?: string;

  @ApiProperty({ description: 'Human-readable name for the token' })
  name: string;

  @ApiProperty({ description: 'Token description', required: false })
  description?: string;

  @ApiProperty({ description: 'User ID who created the token' })
  userId: string;

  @ApiProperty({ description: 'Array of permissions', type: [String] })
  permissions: string[];

  @ApiProperty({ description: 'Token expiration date' })
  expiresAt: Date;

  @ApiProperty({ description: 'Whether the token is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Last used date', required: false })
  lastUsedAt?: Date;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}
