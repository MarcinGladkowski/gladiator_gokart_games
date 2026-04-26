import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const drivers = JSON.parse(
  readFileSync(join(__dirname, '../src/data/drivers.json'), 'utf-8')
);

const res = await fetch(
  'https://www.apex-timing.com/gokarts/results.php?center=120&leaderboard=7&start=1&count=999999',
  { headers: { 'User-Agent': 'Mozilla/5.0' } }
);
const html = await res.text();

const rowRegex = /data-member_id="(\d+)"[\s\S]*?<td class="pseudo">([^<]+)<\/td>/g;

const allDrivers = [];
for (const match of html.matchAll(rowRegex)) {
  allDrivers.push({ memberId: match[1], nickname: match[2].trim() });
}

console.log(`\nFetched ${allDrivers.length} drivers from website\n`);

const matched = [];
const notFound = [];

for (const name of drivers) {
  const found = allDrivers.find(
    (d) => d.nickname.toUpperCase() === name.toUpperCase()
  );
  if (found) {
    matched.push({ nickname: name, memberId: found.memberId });
  } else {
    notFound.push(name);
  }
}

console.log('=== MATCHED ===');
for (const { nickname, memberId } of matched) {
  console.log(`  ${memberId.padEnd(12)} ${nickname}`);
}

console.log(`\n=== NOT FOUND (${notFound.length}) ===`);
for (const name of notFound) {
  console.log(`  ${name}`);
}

console.log(`\nMatched: ${matched.length}/${drivers.length}`);
