import { IsIn, IsInt, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';
export class InitiatePaymentDto {
  @IsUUID() orderId!: string;
}
export class PayuWebhookDto {
  @IsString() eventId!: string;
  @IsString() transactionId!: string;
  @IsUUID() paymentId!: string;
  @IsIn(['CAPTURED', 'FAILED', 'PENDING', 'CANCELLED']) status!:
    'CAPTURED' | 'FAILED' | 'PENDING' | 'CANCELLED';
  @IsInt() @Min(0) amountMinor!: number;
  @IsString() currency!: string;
}
export class ReturnDto {
  @IsOptional() @IsUUID() paymentId?: string;
  @IsOptional() @IsUUID() udf1?: string;
  @IsOptional() @IsString() txnid?: string;
  @IsOptional() @IsString() transactionId?: string;
}
export class AdminRefundQueryDto {
  @IsOptional()
  @IsIn(['REQUESTED', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'FAILED'])
  status?: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  @IsOptional() @IsString() q?: string;
}
export class RefundRequestDto {
  @IsString() @Length(3, 500) reason!: string;
  @IsOptional() @IsInt() @Min(1) amountMinor?: number;
}
export class RefundDecisionDto {
  @IsString() @Length(3, 500) reason!: string;
}
export class RefundWebhookDto {
  @IsString() eventId!: string;
  @IsUUID() refundId!: string;
  @IsString() providerRefundId!: string;
  @IsIn(['COMPLETED', 'FAILED', 'PROCESSING']) status!: 'COMPLETED' | 'FAILED' | 'PROCESSING';
}
