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
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AccessTokensService } from './access-tokens.service';
import { CreateAccessTokenDto } from './dto/create-access-token.dto';
import { UpdateAccessTokenDto } from './dto/update-access-token.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Access Tokens')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('access-tokens')
export class AccessTokensController {
  constructor(private readonly accessTokensService: AccessTokensService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new access token' })
  @ApiResponse({ status: 201, description: 'Access token created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - Invalid permissions' })
  create(@Body() createAccessTokenDto: CreateAccessTokenDto, @Request() req) {
    return this.accessTokensService.create(createAccessTokenDto, req.user.id, req.user.role);
  }

  @Get()
  @ApiOperation({ summary: 'Get all access tokens for the current user' })
  @ApiResponse({ status: 200, description: 'Access tokens retrieved successfully' })
  findAll(@Request() req) {
    return this.accessTokensService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an access token by ID' })
  @ApiResponse({ status: 200, description: 'Access token retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Access token not found' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.accessTokensService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an access token' })
  @ApiResponse({ status: 200, description: 'Access token updated successfully' })
  @ApiResponse({ status: 404, description: 'Access token not found' })
  update(@Param('id') id: string, @Body() updateAccessTokenDto: UpdateAccessTokenDto, @Request() req) {
    return this.accessTokensService.update(id, updateAccessTokenDto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an access token' })
  @ApiResponse({ status: 204, description: 'Access token deleted successfully' })
  @ApiResponse({ status: 404, description: 'Access token not found' })
  remove(@Param('id') id: string, @Request() req) {
    return this.accessTokensService.remove(id, req.user.id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate an access token' })
  @ApiResponse({ status: 200, description: 'Access token deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Access token not found' })
  deactivate(@Param('id') id: string, @Request() req) {
    return this.accessTokensService.deactivateToken(id, req.user.id);
  }

  @Patch(':id/reactivate')
  @ApiOperation({ summary: 'Reactivate an access token' })
  @ApiResponse({ status: 200, description: 'Access token reactivated successfully' })
  @ApiResponse({ status: 404, description: 'Access token not found' })
  @ApiResponse({ status: 400, description: 'Cannot reactivate expired token' })
  reactivate(@Param('id') id: string, @Request() req) {
    return this.accessTokensService.reactivateToken(id, req.user.id);
  }

  @Post('cleanup')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Clean up expired access tokens (Admin only)' })
  @ApiResponse({ status: 200, description: 'Cleanup completed successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  cleanup() {
    return this.accessTokensService.cleanupExpiredTokens();
  }
}
