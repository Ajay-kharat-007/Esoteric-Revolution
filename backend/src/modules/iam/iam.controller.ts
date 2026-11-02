import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Ip,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard, CurrentUser, type AuthUser } from './auth.guard';
import {
  ConsentDto,
  DeletionRequestDto,
  DevelopmentAdminDto,
  ForgotPasswordDto,
  LoginDto,
  OtpRequestDto,
  PreferencesDto,
  RefreshDto,
  RegisterDto,
  ResendOtpDto,
  ResetPasswordDto,
  UpdateMeDto,
  VerifyOtpDto,
} from './iam.dto';
import { IamService } from './iam.service';
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly iam: IamService) {}
  private meta(agent?: string, ip?: string) {
    return { userAgent: agent, ipAddress: ip };
  }
  @Post('register') register(@Body() d: RegisterDto) {
    return this.iam.register(d);
  }
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('development/admin')
  developmentAdmin(@Body() d: DevelopmentAdminDto) {
    return this.iam.developmentAdmin(d);
  }
  @Post('verify-otp') verify(
    @Body() d: VerifyOtpDto,
    @Headers('user-agent') a?: string,
    @Ip() ip?: string,
  ) {
    return this.iam.verifyOtp(d.challengeId, d.code, this.meta(a, ip));
  }
  @Post('resend-otp') resend(@Body() d: ResendOtpDto) {
    return this.iam.resend(d.challengeId);
  }
  @Throttle({ default: { limit: 10, ttl: 60000 } }) @Post('login') login(
    @Body() d: LoginDto,
    @Headers('user-agent') a?: string,
    @Ip() ip?: string,
  ) {
    return this.iam.login(d, this.meta(a, ip));
  }
  @Throttle({ default: { limit: 5, ttl: 60000 } }) @Post('login/otp/request') otpRequest(
    @Body() d: OtpRequestDto,
  ) {
    return this.iam.requestLoginOtp(d.identifier);
  }
  @Post('login/otp/verify') otpVerify(
    @Body() d: VerifyOtpDto,
    @Headers('user-agent') a?: string,
    @Ip() ip?: string,
  ) {
    return this.iam.verifyOtp(d.challengeId, d.code, this.meta(a, ip));
  }
  @Post('refresh') refresh(
    @Body() d: RefreshDto,
    @Headers('user-agent') a?: string,
    @Ip() ip?: string,
  ) {
    return this.iam.refresh(d.refreshToken, this.meta(a, ip));
  }
  @Throttle({ default: { limit: 5, ttl: 60000 } }) @Post('forgot-password') forgot(
    @Body() d: ForgotPasswordDto,
  ) {
    return this.iam.forgot(d.identifier);
  }
  @Post('reset-password') reset(@Body() d: ResetPasswordDto) {
    return this.iam.reset(d);
  }
  @ApiBearerAuth() @UseGuards(AuthGuard) @Post('logout') logout(@CurrentUser() u: AuthUser) {
    return this.iam.logout(u.sub, u.sid);
  }
  @ApiBearerAuth() @UseGuards(AuthGuard) @Post('logout-all') logoutAll(@CurrentUser() u: AuthUser) {
    return this.iam.logoutAll(u.sub);
  }
  @ApiBearerAuth() @UseGuards(AuthGuard) @Get('sessions') sessions(@CurrentUser() u: AuthUser) {
    return this.iam.sessions(u.sub);
  }
  @ApiBearerAuth() @UseGuards(AuthGuard) @Delete('sessions/:id') revoke(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
  ) {
    return this.iam.revokeSession(u.sub, id);
  }
}
@ApiTags('Account')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('me')
export class MeController {
  constructor(private readonly iam: IamService) {}
  @Get() me(@CurrentUser() u: AuthUser) {
    return this.iam.me(u.sub);
  }
  @Patch() update(@CurrentUser() u: AuthUser, @Body() d: UpdateMeDto) {
    return this.iam.updateMe(u.sub, d);
  }
  @Patch('preferences') prefs(@CurrentUser() u: AuthUser, @Body() d: PreferencesDto) {
    return this.iam.preferences(u.sub, d.preferences);
  }
  @Get('consents') consents(@CurrentUser() u: AuthUser) {
    return this.iam.consents(u.sub);
  }
  @Put('consents/:code') consent(
    @CurrentUser() u: AuthUser,
    @Param('code') code: string,
    @Body() d: ConsentDto,
  ) {
    return this.iam.consent(u.sub, code, d.granted);
  }
  @Post('deletion-request') deletion(@CurrentUser() u: AuthUser, @Body() d: DeletionRequestDto) {
    return this.iam.deletion(u.sub, d.reason);
  }
}
