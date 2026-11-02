import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class NotificationManagementService {
  constructor(private readonly db: PrismaService) {}

  private visibleToUser(audience: unknown, userId: string, roles: string[]) {
    const value = audience as Record<string, unknown>;
    const users = Array.isArray(value['userIds']) ? value['userIds'] : [];
    const targetRoles = Array.isArray(value['roles']) ? value['roles'] : [];
    return (
      value['all'] === true ||
      users.includes(userId) ||
      targetRoles.some((role) => typeof role === 'string' && roles.includes(role))
    );
  }

  private async assertAccessible(notificationId: string, userId: string, roles: string[]) {
    const row = await this.db.notification.findFirst({
      where: {
        id: notificationId,
        status: 'SENT',
        OR: [{ sentAt: null }, { sentAt: { lte: new Date() } }],
      },
      select: { id: true, audience: true },
    });
    if (!row) throw new NotFoundException('Notification not found');
    if (!this.visibleToUser(row.audience, userId, roles))
      throw new ForbiddenException('Notification is not available to this user');
    return row;
  }

  async markRead(notificationId: string, userId: string, roles: string[]) {
    await this.assertAccessible(notificationId, userId, roles);
    return this.db.userNotificationState.upsert({
      where: { userId_notificationId: { userId, notificationId } },
      update: { readAt: new Date(), deletedAt: null },
      create: { userId, notificationId, readAt: new Date() },
    });
  }

  async markAllRead(userId: string, roles: string[]) {
    const rows = await this.db.notification.findMany({
      where: { status: 'SENT', OR: [{ sentAt: null }, { sentAt: { lte: new Date() } }] },
      select: { id: true, audience: true },
    });
    const ids = rows
      .filter((row) => this.visibleToUser(row.audience, userId, roles))
      .map((row) => row.id);
    if (!ids.length) return { updated: 0 };
    const now = new Date();
    await this.db.$transaction(
      ids.map((notificationId) =>
        this.db.userNotificationState.upsert({
          where: { userId_notificationId: { userId, notificationId } },
          update: { readAt: now, deletedAt: null },
          create: { userId, notificationId, readAt: now },
        }),
      ),
    );
    return { updated: ids.length };
  }

  async remove(notificationId: string, userId: string, roles: string[]) {
    await this.assertAccessible(notificationId, userId, roles);
    const state = await this.db.userNotificationState.upsert({
      where: { userId_notificationId: { userId, notificationId } },
      update: { deletedAt: new Date() },
      create: { userId, notificationId, deletedAt: new Date() },
    });
    return { id: state.notificationId, deleted: true };
  }
}
