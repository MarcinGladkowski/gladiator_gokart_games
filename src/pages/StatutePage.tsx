import { useEffect } from 'react'
import statuteUrl from '../assets/statute.pdf?url'

export function StatutePage() {
  useEffect(() => {
    window.location.href = statuteUrl
  }, [])

  return <p className="text-gray-500">Opening statute...</p>
}
