import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
export const ROLES_KEY = 'required_roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    const required =
      this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]) ??
      [];
    if (!required.length) return true;
    const roles = ctx.switchToHttp().getRequest<Request>().user?.roles ?? [];
    if (!required.some((role) => roles.includes(role)) && !roles.includes('admin'))
      throw new ForbiddenException('Insufficient role');
    return true;
  }
}
