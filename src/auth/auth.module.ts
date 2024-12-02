import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user.entity/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants/constants';
import { EmailService } from './email.service';
import { ProfileImageService } from 'src/profile-image/profile-image.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '24h' }
    }),
  ],
  providers: [AuthService, ProfileImageService],
  controllers: [AuthController]
})
export class AuthModule { }
