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

const memberId = args['member-id'];
const round    = args['round'];
const runType  = args['run-type'];

if (!memberId || !round || !runType) {
  console.error('Usage: tsx scripts/extract-race.ts --member-id=<id> --round=<n:YYYY-MM-DD> --run-type="Race A: Závod, sk. A"');
  process.exit(1);
}

// ── Parse round ───────────────────────────────────────────────────────────────

const [roundNumber, date] = round.split(':');
const [year, month, day]  = date.split('-');
const dateFormatted        = `${day}_${month}_${year}`;
const runTypeValue         = runType.split(':').slice(1).join(':').trim();

const RESULT_FILES: Record<string, string> = {
  'Race A':           'group_a_race_result.json',
  'Race B':           'group_b_race_result.json',
  'Qualifications A': 'group_a_qualifications_result.json',
  'Qualifications B': 'group_b_qualifications_result.json',
};
const resultFile = Object.entries(RESULT_FILES).find(([k]) => runType.startsWith(k))?.[1] ?? 'result.json';

// ── HTTP ──────────────────────────────────────────────────────────────────────

const HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
};

async function fetchMemberSessions(id: string): Promise<string> {
  const res = await fetch('https://www.apex-timing.com/gokarts/functions/request_member_graphic.php', {
    method: 'POST', headers: HEADERS, body: `center_id=120&member_id=${id}`,
  });
  return res.text();
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

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`[extract-race] member=${memberId} round=${roundNumber} date=${date} run_type=${runType}`);

  // Phase 1: find session_id
  console.log('[extract-race] Fetching member sessions...');
  const sessionsData = await fetchMemberSessions(memberId);

  const sessionIdRaw = await askClaude(`
From the JavaScript response below, extract the \`var graphic_all_data\` variable and find
the entry that matches ALL of the following criteria:
- race_name contains: ${runTypeValue}
- date field matches year ${year} and month ${month}

The date field uses Czech month abbreviations:
01=led, 02=úno, 03=bře, 04=dub, 05=kvě, 06=čer, 07=čvc, 08=srp, 09=zář, 10=říj, 11=lis, 12=pro

Return ONLY the session_id as a plain number with no additional text.

Data:
${sessionsData}
`);

  if (process.env.DEBUG) {
    console.log(sessionsData)
  }
 
  const sessionId = sessionIdRaw.trim().replaceAll(/\D/g, '');
  if (!/^\d{6}$/.test(sessionId)) {
    console.error(`[extract-race] Invalid session_id: "${sessionId}"`);
    process.exit(1);
  }
  console.log(`[extract-race] session_id: ${sessionId}`);

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
