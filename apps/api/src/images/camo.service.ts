import { createHmac } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env';

/**
 * Builds signed go-camo proxy URLs: <base>/<hmac-sha1 hex>/<url hex>.
 * The HMAC key is shared with the go-camo container so it can verify signatures.
 */
@Injectable()
export class CamoService {
  private readonly key: string;
  private readonly baseUrl: string;

  constructor(config: ConfigService<Env, true>) {
    this.key = config.get('CAMO_HMAC_KEY');
    this.baseUrl = config.get('CAMO_BASE_URL').replace(/\/$/, '');
  }

  sign(url: string): string {
    const digest = createHmac('sha1', this.key).update(url).digest('hex');
    const encodedUrl = Buffer.from(url, 'utf8').toString('hex');
    return `${this.baseUrl}/${digest}/${encodedUrl}`;
  }
}
