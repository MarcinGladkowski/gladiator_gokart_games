import { useMemo, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { useSeason } from '../hooks/useResults'
import { computeSeasonStats, type SeasonStats, type GroupFilter, type Tally } from '../services/seasonStats'

const TOP_N = 5
const PODIUM = ['text-yellow-400', 'text-gray-300', 'text-orange-400']

type StatsByGroup = Record<GroupFilter, SeasonStats>

const GROUPS: Array<[Exclude<GroupFilter, 'all'>, string]> = [['a', 'Group A'], ['b', 'Group B']]

function Card({
  title,
  subtitle,
  facts,
  combined = false,
  children,
}: {
  title: string
  subtitle?: string
  facts: StatsByGroup
  // Show one list for both groups together instead of a column per group
  combined?: boolean
  children: (facts: SeasonStats) => ReactNode
}) {
  return (
    <section className="rounded-lg border border-gray-700 bg-gray-900 p-4">
      <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      {combined ? (
        <div className="mt-3">{children(facts.all)}</div>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {GROUPS.map(([key, label]) => (
            <div key={key} className="min-w-0">
              <h4 className="mb-2 text-xs font-medium uppercase text-red-400">{label}</h4>
              {children(facts[key])}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-white mb-3">{title}</h2>
      <div className="grid gap-4 xl:grid-cols-2">{children}</div>
    </section>
  )
}

// Ties at the cutoff only get their own rows while the list stays at most this long
const MAX_ROWS = TOP_N * 2

// Shows the top TOP_N drivers plus anyone tied with the last of them; tied drivers share a position.
// A tie too large to list is collapsed into a single row naming the drivers.
function Ranking({
  rows,
  detail,
  empty = 'No data yet.',
}: {
  rows: Tally[]
  detail?: (driver: string) => ReactNode
  empty?: string
}) {
  if (rows.length === 0) return <p className="text-sm text-gray-500">{empty}</p>
  const cutoff = rows[Math.min(TOP_N, rows.length) - 1].count
  const shown = rows.filter((t) => t.count >= cutoff)
  const collapsed = shown.length > MAX_ROWS ? shown.filter((t) => t.count === cutoff) : []
  const rankOf = (count: number) => rows.findIndex((r) => r.count === count)
  const rankCell = (rank: number) => (
    <span className={`w-5 text-right font-bold ${PODIUM[rank] ?? 'text-gray-500'}`}>{rank + 1}</span>
  )
  return (
    <ol className="space-y-1 text-sm">
      {shown
        .filter((t) => !collapsed.includes(t))
        .map((t) => (
          <li key={t.driver}>
            <div className="flex items-center gap-3">
              {rankCell(rankOf(t.count))}
              <span className="text-gray-200">{t.driver}</span>
              <span className="ml-auto font-mono text-green-400">{t.count}</span>
            </div>
            {detail && <div className="ml-8 text-xs text-gray-500">{detail(t.driver)}</div>}
          </li>
        ))}
      {collapsed.length > 0 && (
        <li>
          <div className="flex items-center gap-3">
            {rankCell(rankOf(cutoff))}
            <span className="text-gray-200">{collapsed.length} drivers tied</span>
            <span className="ml-auto font-mono text-green-400">{cutoff}</span>
          </div>
          <div className="ml-8 text-xs text-gray-500">{collapsed.map((t) => t.driver).join(', ')}</div>
        </li>
      )}
    </ol>
  )
}

// "Race 2 · P1 · 1:11.224" for every race where the driver set the fastest lap
function fastestLapRaces(f: SeasonStats, driver: string, withGroup: boolean) {
  return f.fastestLapRaces
    .filter((x) => x.driver === driver)
    .map((x) =>
      [x.round.split(' - ')[0], withGroup && x.group.toUpperCase(), `P${x.position}`, x.bestLap]
        .filter(Boolean)
        .join(' · '),
    )
    .join(', ')
}

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
        {facts.all.racesCount} races so far, shown separately for group A and group B.
      </p>

      <Section title="Races">
        <Card title="Most wins" facts={facts}>
          {(f) => (
            <Ranking
              rows={f.wins}
              detail={(driver) =>
                f.raceWins
                  .filter((w) => w.driver === driver)
                  .map((w) => w.round.split(' - ')[0])
                  .join(', ')
              }
            />
          )}
        </Card>

        <Card title="Most podiums" facts={facts}>
          {(f) => <Ranking rows={f.podiums} />}
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
          {(f) => <Ranking rows={f.fastestLaps} detail={(driver) => fastestLapRaces(f, driver, false)} />}
        </Card>

        <Card
          title="Most fastest laps in total ⚡"
          subtitle="Fastest laps across group A and group B races"
          facts={facts}
          combined
        >
          {(f) => <Ranking rows={f.fastestLaps} detail={(driver) => fastestLapRaces(f, driver, true)} />}
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
      </Section>

      <Section title="Qualifying">
        <Card title="Most pole positions" subtitle="P1 in a qualifying group" facts={facts}>
          {(f) => <Ranking rows={f.poles} empty="No qualifying sessions yet." />}
        </Card>

        <Card title="Pole to win" subtitle="How the pole sitter finished the race" facts={facts}>
          {(f) => {
            if (f.poleConversions.length === 0)
              return <p className="text-sm text-gray-500">No qualifying sessions yet.</p>
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
      </Section>
    </div>
  )
}
