import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccessTokenDto } from './dto/create-access-token.dto';
import { UpdateAccessTokenDto } from './dto/update-access-token.dto';
import { AccessToken } from './entities/access-token.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class AccessTokensService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAccessTokenDto: CreateAccessTokenDto, userId: string, userRole?: string): Promise<AccessToken> {
    // Validate permissions based on user role
    const validPermissions = ['read', 'write', 'delete', 'manage', 'admin'];
    const invalidPermissions = createAccessTokenDto.permissions.filter(
      permission => !validPermissions.includes(permission.toLowerCase())
    );

    if (invalidPermissions.length > 0) {
      throw new BadRequestException(`Invalid permissions: ${invalidPermissions.join(', ')}`);
    }

    // Non-admin users can only create tokens with limited permissions
    if (userRole !== 'ADMIN') {
      const restrictedPermissions = ['admin', 'manage'];
      const hasRestrictedPermissions = createAccessTokenDto.permissions.some(
        permission => restrictedPermissions.includes(permission.toLowerCase())
      );

      if (hasRestrictedPermissions) {
        throw new ForbiddenException('Only admin users can create tokens with admin or manage permissions');
      }
    }

    // Generate secure token
    const token = this.generateSecureToken();

    // Normalize permissions to lowercase
    const normalizedPermissions = createAccessTokenDto.permissions.map(p => p.toLowerCase());

    const accessToken = await this.prisma.accessToken.create({
      data: {
        ...createAccessTokenDto,
        token,
        permissions: normalizedPermissions,
        userId,
        expiresAt: new Date(createAccessTokenDto.expiresAt),
      },
    });

    return this.mapToEntity(accessToken, true); // Include token on creation
  }

  async findAll(userId: string): Promise<AccessToken[]> {
    const accessTokens = await this.prisma.accessToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return accessTokens.map(token => this.mapToEntity(token, false)); // Don't include token
  }

  async findOne(id: string, userId: string): Promise<AccessToken> {
    const accessToken = await this.prisma.accessToken.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!accessToken) {
      throw new NotFoundException('Access token not found');
    }

    return this.mapToEntity(accessToken, false); // Don't include token
  }

  async update(id: string, updateAccessTokenDto: UpdateAccessTokenDto, userId: string): Promise<AccessToken> {
    const accessToken = await this.prisma.accessToken.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!accessToken) {
      throw new NotFoundException('Access token not found');
    }

    // Validate permissions if provided
    if (updateAccessTokenDto.permissions) {
      const validPermissions = ['read', 'write', 'delete', 'manage', 'admin'];
      const invalidPermissions = updateAccessTokenDto.permissions.filter(
        permission => !validPermissions.includes(permission.toLowerCase())
      );

      if (invalidPermissions.length > 0) {
        throw new BadRequestException(`Invalid permissions: ${invalidPermissions.join(', ')}`);
      }

      // Normalize permissions to lowercase
      updateAccessTokenDto.permissions = updateAccessTokenDto.permissions.map(p => p.toLowerCase());
    }

    const updatedToken = await this.prisma.accessToken.update({
      where: { id },
      data: {
        ...updateAccessTokenDto,
        expiresAt: updateAccessTokenDto.expiresAt ? new Date(updateAccessTokenDto.expiresAt) : undefined,
      },
    });

    return this.mapToEntity(updatedToken, false); // Don't include token
  }

  async remove(id: string, userId: string): Promise<void> {
    const accessToken = await this.prisma.accessToken.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!accessToken) {
      throw new NotFoundException('Access token not found');
    }

    await this.prisma.accessToken.delete({
      where: { id }
    });
  }

  async validateToken(token: string): Promise<{ userId: string; permissions: string[] } | null> {
    const accessToken = await this.prisma.accessToken.findFirst({
      where: {
        token,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!accessToken) {
      return null;
    }

    // Update last used timestamp
    await this.prisma.accessToken.update({
      where: { id: accessToken.id },
      data: { lastUsedAt: new Date() }
    });

    return {
      userId: accessToken.userId,
      permissions: accessToken.permissions as string[]
    };
  }

  async deactivateToken(id: string, userId: string): Promise<AccessToken> {
    const accessToken = await this.prisma.accessToken.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!accessToken) {
      throw new NotFoundException('Access token not found');
    }

    const updatedToken = await this.prisma.accessToken.update({
      where: { id },
      data: { isActive: false }
    });

    return this.mapToEntity(updatedToken, false);
  }

  async reactivateToken(id: string, userId: string): Promise<AccessToken> {
    const accessToken = await this.prisma.accessToken.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!accessToken) {
      throw new NotFoundException('Access token not found');
    }

    // Check if token is expired
    if (accessToken.expiresAt < new Date()) {
      throw new BadRequestException('Cannot reactivate expired token');
    }

    const updatedToken = await this.prisma.accessToken.update({
      where: { id },
      data: { isActive: true }
    });

    return this.mapToEntity(updatedToken, false);
  }

  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.accessToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    return result.count;
  }

  private generateSecureToken(): string {
    // Generate a 64-character hex token
    return randomBytes(32).toString('hex');
  }

  private mapToEntity(accessToken: any, includeToken = false): AccessToken {
    return {
      id: accessToken.id,
      token: includeToken ? accessToken.token : undefined,
      name: accessToken.name,
      description: accessToken.description,
      userId: accessToken.userId,
      permissions: accessToken.permissions as string[],
      expiresAt: accessToken.expiresAt,
      isActive: accessToken.isActive,
      lastUsedAt: accessToken.lastUsedAt,
      createdAt: accessToken.createdAt,
      updatedAt: accessToken.updatedAt
    };
  }
}
