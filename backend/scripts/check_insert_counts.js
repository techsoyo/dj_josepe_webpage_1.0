const fs = require('fs');
const path = require('path');

const sqlPath = process.argv[2] || path.resolve(__dirname, '../prisma/src/db/josepe_DB.sql');
const text = fs.readFileSync(sqlPath, 'utf8');

function splitTopLevelCommas(s) {
  const res = [];
  let cur = '';
  let inSingle = false, inDouble = false, depth = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "'" && !inDouble) { inSingle = !inSingle; cur += ch; continue; }
    if (ch === '"' && !inSingle) { inDouble = !inDouble; cur += ch; continue; }
    if (!inSingle && !inDouble) {
      if (ch === '(') { depth++; cur += ch; continue; }
      if (ch === ')') { depth--; cur += ch; continue; }
      if (ch === ',' && depth === 0) { res.push(cur.trim()); cur = ''; continue; }
    }
    cur += ch;
  }
  if (cur.trim() !== '') res.push(cur.trim());
  return res;
}

// Find all INSERT INTO ... (...) VALUES (...) blocks
const insertRegex = /INSERT\s+INTO\s+`?([A-Za-z0-9_]+)`?\s*\(([^)]+)\)\s*VALUES\s*((?:\([^;]+\))(?:\s*,\s*\([^;]+\))*)\s*;/gim;
let m; let problems = [];
while ((m = insertRegex.exec(text)) !== null) {
  const table = m[1];
  const colsRaw = m[2];
  const valuesRaw = m[3];
  const cols = splitTopLevelCommas(colsRaw).map(c => c.replace(/`/g, '').trim());
  // Extract each (...) pair from valuesRaw
  const tuples = [];
  let cur = ''; let depth = 0; let inSingle = false, inDouble = false;
  for (let i = 0; i < valuesRaw.length; i++) {
    const ch = valuesRaw[i];
    cur += ch;
    if (ch === "'" && !inDouble) { inSingle = !inSingle; }
    if (ch === '"' && !inSingle) { inDouble = !inDouble; }
    if (!inSingle && !inDouble) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
    }
    if (depth === 0 && cur.trim() !== '') {
      const t = cur.trim();
      if (t.endsWith(',')) {
        tuples.push(t.slice(0, -1).trim());
      } else {
        tuples.push(t);
      }
      cur = '';
    }
  }
  // Clean tuples to remove leading/trailing commas/spaces
  const cleaned = tuples.map(t => {
    const s = t.trim();
    if (s.startsWith('(') && s.endsWith(')')) return s.slice(1, -1).trim();
    return s;
  }).filter(Boolean);

  cleaned.forEach((tuple, idx) => {
    // split by top-level commas
    const vals = splitTopLevelCommas(tuple).map(v => v.trim());
    if (vals.length !== cols.length) {
      problems.push({ table, index: idx + 1, cols: cols.length, vals: vals.length, colsList: cols, sampleVals: vals.slice(0, 10) });
    }
  });
}

if (problems.length === 0) {
  console.log('No problems found: every INSERT has matching column/value counts.');
} else {
  console.log('Found problems in INSERTs:');
  problems.forEach(p => {
    console.log(`Table ${p.table} tuple #${p.index}: columns=${p.cols} values=${p.vals}`);
    console.log('Sample values:', p.sampleVals.join(' | '));
  });
  process.exitCode = 2;
}
