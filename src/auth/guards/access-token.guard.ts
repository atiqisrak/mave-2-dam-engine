import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AccessTokensService } from '../../access-tokens/access-tokens.service';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly accessTokensService: AccessTokensService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Access token required');
    }

    const tokenData = await this.accessTokensService.validateToken(token);
    if (!tokenData) {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    // Add token data to request
    request.user = {
      id: tokenData.userId,
      permissions: tokenData.permissions,
      tokenType: 'access_token'
    };

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
