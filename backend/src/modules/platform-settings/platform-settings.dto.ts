import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';

export class PlatformSettingEntryDto {
  @ApiProperty() @IsString() @Length(2, 160) @Matches(/^[a-z][a-z0-9._-]*$/) key!: string;
  @ApiProperty({ type: Object }) @IsObject() value!: Record<string, unknown>;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() isSecret?: boolean;
}

export class UpdatePlatformSettingsDto {
  @ApiProperty({ type: [PlatformSettingEntryDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PlatformSettingEntryDto)
  settings!: PlatformSettingEntryDto[];
}
