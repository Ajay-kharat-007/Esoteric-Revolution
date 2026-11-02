import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
export class CreateCartDto {}
export class AddCartItemDto {
  @IsUUID() productId!: string;
  @IsOptional() @IsInt() @Min(1) @Max(10) quantity = 1;
}
export class UpdateQuantityDto {
  @IsInt() @Min(1) @Max(10) quantity!: number;
}
export class CouponCodeDto {
  @IsString() @Length(2, 50) code!: string;
}
export class AdminOrderQueryDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional()
  @IsIn(['PENDING_PAYMENT', 'PAID', 'CANCELLED', 'REFUNDED'])
  status?: 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED' | 'REFUNDED';
}
export class CreateProductDto {
  @IsOptional() @IsUUID() workId?: string;
  @IsString() name!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsIn(['DRAFT', 'ACTIVE', 'INACTIVE']) status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  @IsOptional() @IsString() currency?: string;
}
export class UpdateProductDto extends CreateProductDto {}
export class CreatePriceDto {
  @IsInt() @Min(0) amountMinor!: number;
  @IsString() currency!: string;
  @IsDateString() startsAt!: string;
  @IsOptional() @IsDateString() endsAt?: string;
}
export class CreateBundleDto {
  @IsString() name!: string;
  @IsOptional() @IsString() description?: string;
  @IsArray() productIds!: string[];
}
export class CreateCouponDto {
  @IsString() code!: string;
  @IsIn(['FIXED', 'PERCENTAGE']) type!: 'FIXED' | 'PERCENTAGE';
  @IsInt() @Min(1) value!: number;
  @IsOptional() @IsString() currency?: string;
  @IsDateString() startsAt!: string;
  @IsOptional() @IsDateString() expiresAt?: string;
}

export class CheckoutQuoteDto {
  @ApiProperty() @IsUUID() cartId!: string;
}
