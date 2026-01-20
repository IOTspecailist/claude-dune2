// 간단한 메모리 기반 Rate Limiter
// 서버리스 환경에서는 인스턴스별로 동작하지만 기본 보호 제공

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// 설정: 1분에 최대 30회 요청
const WINDOW_MS = 60 * 1000; // 1분
const MAX_REQUESTS = 30;

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  // 오래된 엔트리 정리 (메모리 관리)
  if (rateLimitMap.size > 10000) {
    const keysToDelete: string[] = [];
    rateLimitMap.forEach((value, key) => {
      if (value.resetTime < now) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => rateLimitMap.delete(key));
  }

  if (!entry || entry.resetTime < now) {
    // 새 윈도우 시작
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_REQUESTS - entry.count };
}
