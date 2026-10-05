type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  scope: string;
  limit: number;
  windowMs: number;
  key?: string;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();
let lastCleanup = 0;

function requestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 128);
  }

  const real = request.headers.get("x-real-ip")?.trim();
  return real ? real.slice(0, 128) : "unknown";
}

function cleanup(now: number) {
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function checkRateLimit(
  request: Request,
  options: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  const identity = options.key?.trim().slice(0, 256) || requestIp(request);
  const key = `${options.scope}:${identity}`;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(0, options.limit - 1),
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
      resetAt,
    };
  }

  if (existing.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  buckets.set(key, existing);

  return {
    allowed: true,
    remaining: Math.max(0, options.limit - existing.count),
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    resetAt: existing.resetAt,
  };
}

export function rateLimitHeaders(result: RateLimitResult) {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    ...(result.allowed
      ? {}
      : { "Retry-After": String(result.retryAfterSeconds) }),
  };
}
