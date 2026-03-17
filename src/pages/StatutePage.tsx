export function StatutePage() {
  return (
    <div className="flex flex-col h-full">
      <h1 className="text-2xl font-bold text-white mb-4">Statute 2026</h1>
      <iframe
        src="/statute.pdf"
        className="flex-1 w-full rounded-lg border border-gray-700"
        style={{ minHeight: '80vh' }}
        title="Gladiators Gokart Games 2026 - Statute"
      />
    </div>
  )
}
