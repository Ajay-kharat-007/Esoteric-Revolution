import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthGuard, CurrentUser, OptionalAuthGuard, type AuthUser } from '../iam/auth.guard';
import { Roles, RolesGuard } from '../iam/roles.guard';
import {
  AddCartItemDto,
  AdminOrderQueryDto,
  CouponCodeDto,
  CreateBundleDto,
  CreateCouponDto,
  CreatePriceDto,
  CreateProductDto,
  UpdateProductDto,
  UpdateQuantityDto,
  CheckoutQuoteDto,
} from './commerce.dto';
import { CommerceService } from './commerce.service';
@ApiTags('Commerce')
@Controller()
export class CommerceController {
  constructor(private readonly c: CommerceService) {}
  @UseGuards(OptionalAuthGuard) @Get('products') products(@Req() r: Request) {
    return this.c.products(r.user?.sub);
  }
  @UseGuards(OptionalAuthGuard) @Get('products/:id') product(
    @Req() r: Request,
    @Param('id') id: string,
  ) {
    return this.c.product(id, r.user?.sub);
  }
  @Get('products/by-work/:workId') byWork(@Param('workId') id: string) {
    return this.c.byWork(id);
  }
  @Get('bundles') bundles() {
    return this.c.bundles();
  }
  @Get('bundles/:id') bundle(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.c.bundle(id);
  }
  @UseGuards(OptionalAuthGuard) @Post('carts') create(@Req() r: Request) {
    return this.c.createCart(r.user?.sub);
  }
  @UseGuards(OptionalAuthGuard) @Get('carts/:id') cart(
    @Req() r: Request,
    @Param('id') id: string,
    @Headers('x-cart-token') t?: string,
  ) {
    return this.c.cart(id, r.user?.sub, t);
  }
  @UseGuards(OptionalAuthGuard) @Post('carts/:id/items') add(
    @Req() r: Request,
    @Param('id') id: string,
    @Body() d: AddCartItemDto,
    @Headers('x-cart-token') t?: string,
  ) {
    return this.c.add(id, d, r.user?.sub, t);
  }
  @UseGuards(OptionalAuthGuard) @Patch('carts/:id/items/:itemId') quantity(
    @Req() r: Request,
    @Param('id') id: string,
    @Param('itemId') item: string,
    @Body() d: UpdateQuantityDto,
    @Headers('x-cart-token') t?: string,
  ) {
    return this.c.quantity(id, item, d.quantity, r.user?.sub, t);
  }
  @UseGuards(OptionalAuthGuard) @Delete('carts/:id/items/:itemId') remove(
    @Req() r: Request,
    @Param('id') id: string,
    @Param('itemId') item: string,
    @Headers('x-cart-token') t?: string,
  ) {
    return this.c.remove(id, item, r.user?.sub, t);
  }
  @UseGuards(OptionalAuthGuard) @Post('carts/:id/coupon') coupon(
    @Req() r: Request,
    @Param('id') id: string,
    @Body() d: CouponCodeDto,
    @Headers('x-cart-token') t?: string,
  ) {
    return this.c.applyCoupon(id, d.code, r.user?.sub, t);
  }
  @UseGuards(OptionalAuthGuard) @Delete('carts/:id/coupon') removeCoupon(
    @Req() r: Request,
    @Param('id') id: string,
    @Headers('x-cart-token') t?: string,
  ) {
    return this.c.removeCoupon(id, r.user?.sub, t);
  }
  @UseGuards(OptionalAuthGuard) @Post('checkout/quote') quote(
    @Req() r: Request,
    @Body() dto: CheckoutQuoteDto,
    @Headers('x-cart-token') t?: string,
  ) {
    return this.c.calculate(dto.cartId, r.user?.sub, t);
  }
  @ApiBearerAuth() @UseGuards(AuthGuard) @Post('carts/:id/claim') claim(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Headers('x-cart-token') token?: string,
  ) {
    if (!token) throw new BadRequestException('X-Cart-Token header is required');
    return this.c.claim(id, u.sub, token);
  }
  @ApiBearerAuth() @UseGuards(AuthGuard) @Post('checkout/orders') order(
    @CurrentUser() u: AuthUser,
    @Body('cartId') id: string,
    @Headers('idempotency-key') key?: string,
  ) {
    if (!key) throw new BadRequestException('Idempotency-Key header is required');
    return this.c.order(id, u.sub, key);
  }
  @ApiBearerAuth() @UseGuards(AuthGuard) @Get('orders/:id') getOrder(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
  ) {
    return this.c.getOrder(id, u.sub, u.roles);
  }
  @ApiBearerAuth() @UseGuards(AuthGuard) @Get('me/orders') orders(@CurrentUser() u: AuthUser) {
    return this.c.myOrders(u.sub);
  }
  @ApiBearerAuth() @UseGuards(AuthGuard) @Post('orders/:id/cancel') cancel(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
  ) {
    return this.c.cancel(id, u.sub);
  }
}
@ApiTags('Admin Commerce')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminCommerceController {
  constructor(private readonly c: CommerceService) {}
  @Get('orders') orders(@Query() query: AdminOrderQueryDto) {
    return this.c.adminOrders(query.q, query.status);
  }
  @Get('orders/:id') order(@Param('id') id: string) {
    return this.c.adminOrder(id);
  }
  @Get('products') products() {
    return this.c.adminProducts();
  }
  @Post('products') product(@Body() d: CreateProductDto) {
    return this.c.createProduct(d);
  }
  @Patch('products/:id') update(@Param('id') id: string, @Body() d: UpdateProductDto) {
    return this.c.updateProduct(id, d);
  }
  @Post('products/:id/prices') price(@Param('id') id: string, @Body() d: CreatePriceDto) {
    return this.c.price(id, d);
  }
  @Post('bundles') bundle(@Body() d: CreateBundleDto) {
    return this.c.bundleCreate(d);
  }
  @Post('coupons') coupon(@Body() d: CreateCouponDto) {
    return this.c.couponCreate(d);
  }
}
