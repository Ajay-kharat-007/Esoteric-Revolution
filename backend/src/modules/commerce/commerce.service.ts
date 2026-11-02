import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { CartStatus, OrderStatus, ProductStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../../database/prisma.service';
import type { Prisma } from '../../generated/prisma/client';
import type {
  AddCartItemDto,
  CreateBundleDto,
  CreateCouponDto,
  CreatePriceDto,
  CreateProductDto,
  UpdateProductDto,
} from './commerce.dto';
@Injectable()
export class CommerceService {
  constructor(private readonly db: PrismaService) {}
  private hash(v: string) {
    return createHash('sha256').update(v).digest('hex');
  }
  private money<T extends Record<string, unknown>>(v: T) {
    return Object.fromEntries(
      Object.entries(v).map(([k, x]) => [k, typeof x === 'bigint' ? x.toString() : x]),
    );
  }
  private activePrice() {
    const now = new Date();
    return {
      where: { startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      orderBy: { startsAt: 'desc' as const },
      take: 1,
    };
  }
  async products(userId?: string) {
    const products = await this.db.product.findMany({
      where: { status: ProductStatus.ACTIVE },
      include: {
        prices: this.activePrice(),
        work: {
          select: {
            id: true,
            slug: true,
            publishedVersion: { select: { title: true, summary: true, coverImageUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    const ownedWorkIds = userId
      ? new Set(
          (
            await this.db.entitlement.findMany({
              where: {
                userId,
                status: 'ACTIVE',
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
              },
              select: { workId: true },
            })
          )
            .map((item) => item.workId)
            .filter(Boolean),
        )
      : new Set<string>();
    return products.map((product) => ({
      ...product,
      owned: !!product.workId && ownedWorkIds.has(product.workId),
      prices: product.prices.map((price) => this.money(price)),
    }));
  }
  async product(id: string, userId?: string) {
    const p = await this.db.product.findFirst({
      where: { id, status: ProductStatus.ACTIVE },
      include: {
        prices: this.activePrice(),
        work: { select: { id: true, slug: true, publishedVersion: { select: { title: true } } } },
      },
    });
    if (!p) throw new NotFoundException('Product not found');
    const owned =
      userId && p.workId
        ? !!(await this.db.entitlement.findFirst({
            where: {
              userId,
              workId: p.workId,
              status: 'ACTIVE',
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
            select: { id: true },
          }))
        : false;
    return { ...p, owned, prices: p.prices.map((x) => this.money(x)) };
  }
  async byWork(workId: string) {
    const items = await this.db.product.findMany({
      where: { workId, status: ProductStatus.ACTIVE },
      include: { prices: this.activePrice() },
    });
    return items.map((p) => ({ ...p, prices: p.prices.map((x) => this.money(x)) }));
  }
  async bundles() {
    const bundles = await this.db.bundle.findMany({
      where: { status: ProductStatus.ACTIVE },
      include: {
        items: {
          orderBy: { position: 'asc' },
          include: { product: { include: { prices: this.activePrice() } } },
        },
      },
    });
    return bundles.map((bundle) => ({
      ...bundle,
      items: bundle.items.map((item) => ({
        ...item,
        product: { ...item.product, prices: item.product.prices.map((price) => this.money(price)) },
      })),
    }));
  }
  async bundle(id: string) {
    const b = await this.db.bundle.findFirst({
      where: { id, status: ProductStatus.ACTIVE },
      include: {
        items: {
          orderBy: { position: 'asc' },
          include: { product: { include: { prices: this.activePrice() } } },
        },
      },
    });
    if (!b) throw new NotFoundException('Bundle not found');
    return {
      ...b,
      items: b.items.map((item) => ({
        ...item,
        product: {
          ...item.product,
          prices: item.product.prices.map((price) => this.money(price)),
        },
      })),
    };
  }
  async createCart(userId?: string) {
    const token = randomBytes(32).toString('base64url');
    const cart = await this.db.cart.create({
      data: {
        userId,
        ownerTokenHash: userId ? null : this.hash(token),
        expiresAt: new Date(Date.now() + 30 * 86400000),
      },
    });
    return { cartId: cart.id, ...(userId ? {} : { cartToken: token }), expiresAt: cart.expiresAt };
  }
  async owned(id: string, userId?: string, token?: string) {
    const cart = await this.db.cart.findUnique({
      where: { id },
      include: {
        items: { include: { product: { include: { prices: this.activePrice() } } } },
        coupon: true,
      },
    });
    if (!cart || cart.status !== CartStatus.ACTIVE) throw new NotFoundException('Cart not found');
    const allowed = cart.userId
      ? cart.userId === userId
      : !!token && cart.ownerTokenHash === this.hash(token);
    if (!allowed) throw new ForbiddenException('Cart ownership required');
    return cart;
  }
  async calculate(id: string, userId?: string, token?: string) {
    const cart = await this.owned(id, userId, token);
    let subtotal = 0n;
    const items = cart.items.map((i) => {
      const price = i.product.prices[0];
      if (!price || i.product.status !== ProductStatus.ACTIVE)
        throw new ConflictException('Cart contains unavailable product');
      const total = price.amountMinor * BigInt(i.quantity);
      subtotal += total;
      return {
        itemId: i.id,
        productId: i.productId,
        name: i.product.name,
        quantity: i.quantity,
        unitAmountMinor: price.amountMinor.toString(),
        totalAmountMinor: total.toString(),
      };
    });
    let discount = 0n;
    if (cart.coupon) {
      if (
        !cart.coupon.isActive ||
        cart.coupon.startsAt > new Date() ||
        (cart.coupon.expiresAt && cart.coupon.expiresAt <= new Date())
      )
        throw new ConflictException('Coupon is no longer valid');
      if (cart.coupon.minimumMinor && subtotal < cart.coupon.minimumMinor)
        throw new ConflictException('Coupon minimum not met');
      discount =
        cart.coupon.type === 'PERCENTAGE'
          ? (subtotal * BigInt(cart.coupon.value)) / 10000n
          : BigInt(cart.coupon.value);
      if (discount > subtotal) discount = subtotal;
    }
    return {
      cartId: cart.id,
      currency: cart.currency,
      items,
      subtotalMinor: subtotal.toString(),
      discountMinor: discount.toString(),
      totalMinor: (subtotal - discount).toString(),
      coupon: cart.coupon?.code,
      couponId: cart.couponId,
    };
  }
  async cart(id: string, u?: string, t?: string) {
    return this.calculate(id, u, t);
  }
  async claim(id: string, userId: string, token: string) {
    const cart = await this.db.cart.findUnique({ where: { id } });
    if (!cart || cart.status !== CartStatus.ACTIVE) throw new NotFoundException('Cart not found');
    if (cart.userId) {
      if (cart.userId !== userId) throw new ForbiddenException('Cart ownership required');
      return this.calculate(id, userId);
    }
    if (!cart.ownerTokenHash || cart.ownerTokenHash !== this.hash(token))
      throw new ForbiddenException('Cart ownership required');
    await this.db.cart.update({
      where: { id },
      data: { userId, ownerTokenHash: null },
    });
    return this.calculate(id, userId);
  }
  async add(id: string, d: AddCartItemDto, u?: string, t?: string) {
    await this.owned(id, u, t);
    await this.db.cartItem.upsert({
      where: { cartId_productId: { cartId: id, productId: d.productId } },
      update: { quantity: { increment: d.quantity } },
      create: { cartId: id, productId: d.productId, quantity: d.quantity },
    });
    return this.calculate(id, u, t);
  }
  async quantity(id: string, itemId: string, quantity: number, u?: string, t?: string) {
    await this.owned(id, u, t);
    const r = await this.db.cartItem.updateMany({
      where: { id: itemId, cartId: id },
      data: { quantity },
    });
    if (!r.count) throw new NotFoundException('Cart item not found');
    return this.calculate(id, u, t);
  }
  async remove(id: string, itemId: string, u?: string, t?: string) {
    await this.owned(id, u, t);
    await this.db.cartItem.deleteMany({ where: { id: itemId, cartId: id } });
    return this.calculate(id, u, t);
  }
  async applyCoupon(id: string, code: string, u?: string, t?: string) {
    await this.owned(id, u, t);
    const c = await this.db.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!c) throw new NotFoundException('Coupon not found');
    await this.db.cart.update({ where: { id }, data: { couponId: c.id } });
    return this.calculate(id, u, t);
  }
  async removeCoupon(id: string, u?: string, t?: string) {
    await this.owned(id, u, t);
    await this.db.cart.update({ where: { id }, data: { couponId: null } });
    return this.calculate(id, u, t);
  }
  async order(cartId: string, userId: string, key: string) {
    const existing = await this.db.order.findUnique({
      where: { idempotencyKey: key },
      include: { items: true },
    });
    if (existing) {
      if (existing.userId !== userId) throw new ForbiddenException();
      return this.orderJson(existing);
    }
    return this.db.$transaction(
      async (tx) => {
        const claimed = await tx.cart.updateMany({
          where: { id: cartId, userId, status: CartStatus.ACTIVE },
          data: { status: CartStatus.CONVERTED },
        });
        if (!claimed.count) throw new ConflictException('Cart has already been checked out');
        const cart = await tx.cart.findUnique({
          where: { id: cartId },
          include: {
            items: { include: { product: { include: { prices: this.activePrice() } } } },
            coupon: true,
          },
        });
        if (!cart) throw new NotFoundException('Cart not found');
        const ownedWorkIds = cart.items.flatMap((item) =>
          item.product.workId ? [item.product.workId] : [],
        );
        if (
          ownedWorkIds.length &&
          (await tx.entitlement.count({
            where: {
              userId,
              workId: { in: ownedWorkIds },
              status: 'ACTIVE',
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
          }))
        )
          throw new ConflictException('Cart contains an edition already in your library');
        let subtotal = 0n;
        const items = cart.items.map((item) => {
          const price = item.product.prices[0];
          if (!price || item.product.status !== ProductStatus.ACTIVE)
            throw new ConflictException('Cart contains unavailable product');
          const total = price.amountMinor * BigInt(item.quantity);
          subtotal += total;
          return {
            itemId: item.id,
            productId: item.productId,
            name: item.product.name,
            quantity: item.quantity,
            unitAmountMinor: price.amountMinor.toString(),
            totalAmountMinor: total.toString(),
          };
        });
        let discount = 0n;
        if (cart.coupon) {
          if (
            !cart.coupon.isActive ||
            cart.coupon.startsAt > new Date() ||
            (cart.coupon.expiresAt && cart.coupon.expiresAt <= new Date())
          )
            throw new ConflictException('Coupon is no longer valid');
          if (cart.coupon.minimumMinor && subtotal < cart.coupon.minimumMinor)
            throw new ConflictException('Coupon minimum not met');
          discount =
            cart.coupon.type === 'PERCENTAGE'
              ? (subtotal * BigInt(cart.coupon.value)) / 10000n
              : BigInt(cart.coupon.value);
          if (discount > subtotal) discount = subtotal;
        }
        const quote = {
          currency: cart.currency,
          subtotalMinor: subtotal.toString(),
          discountMinor: discount.toString(),
          totalMinor: (subtotal - discount).toString(),
          couponId: cart.couponId,
          items,
        };
        const order = await tx.order.create({
          data: {
            userId,
            cartId,
            idempotencyKey: key,
            currency: quote.currency,
            subtotalMinor: BigInt(quote.subtotalMinor),
            discountMinor: BigInt(quote.discountMinor),
            totalMinor: BigInt(quote.totalMinor),
            couponId: quote.couponId,
            items: {
              create: quote.items.map((i) => ({
                productId: i.productId,
                productName: i.name,
                quantity: i.quantity,
                unitAmountMinor: BigInt(i.unitAmountMinor),
                totalAmountMinor: BigInt(i.totalAmountMinor),
              })),
            },
          },
          include: { items: true },
        });
        return this.orderJson(order);
      },
      { isolationLevel: 'Serializable' },
    );
  }
  private orderJson(o: Prisma.OrderGetPayload<{ include: { items: true } }>) {
    return {
      ...o,
      subtotalMinor: o.subtotalMinor.toString(),
      discountMinor: o.discountMinor.toString(),
      totalMinor: o.totalMinor.toString(),
      items: o.items.map((i) => ({
        ...i,
        unitAmountMinor: i.unitAmountMinor.toString(),
        totalAmountMinor: i.totalAmountMinor.toString(),
      })),
    };
  }
  async getOrder(id: string, userId: string, roles: string[]) {
    const o = await this.db.order.findUnique({ where: { id }, include: { items: true } });
    if (!o) throw new NotFoundException('Order not found');
    if (o.userId !== userId && !roles.some((r) => r === 'admin')) throw new ForbiddenException();
    return this.orderJson(o);
  }
  async myOrders(userId: string) {
    const os = await this.db.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return os.map((o) => this.orderJson(o));
  }
  async cancel(id: string, userId: string) {
    const o = await this.db.order.findFirst({ where: { id, userId } });
    if (!o) throw new NotFoundException('Order not found');
    if (o.status !== OrderStatus.PENDING_PAYMENT)
      throw new ConflictException('Order cannot be cancelled');
    const cancelled = await this.db.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
      include: { items: true },
    });
    return this.orderJson(cancelled);
  }
  async adminProducts() {
    const products = await this.db.product.findMany({
      include: { prices: { orderBy: { startsAt: 'desc' } } },
    });
    return products.map((product) => ({
      ...product,
      prices: product.prices.map((price) => this.money(price)),
    }));
  }
  async adminOrders(query?: string, status?: OrderStatus) {
    const exactOrderId = query && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(query) ? query : undefined;
    const orders = await this.db.order.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(query
          ? {
              OR: [
                ...(exactOrderId ? [{ id: exactOrderId }] : []),
                { user: { email: { contains: query, mode: 'insensitive' as const } } },
                { user: { phone: { contains: query } } },
              ],
            }
          : {}),
      },
      include: {
        user: { select: { email: true, phone: true, profile: { select: { displayName: true } } } },
        items: true,
        payments: { select: { id: true, status: true } },
        refunds: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return orders.map((order) => ({
      ...this.orderJson(order),
      user: order.user,
      payments: order.payments,
      refunds: order.refunds,
    }));
  }
  async adminOrder(id: string) {
    const order = await this.db.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            profile: { select: { displayName: true } },
          },
        },
        items: true,
        payments: { orderBy: { createdAt: 'desc' } },
        refunds: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    const paymentIds = order.payments.map((payment) => payment.id);
    const entitlements = paymentIds.length
      ? await this.db.entitlement.findMany({
          where: { sourceType: 'PAYMENT', sourceId: { in: paymentIds } },
          select: {
            id: true,
            workId: true,
            status: true,
            startsAt: true,
            expiresAt: true,
            revokedAt: true,
          },
        })
      : [];
    return {
      ...this.orderJson(order),
      user: order.user,
      payments: order.payments.map((payment) => ({
        ...payment,
        amountMinor: payment.amountMinor.toString(),
      })),
      refunds: order.refunds.map((refund) => ({
        ...refund,
        amountMinor: refund.amountMinor.toString(),
      })),
      entitlements,
    };
  }
  createProduct(d: CreateProductDto) {
    return this.db.product.create({ data: d });
  }
  updateProduct(id: string, d: UpdateProductDto) {
    return this.db.product.update({ where: { id }, data: d });
  }
  async price(id: string, d: CreatePriceDto) {
    const price = await this.db.productPrice.create({
      data: {
        productId: id,
        amountMinor: BigInt(d.amountMinor),
        currency: d.currency,
        startsAt: new Date(d.startsAt),
        endsAt: d.endsAt ? new Date(d.endsAt) : undefined,
      },
    });
    return this.money(price);
  }
  bundleCreate(d: CreateBundleDto) {
    return this.db.bundle.create({
      data: {
        name: d.name,
        description: d.description,
        status: ProductStatus.ACTIVE,
        items: { create: d.productIds.map((productId, i) => ({ productId, position: i + 1 })) },
      },
    });
  }
  couponCreate(d: CreateCouponDto) {
    return this.db.coupon.create({
      data: {
        code: d.code.toUpperCase(),
        type: d.type,
        value: d.value,
        currency: d.currency,
        startsAt: new Date(d.startsAt),
        expiresAt: d.expiresAt ? new Date(d.expiresAt) : undefined,
      },
    });
  }
}
