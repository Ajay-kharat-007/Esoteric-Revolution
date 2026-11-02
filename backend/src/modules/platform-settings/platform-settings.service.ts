import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { UpdatePlatformSettingsDto } from './platform-settings.dto';

@Injectable()
export class PlatformSettingsService {
  constructor(private readonly db: PrismaService) {}

  async publicSettings() {
    const rows = await this.db.setting.findMany({
      where: { isSecret: false },
      orderBy: { key: 'asc' },
      select: { key: true, value: true, updatedAt: true },
    });
    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  }

  async adminSettings() {
    const rows = await this.db.setting.findMany({ orderBy: { key: 'asc' } });
    return rows.map((row) => ({
      key: row.key,
      value: row.isSecret ? null : row.value,
      isSecret: row.isSecret,
      hasValue: row.value !== null,
      updatedAt: row.updatedAt,
    }));
  }

  async update(dto: UpdatePlatformSettingsDto) {
    const rows = await this.db.$transaction(
      dto.settings.map((entry) =>
        this.db.setting.upsert({
          where: { key: entry.key },
          update: {
            value: entry.value as Prisma.InputJsonValue,
            isSecret: entry.isSecret ?? false,
          },
          create: {
            key: entry.key,
            value: entry.value as Prisma.InputJsonValue,
            isSecret: entry.isSecret ?? false,
          },
        }),
      ),
    );
    return rows.map((row) => ({
      key: row.key,
      value: row.isSecret ? null : row.value,
      isSecret: row.isSecret,
      hasValue: true,
      updatedAt: row.updatedAt,
    }));
  }
}
