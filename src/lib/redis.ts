const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL ?? '';
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? '';

export async function redisGet(key: string): Promise<string | null> {
  if (!REDIS_URL || !REDIS_TOKEN) return null;
  const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    cache: 'no-store',
  });
  const data = await res.json() as { result: string | null };
  return typeof data.result === 'string' ? data.result : null;
}

export async function redisSet(key: string, value: string): Promise<void> {
  if (!REDIS_URL || !REDIS_TOKEN) return;
  await fetch(REDIS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(['SET', key, value]),
  });
}
