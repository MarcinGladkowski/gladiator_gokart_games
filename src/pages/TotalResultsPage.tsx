import { useTotalResults } from '../hooks/useResults'
import { TotalResultsTable } from '../components/tables/TotalResultsTable'

export function TotalResultsPage() {
  const results = useTotalResults()

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Total Results</h1>
      {results.length === 0 ? (
        <p className="text-gray-500">No total results data available.</p>
      ) : (
        <TotalResultsTable entries={results} />
      )}
    </div>
  )
}
