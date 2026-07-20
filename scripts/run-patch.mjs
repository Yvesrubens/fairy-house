// Exécute un fichier SQL arbitraire sur la base via une chaîne de connexion Postgres.
// Usage : node scripts/run-patch.mjs supabase/patch-2026-07-lot2.sql "postgresql://...:5432/postgres"
// (la chaîne de connexion peut aussi être fournie via la variable DATABASE_URL)
import { readFile } from 'node:fs/promises'
import pg from 'pg'

const file = process.argv[2]
const conn = process.argv[3] || process.env.DATABASE_URL

if (!file) {
  console.error('Fichier SQL manquant. Usage: node scripts/run-patch.mjs <fichier.sql> "postgresql://..."')
  process.exit(1)
}
if (!conn) {
  console.error('Chaîne de connexion manquante. Passez-la en 2e argument ou via DATABASE_URL.')
  process.exit(1)
}

const sql = await readFile(new URL(`../${file}`, import.meta.url), 'utf8')
const client = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })

try {
  await client.connect()
  await client.query(sql)
  console.log(`✅ ${file} exécuté avec succès.`)
} catch (err) {
  console.error('❌ Erreur:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
