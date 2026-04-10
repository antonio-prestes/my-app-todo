import postgres from "postgres";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL não encontrada no .env.local");
  process.exit(1);
}

const sql = postgres(databaseUrl);

async function setup() {
  console.log("🚀 Iniciando configuração do Supabase...");
  
  try {
    const sqlPath = path.join(process.cwd(), "src/db/setup.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf-8");

    // Execute the SQL plan
    // postgres-js allows running multiple statements in one call if configured, 
    // but often it's better to split by ; or just run as a block.
    // For simplicity with this driver, we run the whole string.
    await sql.unsafe(sqlContent);

    console.log("✅ Configuração concluída com sucesso (Buckets e RLS)!");
  } catch (error) {
    console.error("❌ Erro ao configurar Supabase:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

setup();
