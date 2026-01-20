import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyApiKey, unauthorizedResponse } from "@/lib/auth";

// IP 주소 추출
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

// GET /api/products - 전체 상품 조회
export async function GET(request: NextRequest) {
  // Rate Limit 체크
  const ip = getClientIP(request);
  const rateLimit = checkRateLimit(ip);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again later." },
      { status: 429, headers: { "X-RateLimit-Remaining": "0" } }
    );
  }

  try {
    // 페이지네이션 (최대 100개로 제한)
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const result = await pool.query(
      "SELECT * FROM products ORDER BY id ASC LIMIT $1 OFFSET $2",
      [limit, offset]
    );

    return NextResponse.json(
      { ok: true, products: result.rows },
      { headers: { "X-RateLimit-Remaining": String(rateLimit.remaining) } }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/products - 새 상품 생성 (인증 필요)
export async function POST(request: NextRequest) {
  // Rate Limit 체크
  const ip = getClientIP(request);
  const rateLimit = checkRateLimit(ip);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  // API Key 인증
  if (!verifyApiKey(request)) {
    return NextResponse.json(unauthorizedResponse(), { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, price, stock, category } = body;

    // 입력 검증 강화
    if (!name || typeof name !== "string" || name.length > 100) {
      return NextResponse.json(
        { ok: false, error: "name은 1-100자 문자열이어야 합니다" },
        { status: 400 }
      );
    }

    if (price === undefined || typeof price !== "number" || price < 0 || price > 99999999) {
      return NextResponse.json(
        { ok: false, error: "price는 0-99999999 범위의 숫자여야 합니다" },
        { status: 400 }
      );
    }

    const safeStock = Math.max(0, Math.min(parseInt(stock) || 0, 999999));
    const safeCategory = category && typeof category === "string"
      ? category.slice(0, 50)
      : null;

    const result = await pool.query(
      `INSERT INTO products (name, price, stock, category)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name.slice(0, 100), price, safeStock, safeCategory]
    );

    return NextResponse.json(
      { ok: true, product: result.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}
