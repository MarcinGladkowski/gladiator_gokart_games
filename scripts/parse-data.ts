import { readdirSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { parseResultsJson } from './parse-results-json.js';
import { parseTotalResultsCsv } from './parse-total-results-csv.js';
import type { AppData, RaceEvent, Season, Session, SessionType, GroupLetter } from '../src/types/index.js';

// Full season schedule — used to add upcoming races that have no data directory yet
const SCHEDULE: Array<{ raceNum: number; isoDate: string }> = [
  { raceNum: 1, isoDate: '2026-03-12' },
  { raceNum: 2, isoDate: '2026-04-23' },
  { raceNum: 3, isoDate: '2026-05-14' },
  { raceNum: 4, isoDate: '2026-06-18' },
  { raceNum: 5, isoDate: '2026-07-16' },
  { raceNum: 6, isoDate: '2026-08-13' },
  { raceNum: 7, isoDate: '2026-09-17' },
  { raceNum: 8, isoDate: '2026-10-15' },
];

const ROOT = new URL('..', import.meta.url).pathname;
const RACES_DIR = join(ROOT, 'resource', 'races');
const TOTAL_CSV_PATH = join(ROOT, 'resource', 'total_results.csv');
const OUT_DIR = join(ROOT, 'src', 'data');
const OUT_FILE = join(OUT_DIR, 'results.json');

function parseDirDate(dirName: string): { isoDate: string; label: string } | null {
  // Expect race_{number}_{DD}_{MM}_{YYYY}
  const match = dirName.match(/^race_(\d+)_(\d{2})_(\d{2})_(\d{4})$/);
  if (!match) return null;
  const [, raceNum, dd, mm, yyyy] = match;
  return {
    isoDate: `${yyyy}-${mm}-${dd}`,
    label: `Race ${raceNum} - ${dd}/${mm}/${yyyy}`,
  };
}

function parseFilename(filename: string): { group: GroupLetter; type: SessionType } | null {
  // e.g. group_a_race_results.json, group_b_qualifications_results.json, group_a_qalifications_result.json
  const match = filename.match(/^group_([a-z])_(race|qual[a-z]*)_results?\.json$/i);
  if (!match) return null;
  const rawType = match[2]!.toLowerCase();
  const type: SessionType = rawType === 'race' ? 'race' : 'qualifications';
  return { group: match[1]!.toLowerCase(), type };
}

function main() {
  // Parse race events
  const eventsByDate = new Map<string, RaceEvent>();

  const dateDirs = readdirSync(RACES_DIR).filter((name: string) => {
    const fullPath = join(RACES_DIR, name);
    try {
      return readdirSync(fullPath) !== null;
    } catch {
      return false;
    }
  });

  for (const dirName of dateDirs) {
    const parsed = parseDirDate(dirName);
    if (!parsed) {
      console.warn(`Skipping directory with unrecognized name format: ${dirName}`);
      continue;
    }
    const { isoDate, label } = parsed;

    const dirPath = join(RACES_DIR, dirName);
    const jsonFiles = readdirSync(dirPath).filter((f: string) => /_results?\.json$/.test(f));
    const sessions: Session[] = [];

    for (const jsonFile of jsonFiles) {
      const parsed = parseFilename(jsonFile);
      if (!parsed) {
        console.warn(`Skipping unrecognized JSON filename: ${jsonFile}`);
        continue;
      }
      const session = parseResultsJson(join(dirPath, jsonFile), parsed.group, parsed.type);
      sessions.push(session);
    }

    // Sort sessions: qualifications before race, then alphabetically by group
    sessions.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'qualifications' ? -1 : 1;
      return a.group.localeCompare(b.group);
    });

    eventsByDate.set(isoDate, { date: isoDate, label, sessions });
  }

  // Add upcoming races from the schedule that have no data directory yet
  const today = new Date().toISOString().slice(0, 10);
  for (const { raceNum, isoDate } of SCHEDULE) {
    if (!eventsByDate.has(isoDate)) {
      const [yyyy, mm, dd] = isoDate.split('-');
      const label = `Race ${raceNum} - ${dd}/${mm}/${yyyy}`;
      eventsByDate.set(isoDate, { date: isoDate, label, sessions: [], upcoming: isoDate > today });
    }
  }

  // Group events by year into seasons
  const seasonMap = new Map<number, RaceEvent[]>();
  for (const [isoDate, event] of eventsByDate) {
    const year = parseInt(isoDate.split('-')[0]!, 10);
    const existing = seasonMap.get(year) ?? [];
    existing.push(event);
    seasonMap.set(year, existing);
  }

  const seasons: Season[] = [...seasonMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, events]) => ({
      year,
      events: events.sort((a, b) => a.date.localeCompare(b.date)),
    }));

  // Parse total results CSV
  let totalResults: ReturnType<typeof parseTotalResultsCsv> = [];
  try {
    totalResults = parseTotalResultsCsv(TOTAL_CSV_PATH);
    console.log(`Parsed ${totalResults.length} total result entries from CSV`);
  } catch (err) {
    console.error('Total results CSV parsing failed:', err);
    console.warn('Continuing with empty total results');
  }

  const appData: AppData = {
    generatedAt: new Date().toISOString(),
    totalResults,
    seasons,
  };

  if (!existsSync(OUT_DIR)) {
    mkdirSync(OUT_DIR, { recursive: true });
  }

  writeFileSync(OUT_FILE, JSON.stringify(appData, null, 2), 'utf-8');
  console.log(`Written ${OUT_FILE}`);

  // Log summary
  for (const season of seasons) {
    for (const event of season.events) {
      for (const session of event.sessions) {
        console.log(`  ${event.date} group=${session.group} type=${session.type} entries=${session.entries.length}`);
      }
    }
  }
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
