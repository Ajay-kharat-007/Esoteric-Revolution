import { IsDateString, IsIn, IsOptional, IsString, IsUUID, IsUrl, Length } from 'class-validator';
export class CreateSourceDto {
  @IsString() title!: string;
  @IsOptional() @IsString() author?: string;
  @IsOptional() @IsString() publisher?: string;
  @IsOptional() @IsDateString() publicationDate?: string;
  @IsOptional() @IsUrl() url?: string;
  @IsOptional() @IsString() isbn?: string;
  @IsOptional() @IsString() notes?: string;
}
export class UpdateSourceDto extends CreateSourceDto {}
export class CreateClaimDto {
  @IsUUID() workId!: string;
  @IsString() @Length(3, 5000) statement!: string;
  @IsOptional() @IsString() classification?: string;
}
export class ReviewClaimDto {
  @IsOptional() @IsString() classification?: string;
  @IsIn(['VERIFIED', 'DISPUTED', 'REJECTED']) status!: 'VERIFIED' | 'DISPUTED' | 'REJECTED';
  @IsOptional() @IsString() reviewNote?: string;
}
export class LinkSourceDto {
  @IsUUID() sourceId!: string;
  @IsOptional() @IsString() locator?: string;
}
export class CreateRightsDto {
  @IsUUID() workId!: string;
  @IsString() basis!: string;
  @IsOptional() @IsString() territory?: string;
  @IsOptional() @IsUrl() evidenceUrl?: string;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() expiresAt?: string;
  @IsOptional() @IsString() notes?: string;
}
export class UpdateRightsDto {
  @IsOptional() @IsString() basis?: string;
  @IsOptional() @IsString() territory?: string;
  @IsOptional() @IsIn(['PENDING', 'CLEARED', 'RESTRICTED', 'EXPIRED']) status?:
    'PENDING' | 'CLEARED' | 'RESTRICTED' | 'EXPIRED';
  @IsOptional() @IsUrl() evidenceUrl?: string;
  @IsOptional() @IsDateString() expiresAt?: string;
  @IsOptional() @IsString() notes?: string;
}
export class StartWorkflowDto {
  @IsUUID() workId!: string;
  @IsUUID() workVersionId!: string;
  @IsOptional() @IsUUID() assigneeId?: string;
}
export class WorkflowActionDto {
  @IsIn(['APPROVE', 'REQUEST_CHANGES', 'TRANSITION']) action!:
    'APPROVE' | 'REQUEST_CHANGES' | 'TRANSITION';
  @IsOptional()
  @IsIn(['RESEARCH_REVIEW', 'EDITORIAL_REVIEW', 'RIGHTS_REVIEW', 'APPROVED'])
  toStage?: 'RESEARCH_REVIEW' | 'EDITORIAL_REVIEW' | 'RIGHTS_REVIEW' | 'APPROVED';
  @IsOptional() @IsString() reason?: string;
}
export class ScheduleDto {
  @IsDateString() publishAt!: string;
}
export class ReasonDto {
  @IsString() @Length(3, 500) reason!: string;
}
