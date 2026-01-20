import { NextRequest } from "next/server";

// 쓰기 작업(POST/PUT/DELETE)에 API Key 인증 필요
// 환경변수 API_SECRET_KEY 설정 필요

export function verifyApiKey(request: NextRequest): boolean {
  const apiKey = process.env.API_SECRET_KEY;

  // API_SECRET_KEY가 설정되지 않으면 인증 비활성화 (개발 편의)
  if (!apiKey) {
    return true;
  }

  // 같은 사이트에서 오는 요청 허용 (브라우저 fetch)
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  if (host) {
    const hostDomain = host.split(":")[0];
    if (origin) {
      try {
        const originDomain = new URL(origin).hostname;
        if (originDomain === hostDomain || originDomain === "localhost") {
          return true;
        }
      } catch {}
    }
    if (referer) {
      try {
        const refererDomain = new URL(referer).hostname;
        if (refererDomain === hostDomain || refererDomain === "localhost") {
          return true;
        }
      } catch {}
    }
  }

  // 외부 요청은 API Key 필요
  const authHeader = request.headers.get("x-api-key");
  return authHeader === apiKey;
}

export function unauthorizedResponse() {
  return {
    ok: false,
    error: "Unauthorized: Invalid or missing API key",
  };
}
