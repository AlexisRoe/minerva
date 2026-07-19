import { createHmac } from 'node:crypto';
import type { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env';
import { CamoService } from './camo.service';

const configStub = {
  get(key: 'CAMO_HMAC_KEY' | 'CAMO_BASE_URL') {
    return { CAMO_HMAC_KEY: 'test-key-0123', CAMO_BASE_URL: 'http://localhost:8443/' }[key];
  },
} as unknown as ConfigService<Env, true>;

describe('CamoService', () => {
  it('signs urls in the go-camo <base>/<hmac hex>/<url hex> format', () => {
    const service = new CamoService(configStub);
    const url = 'https://example.com/image.png';

    const signed = service.sign(url);
    const [digest, encodedUrl] = signed.replace('http://localhost:8443/', '').split('/');

    expect(digest).toBe(createHmac('sha1', 'test-key-0123').update(url).digest('hex'));
    expect(Buffer.from(encodedUrl ?? '', 'hex').toString('utf8')).toBe(url);
  });
});
