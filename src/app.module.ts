import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createObserveModule } from '@nestjs/observe';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { AuthModule } from './auth/auth.module.js';
import { SignalingModule } from './signaling/signaling.module.js';
import { RoomsModule } from './rooms/rooms.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    SignalingModule,
    RoomsModule,
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'degust',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USER', 'postgres'),
        password: config.get('DB_PASSWORD', ''),
        database: config.get('DB_NAME', 'degust'),
        autoLoadEntities: true,   // подхватывает entities из forFeature
        synchronize: config.get('NODE_ENV') !== 'production', // только для dev
        logging: config.get('NODE_ENV') === 'development',
        // ssl: { rejectUnauthorized: false },
      }),
    }),

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
