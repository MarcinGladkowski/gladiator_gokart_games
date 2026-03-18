import { useParams } from 'react-router-dom'
import { useGeneralClassification } from '../hooks/useResults'
import { GeneralClassificationTable } from '../components/tables/GeneralClassificationTable'

export function GeneralClassificationPage() {
  const { year } = useParams<{ year: string }>()
  const yearNum = parseInt(year ?? '0', 10)
  const entries = useGeneralClassification(yearNum)

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">General Classification {yearNum}</h1>
      <p className="text-gray-400 text-sm mb-6">
        Groups A &amp; B — best 6 races count per driver
      </p>
      {entries.length === 0 ? (
        <p className="text-gray-500">No race results available yet.</p>
      ) : (
        <GeneralClassificationTable entries={entries} />
      )}
    </div>
  )
}
