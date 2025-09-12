// dump_musicset_values.cjs - Dump completo de valores de tabla MusicSet (MySQL)
require('dotenv').config({ path: '.env.prisma' });
const mysql = require('mysql2/promise');

async function main() {
  const mysqlConfig = {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'test'
  };

  console.log('🔄 Conectando a MySQL para dump de MusicSet...');
  console.log('📍 Host:', mysqlConfig.host + ':' + mysqlConfig.port);
  console.log('🗄️  Base de datos:', mysqlConfig.database);

  let conn;
  try {
    conn = await mysql.createConnection(mysqlConfig);
    console.log('✅ Conexión MySQL exitosa');

    // Verificar que la tabla MusicSet existe
    const [tables] = await conn.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'MusicSet'
    `, [mysqlConfig.database]);

    if (tables.length === 0) {
      console.error('❌ Tabla MusicSet no encontrada en la base de datos');
      process.exit(1);
    }

    console.log('📋 Tabla MusicSet encontrada');

    // Obtener información de columnas
    const [columns] = await conn.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'MusicSet'
      ORDER BY ORDINAL_POSITION
    `, [mysqlConfig.database]);

    console.log('📊 Estructura de la tabla MusicSet:');
    columns.forEach(col => {
      console.log(`   ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Contar filas totales
    const [countResult] = await conn.query('SELECT COUNT(*) as total FROM MusicSet');
    const totalRows = countResult[0].total;
    console.log(`\n📈 Total de filas en MusicSet: ${totalRows}`);

    if (totalRows === 0) {
      console.log('⚠️  La tabla MusicSet está vacía');
      return;
    }

    // Obtener todas las filas ordenadas por ID
    const [rows] = await conn.query('SELECT * FROM MusicSet ORDER BY id');

    console.log('\n🎵 DUMP COMPLETO DE VALORES - MusicSet:');
    console.log('='.repeat(80));

    rows.forEach((row, index) => {
      console.log(`\n📀 MusicSet #${index + 1} (ID: ${row.id})`);
      console.log('-'.repeat(40));

      // Mostrar cada campo del registro
      Object.keys(row).forEach(key => {
        const value = row[key];
        let displayValue = value;

        // Formatear valores especiales
        if (value === null) {
          displayValue = 'NULL';
        } else if (typeof value === 'object') {
          displayValue = JSON.stringify(value, null, 2);
        } else if ((key.includes('date') || key.includes('Date') || key.includes('At')) && value) {
          try {
            displayValue = new Date(value).toISOString();
          } catch (dateError) {
            displayValue = `INVALID_DATE: ${value}`;
          }
        } else if (typeof value === 'boolean') {
          displayValue = value ? 'true' : 'false';
        } else if (typeof value === 'string' && value.length > 100) {
          displayValue = value.substring(0, 100) + '...';
        }

        console.log(`   ${key}: ${displayValue}`);
      });
    });

    console.log('\n' + '='.repeat(80));
    console.log(`✅ Dump completado - ${totalRows} registros procesados`);

    // Resumen estadístico
    console.log('\n📊 RESUMEN ESTADÍSTICO:');

    // Géneros más comunes
    const [genreStats] = await conn.query(`
      SELECT genre, COUNT(*) as count
      FROM MusicSet
      GROUP BY genre
      ORDER BY count DESC
    `);

    if (genreStats.length > 0) {
      console.log('🎼 Distribución por género:');
      genreStats.forEach(stat => {
        console.log(`   ${stat.genre || 'Sin género'}: ${stat.count}`);
      });
    }

    // Estado de publicación
    const [publishStats] = await conn.query(`
      SELECT published, COUNT(*) as count
      FROM MusicSet
      GROUP BY published
    `);

    console.log('📢 Estado de publicación:');
    publishStats.forEach(stat => {
      console.log(`   ${stat.published ? 'Publicado' : 'No publicado'}: ${stat.count}`);
    });

    // Sets destacados
    const [featuredStats] = await conn.query(`
      SELECT featured, COUNT(*) as count
      FROM MusicSet
      GROUP BY featured
    `);

    console.log('⭐ Sets destacados:');
    featuredStats.forEach(stat => {
      console.log(`   ${stat.featured ? 'Destacado' : 'No destacado'}: ${stat.count}`);
    });

  } catch (error) {
    console.error('❌ Error durante el dump:', error.message);
    process.exit(1);
  } finally {
    if (conn) {
      await conn.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

main().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});