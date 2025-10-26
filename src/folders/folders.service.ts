import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { GrantFolderPermissionDto, GrantMediaPermissionDto } from './dto/folder-permission.dto';
import { Folder } from './entities/folder.entity';

@Injectable()
export class FoldersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createFolderDto: CreateFolderDto, userId: string): Promise<Folder> {
    // Validate parent folder exists and user has access
    if (createFolderDto.parentId) {
      const parentFolder = await this.prisma.folder.findFirst({
        where: {
          id: createFolderDto.parentId,
          OR: [
            { ownerId: userId },
            { 
              permissions: {
                some: {
                  userId,
                  permission: { in: ['WRITE', 'MANAGE', 'ADMIN'] }
                }
              }
            }
          ]
        }
      });

      if (!parentFolder) {
        throw new NotFoundException('Parent folder not found or access denied');
      }
    }

    // Generate folder path
    const path = await this.generateFolderPath(createFolderDto.name, createFolderDto.parentId, userId);

    const folder = await this.prisma.folder.create({
      data: {
        ...createFolderDto,
        path,
        ownerId: userId,
      },
    });

    return this.mapToEntity(folder);
  }

  async findAll(
    userId: string, 
    includeChildren = false, 
    parentId?: string,
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: string
  ): Promise<{ data: Folder[]; total: number; page: number; limit: number }> {
    const whereClause: any = {
      OR: [
        { ownerId: userId },
        { 
          permissions: {
            some: {
              userId,
              permission: { in: ['READ', 'WRITE', 'DELETE', 'MANAGE', 'ADMIN'] }
            }
          }
        }
      ]
    };

    // Filter by parent ID if provided
    if (parentId !== undefined) {
      whereClause.parentId = parentId;
    }

    // Set default pagination values
    const currentPage = page || 1;
    const pageSize = limit || 20;
    const skip = (currentPage - 1) * pageSize;

    // Set default sorting
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy && sortOrder) {
      orderBy = { [sortBy]: sortOrder.toLowerCase() as 'asc' | 'desc' };
    }

    // Get total count
    const total = await this.prisma.folder.count({
      where: whereClause
    });

    const folders = await this.prisma.folder.findMany({
      where: whereClause,
      include: {
        children: includeChildren,
        _count: {
          select: {
            media: true,
            children: true,
          }
        }
      },
      orderBy,
      skip,
      take: pageSize
    });

    const data = folders.map(folder => ({
      ...this.mapToEntity(folder),
      children: includeChildren ? folder.children?.map(child => this.mapToEntity(child)) : undefined,
      mediaCount: folder._count.media,
      folderCount: folder._count.children
    }));

    return {
      data,
      total,
      page: currentPage,
      limit: pageSize
    };
  }

  async findByPath(path: string, userId: string): Promise<Folder> {
    // Convert path segments to folder hierarchy
    const pathSegments = path.split('/').filter(segment => segment.length > 0);
    
    if (pathSegments.length === 0) {
      throw new NotFoundException('Invalid path');
    }

    // Find the folder by traversing the path
    let currentParentId: string | null = null;
    let targetFolder: any = null;

    for (const segment of pathSegments) {
      targetFolder = await this.prisma.folder.findFirst({
        where: {
          name: segment,
          parentId: currentParentId,
          OR: [
            { ownerId: userId },
            { 
              permissions: {
                some: {
                  userId,
                  permission: { in: ['READ', 'WRITE', 'DELETE', 'MANAGE', 'ADMIN'] }
                }
              }
            }
          ]
        },
        include: {
          children: true,
          _count: {
            select: {
              media: true,
              children: true,
            }
          }
        }
      });

      if (!targetFolder) {
        throw new NotFoundException(`Folder not found: ${segment}`);
      }

      currentParentId = targetFolder.id;
    }

    if (!targetFolder) {
      throw new NotFoundException('Folder not found');
    }

    return {
      ...this.mapToEntity(targetFolder),
      children: targetFolder.children?.map((child: any) => this.mapToEntity(child)),
      mediaCount: targetFolder._count.media,
      folderCount: targetFolder._count.children
    };
  }

  async findOne(id: string, userId: string): Promise<Folder> {
    const folder = await this.prisma.folder.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          { 
            permissions: {
              some: {
                userId,
                permission: { in: ['READ', 'WRITE', 'DELETE', 'MANAGE', 'ADMIN'] }
              }
            }
          }
        ]
      },
      include: {
        children: true,
        _count: {
          select: {
            media: true,
            children: true,
          }
        }
      }
    });

    if (!folder) {
      throw new NotFoundException('Folder not found or access denied');
    }

    return {
      ...this.mapToEntity(folder),
      children: folder.children?.map(child => this.mapToEntity(child)),
      mediaCount: folder._count.media,
      folderCount: folder._count.children
    };
  }

  async update(id: string, updateFolderDto: UpdateFolderDto, userId: string): Promise<Folder> {
    // Check if user has permission to update
    const folder = await this.prisma.folder.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          { 
            permissions: {
              some: {
                userId,
                permission: { in: ['MANAGE', 'ADMIN'] }
              }
            }
          }
        ]
      }
    });

    if (!folder) {
      throw new NotFoundException('Folder not found or access denied');
    }

    // If changing parent, validate new parent
    if (updateFolderDto.parentId !== undefined && updateFolderDto.parentId !== folder.parentId) {
      // If parentId is null or undefined, we're moving to root - no validation needed
      if (updateFolderDto.parentId !== null && updateFolderDto.parentId !== undefined) {
        const parentFolder = await this.prisma.folder.findFirst({
          where: {
            id: updateFolderDto.parentId,
            OR: [
              { ownerId: userId },
              { 
                permissions: {
                  some: {
                    userId,
                    permission: { in: ['WRITE', 'MANAGE', 'ADMIN'] }
                  }
                }
              }
            ]
          }
        });

        if (!parentFolder) {
          throw new NotFoundException('New parent folder not found or access denied');
        }

        // Prevent circular references
        if (await this.wouldCreateCircularReference(id, updateFolderDto.parentId)) {
          throw new BadRequestException('Cannot move folder to its own subfolder');
        }
      }
    }

    // Update folder
    const updateData = { ...updateFolderDto };
    // Convert undefined parentId to null for moving to root
    if (updateData.parentId === undefined) {
      updateData.parentId = null;
    }
    
    const updatedFolder = await this.prisma.folder.update({
      where: { id },
      data: updateData,
      include: {
        children: true,
        _count: {
          select: {
            media: true,
            children: true,
          }
        }
      }
    });

    return {
      ...this.mapToEntity(updatedFolder),
      children: updatedFolder.children?.map(child => this.mapToEntity(child)),
      mediaCount: updatedFolder._count.media,
      folderCount: updatedFolder._count.children
    };
  }

  async remove(id: string, userId: string): Promise<void> {
    // Check if user has permission to delete
    const folder = await this.prisma.folder.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          { 
            permissions: {
              some: {
                userId,
                permission: { in: ['DELETE', 'ADMIN'] }
              }
            }
          }
        ]
      },
      include: {
        children: true,
        media: true
      }
    });

    if (!folder) {
      throw new NotFoundException('Folder not found or access denied');
    }

    // Check if folder has children or media
    if (folder.children.length > 0) {
      throw new BadRequestException('Cannot delete folder with subfolders');
    }

    if (folder.media.length > 0) {
      throw new BadRequestException('Cannot delete folder with media files');
    }

    await this.prisma.folder.delete({
      where: { id }
    });
  }

  async grantFolderPermission(
    folderId: string, 
    grantPermissionDto: GrantFolderPermissionDto, 
    grantedBy: string
  ): Promise<void> {
    // Check if granter has permission to grant permissions
    const folder = await this.prisma.folder.findFirst({
      where: {
        id: folderId,
        OR: [
          { ownerId: grantedBy },
          { 
            permissions: {
              some: {
                userId: grantedBy,
                permission: { in: ['MANAGE', 'ADMIN'] }
              }
            }
          }
        ]
      }
    });

    if (!folder) {
      throw new NotFoundException('Folder not found or access denied');
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: grantPermissionDto.userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Grant or update permission
    await this.prisma.folderPermission.upsert({
      where: {
        folderId_userId: {
          folderId,
          userId: grantPermissionDto.userId
        }
      },
      update: {
        permission: grantPermissionDto.permission,
        grantedBy,
        expiresAt: grantPermissionDto.expiresAt ? new Date(grantPermissionDto.expiresAt) : null
      },
      create: {
        folderId,
        userId: grantPermissionDto.userId,
        permission: grantPermissionDto.permission,
        grantedBy,
        expiresAt: grantPermissionDto.expiresAt ? new Date(grantPermissionDto.expiresAt) : null
      }
    });
  }

  async grantMediaPermission(
    mediaId: string, 
    grantPermissionDto: GrantMediaPermissionDto, 
    grantedBy: string
  ): Promise<void> {
    // Check if granter has permission to grant permissions
    const media = await this.prisma.media.findFirst({
      where: {
        id: mediaId,
        OR: [
          { uploadedBy: grantedBy },
          { 
            permissions: {
              some: {
                userId: grantedBy,
                permission: { in: ['MANAGE', 'ADMIN'] }
              }
            }
          }
        ]
      }
    });

    if (!media) {
      throw new NotFoundException('Media not found or access denied');
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: grantPermissionDto.userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Grant or update permission
    await this.prisma.mediaPermission.upsert({
      where: {
        mediaId_userId: {
          mediaId,
          userId: grantPermissionDto.userId
        }
      },
      update: {
        permission: grantPermissionDto.permission,
        grantedBy,
        expiresAt: grantPermissionDto.expiresAt ? new Date(grantPermissionDto.expiresAt) : null
      },
      create: {
        mediaId,
        userId: grantPermissionDto.userId,
        permission: grantPermissionDto.permission,
        grantedBy,
        expiresAt: grantPermissionDto.expiresAt ? new Date(grantPermissionDto.expiresAt) : null
      }
    });
  }

  async revokeFolderPermission(folderId: string, userId: string, revokedBy: string): Promise<void> {
    // Check if revoker has permission
    const folder = await this.prisma.folder.findFirst({
      where: {
        id: folderId,
        OR: [
          { ownerId: revokedBy },
          { 
            permissions: {
              some: {
                userId: revokedBy,
                permission: { in: ['MANAGE', 'ADMIN'] }
              }
            }
          }
        ]
      }
    });

    if (!folder) {
      throw new NotFoundException('Folder not found or access denied');
    }

    await this.prisma.folderPermission.deleteMany({
      where: {
        folderId,
        userId
      }
    });
  }

  async revokeMediaPermission(mediaId: string, userId: string, revokedBy: string): Promise<void> {
    // Check if revoker has permission
    const media = await this.prisma.media.findFirst({
      where: {
        id: mediaId,
        OR: [
          { uploadedBy: revokedBy },
          { 
            permissions: {
              some: {
                userId: revokedBy,
                permission: { in: ['MANAGE', 'ADMIN'] }
              }
            }
          }
        ]
      }
    });

    if (!media) {
      throw new NotFoundException('Media not found or access denied');
    }

    await this.prisma.mediaPermission.deleteMany({
      where: {
        mediaId,
        userId
      }
    });
  }

  private async generateFolderPath(name: string, parentId: string | null, userId: string): Promise<string> {
    if (!parentId) {
      return `/${userId}/${name}`;
    }

    const parentFolder = await this.prisma.folder.findUnique({
      where: { id: parentId }
    });

    if (!parentFolder) {
      throw new NotFoundException('Parent folder not found');
    }

    return `${parentFolder.path}/${name}`;
  }

  private async wouldCreateCircularReference(folderId: string, newParentId: string): Promise<boolean> {
    let currentId = newParentId;
    while (currentId) {
      if (currentId === folderId) {
        return true;
      }
      const parent = await this.prisma.folder.findUnique({
        where: { id: currentId },
        select: { parentId: true }
      });
      currentId = parent?.parentId || null;
    }
    return false;
  }

  private mapToEntity(folder: any): Folder {
    return {
      id: folder.id,
      name: folder.name,
      description: folder.description,
      path: folder.path,
      parentId: folder.parentId,
      ownerId: folder.ownerId,
      isPublic: folder.isPublic,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt
    };
  }
}
