const { getPool } = require('../main/database');
const { sincronizarEstados } = require('./obligacionService');

async function obtenerResumen() {
    await sincronizarEstados();

    const pool = await getPool();

    const result = await pool.request().query(`
        SELECT
            (SELECT COUNT(*)
             FROM core.Empresa
             WHERE activo = 1) AS empresas,

            (SELECT COUNT(*)
             FROM obl.Obligacion
             WHERE estado IN ('PENDIENTE', 'PROXIMA', 'VENCIDA')) AS activas,

            (SELECT COUNT(*)
             FROM obl.Obligacion
             WHERE estado = 'PROXIMA') AS proximas,

            (SELECT COUNT(*)
             FROM obl.Obligacion
             WHERE estado = 'VENCIDA') AS vencidas,

            (SELECT COUNT(*)
             FROM obl.Obligacion
             WHERE estado IN ('ATENDIDA', 'CERRADA')) AS atendidas
    `);

    return result.recordset[0];
}

async function obtenerProximas() {
    await sincronizarEstados();

    const pool = await getPool();

    const result = await pool.request().query(`
        SELECT TOP 8
            id_empresa,
            empresa,
            id_obligacion,
            codigo,
            tipo_obligacion,
            titulo,
            fecha_vencimiento,
            dias_restantes,
            prioridad,
            estado,
            responsable
        FROM obl.vw_ObligacionesPorVencer
        WHERE estado IN ('VENCIDA', 'PROXIMA')
        ORDER BY
            CASE WHEN estado = 'VENCIDA' THEN 0 ELSE 1 END,
            fecha_vencimiento ASC
    `);

    return result.recordset;
}

async function obtenerRecientes() {
    const pool = await getPool();

    const result = await pool.request().query(`
        SELECT TOP 8
            o.id_obligacion,
            o.codigo,
            o.titulo,
            e.nombre AS empresa,
            t.nombre AS tipo_obligacion,
            o.estado,
            o.creado_en
        FROM obl.Obligacion o
        INNER JOIN core.Empresa e
            ON e.id_empresa = o.id_empresa
        INNER JOIN obl.TipoObligacion t
            ON t.id_tipo_obligacion = o.id_tipo_obligacion
        ORDER BY o.creado_en DESC
    `);

    return result.recordset;
}

module.exports = {
    obtenerResumen,
    obtenerProximas,
    obtenerRecientes
};
