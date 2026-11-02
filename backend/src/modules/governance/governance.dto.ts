import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsIn,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class AssignRolesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayUnique()
  @ArrayMinSize(1)
  @ArrayMaxSize(1)
  @IsString({ each: true })
  @IsIn(['admin', 'learner'], { each: true })
  roleCodes!: string[];
  @ApiProperty() @IsString() @Length(3, 500) reason!: string;
}
export class UpdateFeatureFlagDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() enabled?: boolean;
  @ApiPropertyOptional({ type: Object }) @IsOptional() @IsObject() configuration?: Record<
    string,
    unknown
  >;
  @ApiProperty() @IsString() @Length(3, 500) reason!: string;
}
