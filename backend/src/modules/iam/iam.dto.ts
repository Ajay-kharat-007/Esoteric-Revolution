import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MinLength,
} from 'class-validator';
export class RegisterDto {
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(8, 20) phone?: string;
  @ApiProperty() @IsString() @MinLength(10) password!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 100) displayName?: string;
}
export class DevelopmentAdminDto {
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() @MinLength(10) password!: string;
  @ApiProperty() @IsString() @Length(1, 100) displayName!: string;
}
export class VerifyOtpDto {
  @ApiProperty() @IsString() challengeId!: string;
  @ApiProperty() @IsString() @Length(6, 6) code!: string;
}
export class ResendOtpDto {
  @ApiProperty() @IsUUID() challengeId!: string;
}
export class LoginDto {
  @ApiProperty() @IsString() identifier!: string;
  @ApiProperty() @IsString() password!: string;
}
export class OtpRequestDto {
  @ApiProperty() @IsString() identifier!: string;
}
export class RefreshDto {
  @ApiProperty() @IsString() refreshToken!: string;
}
export class ForgotPasswordDto {
  @ApiProperty() @IsString() identifier!: string;
}
export class ResetPasswordDto {
  @ApiProperty() @IsString() token!: string;
  @ApiProperty() @IsString() @MinLength(10) password!: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() revokeAllSessions?: boolean;
}
export class UpdateMeDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 100) displayName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() language?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() timezone?: string;
}
export class PreferencesDto {
  @ApiProperty({ type: Object }) @IsObject() preferences!: Record<string, unknown>;
}
export class ConsentDto {
  @ApiProperty() @IsBoolean() granted!: boolean;
}
export class DeletionRequestDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 500) reason?: string;
}
