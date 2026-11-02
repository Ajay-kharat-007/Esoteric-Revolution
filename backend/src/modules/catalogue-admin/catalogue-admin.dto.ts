import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty() @IsString() @Length(1, 120) name!: string;
  @ApiProperty() @IsString() @Length(1, 160) slug!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() parentId?: string;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() @Min(0) position?: number;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() isPublished?: boolean;
}
export class UpdateCategoryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 120) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 160) slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() parentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) position?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean;
}
export class CreateTopicDto {
  @ApiProperty() @IsString() @Length(1, 120) name!: string;
  @ApiProperty() @IsString() @Length(1, 160) slug!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() isPublished?: boolean;
}
export class UpdateTopicDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 120) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 160) slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean;
}
export class CreateContributorDto {
  @ApiProperty() @IsString() @Length(1, 160) displayName!: string;
  @ApiProperty() @IsString() @Length(1, 160) slug!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() biography?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() imageUrl?: string;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() isPublic?: boolean;
}
export class UpdateContributorDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 160) displayName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 160) slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() biography?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() imageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublic?: boolean;
}
