import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Request,
  Query 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { GrantFolderPermissionDto, GrantMediaPermissionDto } from './dto/folder-permission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Folders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new folder' })
  @ApiResponse({ status: 201, description: 'Folder created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() createFolderDto: CreateFolderDto, @Request() req) {
    return this.foldersService.create(createFolderDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all folders accessible to user' })
  @ApiQuery({ name: 'includeChildren', required: false, type: Boolean, description: 'Include child folders' })
  @ApiQuery({ name: 'parentId', required: false, description: 'Filter by parent folder ID' })
  @ApiQuery({ name: 'path', required: false, description: 'Get folder by path' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Field to sort by' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order (asc or desc)' })
  @ApiResponse({ status: 200, description: 'Folders retrieved successfully' })
  findAll(
    @Request() req, 
    @Query('includeChildren') includeChildren?: boolean,
    @Query('parentId') parentId?: string,
    @Query('path') path?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string
  ) {
    if (path) {
      return this.foldersService.findByPath(path, req.user.id);
    }
    return this.foldersService.findAll(
      req.user.id, 
      includeChildren, 
      parentId, 
      page, 
      limit, 
      sortBy, 
      sortOrder
    );
  }

  @Get('by-path/*path')
  @ApiOperation({ summary: 'Get a folder by path' })
  @ApiResponse({ status: 200, description: 'Folder retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Folder not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findByPath(@Param('path') path: string, @Request() req) {
    return this.foldersService.findByPath(path, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a folder by ID' })
  @ApiResponse({ status: 200, description: 'Folder retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Folder not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.foldersService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a folder' })
  @ApiResponse({ status: 200, description: 'Folder updated successfully' })
  @ApiResponse({ status: 404, description: 'Folder not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(@Param('id') id: string, @Body() updateFolderDto: UpdateFolderDto, @Request() req) {
    return this.foldersService.update(id, updateFolderDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a folder' })
  @ApiResponse({ status: 200, description: 'Folder deleted successfully' })
  @ApiResponse({ status: 404, description: 'Folder not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string, @Request() req) {
    return this.foldersService.remove(id, req.user.id);
  }

  @Post(':id/permissions')
  @ApiOperation({ summary: 'Grant permission to a folder' })
  @ApiResponse({ status: 201, description: 'Permission granted successfully' })
  @ApiResponse({ status: 404, description: 'Folder or user not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  grantFolderPermission(
    @Param('id') id: string,
    @Body() grantPermissionDto: GrantFolderPermissionDto,
    @Request() req
  ) {
    return this.foldersService.grantFolderPermission(id, grantPermissionDto, req.user.id);
  }

  @Delete(':id/permissions/:userId')
  @ApiOperation({ summary: 'Revoke permission from a folder' })
  @ApiResponse({ status: 200, description: 'Permission revoked successfully' })
  @ApiResponse({ status: 404, description: 'Folder not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  revokeFolderPermission(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req
  ) {
    return this.foldersService.revokeFolderPermission(id, userId, req.user.id);
  }

  @Post('media/:mediaId/permissions')
  @ApiOperation({ summary: 'Grant permission to a media file' })
  @ApiResponse({ status: 201, description: 'Permission granted successfully' })
  @ApiResponse({ status: 404, description: 'Media or user not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  grantMediaPermission(
    @Param('mediaId') mediaId: string,
    @Body() grantPermissionDto: GrantMediaPermissionDto,
    @Request() req
  ) {
    return this.foldersService.grantMediaPermission(mediaId, grantPermissionDto, req.user.id);
  }

  @Delete('media/:mediaId/permissions/:userId')
  @ApiOperation({ summary: 'Revoke permission from a media file' })
  @ApiResponse({ status: 200, description: 'Permission revoked successfully' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  revokeMediaPermission(
    @Param('mediaId') mediaId: string,
    @Param('userId') userId: string,
    @Request() req
  ) {
    return this.foldersService.revokeMediaPermission(mediaId, userId, req.user.id);
  }
}
