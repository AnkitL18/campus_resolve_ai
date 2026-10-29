
import "dotenv/config";
import mariadb from "mariadb";

async function main() {
  const pool = mariadb.createPool({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT ?? 3306),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    connectionLimit: 2,
    connectTimeout: 5000,
    acquireTimeout: 8000,
    allowPublicKeyRetrieval: true,
  });

  try {
    const rows = await pool.query(
  "SELECT USER() AS connected_user, DATABASE() AS database_name"
);

    console.log("Database connection successful!");
    console.log(rows);
  } catch (error) {
    console.error("Database connection failed:", error);
  } finally {
    await pool.end();
  }
}

main();
