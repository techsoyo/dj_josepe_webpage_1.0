// migrate.js
require('dotenv').config({ path: '.env.prisma' });
const initSqlJs = require('sql.js');
const fs = require('fs');
const mysql = require('mysql2/promise');
const path = require('path');

const sqliteFile = path.resolve(process.env.SQLITE_FILE || './prisma/src/db/database.sqlite');
const mysqlConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'test'
};
const BATCH = parseInt(process.env.BATCH_SIZE || '500', 10);

function transformValue(val) {
  if (val === null || val === undefined) return null;
  // Try convert JSON-like strings to JSON objects (MySQL JSON column expects valid JSON)
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        return JSON.parse(trimmed);
      } catch (e) {
        // keep original string if not valid JSON
      }
    }
    // sqlite may store booleans as "0"/"1" or numbers; keep strings as-is
  }
  return val;
}

(async () => {
  console.log('Abriendo SQLite (sql.js):', sqliteFile);
  const filebuffer = fs.readFileSync(sqliteFile);
  const SQL = await initSqlJs();
  const sqliteDb = new SQL.Database(new Uint8Array(filebuffer));

  function execAll(sql) {
    const res = sqliteDb.exec(sql);
    if (!res || res.length === 0) return [];
    const { columns, values } = res[0];
    const rows = values.map(row => {
      const obj = {};
      for (let i = 0; i < columns.length; i++) obj[columns[i]] = row[i];
      return obj;
    });
    return rows;
  }

  console.log('Conectando a MySQL:', mysqlConfig.host + ':' + mysqlConfig.port, ' DB:', mysqlConfig.database);
  const conn = await mysql.createConnection({ ...mysqlConfig, multipleStatements: true });

  try {
    // Get list of user tables from sqlite
    const tablesRes = execAll("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    const tables = tablesRes.map(r => r.name);
    console.log('Tablas encontradas en SQLite:', tables.join(', '));

    // Disable foreign key checks in MySQL during import
    await conn.query('SET FOREIGN_KEY_CHECKS=0;');

    for (const table of tables) {
      console.log(`\nMigrando tabla: ${table}`);

      // Get columns from sqlite table
      const cols = execAll(`PRAGMA table_info(${table})`);
      if (!cols || cols.length === 0) {
        console.log(`  (sin columnas detectadas, se omite)`);
        continue;
      }
      const colNames = cols.map(c => c.name);

      // Read all rows from sqlite
      const rows = execAll(`SELECT * FROM "${table}"`);
      console.log(`  Filas encontradas: ${rows.length}`);

      if (rows.length === 0) continue;

      // Prepare insert statement for MySQL: preserve column order
      const placeholder = '(' + colNames.map(() => '?').join(',') + ')';
      const insertSql = `INSERT INTO \`${table}\` (${colNames.map(c => `\`${c}\``).join(',')}) VALUES `;

      // Insert in batches using transaction
      for (let i = 0; i < rows.length; i += BATCH) {
        const batchRows = rows.slice(i, i + BATCH);
        const values = [];
        const placeholders = batchRows.map(r => {
          for (const c of colNames) {
            let v = r[c];
            v = transformValue(v);
            values.push(v);
          }
          return placeholder;
        }).join(',');

        const sql = insertSql + placeholders + ';';
        try {
          await conn.query(sql, values);
          console.log(`  Insertadas ${batchRows.length} filas (offset ${i})`);
        } catch (err) {
          console.error('  Error insertando batch, intentando fila a fila para aislar el error...', err.message);
          // fallback: try insert fila a fila to isolate bad row
          for (const r of batchRows) {
            const vals = colNames.map(c => transformValue(r[c]));
            const rowSql = `INSERT INTO \`${table}\` (${colNames.map(c => `\`${c}\``).join(',')}) VALUES (${colNames.map(() => '?').join(',')})`;
            try {
              await conn.query(rowSql, vals);
            } catch (rowErr) {
              console.error('    Error en fila, tabla:', table, 'fila id/preview:', r.id || '(sin id)', 'error:', rowErr.message);
              // decide: skip problematic row
            }
          }
        }
      }

      // Ajustar AUTO_INCREMENT para preservar ids (si existe columna id)
      if (colNames.includes('id')) {
        try {
          const [[{ max_id }]] = await conn.query(`SELECT MAX(id) as max_id FROM \`${table}\``);
          const next = (max_id || 0) + 1;
          await conn.query(`ALTER TABLE \`${table}\` AUTO_INCREMENT = ${next};`);
          console.log(`  AUTO_INCREMENT ajustado a ${next}`);
        } catch (e) {
          console.warn('  No se pudo ajustar AUTO_INCREMENT:', e.message);
        }
      }
    }

    // Re-enable foreign key checks
    await conn.query('SET FOREIGN_KEY_CHECKS=1;');
    console.log('\nMigración completada. Re-enable FK checks y cerrando conexión.');
  } catch (err) {
    console.error('Error durante migración:', err);
    try { await conn.query('SET FOREIGN_KEY_CHECKS=1;'); } catch (e) { }
  } finally {
    await conn.end();
    try { sqliteDb.close(); } catch (e) { }
  }
})();