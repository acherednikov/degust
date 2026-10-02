// import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
// import { JwtService } from "@nestjs/jwt";

// @Injectable()
// export class JwtAuthGuard implements CanActivate {
//   constructor(private readonly jwtService: JwtService) {}

//   async canActivate(ctx: ExecutionContext): Promise<boolean> {
//     const req = ctx.switchToHttp().getRequest();
//     const auth = req.headers.authorization;
//     if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException();

//     try {
//       req.user = await this.jwtService.verifyAsync(auth.slice(7));
//       return true;
//     } catch {
//       throw new UnauthorizedException();
//     }
//   }
// }

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

export interface JwtUser {
  userId: string;
  displayName: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request & { user?: JwtUser }>();
    const auth = req.headers.authorization;

    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(auth.slice(7));
      req.user = {
        userId: payload.sub,
        displayName: payload.name,
      };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
