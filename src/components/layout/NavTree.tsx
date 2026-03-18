import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useSeasons } from '../../hooks/useResults'
import statuteUrl from '../../assets/statute.pdf?url'

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3 h-3 transition-transform ${open ? 'rotate-90' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-3 py-1.5 rounded text-sm transition-colors ${
    isActive
      ? 'bg-red-900/40 text-red-400 font-medium'
      : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
  }`

export function NavTree({ onNavigate }: { onNavigate?: () => void }) {
  const seasons = useSeasons()
  const [openSeasons, setOpenSeasons] = useState<Set<number>>(new Set(seasons.map((s) => s.year)))
  const [openDates, setOpenDates] = useState<Set<string>>(new Set())

  function toggleSeason(year: number) {
    setOpenSeasons((prev) => {
      const next = new Set(prev)
      next.has(year) ? next.delete(year) : next.add(year)
      return next
    })
  }

  function toggleDate(date: string) {
    setOpenDates((prev) => {
      const next = new Set(prev)
      next.has(date) ? next.delete(date) : next.add(date)
      return next
    })
  }

  return (
    <nav className="space-y-1 px-2">
      <NavLink to="/total" className={linkClass} onClick={onNavigate}>
        Total Results
      </NavLink>
      <a
        href={statuteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block px-3 py-1.5 rounded text-sm transition-colors text-gray-400 hover:text-gray-100 hover:bg-gray-800"
      >
        Statute 2026
      </a>

      {[...seasons].reverse().map((season) => (
        <div key={season.year}>
          <button
            onClick={() => toggleSeason(season.year)}
            className="flex items-center gap-2 w-full px-3 py-1.5 rounded text-sm text-gray-300 hover:text-gray-100 hover:bg-gray-800 transition-colors"
          >
            <ChevronIcon open={openSeasons.has(season.year)} />
            <span>{season.year}</span>
          </button>

          {openSeasons.has(season.year) && (
            <div className="ml-4 space-y-0.5">
              {season.year === 2026 && (
                <NavLink
                  to={`/season/${season.year}/classification`}
                  className={linkClass}
                  onClick={onNavigate}
                >
                  General Classification
                </NavLink>
              )}
              {season.events.map((event) =>
                event.upcoming ? (
                  <NavLink
                    key={event.date}
                    to={`/season/${season.year}/${event.date}`}
                    className={({ isActive }) =>
                      `block px-3 py-1.5 rounded text-sm transition-colors ${
                        isActive
                          ? 'bg-red-900/40 text-red-400 font-medium'
                          : 'text-gray-600 hover:text-gray-400 hover:bg-gray-800'
                      }`
                    }
                    onClick={onNavigate}
                  >
                    {event.label}
                  </NavLink>
                ) : (
                  <div key={event.date}>
                    <button
                      onClick={() => toggleDate(event.date)}
                      className="flex items-center gap-2 w-full px-3 py-1.5 rounded text-sm text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
                    >
                      <ChevronIcon open={openDates.has(event.date)} />
                      <span>{event.label}</span>
                    </button>

                    {openDates.has(event.date) && (
                      <div className="ml-4 space-y-0.5">
                        {event.sessions.map((session) => {
                          const label = `${session.type === 'qualifications' ? 'Qualifications' : 'Race'} ${session.group.toUpperCase()}`
                          return (
                            <NavLink
                              key={`${session.group}-${session.type}`}
                              to={`/season/${season.year}/${event.date}/${session.group}/${session.type}`}
                              className={linkClass}
                              onClick={onNavigate}
                            >
                              {label}
                            </NavLink>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      ))}
    </nav>
  )
}
