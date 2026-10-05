const sql = require('mssql/msnodesqlv8');
require('dotenv').config();

const driver = process.env.ODBC_DRIVER || 'ODBC Driver 18 for SQL Server';

const connectionString = [
    `Driver={${driver}}`,
    `Server=${process.env.DB_SERVER}`,
    `Database=${process.env.DB_DATABASE}`,
    'Trusted_Connection=Yes',
    'Encrypt=Yes',
    'TrustServerCertificate=Yes'
].join(';') + ';';

const config = { connectionString };
let poolPromise = null;

async function getPool() {
    try {
        if (!poolPromise) {
            poolPromise = new sql.ConnectionPool(config).connect();
        }
        return await poolPromise;
    } catch (error) {
        poolPromise = null;
        console.error('Error de conexión a SQL Server:', error);
        throw error;
    }
}

async function probarConexion() {
    const pool = await getPool();
    const result = await pool.request().query(`
        SELECT DB_NAME() AS base_datos, @@SERVERNAME AS servidor
    `);
    return result.recordset[0];
}

async function cerrarConexion() {
    if (poolPromise) {
        const pool = await poolPromise;
        await pool.close();
        poolPromise = null;
    }
}

module.exports = {
    sql,
    getPool,
    probarConexion,
    cerrarConexion
};
