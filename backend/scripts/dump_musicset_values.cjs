const fs = require('fs'); const path = require('path');
const text = fs.readFileSync(path.resolve(__dirname, '../prisma/src/db/josepe_DB.sql'), 'utf8');
const m = /INSERT\s+INTO\s+`?MusicSet`?\s*\([^)]*\)\s*VALUES\s*((?:\([^;]+\))(?:\s*,\s*\([^;]+\))*)\s*;/i.exec(text);
if (!m) { console.error('no match'); process.exit(1); }
const vr = m[1];
console.log('--- VALUES RAW START ---');
console.log(vr);
console.log('--- VALUES RAW END ---');
console.log('length:', vr.length);
