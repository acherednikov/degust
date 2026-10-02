import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StringValue } from 'ms';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

// import { User } from '../users/user.entity.js';
import { UsersModule } from '../users/user.module.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      // imports: [ConfigModule, TypeOrmModule.forFeature([User])],
      imports: [ConfigModule, UsersModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '96h') as StringValue,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [JwtModule],
})
export class AuthModule {}