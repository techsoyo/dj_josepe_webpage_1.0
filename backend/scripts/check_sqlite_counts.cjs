// check_sqlite_counts.cjs (CommonJS)
require('dotenv').config({ path: '.env.prisma' });
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

async function main() {
  const sqliteFile = path.resolve(process.env.SQLITE_FILE || './prisma/src/db/database.sqlite');
  if (!fs.existsSync(sqliteFile)) {
    console.error('SQLite file not found:', sqliteFile);
    process.exit(1);
  }
  const stat = fs.statSync(sqliteFile);
  console.log('SQLite file:', sqliteFile);
  console.log('Size (bytes):', stat.size);

  const filebuffer = fs.readFileSync(sqliteFile);
  const SQL = await initSqlJs();
  const db = new SQL.Database(new Uint8Array(filebuffer));

  function execAll(sql) {
    const res = db.exec(sql);
    if (!res || res.length === 0) return [];
    const { columns, values } = res[0];
    return values.map(row => {
      const obj = {};
      for (let i = 0; i < columns.length; i++) obj[columns[i]] = row[i];
      return obj;
    });
  }

  const tables = execAll("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").map(r => r.name);
  console.log('Found tables:', tables.join(', '));

  for (const t of tables) {
    try {
      const cntRes = execAll(`SELECT COUNT(*) as c FROM \"${t}\"`);
      const cnt = (cntRes[0] && cntRes[0].c) || 0;
      console.log(`Table: ${t} — rows: ${cnt}`);
      if (cnt > 0) {
        const sample = execAll(`SELECT * FROM \"${t}\" LIMIT 3`);
        console.log(' Sample rows:', sample);
      }
    } catch (e) {
      console.warn(' Could not query table', t, e.message);
    }
  }

  db.close();
}

main().catch(err => { console.error(err); process.exit(1); });
