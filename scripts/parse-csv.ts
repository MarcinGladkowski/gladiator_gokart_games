import { readFileSync } from 'fs';
import type { QualificationEntry, RaceEntry, Session, SessionType, GroupLetter } from '../src/types/index.js';

// Column aliases for multilingual headers
const ALIASES: Record<string, string[]> = {
  position: ['pořadí', 'poradi', 'porzadek'],
  kart: ['motokára', 'motokara', 'moto'],
  driver: ['jezdec'],
  laps: ['kola'],
  bestLap: ['najlepszy czas'],
  gap: ['różnica', 'roznica'],
  avg: ['średnia', 'srednia'],
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function findHeader(headers: string[], fieldAliases: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const h = normalize(headers[i] ?? '');
    if (fieldAliases.some((a) => normalize(a) === h)) return i;
  }
  return -1;
}

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c: string) => c.toUpperCase());
}

export function parseCsv(
  filePath: string,
  group: GroupLetter,
  type: SessionType,
): Session {
  let raw = readFileSync(filePath, 'utf-8');
  // Strip BOM
  raw = raw.replace(/^\uFEFF/, '');
  // Normalize line endings
  raw = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const lines = raw.split('\n').filter((l: string) => l.trim().length > 0);
  if (lines.length === 0) throw new Error(`Empty CSV: ${filePath}`);

  const headerLine = lines[0]!;
  const headers = headerLine.split(';');

  const isQualification = headers.some((h: string) =>
    ALIASES['avg']!.some((a) => normalize(a) === normalize(h)),
  );

  const posIdx = findHeader(headers, ALIASES['position']!);
  const kartIdx = findHeader(headers, ALIASES['kart']!);
  const driverIdx = findHeader(headers, ALIASES['driver']!);
  const lapsIdx = findHeader(headers, ALIASES['laps']!);
  const bestLapIdx = findHeader(headers, ALIASES['bestLap']!);
  const gapIdx = findHeader(headers, ALIASES['gap']!);
  const avgIdx = isQualification ? findHeader(headers, ALIASES['avg']!) : -1;

  const entries: (QualificationEntry | RaceEntry)[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i]!.split(';');
    if (cols.every((c) => c.trim() === '')) continue;

    const get = (idx: number) => (idx >= 0 ? (cols[idx] ?? '').trim() : '');

    const position = parseInt(get(posIdx), 10);
    const kartNumber = parseInt(get(kartIdx), 10);
    const driver = toTitleCase(get(driverIdx));
    const laps = parseInt(get(lapsIdx), 10);
    const bestLap = get(bestLapIdx);
    const gapRaw = get(gapIdx);
    const gap = gapRaw === '' ? null : gapRaw;

    if (isNaN(position) || isNaN(kartNumber)) continue;

    if (isQualification) {
      const avgLap = get(avgIdx);
      const entry: QualificationEntry = { position, kartNumber, driver, laps, bestLap, gap, avgLap };
      entries.push(entry);
    } else {
      const entry: RaceEntry = { position, kartNumber, driver, laps, gap, bestLap };
      entries.push(entry);
    }
  }

  return { group, type, entries };
}
