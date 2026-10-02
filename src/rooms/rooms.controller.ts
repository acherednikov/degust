import { Controller, Get, UseGuards } from '@nestjs/common';

import { JwtAuthGuard, type JwtUser } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RoomsRepository } from './rooms.repository.js';

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private readonly rooms: RoomsRepository) {}

  @Get()
  async getMyRooms(@CurrentUser() user: JwtUser) {
    return this.rooms.findByUserId(user.userId);
  }
}
