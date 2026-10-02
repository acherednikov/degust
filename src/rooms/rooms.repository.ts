import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Room } from './room.entity.js';

@Injectable()
export class RoomsRepository {
  constructor(
    @InjectRepository(Room)
    private readonly repo: Repository<Room>,
  ) {}

  async findOrCreate(name: string): Promise<Room> {
    const existing = await this.repo.findOneBy({ name });
    if (existing) return existing;

    try {
      const room = this.repo.create({ name });
      return await this.repo.save(room);
    } catch (err: any) {
      if (err.code === '23505') {
        return this.repo.findOneByOrFail({ name });
      }
      throw err;
    }
  }
}
