import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard, OptionalAuthGuard } from './auth.guard';
import { AuthController, MeController } from './iam.controller';
import { IamService } from './iam.service';
import { PasswordService } from './password.service';
import { RolesGuard } from './roles.guard';
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (c: ConfigService) => ({ secret: c.getOrThrow<string>('auth.accessSecret') }),
    }),
  ],
  controllers: [AuthController, MeController],
  providers: [IamService, PasswordService, AuthGuard, OptionalAuthGuard, RolesGuard],
  exports: [AuthGuard, OptionalAuthGuard, RolesGuard, JwtModule],
})
export class IamModule {}
