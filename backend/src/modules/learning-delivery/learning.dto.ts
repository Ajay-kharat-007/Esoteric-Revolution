import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
export class ProgressDto {
  @IsInt() @Min(0) @Max(100) percent!: number;
  @IsOptional() @IsInt() @Min(0) positionSeconds?: number;
  @IsOptional() @IsString() format?: string;
}
export class GrantEntitlementDto {
  @IsUUID() userId!: string;
  @IsUUID() workId!: string;
  @IsString() @Length(3, 500) reason!: string;
  @IsOptional() @IsDateString() expiresAt?: string;
}
export class RevokeEntitlementDto {
  @IsString() @Length(3, 500) reason!: string;
}
