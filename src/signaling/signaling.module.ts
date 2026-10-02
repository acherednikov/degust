import { Module } from '@nestjs/common';

import { SignalingGateway } from './signaling.gateway.js';
import { SignalingService } from './signaling.service.js';

import { AuthModule } from '../auth/auth.module.js';
import { RoomsModule } from '../rooms/rooms.module.js';

@Module({
  imports: [AuthModule, RoomsModule],
  providers: [SignalingGateway, SignalingService],
  exports: [SignalingService],
})
export class SignalingModule {}
