import { readFileSync } from 'fs';
import type { TotalResultEntry } from '../src/types/index.js';

export function parseTotalResultsCsv(filePath: string): TotalResultEntry[] {
  let raw = readFileSync(filePath, 'utf-8');
  raw = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const lines = raw.split('\n').filter((l: string) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0]!.split(';');
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const dateCols: { index: number; date: string }[] = [];

  for (let i = 0; i < headers.length; i++) {
    if (dateRegex.test(headers[i]!.trim())) {
      dateCols.push({ index: i, date: headers[i]!.trim() });
    }
  }

  const results: TotalResultEntry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i]!.split(';');
    const get = (idx: number) => (cols[idx] ?? '').trim();

    const position = parseInt(get(0), 10);
    const nickname = get(1);
    const scorePercent = parseFloat(get(2));
    const racesCount = parseInt(get(3), 10);

    if (isNaN(position) || !nickname) continue;

    const raceScores: Record<string, number | null> = {};
    for (const { index, date } of dateCols) {
      const val = get(index);
      raceScores[date] = val === '' ? null : parseFloat(val);
    }

    results.push({
      position,
      nickname,
      scorePercent: isNaN(scorePercent) ? 0 : scorePercent,
      racesCount: isNaN(racesCount) ? 0 : racesCount,
      raceScores,
    });
  }

  return results;
}
