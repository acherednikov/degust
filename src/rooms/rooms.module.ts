import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Room } from './room.entity.js';
import { RoomsRepository } from './rooms.repository.js';

@Module({
  imports: [TypeOrmModule.forFeature([Room])],
  providers: [RoomsRepository],
  exports: [RoomsRepository],
})

export class RoomsModule {}
