import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class RejectDeletionRequestDto {
  @ApiProperty() @IsString() @Length(3, 1000) reason!: string;
}
