import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { JwtUser } from '../guards/jwt-auth.guard.js';

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): JwtUser => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
