require('dotenv').config();
const { TYPES } = require('tedious');

const useWindowsAuth = (process.env.DB_AUTH || 'windows').toLowerCase() === 'windows';
const sql = useWindowsAuth ? require('mssql/msnodesqlv8') : require('mssql');

const server = process.env.DB_SERVER || 'DESKTOP-QROBQA9';
const instanceName = process.env.DB_INSTANCE || 'SQLEXPRESS';
const database = process.env.DB_DATABASE || 'ADE_KPI';
const odbcDriver = process.env.DB_ODBC_DRIVER || 'ODBC Driver 18 for SQL Server';

function getPoolConfig() {
  if (useWindowsAuth) {
    return {
      connectionString: [
        `Driver={${odbcDriver}}`,
        `Server=${server}\\${instanceName}`,
        `Database=${database}`,
        'Trusted_Connection=yes',
        'TrustServerCertificate=yes'
      ].join(';')
    };
  }

  return {
    server,
    authentication: {
      type: 'default',
      options: {
        userName: process.env.DB_USER,
        password: process.env.DB_PASSWORD
      }
    },
    options: {
      database,
      trustServerCertificate: true,
      encrypt: false,
      instanceName,
      enableArithAbort: true
    }
  };
}

let poolPromise = null;

function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(getPoolConfig()).catch((err) => {
      poolPromise = null;
      throw err;
    });
  }
  return poolPromise;
}

function toMssqlType(type) {
  if (!type) return sql.NVarChar;
  const name = type.name || type.type?.name;
  if (!name) return sql.NVarChar;
  return sql[name] || sql.NVarChar;
}

function bindParams(request, params = []) {
  params.forEach((p) => {
    request.input(p.name, toMssqlType(p.type), p.value);
  });
}

async function execute(sqlText, params = []) {
  const pool = await getPool();
  const request = pool.request();
  bindParams(request, params);
  return request.query(sqlText);
}

async function query(sqlText, params = []) {
  const result = await execute(sqlText, params);
  return result.recordset || [];
}

async function testConnection() {
  const rows = await query('SELECT DB_NAME() AS DatabaseName, SUSER_SNAME() AS WindowsUser');
  return rows[0] || null;
}

module.exports = {
  query,
  execute,
  testConnection,
  TYPES,
  sql,
  useWindowsAuth,
  getPoolConfig
};
