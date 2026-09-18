import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { query } from '@anthropic-ai/claude-agent-sdk';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => {
      const [key, ...rest] = a.slice(2).split('=');
      return [key, rest.join('=')];
    })
);

const memberId       = args['member-id'];
const round          = args['round'];
const runType        = args['run-type'];
const knownSessionId = args['session-id'];

if (!memberId || !round || !runType) {
  console.error('Usage: tsx scripts/extract-race.ts --member-id=<id> --round=<n:YYYY-MM-DD> --run-type="Race A: Závod, sk. A" [--session-id=<id>]');
  process.exit(1);
}

// ── Parse round ───────────────────────────────────────────────────────────────

const [roundNumber, date] = round.split(':');
const [year, month, day]  = date.split('-');
const dateFormatted        = `${day}_${month}_${year}`;

const RESULT_FILES: Record<string, string> = {
  'Race A':           'group_a_race_result.json',
  'Race B':           'group_b_race_result.json',
  'Qualifications A': 'group_a_qualifications_result.json',
  'Qualifications B': 'group_b_qualifications_result.json',
};

// --run-type accepts either "<Prefix>: <value>" or "<Prefix> - <value>";
// strip the recognized prefix and whatever separator follows it.
const runTypePrefix = Object.keys(RESULT_FILES).find(k => runType.startsWith(k));
const runTypeValue  = runTypePrefix
  ? runType.slice(runTypePrefix.length).replace(/^[\s:-]+/, '').trim()
  : runType.split(':').slice(1).join(':').trim();
const resultFile = runTypePrefix ? RESULT_FILES[runTypePrefix] : 'result.json';

// ── HTTP ──────────────────────────────────────────────────────────────────────

const HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
};

async function fetchMemberSessions(id: string): Promise<string> {
  const res = await fetch('https://www.apex-timing.com/gokarts/functions/request_member_profile.php', {
    method: 'POST', headers: HEADERS, body: `center_id=120&type=member_results&member_id=${id}&start=1&count=100`,
  });
  const { html } = await res.json() as { html: string };
  return html;
}

// ── Extraction ────────────────────────────────────────────────────────────────

// Server localizes the date cell depending on locale: English ("Sept. 17, 2026")
// or Czech ("zář. 2026", no day). Both use a 3-letter month abbreviation.
const MONTHS: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  led: '01', úno: '02', bře: '03', dub: '04', kvě: '05', čer: '06',
  čvc: '07', srp: '08', zář: '09', říj: '10', lis: '11', pro: '12',
};

type SessionRow = { sessionId: string; raceName: string; year: string; month: string };

/**
 * Parses the `member_results` table HTML into one row per session, reading
 * session_id straight off each `<tr data-session_id="...">` and the race
 * name/date out of that row's `<span class="name">`/`<td class="date">`.
 */
function parseMemberResults(html: string): SessionRow[] {
  const rows: SessionRow[] = [];

  for (const trMatch of html.matchAll(/<tr[^>]*\bdata-session_id="(\d+)"[^>]*>([\s\S]*?)<\/tr>/g)) {
    const [, sessionId, block] = trMatch;
    const nameMatch = /<span class="name">\s*([^<]+?)\s*<\/span>/.exec(block);
    const dateMatch = /<td class="date">\s*([^<]+?)\s*<\/td>/.exec(block);
    if (!nameMatch || !dateMatch) continue;

    const yearMatch  = /(\d{4})/.exec(dateMatch[1]);
    const monthMatch = /[A-Za-zÀ-ž]+/.exec(dateMatch[1]);
    if (!yearMatch || !monthMatch) continue;

    const month = MONTHS[monthMatch[0].toLowerCase().slice(0, 3)];
    if (!month) continue;

    rows.push({ sessionId, raceName: nameMatch[1].trim(), year: yearMatch[1], month });
  }

  return rows;
}

async function fetchRaceDetails(sessionId: string): Promise<string> {
  const res = await fetch('https://www.apex-timing.com/gokarts/functions/request_member_profile.php', {
    method: 'POST', headers: HEADERS, body: `type=session_results&center_id=120&session_id=${sessionId}`,
  });
  return res.text();
}

