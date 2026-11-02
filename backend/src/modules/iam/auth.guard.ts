import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';
export interface AuthUser {
  sub: string;
  sid: string;
  roles: string[];
}
declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly db: PrismaService,
  ) {}
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    if (!token) throw new UnauthorizedException('Missing bearer token');
    try {
      const user = await this.jwt.verifyAsync<AuthUser>(token, {
        secret: this.config.getOrThrow<string>('auth.accessSecret'),
      });
      const session = await this.db.authSession.findFirst({
        where: {
          id: user.sid,
          userId: user.sub,
          revokedAt: null,
          expiresAt: { gt: new Date() },
          user: { status: 'ACTIVE' },
        },
        select: { id: true },
      });
      if (!session) throw new UnauthorizedException('Session is no longer active');
      req.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
@Injectable()
export class OptionalAuthGuard extends AuthGuard {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    try {
      return await super.canActivate(ctx);
    } catch {
      return true;
    }
  }
}
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest<Request>().user as AuthUser,
);
