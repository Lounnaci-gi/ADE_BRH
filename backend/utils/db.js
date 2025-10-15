const { Connection, Request, TYPES } = require('tedious');

const baseConfig = {
  server: process.env.DB_SERVER || 'localhost',
  authentication: {
    type: 'default',
    options: {
      userName: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    }
  },
  options: {
    database: process.env.DB_DATABASE,
    trustServerCertificate: true,
    encrypt: false,
    instanceName: 'SQLEXPRESS',
    enableArithAbort: true
  }
};

function connect() {
  return new Promise((resolve, reject) => {
    const connection = new Connection(baseConfig);
    connection.on('connect', (err) => {
      if (err) return reject(err);
      resolve(connection);
    });
    connection.connect();
  });
}

async function query(sql, params = []) {
  const connection = await connect();
  return new Promise((resolve, reject) => {
    const rows = [];
    const request = new Request(sql, (err) => {
      if (err) {
        // ensure close then reject
        connection.close();
        return reject(err);
      }
    });

    // add parameters
    params.forEach((p) => {
      request.addParameter(p.name, p.type, p.value);
    });

    request.on('row', (columns) => {
      const row = {};
      columns.forEach((c) => {
        row[c.metadata.colName] = c.value;
      });
      rows.push(row);
    });

    request.on('requestCompleted', () => {
      connection.close();
      resolve(rows);
    });

    connection.execSql(request);
  });
}

module.exports = { query, TYPES };


