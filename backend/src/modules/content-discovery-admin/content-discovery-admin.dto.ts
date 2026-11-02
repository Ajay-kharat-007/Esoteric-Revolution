import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';

const PUBLICATION_STATUSES = ['DRAFT', 'IN_REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'] as const;
type PublicationStatusValue = (typeof PUBLICATION_STATUSES)[number];

export class LearningPathItemDto {
  @ApiProperty() @IsUUID() workId!: string;
  @ApiProperty() @IsInt() @Min(1) position!: number;
}

export class CreateLearningPathDto {
  @ApiProperty() @IsString() @Length(1, 160) slug!: string;
  @ApiProperty() @IsString() @Length(1, 200) title!: string;
  @ApiProperty() @IsString() @Length(1, 500) summary!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: PUBLICATION_STATUSES, default: 'DRAFT' })
  @IsOptional()
  @IsIn(PUBLICATION_STATUSES)
  status?: PublicationStatusValue;
  @ApiPropertyOptional({ type: [LearningPathItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayUnique((item: LearningPathItemDto) => item.workId)
  @ValidateNested({ each: true })
  @Type(() => LearningPathItemDto)
  items?: LearningPathItemDto[];
}

export class UpdateLearningPathDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 160) slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 200) title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 500) summary?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: PUBLICATION_STATUSES })
  @IsOptional()
  @IsIn(PUBLICATION_STATUSES)
  status?: PublicationStatusValue;
  @ApiPropertyOptional({ type: [LearningPathItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayUnique((item: LearningPathItemDto) => item.workId)
  @ValidateNested({ each: true })
  @Type(() => LearningPathItemDto)
  items?: LearningPathItemDto[];
}

export class CreateInsightDto {
  @ApiProperty() @IsString() @Length(1, 160) slug!: string;
  @ApiProperty() @IsString() @Length(1, 200) title!: string;
  @ApiProperty() @IsString() @Length(1, 500) excerpt!: string;
  @ApiProperty({ type: Object }) @IsObject() body!: Record<string, unknown>;
  @ApiPropertyOptional({ enum: PUBLICATION_STATUSES, default: 'DRAFT' })
  @IsOptional()
  @IsIn(PUBLICATION_STATUSES)
  status?: PublicationStatusValue;
}

export class UpdateInsightDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 160) slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 200) title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 500) excerpt?: string;
  @ApiPropertyOptional({ type: Object }) @IsOptional() @IsObject() body?: Record<string, unknown>;
  @ApiPropertyOptional({ enum: PUBLICATION_STATUSES })
  @IsOptional()
  @IsIn(PUBLICATION_STATUSES)
  status?: PublicationStatusValue;
}
