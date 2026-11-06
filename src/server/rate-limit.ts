type Bucket = {
  hits: number[];
};

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 5000;

/**
 * Small in-memory sliding window. It protects a single Node process; on
 * serverless platforms each instance keeps its own counters, which is still
 * enough to stop casual form flooding.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((time) => now - time < windowMs);

  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket);
    return false;
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);

  if (buckets.size > MAX_BUCKETS) {
    for (const [bucketKey, value] of buckets) {
      if (value.hits.length === 0) buckets.delete(bucketKey);
      if (buckets.size <= MAX_BUCKETS / 2) break;
    }
  }

  return true;
}

/** Checks a bucket without recording a hit. */
export function isRateLimited(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket) return false;

  bucket.hits = bucket.hits.filter((time) => now - time < windowMs);
  buckets.set(key, bucket);

  return bucket.hits.length >= limit;
}

/** Forgets a bucket, for example after a successful login. */
export function clearRateLimit(key: string): void {
  buckets.delete(key);
}
