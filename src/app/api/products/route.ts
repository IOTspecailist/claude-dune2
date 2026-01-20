import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// GET /api/products - 전체 상품 조회
export async function GET() {
  try {
    const result = await pool.query(
      "SELECT * FROM products ORDER BY id ASC"
    );
    return NextResponse.json({ ok: true, products: result.rows });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/products - 새 상품 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, price, stock, category } = body;

    if (!name || price === undefined) {
      return NextResponse.json(
        { ok: false, error: "name과 price는 필수입니다" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO products (name, price, stock, category)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, price, stock ?? 0, category ?? null]
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
