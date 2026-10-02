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

  async findOrCreateForUser(name: string, userId: string): Promise<Room> {
    let room = await this.repo.findOne({
      where: { name },
      relations: { users: true },
    });

    if (!room) {
      room = this.repo.create({ name, users: [] });
      room = await this.repo.save(room);
    }

    // Добавляем user в room, если его там ещё нет
    const alreadyIn = room.users.some((u) => u.id === userId);
    if (!alreadyIn) {
      await this.repo
        .createQueryBuilder()
        .relation(Room, 'users')
        .of(room.id)
        .add(userId);
    }

    return room;
  }

  async findByUserId(userId: string): Promise<Room[]> {
    return this.repo
      .createQueryBuilder('room')
      .innerJoin('room.users', 'user', 'user.id = :userId', { userId })
      .orderBy('room.updatedAt', 'DESC')
      .getMany();
  }
}
