import mysql from 'mysql2/promise';

// Create MySQL connection pool
const pool = mysql.createPool({
  host: '192.168.1.40',
  port: 3306,
  user: 'admin',
  password: 'admin123',
  database: 'josepe_DB',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Database connection helper
export const connectDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Database disconnection helper
export const disconnectDatabase = async () => {
  try {
    await pool.end();
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
  }
};

// Pagination helper
export const paginate = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return {
    offset,
    limit
  };
};

// Search helper - adapted for MySQL
export const buildSearchQuery = (searchTerm, fields = []) => {
  if (!searchTerm || fields.length === 0) return '';

  const conditions = fields.map(field => `${field} LIKE ?`).join(' OR ');
  const values = fields.map(() => `%${searchTerm}%`);
  return { condition: `(${conditions})`, values };
};

// Sort helper - adapted for MySQL
export const buildSortQuery = (sort = 'createdAt', order = 'desc') => {
  const validOrders = ['asc', 'desc'];
  const orderClause = validOrders.includes(order.toLowerCase()) ? order.toUpperCase() : 'DESC';
  return `${sort} ${orderClause}`;
};

// Generic CRUD operations
export const createRecord = async (model, data) => {
  try {
    const connection = await pool.getConnection();
    try {
      const columns = Object.keys(data);
      const placeholders = columns.map(() => '?').join(', ');
      const values = columns.map(col => data[col]);

      const query = `INSERT INTO ${model} (${columns.join(', ')}) VALUES (${placeholders})`;
      const [result] = await connection.execute(query, values);

      // Get the created record
      const [rows] = await connection.execute(`SELECT * FROM ${model} WHERE id = ?`, [result.insertId]);
      connection.release();
      return rows[0];
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    throw new Error(`Failed to create ${model}: ${error.message}`);
  }
};

export const findRecord = async (model, where, include = {}) => {
  try {
    const connection = await pool.getConnection();
    try {
      const whereConditions = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
      const values = Object.values(where);

      const query = `SELECT * FROM ${model} WHERE ${whereConditions} LIMIT 1`;
      const [rows] = await connection.execute(query, values);
      connection.release();
      return rows[0] || null;
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    throw new Error(`Failed to find ${model}: ${error.message}`);
  }
};

export const findRecords = async (model, options = {}) => {
  try {
    const connection = await pool.getConnection();
    try {
      const { where = {}, include = {}, orderBy = {}, offset = 0, limit = 10 } = options;

      let query = `SELECT * FROM ${model}`;
      let values = [];

      // WHERE clause
      if (Object.keys(where).length > 0) {
        const whereConditions = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
        values = Object.values(where);
        query += ` WHERE ${whereConditions}`;
      }

      // ORDER BY clause
      if (Object.keys(orderBy).length > 0) {
        const orderClauses = Object.entries(orderBy).map(([field, direction]) =>
          `${field} ${direction.toUpperCase()}`
        ).join(', ');
        query += ` ORDER BY ${orderClauses}`;
      }

      // LIMIT and OFFSET
      query += ` LIMIT ${limit} OFFSET ${offset}`;

      const [rows] = await connection.execute(query, values);
      connection.release();
      return rows;
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    throw new Error(`Failed to find ${model} records: ${error.message}`);
  }
};

export const updateRecord = async (model, where, data) => {
  try {
    const connection = await pool.getConnection();
    try {
      const setColumns = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const setValues = Object.values(data);

      const whereConditions = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
      const whereValues = Object.values(where);

      const query = `UPDATE ${model} SET ${setColumns} WHERE ${whereConditions}`;
      const values = [...setValues, ...whereValues];

      await connection.execute(query, values);

      // Get the updated record
      const [rows] = await connection.execute(
        `SELECT * FROM ${model} WHERE ${whereConditions}`,
        whereValues
      );
      connection.release();
      return rows[0];
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    throw new Error(`Failed to update ${model}: ${error.message}`);
  }
};

export const deleteRecord = async (model, where) => {
  try {
    const connection = await pool.getConnection();
    try {
      // First get the record to return it
      const whereConditions = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
      const values = Object.values(where);

      const [rows] = await connection.execute(
        `SELECT * FROM ${model} WHERE ${whereConditions}`,
        values
      );

      if (rows.length === 0) {
        connection.release();
        throw new Error('Record not found');
      }

      const record = rows[0];

      // Delete the record
      await connection.execute(`DELETE FROM ${model} WHERE ${whereConditions}`, values);
      connection.release();
      return record;
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    throw new Error(`Failed to delete ${model}: ${error.message}`);
  }
};

export const countRecords = async (model, where = {}) => {
  try {
    const connection = await pool.getConnection();
    try {
      let query = `SELECT COUNT(*) as count FROM ${model}`;
      let values = [];

      if (Object.keys(where).length > 0) {
        const whereConditions = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
        values = Object.values(where);
        query += ` WHERE ${whereConditions}`;
      }

      const [rows] = await connection.execute(query, values);
      connection.release();
      return rows[0].count;
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    throw new Error(`Failed to count ${model} records: ${error.message}`);
  }
};

// Batch operations
export const batchCreate = async (model, data) => {
  try {
    const connection = await pool.getConnection();
    try {
      if (data.length === 0) return [];

      const columns = Object.keys(data[0]);
      const placeholders = `(${columns.map(() => '?').join(', ')})`;
      const allPlaceholders = data.map(() => placeholders).join(', ');

      const values = data.flatMap(item =>
        columns.map(col => item[col] || null)
      );

      const query = `INSERT INTO ${model} (${columns.join(', ')}) VALUES ${allPlaceholders}`;
      await connection.execute(query, values);

      connection.release();
      return data; // Return the input data as confirmation
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    throw new Error(`Failed to batch create ${model}: ${error.message}`);
  }
};

export const batchUpdate = async (model, operations) => {
  try {
    const connection = await pool.getConnection();
    try {
      const results = [];

      for (const { where, data } of operations) {
        const setColumns = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const setValues = Object.values(data);

        const whereConditions = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
        const whereValues = Object.values(where);

        const query = `UPDATE ${model} SET ${setColumns} WHERE ${whereConditions}`;
        const values = [...setValues, ...whereValues];

        await connection.execute(query, values);

        // Get the updated record
        const [rows] = await connection.execute(
          `SELECT * FROM ${model} WHERE ${whereConditions}`,
          whereValues
        );
        results.push(rows[0]);
      }

      connection.release();
      return results;
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    throw new Error(`Failed to batch update ${model}: ${error.message}`);
  }
};

export const batchDelete = async (model, whereConditions) => {
  try {
    const connection = await pool.getConnection();
    try {
      const results = [];

      for (const where of whereConditions) {
        const whereConditionsStr = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
        const values = Object.values(where);

        // Get the record before deleting
        const [rows] = await connection.execute(
          `SELECT * FROM ${model} WHERE ${whereConditionsStr}`,
          values
        );

        if (rows.length > 0) {
          results.push(rows[0]);
          await connection.execute(`DELETE FROM ${model} WHERE ${whereConditionsStr}`, values);
        }
      }

      connection.release();
      return results;
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    throw new Error(`Failed to batch delete ${model}: ${error.message}`);
  }
};

// Transaction helper
export const executeTransaction = async (operations) => {
  try {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const results = [];
      for (const operation of operations) {
        const [result] = await connection.execute(operation);
        results.push(result);
      }

      await connection.commit();
      connection.release();
      return results;
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    throw new Error(`Transaction failed: ${error.message}`);
  }
};

// Database health check
export const healthCheck = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.execute('SELECT 1');
    connection.release();
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
  }
};

// Cleanup old records
export const cleanupOldRecords = async (model, field = 'createdAt', daysOld = 30) => {
  try {
    const connection = await pool.getConnection();
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const query = `DELETE FROM ${model} WHERE ${field} < ?`;
      const [result] = await connection.execute(query, [cutoffDate]);
      connection.release();
      return result.affectedRows;
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    throw new Error(`Failed to cleanup old ${model} records: ${error.message}`);
  }
};

// Export pool instance for direct access if needed
export default pool;
