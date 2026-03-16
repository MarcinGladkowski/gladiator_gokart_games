import { readFileSync } from 'fs';
import type { RaceEntry, Session, SessionType, GroupLetter } from '../src/types/index.js';

interface RaceResultJson {
  race_details: {
    name: string;
    date: string;
    time_range: string;
  };
  general_results: Array<{
    rank: number;
    kart_number: number;
    driver: string;
    laps: number;
    difference_to_leader: string;
    best_lap_time: string;
  }>;
}

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c: string) => c.toUpperCase());
}

export function parseResultsJson(
  filePath: string,
  group: GroupLetter,
  type: SessionType,
): Session {
  const raw = readFileSync(filePath, 'utf-8');
  const data: RaceResultJson = JSON.parse(raw);

  const entries: RaceEntry[] = data.general_results.map((r) => ({
    position: r.rank,
    kartNumber: r.kart_number,
    driver: toTitleCase(r.driver),
    laps: r.laps,
    gap: r.difference_to_leader === 'Winner' ? null : r.difference_to_leader,
    bestLap: r.best_lap_time,
  }));

  return { group, type, entries };
}
