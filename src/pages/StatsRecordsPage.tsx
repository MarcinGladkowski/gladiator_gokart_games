import { useMemo, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { useSeason } from '../hooks/useResults'
import { computeSeasonStats, MIN_ROUNDS, type SeasonStats, type GroupFilter, type Tally } from '../services/seasonStats'

const TOP_N = 5
const PODIUM = ['text-yellow-400', 'text-gray-300', 'text-orange-400']

type StatsByGroup = Record<GroupFilter, SeasonStats>

function Card({
  title,
  subtitle,
  facts,
  children,
}: {
  title: string
  subtitle?: string
  facts: StatsByGroup
  children: (facts: SeasonStats) => ReactNode
}) {
  const [group, setGroup] = useState<GroupFilter>('all')
  return (
    <section className="rounded-lg border border-gray-700 bg-gray-900 p-4">
      <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      <div className="mt-3">
        <GroupTabs value={group} onChange={setGroup} />
        {children(facts[group])}
      </div>
    </section>
  )
}

function Ranking<T>({
  rows,
  driver,
  value,
  empty = 'No data yet.',
}: {
  rows: T[]
  driver: (row: T) => string
  value: (row: T) => ReactNode
  empty?: string
}) {
  if (rows.length === 0) return <p className="text-sm text-gray-500">{empty}</p>
  return (
    <ol className="space-y-1 text-sm">
      {rows.slice(0, TOP_N).map((row, i) => (
        <li key={driver(row)} className="flex items-center gap-3">
          <span className={`w-5 text-right font-bold ${PODIUM[i] ?? 'text-gray-500'}`}>{i + 1}</span>
          <span className="text-gray-200">{driver(row)}</span>
          <span className="ml-auto font-mono text-green-400">{value(row)}</span>
        </li>
      ))}
    </ol>
  )
}

function GroupTabs({ value, onChange }: { value: GroupFilter; onChange: (g: GroupFilter) => void }) {
  const tabs: Array<[GroupFilter, string]> = [['all', 'All'], ['a', 'Group A'], ['b', 'Group B']]
  return (
    <div className="flex gap-1 mb-3">
      {tabs.map(([key, label]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-2.5 py-1 rounded text-xs transition-colors ${
            value === key ? 'bg-red-900/40 text-red-400 font-medium' : 'bg-gray-800 text-gray-400 hover:text-gray-100'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

const pct = (v: number) => `${v.toFixed(2)}%`

export function StatsRecordsPage() {
  const { year } = useParams<{ year: string }>()
  const yearNum = parseInt(year ?? '0', 10)
  const season = useSeason(yearNum)
  const facts = useMemo<StatsByGroup | null>(
    () =>
      season
        ? { all: computeSeasonStats(season, 'all'), a: computeSeasonStats(season, 'a'), b: computeSeasonStats(season, 'b') }
        : null,
    [season],
  )

  if (!facts || facts.all.racesCount === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white mb-6">Stats &amp; Records {yearNum}</h1>
        <p className="text-gray-500">No race results available yet.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Stats &amp; Records {yearNum}</h1>
      <p className="text-gray-400 text-sm mb-6">
        {facts.all.racesCount} races so far. Lap-time stats compare each driver's best race lap with the fastest race
        lap of that round (or of that group, when a group is selected), so rounds on different layouts are comparable.
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Most wins" facts={facts}>
          {(f) => <Ranking<Tally> rows={f.wins} driver={(t) => t.driver} value={(t) => t.count} />}
        </Card>

        <Card title="Most podiums" facts={facts}>
          {(f) => <Ranking<Tally> rows={f.podiums} driver={(t) => t.driver} value={(t) => t.count} />}
        </Card>

        <Card title="Different winners" subtitle="Race winners and back-to-back wins" facts={facts}>
          {(f) => (
            <>
              <p className="text-3xl font-bold text-white">
                {f.distinctWinners}
                <span className="text-base font-normal text-gray-400"> drivers won {f.racesCount} races</span>
              </p>
              <h3 className="mt-4 mb-1 text-xs uppercase text-gray-400">Back-to-back winners</h3>
              {f.backToBackWins.length === 0 ? (
                <p className="text-sm text-gray-500">Nobody has won in consecutive rounds yet.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {f.backToBackWins.map((b) => (
                    <li key={`${b.driver}-${b.rounds[0]}`} className="text-gray-200">
                      {b.driver} <span className="text-gray-500">· {b.rounds.join(', ')}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Card>

        <Card title="Most fastest laps ⚡" subtitle="Fastest lap of a race (bonus point)" facts={facts}>
          {(f) => <Ranking<Tally> rows={f.fastestLaps} driver={(t) => t.driver} value={(t) => t.count} />}
        </Card>

        <Card title="Fast but unlucky" subtitle="Fastest lap of the race, but no podium" facts={facts}>
          {(f) =>
            f.fastestLapNoPodium.length === 0 ? (
              <p className="text-sm text-gray-500">Every fastest lap ended on the podium so far.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {f.fastestLapNoPodium.map((x) => (
                  <li key={`${x.round}-${x.group}`} className="flex gap-2">
                    <span className="text-gray-200">{x.driver}</span>
                    <span className="text-gray-500">
                      {x.round.split(' - ')[0]} · {x.group.toUpperCase()} · P{x.position}
                    </span>
                    <span className="ml-auto font-mono text-purple-400">{x.bestLap}</span>
                  </li>
                ))}
              </ul>
            )
          }
        </Card>

        <Card
          title="Fastest on average"
          subtitle={`Average gap to the fastest lap · min. ${MIN_ROUNDS} rounds`}
          facts={facts}
        >
          {(f) => <Ranking rows={f.pace} driver={(p) => p.driver} value={(p) => `+${pct(p.avgGapPct)}`} />}
        </Card>

        <Card
          title="Most consistent"
          subtitle={`Smallest spread of that gap across rounds · min. ${MIN_ROUNDS} rounds`}
          facts={facts}
        >
          {(f) => <Ranking rows={f.consistency} driver={(p) => p.driver} value={(p) => `±${pct(p.stdDevPct)}`} />}
        </Card>

        <Card title="Most improved" subtitle="Gap to fastest lap: first 2 rounds vs last 2 rounds" facts={facts}>
          {(f) => (
            <Ranking
              rows={f.improvement.filter((e) => e.improvementPct > 0)}
              driver={(e) => e.driver}
              value={(e) => <span title={`${pct(e.startGapPct)} → ${pct(e.endGapPct)}`}>−{pct(e.improvementPct)}</span>}
            />
          )}
        </Card>

        <Card title="Most pole positions" subtitle="P1 in a qualifying group" facts={facts}>
          {(f) => (
            <Ranking<Tally>
              rows={f.poles}
              driver={(t) => t.driver}
              value={(t) => t.count}
              empty="No qualifying sessions yet."
            />
          )}
        </Card>

        <Card title="Pole to win" subtitle="How the pole sitter finished the race" facts={facts}>
          {(f) => {
            if (f.poleConversions.length === 0) return <p className="text-sm text-gray-500">No qualifying sessions yet.</p>
            const poleWins = f.poleConversions.filter((p) => p.racePosition === 1).length
            return (
              <>
                <p className="text-3xl font-bold text-white mb-3">
                  {poleWins}/{f.poleConversions.length}
                  <span className="text-base font-normal text-gray-400"> poles converted</span>
                </p>
                <ul className="space-y-1 text-sm">
                  {f.poleConversions.map((p) => (
                    <li key={`${p.round}-${p.qualiGroup}`} className="flex gap-2">
                      <span className="text-gray-500">
                        {p.round.split(' - ')[0]} · Q{p.qualiGroup.toUpperCase()}
                      </span>
                      <span className="text-gray-200">{p.driver}</span>
                      <span
                        className={`ml-auto font-mono ${p.racePosition === 1 ? 'text-yellow-400' : 'text-gray-400'}`}
                      >
                        {p.racePosition === null ? 'DNS' : `${p.raceGroup?.toUpperCase()} · P${p.racePosition}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )
          }}
        </Card>

        <Card title="Closest qualifying" subtitle="Smallest gap between P1 and P2" facts={facts}>
          {(f) =>
            f.closestQualis.length === 0 ? (
              <p className="text-sm text-gray-500">No qualifying sessions yet.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {f.closestQualis.slice(0, TOP_N).map((q) => (
                  <li key={`${q.round}-${q.group}`} className="flex gap-2">
                    <span className="text-gray-500">
                      {q.round.split(' - ')[0]} · Q{q.group.toUpperCase()}
                    </span>
                    <span className="text-gray-200 truncate">
                      {q.pole} vs {q.second}
                    </span>
                    <span className="ml-auto font-mono text-green-400">+{(q.gapMs / 1000).toFixed(3)}s</span>
                  </li>
                ))}
              </ul>
            )
          }
        </Card>
      </div>
    </div>
  )
}
