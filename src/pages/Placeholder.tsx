export default function Placeholder({ title }: { title: string }) {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 pt-24 text-center">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gold">
        Fairy House
      </p>
      <h1 className="text-4xl font-bold text-ink md:text-5xl">{title}</h1>
      <p className="mt-4 max-w-md text-gray-600">
        Cette page sera reconstruite prochainement.
      </p>
    </main>
  )
}
