import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsObject, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';

export class CreateBookmarkDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 200) label?: string;
  @ApiPropertyOptional({ type: Object }) @IsOptional() @IsObject() position?: Record<
    string,
    unknown
  >;
}
export class CreateHighlightDto {
  @ApiProperty() @IsString() @Length(1, 5000) quote!: string;
  @ApiProperty({ type: Object }) @IsObject() range!: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 30) color?: string;
}
export class UpdateHighlightDto {
  @ApiPropertyOptional({ type: Object }) @IsOptional() @IsObject() range?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 30) color?: string;
}
export class CreateNoteDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 200) title?: string;
  @ApiProperty() @IsString() @Length(1, 20000) body!: string;
}
export class UpdateNoteDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 200) title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 20000) body?: string;
}
export class ReflectionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 200) title?: string;
  @ApiProperty() @IsString() @Length(1, 50000) body!: string;
}
export class SaveAnswerDto {
  @ApiProperty() @IsUUID() questionId!: string;
  @ApiProperty() @IsUUID() optionId!: string;
}
export class RatingDto {
  @ApiProperty() @IsInt() @Min(1) @Max(5) value!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 2000) review?: string;
}
