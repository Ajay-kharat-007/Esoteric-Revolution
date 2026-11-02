import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  constructor(config: ConfigService) {
    this.client = new Redis(config.getOrThrow<string>('redis.url'), {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
  }
  async ping(): Promise<boolean> {
    if (this.client.status === 'wait' || this.client.status === 'end') await this.client.connect();
    return (await this.client.ping()) === 'PONG';
  }
  onModuleDestroy(): void {
    if (this.client.status !== 'end') this.client.disconnect();
  }
}
