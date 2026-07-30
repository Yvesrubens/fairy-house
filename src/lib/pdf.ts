// Crée une URL blob pour un PDF encodé en base64.
export function pdfBlobUrl(base64: string): string {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  const blob = new Blob([bytes], { type: 'application/pdf' })
  return URL.createObjectURL(blob)
}

// Affiche un PDF (aperçu avant envoi). `win` = fenêtre déjà ouverte dans le geste
// utilisateur (évite le blocage de pop-up quand on l'ouvre après un await). En
// l'absence de fenêtre, tente `window.open`, puis retombe sur un téléchargement.
export function openPdfBase64(base64: string, win?: Window | null): void {
  const url = pdfBlobUrl(base64)
  if (win) {
    win.location.href = url
  } else {
    const w = window.open(url, '_blank')
    if (!w) {
      const a = document.createElement('a')
      a.href = url
      a.download = 'document.pdf'
      a.click()
    }
  }
  // Libère l'URL après un délai laissant le temps d'ouvrir/télécharger.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
