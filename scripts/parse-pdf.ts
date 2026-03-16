import { readFileSync } from 'fs';
import type { TotalResultEntry } from '../src/types/index.js';

interface TextItem {
  str: string;
  x: number;
  y: number;
}

function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step;
}

export async function parsePdf(filePath: string): Promise<TotalResultEntry[]> {
  // Dynamic import for pdfjs-dist to work in Node/ESM context
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

  const data = readFileSync(filePath);
  const uint8 = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

  const loadingTask = pdfjsLib.getDocument({ data: uint8, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true });
  const pdfDoc = await loadingTask.promise;

  const allItems: TextItem[] = [];

  for (let pageIndex = 0; pageIndex < pdfDoc.numPages; pageIndex++) {
    const page = await pdfDoc.getPage(pageIndex + 1);
    const content = await page.getTextContent();
    const yOffset = pageIndex * 10000;

    for (const item of content.items) {
      if (!('str' in item)) continue;
      const textItem = item as { str: string; transform: number[] };
      if (textItem.str.trim() === '') continue;
      allItems.push({
        str: textItem.str.trim(),
        x: textItem.transform[4] ?? 0,
        y: yOffset + (textItem.transform[5] ?? 0),
      });
    }
  }

  // Group items into rows by rounding Y to nearest 5pt
  const rowMap = new Map<number, TextItem[]>();
  for (const item of allItems) {
    const rowY = roundTo(item.y, 5);
    const existing = rowMap.get(rowY) ?? [];
    existing.push(item);
    rowMap.set(rowY, existing);
  }

  // Sort rows top-to-bottom (higher Y = higher on page in PDF coords)
  const sortedYs = [...rowMap.keys()].sort((a, b) => b - a);
  const rows = sortedYs.map((y) => {
    const items = rowMap.get(y)!;
    return items.sort((a, b) => a.x - b.x);
  });

  // Find header row
  let headerRowIdx = -1;
  let headerItems: TextItem[] = [];
  for (let i = 0; i < rows.length; i++) {
    const text = rows[i]!.map((it) => it.str).join(' ').toLowerCase();
    if (text.includes('pozycja') || text.includes('ksywa')) {
      headerRowIdx = i;
      headerItems = rows[i]!;
      break;
    }
  }

  if (headerRowIdx === -1) {
    throw new Error('Could not find header row in PDF (expected "Pozycja" or "Ksywa")');
  }

  // Record column X midpoints and names
  const columns: { name: string; x: number }[] = headerItems.map((it) => ({
    name: it.str,
    x: it.x,
  }));

  // Detect race-date columns
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  function assignToColumn(item: TextItem): number {
    let closest = 0;
    let minDist = Infinity;
    for (let i = 0; i < columns.length; i++) {
      const dist = Math.abs(item.x - columns[i]!.x);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    }
    return closest;
  }

  const results: TotalResultEntry[] = [];

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i]!;
    if (row.length === 0) continue;

    const assigned: Record<number, string> = {};
    for (const item of row) {
      const colIdx = assignToColumn(item);
      assigned[colIdx] = (assigned[colIdx] ? assigned[colIdx] + ' ' : '') + item.str;
    }

    // Find position column
    const posColIdx = columns.findIndex((c) =>
      c.name.toLowerCase().includes('pozycja') || c.name.toLowerCase().includes('pos'),
    );
    const nicknameColIdx = columns.findIndex((c) =>
      c.name.toLowerCase().includes('ksywa') || c.name.toLowerCase().includes('nick'),
    );
    const scoreColIdx = columns.findIndex((c) =>
      c.name.toLowerCase().includes('%') || c.name.toLowerCase().includes('wynik'),
    );
    const racesCountColIdx = columns.findIndex((c) =>
      c.name.toLowerCase().includes('start'),
    );

    const posStr = assigned[posColIdx] ?? '';
    const position = parseInt(posStr, 10);
    if (isNaN(position)) continue;

    const nickname = (assigned[nicknameColIdx] ?? '').trim();
    if (!nickname) continue;

    const scoreStr = (assigned[scoreColIdx] ?? '').replace(',', '.').replace('%', '').trim();
    const scorePercent = parseFloat(scoreStr);

    const racesCountStr = (assigned[racesCountColIdx] ?? '').trim();
    const racesCount = parseInt(racesCountStr, 10);

    const raceScores: Record<string, number | null> = {};
    for (let ci = 0; ci < columns.length; ci++) {
      const colName = columns[ci]!.name;
      if (dateRegex.test(colName)) {
        const scoreVal = (assigned[ci] ?? '').replace(',', '.').trim();
        raceScores[colName] = scoreVal === '' || scoreVal === '-' ? null : parseFloat(scoreVal);
      }
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
