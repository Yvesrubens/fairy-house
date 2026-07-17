// Exécute supabase/schema.sql sur la base via une chaîne de connexion Postgres.
// Usage : node scripts/run-schema.mjs "postgresql://...:5432/postgres"
import { readFile } from 'node:fs/promises'
import pg from 'pg'

const conn = process.argv[2] || process.env.DATABASE_URL
if (!conn) {
  console.error('Chaîne de connexion manquante. Usage: node scripts/run-schema.mjs "postgresql://..."')
  process.exit(1)
}

const sql = await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8')
const client = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })

try {
  await client.connect()
  await client.query(sql)
  console.log('✅ Schéma exécuté avec succès.')
} catch (err) {
  console.error('❌ Erreur:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
