import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { TotalResultEntry, TotalResultScore } from '../src/types/index.js';

const ROOT = new URL('..', import.meta.url).pathname;
const RACES_DIR = join(ROOT, 'resource', 'races');
const TOTAL_RESULTS_FILE = join(ROOT, 'src', 'data', 'total_results.json');
const DRIVERS_MAPPING_FILE = join(ROOT, 'src', 'data', 'drivers_mapping.json');

type DriversMapping = Record<string, string[]>;

interface RaceResultEntry {
  rank: number;
  driver: string;
  best_lap_time: string;
}

interface RaceResultJson {
  general_results: RaceResultEntry[];
}

function parseDirDate(dirName: string): string | null {
  const match = dirName.match(/^race_\d+_(\d{2})_(\d{2})_(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

function parseGroupLetter(filename: string): string | null {
  const match = filename.match(/^group_([a-z])_race_results?\.json$/i);
  return match ? match[1]!.toLowerCase() : null;
}

function normalizeDriverName(rawName: string, mapping: DriversMapping): string {
  const lower = rawName.toLowerCase();
  if (lower in mapping) return lower.toUpperCase();
  for (const [canonical, aliases] of Object.entries(mapping)) {
    if (aliases.some((a) => a.toLowerCase() === lower)) {
      return canonical.toUpperCase();
    }
  }
  return rawName.toUpperCase();
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function main() {
  const totalResults: TotalResultEntry[] = JSON.parse(
    readFileSync(TOTAL_RESULTS_FILE, 'utf-8'),
  );
  const driversMapping: DriversMapping = JSON.parse(
    readFileSync(DRIVERS_MAPPING_FILE, 'utf-8'),
  );

  // Collect all dates already covered in total_results
  const datesInTotal = new Set<string>();
  for (const entry of totalResults) {
    for (const score of entry.scores) {
      datesInTotal.add(score.date);
    }
  }

  const raceDirs = readdirSync(RACES_DIR)
    .filter((name) => {
      try {
        readdirSync(join(RACES_DIR, name));
        return true;
      } catch {
        return false;
      }
    })
    .sort();

  let updated = false;

  for (const dirName of raceDirs) {
    const isoDate = parseDirDate(dirName);
    if (!isoDate) continue;
    if (datesInTotal.has(isoDate)) continue;

    const dirPath = join(RACES_DIR, dirName);
    const raceFiles = readdirSync(dirPath)
      .filter((f) => /^group_[a-z]_race_results?\.json$/i.test(f))
      .sort();

    if (raceFiles.length === 0) continue;

    // Read each group, sort alphabetically by group letter (A first, then B, ...)
    const groups: Array<{ group: string; entries: RaceResultEntry[] }> = [];
    for (const file of raceFiles) {
      const group = parseGroupLetter(file);
      if (!group) continue;
      const raw: RaceResultJson = JSON.parse(readFileSync(join(dirPath, file), 'utf-8'));
      groups.push({ group, entries: raw.general_results });
    }
    groups.sort((a, b) => a.group.localeCompare(b.group));

    // Group A occupies absolute positions 1..N_A, Group B N_A+1..N_A+N_B, etc.
    const allResultsCount = groups.reduce((sum, g) => sum + g.entries.length, 0);

    let positionOffset = 0;
    const newScores: Array<{ driver: string; score: TotalResultScore }> = [];

    for (const { entries } of groups) {
      const sorted = [...entries].sort((a, b) => a.rank - b.rank);
      for (const entry of sorted) {
        const positionAbsolute = positionOffset + entry.rank;
        const betterResultsCount = positionAbsolute - 1;
        const value =
          allResultsCount === 1
            ? 1
            : round4((allResultsCount - positionAbsolute) / (allResultsCount - 1));
        newScores.push({
          driver: normalizeDriverName(entry.driver, driversMapping),
          score: { value, betterResultsCount, allResultsCount, date: isoDate, positionAbsolute },
        });
      }
      positionOffset += entries.length;
    }

    for (const { driver, score } of newScores) {
      let entry = totalResults.find(
        (e) => e.nickname.toUpperCase() === driver,
      );
      if (!entry) {
        entry = { position: 0, nickname: driver, score: 0, entriesCount: 0, scores: [] };
        totalResults.push(entry);
        console.log(`  New driver: ${driver}`);
      }
      if (!entry.scores.some((s) => s.date === isoDate)) {
        entry.scores.push(score);
      }
    }

    console.log(
      `Added ${isoDate}: ${allResultsCount} drivers across ${groups.length} group(s)`,
    );
    updated = true;
  }

  if (!updated) {
    console.log('Total results already up to date');
    return;
  }

  // Recalculate aggregate fields for every driver
  for (const entry of totalResults) {
    entry.entriesCount = entry.scores.length;
    entry.score =
      entry.scores.length > 0
        ? round4(
            entry.scores.reduce((sum, s) => sum + s.value, 0) / entry.scores.length,
          )
        : 0;
    // Keep scores sorted most-recent first
    entry.scores.sort((a, b) => b.date.localeCompare(a.date));
  }

  // Sort by score desc, entriesCount desc as tie-breaker, then reassign positions
  totalResults.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.entriesCount - a.entriesCount;
  });
  totalResults.forEach((entry, idx) => {
    entry.position = idx + 1;
  });

  writeFileSync(TOTAL_RESULTS_FILE, JSON.stringify(totalResults, null, 2), 'utf-8');
  console.log(`Written ${TOTAL_RESULTS_FILE}`);
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
