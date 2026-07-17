// Crée un compte admin : signup via GoTrue (hachage correct) puis confirmation
// + insertion dans la table admins via connexion Postgres directe.
// Usage: node scripts/create-admin.mjs <connString> <email> <password> <fullName>
import { createClient } from '@supabase/supabase-js'
import pg from 'pg'
import { readFile } from 'node:fs/promises'

const [, , conn, email, password, fullName] = process.argv
if (!conn || !email || !password || !fullName) {
  console.error('Usage: node scripts/create-admin.mjs <connString> <email> <password> <fullName>')
  process.exit(1)
}

// Lire URL + anon key depuis .env
const env = await readFile(new URL('../.env', import.meta.url), 'utf8')
const get = (k) => env.match(new RegExp(`${k}=(.*)`))?.[1]?.trim()
const supabase = createClient(get('VITE_SUPABASE_URL'), get('VITE_SUPABASE_ANON_KEY'))

// 1) Signup (crée l'utilisateur avec hachage et identité corrects)
const { error: sErr } = await supabase.auth.signUp({ email, password })
if (sErr && !/already registered|already exists/i.test(sErr.message)) {
  console.error('❌ signup:', sErr.message)
  process.exit(1)
}
console.log(sErr ? 'ℹ️ utilisateur déjà existant, on continue' : '✅ utilisateur auth créé')

// 2) Confirmer l'email + insérer dans admins
const client = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })
await client.connect()
await client.query(
  `update auth.users set email_confirmed_at = now() where email = $1 and email_confirmed_at is null`,
  [email],
)
await client.query(
  `insert into admins (id, email, full_name)
   select id, $2, $3 from auth.users where email = $1
   on conflict (id) do update set full_name = excluded.full_name`,
  [email, email, fullName],
)
const check = await client.query('select email, full_name from admins where email = $1', [email])
console.log('✅ admin:', JSON.stringify(check.rows[0]))
await client.end()
