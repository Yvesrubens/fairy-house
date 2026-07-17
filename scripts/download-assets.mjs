import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const BASE = 'https://prod.afrikscout.com'
const OUT = new URL('../public/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

const files = [
  'logo-fonce-bg.png',
  'logo-clair-bg.png',
  'photo/Vue_coucher_de_soleil.jpg',
  'photo/PXL_20260101_081856561.jpg',
  'photo/Chambre_Litha.jpg',
  'photo/Chambre_Mabbon.jpg',
  'photo/Chambre_Imbolc.jpg',
  'PXL_20260320_085953235.jpg',
  'photo/Vue_d_ensemble.jpg',
  'photo/Chill_Room.jpg',
  'photo/Ostara_1.jpg',
]

async function dl(rel) {
  const url = `${BASE}/${rel}`
  const res = await fetch(url)
  if (!res.ok) { console.error('FAIL', res.status, rel); return }
  const buf = Buffer.from(await res.arrayBuffer())
  const dest = join(OUT, rel)
  await mkdir(dirname(dest), { recursive: true })
  await writeFile(dest, buf)
  console.log('OK', rel, (buf.length / 1024).toFixed(0) + 'kb')
}

for (let i = 0; i < files.length; i += 4) {
  await Promise.all(files.slice(i, i + 4).map(dl))
}
console.log('Done ->', OUT)
