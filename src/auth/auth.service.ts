import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { LoginDto } from './dto/login.dto.js';

import { UsersRepository } from '../users/users.repository.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly users: UsersRepository,
  ) {}

  // async login(dto: LoginDto) {
  //   const payload = {
  //     sub: dto.userId,
  //     name: dto.displayName,
  //   };

  //   return {
  //     access_token: await this.jwtService.signAsync(payload),
  //   };
  // }
  async login(dto: LoginDto) {
    const user = await this.users.findOrCreate(dto.displayName);

    const payload = {
      sub: user.id,
      name: user.displayName,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
