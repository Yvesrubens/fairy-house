// Ouvre un PDF encodé en base64 dans un nouvel onglet (aperçu avant envoi).
export function openPdfBase64(base64: string): void {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  // Libère l'URL après un délai laissant le temps au navigateur d'ouvrir l'onglet.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
