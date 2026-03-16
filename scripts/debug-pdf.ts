import { readFileSync } from 'fs';

async function main() {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = readFileSync('resource/total_results.pdf');
  const uint8 = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  const loadingTask = pdfjsLib.getDocument({ data: uint8, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true });
  const pdfDoc = await loadingTask.promise;
  console.log('numPages:', pdfDoc.numPages);

  for (let pageIndex = 0; pageIndex < Math.min(pdfDoc.numPages, 2); pageIndex++) {
    const page = await pdfDoc.getPage(pageIndex + 1);
    const content = await page.getTextContent();
    const yOffset = pageIndex * 10000;

    const items: { str: string; x: number; y: number }[] = [];
    for (const item of content.items) {
      if (!('str' in item)) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const t = item as any;
      if (t.str.trim() === '') continue;
      items.push({ str: t.str.trim(), x: Math.round(t.transform[4]), y: yOffset + Math.round(t.transform[5]) });
    }

    // Group into rows
    const rowMap = new Map<number, typeof items>();
    for (const it of items) {
      const ry = Math.round(it.y / 5) * 5;
      const row = rowMap.get(ry) ?? [];
      row.push(it);
      rowMap.set(ry, row);
    }

    const sortedYs = [...rowMap.keys()].sort((a, b) => b - a);
    console.log(`\n=== Page ${pageIndex + 1} (first 25 rows) ===`);
    for (let i = 0; i < Math.min(25, sortedYs.length); i++) {
      const y = sortedYs[i]!;
      const row = rowMap.get(y)!.sort((a, b) => a.x - b.x);
      console.log(`Y=${y}: ${row.map((r) => `[x=${r.x} "${r.str}"]`).join('  ')}`);
    }
  }
}

main().catch(console.error);
