import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Room } from './room.entity.js';
import { RoomsRepository } from './rooms.repository.js';
import { RoomsController } from './rooms.controller.js';

import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Room])],
  providers: [RoomsRepository],
  exports: [RoomsRepository],
  controllers: [RoomsController],
})

export class RoomsModule {}
