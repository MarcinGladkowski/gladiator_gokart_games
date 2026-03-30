# Exposing Google Sheet data via Apps Script

## Why

The website is stateless and has no backend. Fetching the sheet as a public CSV export works but has ~1 minute cache delay. A Google Apps Script Web App serves the same data as fresh JSON with no caching and no secrets required.

## Setup

### 1. Open Apps Script

In your Google Sheet: **Extensions → Apps Script**

### 2. Paste the script

```js
function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet()
  const [header, ...rows] = sheet.getDataRange().getValues()
  const data = rows.map(row =>
    Object.fromEntries(header.map((h, i) => [h, row[i]]))
  )
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
}
```

### 3. Deploy

1. Click **Deploy → New deployment**
2. Click the gear icon next to "Select type" → **Web app**
3. Set **Execute as:** Me
4. Set **Who has access:** Anyone
5. Click **Deploy** and authorize when prompted
6. Copy the Web app URL (`https://script.google.com/macros/s/.../exec`)

### 4. Use the URL

```ts
const url = 'https://script.google.com/macros/s/.../exec'
const rows = await fetch(url).then(r => r.json())
// rows: Record<string, string>[]  — one object per sheet row, keys are column headers
```

## Response format

```json
[
  { "Sygnatura czasowa": "3/29/2026 10:00:00", "Zawodnik": "JAN KOWALSKI" },
  { "Sygnatura czasowa": "3/29/2026 10:05:00", "Zawodnik": "ANNA NOWAK" }
]
```

## Maintenance

| Situation | Action required |
|---|---|
| Sheet data changes | Nothing — script always reads live data |
| Script code changes | Redeploy: **Deploy → Manage deployments → Edit → New version** |
| Column names change | Update column references in `useRegisteredDrivers.ts` |

## Current deployment

URL is defined in `src/pages/RaceDatePage.tsx` as `REGISTRATIONS_URL`.