// ── Claude ────────────────────────────────────────────────────────────────────

async function askClaude(prompt: string): Promise<string> {
  for await (const msg of query({ prompt, options: { maxTurns: 1 } })) {
    if (msg.type === 'result' && msg.subtype === 'success') return msg.result.trim();
    if (msg.type === 'result' && msg.subtype === 'error')   throw new Error(`Claude error: ${msg.result}`);
  }
  throw new Error('No result received from Claude');
}

/**
 * Finds the session_id for a given member/run-type/round by fetching the
 * member's recent sessions and matching the row whose race name contains
 * runTypeValue and whose date falls in the requested year/month.
 */
async function findSessionId(memberId: string, runTypeValue: string, year: string, month: string): Promise<string> {
  console.log('[extract-race] Fetching member sessions...');
  const sessionsHtml = await fetchMemberSessions(memberId);
  const rows         = parseMemberResults(sessionsHtml);

  if (process.env.DEBUG) {
    console.log(JSON.stringify(rows, null, 2));
  }

  const matches = rows.filter(row => row.raceName.includes(runTypeValue) && row.year === year && row.month === month);

  if (matches.length === 0) {
    throw new Error(`No session found for run_type "${runTypeValue}" in ${year}-${month}`);
  }
  if (matches.length > 1) {
    throw new Error(
      `Ambiguous session for run_type "${runTypeValue}" in ${year}-${month}: ` +
      matches.map(m => m.sessionId).join(', ')
    );
  }

  const sessionId = matches[0].sessionId;
  console.log(`[extract-race] session_id: ${sessionId}`);
  return sessionId;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`[extract-race] member=${memberId} round=${roundNumber} date=${date} run_type=${runType}`);

  // Phase 1: find session_id (skipped when provided via --session-id)
  let sessionId: string;
  if (knownSessionId) {
    sessionId = knownSessionId.trim().replaceAll(/\D/g, '');
    if (!/^\d{5,6}$/.test(sessionId)) {
      console.error(`[extract-race] Invalid --session-id: "${knownSessionId}"`);
      process.exit(1);
    }
    console.log(`[extract-race] Using provided session_id: ${sessionId}`);
  } else {
    try {
      sessionId = await findSessionId(memberId, runTypeValue, year, month);
    } catch (err) {
      console.error(`[extract-race] ${(err as Error).message}`);
      process.exit(1);
    }
  }

  // Phase 2: fetch race details and extract results
  console.log('[extract-race] Fetching race details...');
  const raceData = await fetchRaceDetails(sessionId);

  const raceResultRaw = await askClaude(`
From the race session data below, extract the RACE results.
Race entries have "Závod" in the race_name.
Group is identified by run_type: ${runTypeValue}

Set best_lap_time_race to true only for the driver(s) who set the fastest lap across
all drivers in the race; false for everyone else.

Replace with correct values for:
* run_type: ${runTypeValue}
* date: ${dateFormatted}
* session_id: ${sessionId}

Return ONLY valid JSON with no additional text:
{
  "race_details": {
    "name": "<race_type>",
    "date": "<race_date>",
    "run_type": "<run_type>",
    "session_id": "<session_id>"
  },
  "general_results": [
    {
      "rank": 1,
      "driver": "DRIVER NAME",
      "laps": 6,
      "difference_to_leader": "Leader",
      "best_lap_time": "1:25.495",
      "best_lap_time_race": true
    }
  ]
}

Data:
${raceData}
`);

  // Phase 3: save result
  const raceDir    = join(ROOT, 'resource', 'races', `race_${roundNumber}_${dateFormatted}`);
  const outputPath = join(raceDir, resultFile);
  mkdirSync(raceDir, { recursive: true });
  const cleanJson = raceResultRaw.replace(/^```[a-z]*\n?/gm, '').replace(/^```\n?$/gm, '').trim();
  writeFileSync(outputPath, cleanJson);
  console.log(`[extract-race] Saved → ${outputPath}`);
}

main().catch(err => { console.error(err); process.exit(1); });
