import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyApiKey, unauthorizedResponse } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// IP 주소 추출
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

// ID 검증 (숫자만 허용)
function validateId(id: string): number | null {
  const num = parseInt(id);
  if (isNaN(num) || num < 1 || num > 2147483647) {
    return null;
  }
  return num;
}

// GET /api/products/[id] - 단일 상품 조회
export async function GET(request: NextRequest, { params }: Params) {
  const ip = getClientIP(request);
  const rateLimit = checkRateLimit(ip);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { id } = await params;
    const validId = validateId(id);

    if (validId === null) {
      return NextResponse.json(
        { ok: false, error: "Invalid ID format" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [validId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: "상품을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, product: result.rows[0] });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - 상품 수정 (인증 필요)
export async function PUT(request: NextRequest, { params }: Params) {
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
    const { id } = await params;
    const validId = validateId(id);

    if (validId === null) {
      return NextResponse.json(
        { ok: false, error: "Invalid ID format" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, price, stock, category } = body;

    // 입력 검증
    const safeName = name && typeof name === "string" ? name.slice(0, 100) : null;
    const safePrice = typeof price === "number" && price >= 0 && price <= 99999999 ? price : null;
    const safeStock = typeof stock === "number" ? Math.max(0, Math.min(stock, 999999)) : null;
    const safeCategory = category && typeof category === "string" ? category.slice(0, 50) : null;

    const result = await pool.query(
      `UPDATE products
       SET name = COALESCE($1, name),
           price = COALESCE($2, price),
           stock = COALESCE($3, stock),
           category = COALESCE($4, category)
       WHERE id = $5
       RETURNING *`,
      [safeName, safePrice, safeStock, safeCategory, validId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: "상품을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, product: result.rows[0] });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - 상품 삭제 (인증 필요)
export async function DELETE(request: NextRequest, { params }: Params) {
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
    const { id } = await params;
    const validId = validateId(id);

    if (validId === null) {
      return NextResponse.json(
        { ok: false, error: "Invalid ID format" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING *",
      [validId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: "상품을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, deleted: result.rows[0] });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}
