import { Redis } from '@upstash/redis';

function normalizeEnv(value?: string) {
  return String(value ?? '').trim().replace(/^['\"]|['\"]$/g, '');
}

const REDIS_URL = normalizeEnv(process.env.UPSTASH_REDIS_REST_URL);
const REDIS_TOKEN = normalizeEnv(process.env.UPSTASH_REDIS_REST_TOKEN);

function getRedisClient() {
  if (!REDIS_URL || !REDIS_TOKEN) {
    throw new Error('Missing Upstash Redis configuration');
  }

  return new Redis({
    url: REDIS_URL,
    token: REDIS_TOKEN,
  });
}

export async function redisGet(key: string): Promise<string | null> {
  const redis = getRedisClient();
  const result = await redis.get<unknown>(key);

  if (result == null) {
    return null;
  }

  return typeof result === 'string' ? result : JSON.stringify(result);
}

export async function redisSet(key: string, value: string): Promise<void> {
  const redis = getRedisClient();
  await redis.set(key, value);
}
