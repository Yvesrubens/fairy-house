import { useEffect, useRef } from 'react'

// Éditeur de texte enrichi minimal (F7) : gras, italique, souligné, listes.
// Sans dépendance : contentEditable + document.execCommand (largement supporté
// par les navigateurs actuels). Émet du HTML via onChange. Le rendu public est
// assaini avec DOMPurify (voir EvenementDetail).

const BUTTONS: { cmd: string; label: string; title: string }[] = [
  { cmd: 'bold', label: 'G', title: 'Gras' },
  { cmd: 'italic', label: 'I', title: 'Italique' },
  { cmd: 'underline', label: 'S', title: 'Souligné' },
  { cmd: 'insertUnorderedList', label: '• Liste', title: 'Liste à puces' },
  { cmd: 'insertOrderedList', label: '1. Liste', title: 'Liste numérotée' },
]

export default function RichTextEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (html: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Initialise le contenu une seule fois (contentEditable non contrôlé pour
  // éviter les sauts de curseur).
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function exec(cmd: string) {
    document.execCommand(cmd, false)
    ref.current?.focus()
    if (ref.current) onChange(ref.current.innerHTML)
  }

  return (
    <div>
      <div className="mb-1 flex flex-wrap gap-1">
        {BUTTONS.map((b) => (
          <button
            key={b.cmd}
            type="button"
            title={b.title}
            onMouseDown={(e) => {
              // Empêche la perte de sélection avant l'exécution de la commande.
              e.preventDefault()
              exec(b.cmd)
            }}
            className="rounded border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
          >
            {b.label}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={() => ref.current && onChange(ref.current.innerHTML)}
        className="min-h-[160px] w-full rounded-lg border px-3 py-2 text-sm leading-relaxed outline-none focus:border-purple-500 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6"
      />
    </div>
  )
}
