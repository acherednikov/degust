import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(dto: LoginDto) {
    const payload = {
      sub: dto.userId,
      name: dto.displayName,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
