export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

export function formatEuro(n: number): string {
  // toLocaleString('fr-FR') uses a narrow no-break space as thousands
  // separator; normalise it to a regular space for stable output.
  const grouped = Math.round(n)
    .toLocaleString('fr-FR')
    .replace(/[  ]/g, ' ')
  return `${grouped}€`
}

// Montant avec 2 décimales (ex. « 6,36 € ») — pour les prix comportant des
// centimes (devis TTC, TVA détaillée), là où formatEuro arrondit à l'entier.
export function formatEuro2(n: number): string {
  const grouped = n.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${grouped} €`
}

export function toCSV(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const esc = (v: string | number) => {
    const s = String(v)
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers.join(',')]
  for (const r of rows) lines.push(headers.map((h) => esc(r[h])).join(','))
  return lines.join('\r\n')
}

export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
