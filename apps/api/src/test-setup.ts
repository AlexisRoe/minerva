// Hermetic defaults so config validation passes in unit/e2e tests without a .env file.
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
process.env.DATABASE_URL_RO ??= 'postgresql://test:test@localhost:5432/test';
process.env.VALKEY_URL ??= 'redis://:test@localhost:6379/0';
process.env.AWS_ACCESS_KEY_ID ??= 'test';
process.env.AWS_SECRET_ACCESS_KEY ??= 'test';
process.env.S3_ENDPOINT ??= 'http://localhost:4566';
process.env.S3_BUCKET ??= 'test-bucket';
process.env.CAMO_HMAC_KEY ??= 'test-key-0123';
process.env.CAMO_BASE_URL ??= 'http://localhost:8443';
process.env.API_TLS ??= 'false';
