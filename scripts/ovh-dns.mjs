// Pose les enregistrements DNS chez OVH (site Vercel + emails Resend).
// Clés lues depuis l'environnement : OVH_AK, OVH_AS, OVH_CK
import crypto from 'node:crypto'

const AK = process.env.OVH_AK
const AS = process.env.OVH_AS
const CK = process.env.OVH_CK
const BASE = 'https://eu.api.ovh.com/1.0'

let timeDelta = 0
async function syncTime() {
  const r = await fetch(BASE + '/auth/time')
  const serverTime = Number(await r.text())
  timeDelta = serverTime - Math.floor(Date.now() / 1000)
}

async function ovh(method, path, body) {
  const url = BASE + path
  const bodyStr = body ? JSON.stringify(body) : ''
  const ts = Math.floor(Date.now() / 1000) + timeDelta
  const toSign = [AS, CK, method, url, bodyStr, ts].join('+')
  const sig = '$1$' + crypto.createHash('sha1').update(toSign).digest('hex')
  const res = await fetch(url, {
    method,
    headers: {
      'X-Ovh-Application': AK,
      'X-Ovh-Consumer': CK,
      'X-Ovh-Timestamp': String(ts),
      'X-Ovh-Signature': sig,
      'Content-Type': 'application/json',
    },
    body: bodyStr || undefined,
  })
  const txt = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${txt}`)
  return txt ? JSON.parse(txt) : null
}

// Supprime tous les enregistrements d'un sous-domaine (sauf NS/SOA),
// ou seulement certains types si `types` est fourni.
async function clearSub(zone, sub, types) {
  const ids = await ovh('GET', `/domain/zone/${zone}/record`)
  for (const id of ids) {
    const rec = await ovh('GET', `/domain/zone/${zone}/record/${id}`)
    if (rec.subDomain !== sub) continue
    if (['NS', 'SOA'].includes(rec.fieldType)) continue
    if (types && !types.includes(rec.fieldType)) continue
    await ovh('DELETE', `/domain/zone/${zone}/record/${id}`)
    console.log(`  supprimé ${rec.fieldType} "${sub}" (#${id})`)
  }
}

async function add(zone, fieldType, subDomain, target, priority) {
  const body = { fieldType, subDomain, target, ttl: 3600 }
  await ovh('POST', `/domain/zone/${zone}/record`, body)
  console.log(`  ajouté ${fieldType} "${subDomain}" -> ${target}${priority ? ' (prio ' + priority + ')' : ''}`)
}

const DKIM =
  'p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC0X7DbxCon85Fm3OUEditbjKeDpQTorTZn5Hp9osazm+b7V4N8UUpqqBt3RxbKWY/RNZ1QiqYZfdpjXiMUljebl1+Bm201kgtrw/bJyAE4eO+BvjfghKGM118sAhcm06mcGKyjbF2mnBI3zj/OanlQIBbALdbRY5zJBoyaTTp0ywIDAQAB'

async function run() {
  await syncTime()

  // ---- fairyhousecollectif.com ----
  const com = 'fairyhousecollectif.com'
  console.log(`\n=== ${com} ===`)
  await clearSub(com, '', ['A', 'AAAA']) // racine : ne toucher qu'aux A/AAAA
  await clearSub(com, 'www') // www : tout nettoyer pour le CNAME
  await clearSub(com, 'resend._domainkey')
  await clearSub(com, 'send')
  await add(com, 'A', '', '76.76.21.21')
  await add(com, 'CNAME', 'www', 'cname.vercel-dns.com.')
  await add(com, 'TXT', 'resend._domainkey', DKIM)
  await add(com, 'MX', 'send', '10 feedback-smtp.eu-west-1.amazonses.com.', 10)
  await add(com, 'TXT', 'send', 'v=spf1 include:amazonses.com ~all')
  await ovh('POST', `/domain/zone/${com}/refresh`)
  console.log('  zone rafraîchie')

  // ---- fairyhousecollectif.fr ----
  const fr = 'fairyhousecollectif.fr'
  console.log(`\n=== ${fr} ===`)
  await clearSub(fr, '', ['A', 'AAAA'])
  await clearSub(fr, 'www')
  await add(fr, 'A', '', '76.76.21.21')
  await add(fr, 'CNAME', 'www', 'cname.vercel-dns.com.')
  await ovh('POST', `/domain/zone/${fr}/refresh`)
  console.log('  zone rafraîchie')

  console.log('\n✅ Tous les enregistrements sont posés.')
}

run().catch((e) => {
  console.error('❌', e.message)
  process.exit(1)
})
