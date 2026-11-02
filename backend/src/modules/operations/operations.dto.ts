import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class ReasonDto {
  @ApiProperty() @IsString() @Length(3, 500) reason!: string;
}
export class CreateSupportCaseDto {
  @ApiProperty() @IsString() @Length(3, 200) subject!: string;
  @ApiProperty() @IsString() @Length(5, 10000) message!: string;
}
export class UpdateSupportCaseDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() assigneeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsIn(['OPEN', 'ASSIGNED', 'RESOLVED', 'CLOSED']) status?:
    'OPEN' | 'ASSIGNED' | 'RESOLVED' | 'CLOSED';
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(3, 5000) resolution?: string;
}
export class CreateContentReportDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() workId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() lessonId?: string;
  @ApiProperty() @IsString() @Length(3, 200) reason!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(3, 5000) details?: string;
}
export class ResolveContentReportDto {
  @ApiProperty() @IsIn(['RESOLVED', 'DISMISSED']) status!: 'RESOLVED' | 'DISMISSED';
  @ApiProperty() @IsString() @Length(3, 5000) resolution!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() correctionId?: string;
}
export class CreateNotificationDto {
  @ApiProperty() @IsString() @Length(1, 200) title!: string;
  @ApiProperty() @IsString() @Length(1, 10000) body!: string;
  @ApiProperty({ type: Object }) @IsObject() audience!: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledAt?: string;
}
export class CreateCampaignDto {
  @ApiProperty() @IsString() @Length(1, 200) name!: string;
  @ApiProperty() @IsIn(['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP']) channel!: string;
  @ApiProperty({ type: Object }) @IsObject() audience!: Record<string, unknown>;
  @ApiProperty({ type: Object }) @IsObject() content!: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledAt?: string;
}
export class ClaimReferralDto {
  @ApiProperty() @IsString() @Length(3, 50) code!: string;
}
