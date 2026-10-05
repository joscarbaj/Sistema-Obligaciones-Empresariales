const { getPool, sql } = require('../main/database');

async function obtenerGrupoPrincipal(transaction = null) {
    const pool = transaction || await getPool();

    let request = transaction
        ? new sql.Request(transaction)
        : pool.request();

    let result = await request.query(`
        SELECT TOP 1 id_grupo
        FROM core.GrupoEmpresarial
        WHERE activo = 1
        ORDER BY id_grupo
    `);

    if (result.recordset.length > 0) {
        return result.recordset[0].id_grupo;
    }

    request = transaction
        ? new sql.Request(transaction)
        : pool.request();

    result = await request.query(`
        INSERT INTO core.GrupoEmpresarial
            (codigo, nombre, descripcion, activo)
        OUTPUT INSERTED.id_grupo
        VALUES
            ('JD', N'Grupo Empresarial JD',
             N'Grupo empresarial principal del sistema', 1)
    `);

    return result.recordset[0].id_grupo;
}

async function obtenerEmpresas(incluirInactivas = true) {
    const pool = await getPool();

    const result = await pool
        .request()
        .input('incluir_inactivas', sql.Bit, incluirInactivas ? 1 : 0)
        .query(`
            SELECT
                id_empresa,
                id_grupo,
                codigo,
                nombre,
                nombre_comercial,
                rtn,
                rubro,
                direccion,
                telefono,
                correo,
                activo,
                creado_en
            FROM core.Empresa
            WHERE @incluir_inactivas = 1 OR activo = 1
            ORDER BY activo DESC, nombre
        `);

    return result.recordset;
}

async function obtenerEmpresaPorId(idEmpresa) {
    const pool = await getPool();

    const result = await pool
        .request()
        .input('id_empresa', sql.Int, idEmpresa)
        .query(`
            SELECT
                id_empresa,
                codigo,
                nombre,
                nombre_comercial,
                rtn,
                rubro,
                direccion,
                telefono,
                correo,
                activo
            FROM core.Empresa
            WHERE id_empresa = @id_empresa
        `);

    return result.recordset[0] || null;
}

function validarEmpresa(datos) {
    if (!datos.codigo || !datos.codigo.trim()) {
        throw new Error('El código de la empresa es obligatorio.');
    }

    if (!datos.nombre || !datos.nombre.trim()) {
        throw new Error('El nombre de la empresa es obligatorio.');
    }
}

async function crearEmpresa(datos) {
    validarEmpresa(datos);

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        const idGrupo = await obtenerGrupoPrincipal(transaction);

        const request = new sql.Request(transaction);

        const result = await request
            .input('id_grupo', sql.Int, idGrupo)
            .input('codigo', sql.VarChar(20), datos.codigo.trim())
            .input('nombre', sql.NVarChar(180), datos.nombre.trim())
            .input('nombre_comercial', sql.NVarChar(180), datos.nombre_comercial?.trim() || null)
            .input('rtn', sql.VarChar(30), datos.rtn?.trim() || null)
            .input('rubro', sql.NVarChar(200), datos.rubro?.trim() || null)
            .input('direccion', sql.NVarChar(300), datos.direccion?.trim() || null)
            .input('telefono', sql.VarChar(50), datos.telefono?.trim() || null)
            .input('correo', sql.VarChar(150), datos.correo?.trim() || null)
            .query(`
                INSERT INTO core.Empresa
                    (
                        id_grupo, codigo, nombre, nombre_comercial,
                        rtn, rubro, direccion, telefono, correo, activo
                    )
                OUTPUT INSERTED.id_empresa
                VALUES
                    (
                        @id_grupo, @codigo, @nombre, @nombre_comercial,
                        @rtn, @rubro, @direccion, @telefono, @correo, 1
                    )
            `);

        await transaction.commit();
        return result.recordset[0];
    } catch (error) {
        if (transaction._aborted !== true) {
            try { await transaction.rollback(); } catch (_) {}
        }

        if (error.number === 2627 || error.number === 2601) {
            throw new Error('Ya existe una empresa con ese código.');
        }

        throw error;
    }
}

async function actualizarEmpresa(idEmpresa, datos) {
    validarEmpresa(datos);

    const pool = await getPool();

    try {
        await pool
            .request()
            .input('id_empresa', sql.Int, idEmpresa)
            .input('codigo', sql.VarChar(20), datos.codigo.trim())
            .input('nombre', sql.NVarChar(180), datos.nombre.trim())
            .input('nombre_comercial', sql.NVarChar(180), datos.nombre_comercial?.trim() || null)
            .input('rtn', sql.VarChar(30), datos.rtn?.trim() || null)
            .input('rubro', sql.NVarChar(200), datos.rubro?.trim() || null)
            .input('direccion', sql.NVarChar(300), datos.direccion?.trim() || null)
            .input('telefono', sql.VarChar(50), datos.telefono?.trim() || null)
            .input('correo', sql.VarChar(150), datos.correo?.trim() || null)
            .query(`
                UPDATE core.Empresa
                SET
                    codigo = @codigo,
                    nombre = @nombre,
                    nombre_comercial = @nombre_comercial,
                    rtn = @rtn,
                    rubro = @rubro,
                    direccion = @direccion,
                    telefono = @telefono,
                    correo = @correo
                WHERE id_empresa = @id_empresa
            `);

        return { id_empresa: idEmpresa };
    } catch (error) {
        if (error.number === 2627 || error.number === 2601) {
            throw new Error('Ya existe una empresa con ese código.');
        }

        throw error;
    }
}

async function cambiarEstadoEmpresa(idEmpresa, activo) {
    const pool = await getPool();

    await pool
        .request()
        .input('id_empresa', sql.Int, idEmpresa)
        .input('activo', sql.Bit, activo ? 1 : 0)
        .query(`
            UPDATE core.Empresa
            SET activo = @activo
            WHERE id_empresa = @id_empresa
        `);

    return { id_empresa: idEmpresa, activo: !!activo };
}

module.exports = {
    obtenerGrupoPrincipal,
    obtenerEmpresas,
    obtenerEmpresaPorId,
    crearEmpresa,
    actualizarEmpresa,
    cambiarEstadoEmpresa
};
