import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
export class CreateWorkDto {
  @ApiProperty() @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) slug!: string;
  @ApiProperty() @IsString() languageCode!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() summary?: string;
}
export class UpdateWorkDto {
  @ApiPropertyOptional() @IsOptional() @IsString() introductionVideoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 200) introductionVideoTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() introductionVideoCaptionInfo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
}
export class CreateWorkVersionDto {
  @ApiProperty() @IsString() title!: string;
  @ApiProperty() @IsString() summary!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subtitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ type: Object }) @IsOptional() @IsObject() content?: Record<
    string,
    unknown
  >;
  @ApiPropertyOptional({ type: Object }) @IsOptional() preview?: Record<string, unknown>;
}
export class CreateModuleDto {
  @ApiProperty() @IsString() title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() summary?: string;
  @ApiProperty() @IsInt() @Min(1) position!: number;
}
export class UpdateModuleDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() summary?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) position?: number;
}
export class CreateLessonDto {
  @ApiProperty() @IsString() slug!: string;
  @ApiProperty() @IsString() title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() summary?: string;
  @ApiProperty() @IsInt() @Min(1) position!: number;
}
export class UpdateLessonDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() summary?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) position?: number;
}
export class CreateLessonVersionDto {
  @ApiProperty({ type: Object }) @IsObject() content!: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsString() transcript?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) durationSeconds?: number;
}
export class PresignMediaDto {
  @ApiProperty() @IsIn(['IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT', 'CAPTION']) type!:
    'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT' | 'CAPTION';
  @ApiProperty() @IsString() originalFilename!: string;
  @ApiProperty() @IsString() mimeType!: string;
  @ApiProperty() @IsInt() @Min(1) @Max(2147483648) sizeBytes!: number;
  @ApiProperty() @Matches(/^[a-fA-F0-9]{64}$/) checksumSha256!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() lessonVersionId?: string;
}
export class CompleteMediaDto {
  @ApiProperty() @Matches(/^[a-fA-F0-9]{64}$/) checksumSha256!: string;
  @ApiPropertyOptional({ type: Object }) @IsOptional() @IsObject() metadata?: Record<
    string,
    unknown
  >;
}
