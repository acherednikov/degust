import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './user.entity.js';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async create(input: { displayName: string }): Promise<User> {
    const user = this.repo.create(input);
    return this.repo.save(user);
  }

  async findOrCreate(displayName: string): Promise<User> {
    const existing = await this.repo.findOneBy({ displayName });
    if (existing) return existing;

    const user = this.repo.create({ displayName });
    return this.repo.save(user);
  }
  // async findOrCreate(displayName: string): Promise<User> {
  //   const existing = await this.repo.findOneBy({ displayName });
  //   if (existing) return existing;

  //   try {
  //     const user = this.repo.create({ displayName });
  //     return await this.repo.save(user);
  //   } catch (err) {
  //     if (err.code === '23505') {
  //       // кто-то успел создать между findOne и save
  //       return this.repo.findOneByOrFail({ displayName });
  //     }
  //     throw err;
  //   }
  // }
}
