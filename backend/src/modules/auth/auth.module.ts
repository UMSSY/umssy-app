import { Module } from '@nestjs/common';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { AuthController } from './controllers/auth.controller.js';
import { AuthService } from './services/auth.service.js';
import { AuthRepository } from './repositories/auth.repository.js';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN || undefined) as JwtSignOptions['expiresIn'],
        algorithm: (process.env.JWT_ALGORITHM || undefined) as JwtSignOptions['algorithm'],
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository],
  exports: [AuthService],
})
export class AuthModule {}