const fs = require('fs');
const path = require('path');
const text = fs.readFileSync(path.resolve(__dirname, '../prisma/src/db/josepe_DB.sql'), 'utf8');
const insertRegex = /INSERT\s+INTO\s+`?MusicSet`?\s*\(([^)]+)\)\s*VALUES\s*((?:\([^;]+\))(?:\s*,\s*\([^;]+\))*)\s*;/i;
const m = insertRegex.exec(text);
if (!m) { console.error('No match'); process.exit(1); }
const colsRaw = m[1];
const valuesRaw = m[2];
function splitTopLevelCommas(s) {
  const res = []; let cur = ''; let inS = false, inD = false, depth = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "'" && !inD) { inS = !inS; cur += ch; continue; }
    if (ch === '"' && !inS) { inD = !inD; cur += ch; continue; }
    if (!inS && !inD) { if (ch === '(') { depth++; cur += ch; continue; } if (ch === ')') { depth--; cur += ch; continue; } if (ch === ',' && depth === 0) { res.push(cur.trim()); cur = ''; continue; } }
    cur += ch;
  }
  if (cur.trim() !== '') res.push(cur.trim()); return res;
}
const cols = splitTopLevelCommas(colsRaw).map(c => c.replace(/`/g, '').trim());
console.log('Columns count:', cols.length);
cols.forEach((c, i) => console.log(i + 1, c));

// extract tuples
let tuples = []; let cur = ''; let depth = 0; let inS = false, inD = false;
for (let i = 0; i < valuesRaw.length; i++) {
  const ch = valuesRaw[i]; cur += ch; if (ch === "'" && !inD) inS = !inS; if (ch === '"' && !inS) inD = !inD; if (!inS && !inD) { if (ch === '(') depth++; if (ch === ')') depth--; }
  if (depth === 0 && cur.trim() !== '') { tuples.push(cur.trim()); cur = ''; }
}
console.log('Tuples found:', tuples.length);
for (let tIndex = 0; tIndex < tuples.length; tIndex++) {
  const t = tuples[tIndex].trim(); const inner = t.startsWith('(') && t.endsWith(')') ? t.slice(1, -1) : t;
  const vals = splitTopLevelCommas(inner).map(v => v.trim());
  console.log('\nTuple #', tIndex + 1, 'values count=', vals.length);
  vals.forEach((v, i) => {
    console.log(`  ${i + 1}: ${v.substring(0, 80)}${v.length > 80 ? '...' : ''}`);
  });
}
