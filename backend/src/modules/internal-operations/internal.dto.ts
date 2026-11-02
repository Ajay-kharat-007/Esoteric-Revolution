import { IsIn, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
export class StorageWebhookDto {
  @IsString() eventId!: string;
  @IsUUID() assetId!: string;
  @IsIn(['READY', 'FAILED']) status!: 'READY' | 'FAILED';
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}
export class EmailWebhookDto {
  @IsString() eventId!: string;
  @IsIn(['DELIVERED', 'BOUNCED', 'COMPLAINED']) status!: string;
  @IsOptional() @IsUUID() notificationId?: string;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}
