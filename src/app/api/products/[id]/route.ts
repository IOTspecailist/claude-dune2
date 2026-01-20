import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// GET /api/products/[id] - 단일 상품 조회
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const result = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [id]
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

// PUT /api/products/[id] - 상품 수정
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, price, stock, category } = body;

    const result = await pool.query(
      `UPDATE products
       SET name = COALESCE($1, name),
           price = COALESCE($2, price),
           stock = COALESCE($3, stock),
           category = COALESCE($4, category)
       WHERE id = $5
       RETURNING *`,
      [name, price, stock, category, id]
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

// DELETE /api/products/[id] - 상품 삭제
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING *",
      [id]
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
