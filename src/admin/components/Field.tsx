interface FieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  textarea?: boolean
  required?: boolean
}

export default function Field({
  label,
  value,
  onChange,
  type = 'text',
  textarea = false,
  required = false,
}: FieldProps) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      {textarea ? (
        <textarea
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:border-purple-500"
        />
      ) : (
        <input
          type={type}
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:border-purple-500"
        />
      )}
    </label>
  )
}
