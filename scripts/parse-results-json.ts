import { readFileSync } from 'fs';
import type { QualificationEntry, RaceEntry, Session, SessionType, GroupLetter } from '../src/types/index.js';

interface ResultJson {
  general_results: Array<{
    rank: number;
    kart_number: number;
    driver: string;
    laps: number;
    difference_to_leader: string;
    best_lap_time: string;
    avg_lap_time?: string;
  }>;
}

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function parseResultsJson(
  filePath: string,
  group: GroupLetter,
  type: SessionType,
): Session {
  const raw = readFileSync(filePath, 'utf-8');
  const data: ResultJson = JSON.parse(raw);

  const isLeader = (val: string) => val === 'Winner' || val === 'Leader';

  if (type === 'qualifications') {
    const entries: QualificationEntry[] = data.general_results.map((r) => ({
      position: r.rank,
      kartNumber: r.kart_number,
      driver: toTitleCase(r.driver),
      laps: r.laps,
      bestLap: r.best_lap_time,
      gap: isLeader(r.difference_to_leader) ? null : r.difference_to_leader,
      ...(r.avg_lap_time !== undefined && { avgLap: r.avg_lap_time }),
    }));
    return { group, type, entries };
  }

  const entries: RaceEntry[] = data.general_results.map((r) => ({
    position: r.rank,
    kartNumber: r.kart_number,
    driver: toTitleCase(r.driver),
    laps: r.laps,
    gap: isLeader(r.difference_to_leader) ? null : r.difference_to_leader,
    bestLap: r.best_lap_time,
  }));

  return { group, type, entries };
}
