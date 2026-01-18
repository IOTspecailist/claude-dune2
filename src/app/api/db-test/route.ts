import { NextResponse } from "next/server";
import { Pool } from "pg";

const globalForPg = globalThis as unknown as { pgPool?: Pool };

const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
  });

if (!globalForPg.pgPool) globalForPg.pgPool = pool;

export async function GET() {
  if (!process.env.POSTGRES_URL) {
    return NextResponse.json(
      { ok: false, error: "POSTGRES_URL is missing" },
      { status: 500 }
    );
  }

  const r = await pool.query("select 1 as ok");
  return NextResponse.json({ ok: true, result: r.rows[0] });
}
