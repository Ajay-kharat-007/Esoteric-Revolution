import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard, CurrentUser, type AuthUser } from '../iam/auth.guard';
import { Roles, RolesGuard } from '../iam/roles.guard';
import {
  AdminRefundQueryDto,
  InitiatePaymentDto,
  PayuWebhookDto,
  RefundDecisionDto,
  RefundRequestDto,
  RefundWebhookDto,
  ReturnDto,
} from './payment.dto';
import { PaymentService } from './payment.service';
import type { Response } from 'express';
@ApiTags('Payments')
@Controller()
export class PaymentController {
  constructor(private readonly p: PaymentService) {}
  @ApiBearerAuth() @UseGuards(AuthGuard) @Post('payments/payu/initiate') initiate(
    @CurrentUser() u: AuthUser,
    @Body() d: InitiatePaymentDto,
    @Headers('idempotency-key') key: string,
  ) {
    if (!key) throw new BadRequestException('Idempotency-Key header is required');
    return this.p.initiate(d.orderId, u.sub, key);
  }
  @Post('payments/payu/return/success') async success(
    @Body() d: ReturnDto,
    @Res() response: Response,
  ) {
    response.redirect(303, await this.p.browserReturn(d, 'success'));
  }
  @Post('payments/payu/return/failure') async failure(
    @Body() d: ReturnDto,
    @Res() response: Response,
  ) {
    response.redirect(303, await this.p.browserReturn(d, 'failure'));
  }
  @Post('payments/payu/webhook') webhook(
    @Body() d: PayuWebhookDto,
    @Headers('x-payu-signature') s?: string,
  ) {
    return this.p.webhook(d, s);
  }
  @Post('payments/payu/refund-webhook') refundWebhook(
    @Body() d: RefundWebhookDto,
    @Headers('x-payu-signature') s?: string,
  ) {
    return this.p.refundWebhook(d, s);
  }
  @ApiBearerAuth() @UseGuards(AuthGuard) @Get('payments/:id/status') status(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
  ) {
    return this.p.status(id, u.sub, u.roles);
  }
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Post('payments/:id/verify')
  verify(@Param('id') id: string) {
    return this.p.verify(id);
  }
  @ApiBearerAuth() @UseGuards(AuthGuard) @Post('orders/:id/refund-requests') refund(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body() d: RefundRequestDto,
  ) {
    return this.p.requestRefund(id, u.sub, d.reason, d.amountMinor);
  }
  @ApiBearerAuth() @UseGuards(AuthGuard) @Get('me/refunds') refunds(@CurrentUser() u: AuthUser) {
    return this.p.refunds(u.sub);
  }
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/refunds')
  adminRefunds(@Query() query: AdminRefundQueryDto) {
    return this.p.adminRefunds(query.status, query.q);
  }
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/refunds/:id')
  adminRefund(@Param('id') id: string) {
    return this.p.adminRefund(id);
  }
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/refunds/:id/approve')
  approve(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() d: RefundDecisionDto) {
    return this.p.approve(id, u.sub, d.reason);
  }
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/refunds/:id/reject')
  reject(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() d: RefundDecisionDto) {
    return this.p.reject(id, u.sub, d.reason);
  }
  @ApiBearerAuth() @UseGuards(AuthGuard) @Get('orders/:id/invoice') invoice(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
  ) {
    return this.p.invoice(id, u.sub, u.roles);
  }
}
