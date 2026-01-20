const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const sql = fs.readFileSync(
    path.join(__dirname, "../sql/init.sql"),
    "utf8"
  );

  try {
    const result = await pool.query(sql);
    console.log("✅ 테이블 생성 및 데이터 삽입 완료!");
    console.log("\n📦 삽입된 데이터:");
    console.table(result[result.length - 1].rows);
  } catch (err) {
    console.error("❌ 오류:", err.message);
  } finally {
    await pool.end();
  }
}

run();
