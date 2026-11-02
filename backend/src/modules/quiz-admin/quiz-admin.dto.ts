import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class QuizOptionInputDto {
  @ApiProperty() @IsString() @Length(1, 500) text!: string;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() isCorrect?: boolean;
  @ApiProperty() @IsInt() @Min(1) position!: number;
}

export class CreateQuizDto {
  @ApiProperty() @IsUUID() workId!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() lessonId?: string;
  @ApiProperty() @IsString() @Length(1, 200) title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ default: 70 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore?: number;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateQuizDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() workId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() lessonId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 200) title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(100) passingScore?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateQuizQuestionDto {
  @ApiProperty() @IsString() @Length(1, 1000) prompt!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() explanation?: string;
  @ApiProperty() @IsInt() @Min(1) position!: number;
  @ApiProperty({ type: [QuizOptionInputDto] })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => QuizOptionInputDto)
  options!: QuizOptionInputDto[];
}

export class UpdateQuizQuestionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 1000) prompt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() explanation?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) position?: number;
  @ApiPropertyOptional({ type: [QuizOptionInputDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => QuizOptionInputDto)
  options?: QuizOptionInputDto[];
}
