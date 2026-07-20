import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import type { Env } from '../config/env';

@Injectable()
export class ValkeyService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(config: ConfigService<Env, true>) {
    this.client = new Redis(config.get('VALKEY_URL'), {
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
    });
  }

  /** Appends an event to a stream, returns the stream entry id. */
  async publish(stream: string, payload: object): Promise<string> {
    const id = await this.client.xadd(stream, '*', 'payload', JSON.stringify(payload));
    if (!id) {
      throw new Error(`XADD to ${stream} returned no id`);
    }
    return id;
  }

  async isHealthy(): Promise<boolean> {
    try {
      return (await this.client.ping()) === 'PONG';
    } catch {
      return false;
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
