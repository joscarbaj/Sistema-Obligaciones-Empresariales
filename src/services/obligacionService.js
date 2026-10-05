const { getPool, sql } = require('../main/database');

async function sincronizarEstados() {
    const pool = await getPool();

    await pool.request().query(`
        UPDATE obl.Obligacion
        SET estado =
            CASE
                WHEN fecha_vencimiento < CAST(GETDATE() AS DATE)
                    THEN 'VENCIDA'
                WHEN DATEDIFF(
                        DAY,
                        CAST(GETDATE() AS DATE),
                        fecha_vencimiento
                     ) <= dias_alerta
                    THEN 'PROXIMA'
                ELSE 'PENDIENTE'
            END
        WHERE estado NOT IN ('ATENDIDA', 'CERRADA', 'CANCELADA')
    `);
}

async function obtenerTipos() {
    const pool = await getPool();

    const result = await pool.request().query(`
        SELECT
            id_tipo_obligacion,
            codigo,
            nombre,
            dias_alerta_default
        FROM obl.TipoObligacion
        WHERE activo = 1
        ORDER BY nombre
    `);

    return result.recordset;
}

async function obtenerObligaciones(filtros = {}) {
    await sincronizarEstados();

    const pool = await getPool();

    const idEmpresa = filtros.id_empresa
        ? Number(filtros.id_empresa)
        : null;

    const estado = filtros.estado && filtros.estado !== 'TODOS'
        ? filtros.estado
        : null;

    const busqueda = filtros.busqueda?.trim()
        ? `%${filtros.busqueda.trim()}%`
        : null;

    const result = await pool
        .request()
        .input('id_empresa', sql.Int, idEmpresa)
        .input('estado', sql.VarChar(20), estado)
        .input('busqueda', sql.NVarChar(250), busqueda)
        .query(`
            SELECT
                o.id_obligacion,
                o.id_empresa,
                e.nombre AS empresa,
                o.id_tipo_obligacion,
                t.nombre AS tipo_obligacion,
                o.codigo,
                o.titulo,
                o.descripcion,
                o.fecha_inicio,
                o.fecha_vencimiento,
                o.dias_alerta,
                o.monto_referencia,
                o.responsable_usuario,
                u.nombre_completo AS responsable,
                o.prioridad,
                o.estado,
                o.requiere_renovacion,
                o.fecha_cierre,
                o.creado_en,
                DATEDIFF(
                    DAY,
                    CAST(GETDATE() AS DATE),
                    o.fecha_vencimiento
                ) AS dias_restantes
            FROM obl.Obligacion o
            INNER JOIN core.Empresa e
                ON e.id_empresa = o.id_empresa
            INNER JOIN obl.TipoObligacion t
                ON t.id_tipo_obligacion = o.id_tipo_obligacion
            LEFT JOIN seg.Usuario u
                ON u.id_usuario = o.responsable_usuario
            WHERE
                (@id_empresa IS NULL OR o.id_empresa = @id_empresa)
                AND (@estado IS NULL OR o.estado = @estado)
                AND (
                    @busqueda IS NULL
                    OR o.codigo LIKE @busqueda
                    OR o.titulo LIKE @busqueda
                    OR e.nombre LIKE @busqueda
                    OR t.nombre LIKE @busqueda
                )
            ORDER BY
                CASE o.estado
                    WHEN 'VENCIDA' THEN 1
                    WHEN 'PROXIMA' THEN 2
                    WHEN 'PENDIENTE' THEN 3
                    ELSE 4
                END,
                o.fecha_vencimiento ASC
        `);

    return result.recordset;
}

async function obtenerObligacionPorId(idObligacion) {
    await sincronizarEstados();

    const pool = await getPool();

    const result = await pool
        .request()
        .input('id_obligacion', sql.BigInt, idObligacion)
        .query(`
            SELECT
                id_obligacion,
                id_empresa,
                id_tipo_obligacion,
                codigo,
                titulo,
                descripcion,
                fecha_inicio,
                fecha_vencimiento,
                dias_alerta,
                monto_referencia,
                responsable_usuario,
                prioridad,
                estado,
                requiere_renovacion,
                fecha_cierre
            FROM obl.Obligacion
            WHERE id_obligacion = @id_obligacion
        `);

    return result.recordset[0] || null;
}

function validar(datos) {
    if (!datos.id_empresa) {
        throw new Error('Seleccione una empresa.');
    }

    if (!datos.id_tipo_obligacion) {
        throw new Error('Seleccione un tipo de obligación.');
    }

    if (!datos.codigo || !datos.codigo.trim()) {
        throw new Error('El código es obligatorio.');
    }

    if (!datos.titulo || !datos.titulo.trim()) {
        throw new Error('El título es obligatorio.');
    }

    if (!datos.fecha_vencimiento) {
        throw new Error('La fecha de vencimiento es obligatoria.');
    }

    const dias = Number(datos.dias_alerta);
    if (!Number.isInteger(dias) || dias < 0) {
        throw new Error('Los días de alerta deben ser un número igual o mayor que cero.');
    }
}

function valorFecha(fecha) {
    return fecha || null;
}

async function crearObligacion(datos, idUsuario) {
    validar(datos);

    const pool = await getPool();

    try {
        const result = await pool
            .request()
            .input('id_empresa', sql.Int, Number(datos.id_empresa))
            .input('id_tipo_obligacion', sql.Int, Number(datos.id_tipo_obligacion))
            .input('codigo', sql.VarChar(40), datos.codigo.trim())
            .input('titulo', sql.NVarChar(200), datos.titulo.trim())
            .input('descripcion', sql.NVarChar(1000), datos.descripcion?.trim() || null)
            .input('fecha_inicio', sql.Date, valorFecha(datos.fecha_inicio))
            .input('fecha_vencimiento', sql.Date, datos.fecha_vencimiento)
            .input('dias_alerta', sql.Int, Number(datos.dias_alerta))
            .input(
                'monto_referencia',
                sql.Decimal(18, 2),
                datos.monto_referencia === '' || datos.monto_referencia == null
                    ? null
                    : Number(datos.monto_referencia)
            )
            .input(
                'responsable_usuario',
                sql.Int,
                datos.responsable_usuario
                    ? Number(datos.responsable_usuario)
                    : null
            )
            .input('prioridad', sql.VarChar(10), datos.prioridad || 'MEDIA')
            .input('requiere_renovacion', sql.Bit, datos.requiere_renovacion ? 1 : 0)
            .input('creado_por', sql.Int, idUsuario || null)
            .query(`
                INSERT INTO obl.Obligacion
                    (
                        id_empresa,
                        id_tipo_obligacion,
                        codigo,
                        titulo,
                        descripcion,
                        fecha_inicio,
                        fecha_vencimiento,
                        dias_alerta,
                        monto_referencia,
                        responsable_usuario,
                        prioridad,
                        estado,
                        requiere_renovacion,
                        creado_por
                    )
                OUTPUT INSERTED.id_obligacion
                VALUES
                    (
                        @id_empresa,
                        @id_tipo_obligacion,
                        @codigo,
                        @titulo,
                        @descripcion,
                        @fecha_inicio,
                        @fecha_vencimiento,
                        @dias_alerta,
                        @monto_referencia,
                        @responsable_usuario,
                        @prioridad,
                        'PENDIENTE',
                        @requiere_renovacion,
                        @creado_por
                    )
            `);

        await sincronizarEstados();
        return result.recordset[0];
    } catch (error) {
        if (error.number === 2627 || error.number === 2601) {
            throw new Error('Ya existe una obligación con ese código para la empresa seleccionada.');
        }

        throw error;
    }
}

async function actualizarObligacion(idObligacion, datos) {
    validar(datos);

    const pool = await getPool();

    try {
        await pool
            .request()
            .input('id_obligacion', sql.BigInt, idObligacion)
            .input('id_empresa', sql.Int, Number(datos.id_empresa))
            .input('id_tipo_obligacion', sql.Int, Number(datos.id_tipo_obligacion))
            .input('codigo', sql.VarChar(40), datos.codigo.trim())
            .input('titulo', sql.NVarChar(200), datos.titulo.trim())
            .input('descripcion', sql.NVarChar(1000), datos.descripcion?.trim() || null)
            .input('fecha_inicio', sql.Date, valorFecha(datos.fecha_inicio))
            .input('fecha_vencimiento', sql.Date, datos.fecha_vencimiento)
            .input('dias_alerta', sql.Int, Number(datos.dias_alerta))
            .input(
                'monto_referencia',
                sql.Decimal(18, 2),
                datos.monto_referencia === '' || datos.monto_referencia == null
                    ? null
                    : Number(datos.monto_referencia)
            )
            .input(
                'responsable_usuario',
                sql.Int,
                datos.responsable_usuario
                    ? Number(datos.responsable_usuario)
                    : null
            )
            .input('prioridad', sql.VarChar(10), datos.prioridad || 'MEDIA')
            .input('requiere_renovacion', sql.Bit, datos.requiere_renovacion ? 1 : 0)
            .query(`
                UPDATE obl.Obligacion
                SET
                    id_empresa = @id_empresa,
                    id_tipo_obligacion = @id_tipo_obligacion,
                    codigo = @codigo,
                    titulo = @titulo,
                    descripcion = @descripcion,
                    fecha_inicio = @fecha_inicio,
                    fecha_vencimiento = @fecha_vencimiento,
                    dias_alerta = @dias_alerta,
                    monto_referencia = @monto_referencia,
                    responsable_usuario = @responsable_usuario,
                    prioridad = @prioridad,
                    requiere_renovacion = @requiere_renovacion
                WHERE id_obligacion = @id_obligacion
            `);

        await sincronizarEstados();
        return { id_obligacion: idObligacion };
    } catch (error) {
        if (error.number === 2627 || error.number === 2601) {
            throw new Error('Ya existe una obligación con ese código para la empresa seleccionada.');
        }

        throw error;
    }
}

async function cambiarEstado(idObligacion, estado) {
    const permitidos = ['ATENDIDA', 'CERRADA', 'CANCELADA'];

    if (!permitidos.includes(estado)) {
        throw new Error('Estado no permitido.');
    }

    const pool = await getPool();

    await pool
        .request()
        .input('id_obligacion', sql.BigInt, idObligacion)
        .input('estado', sql.VarChar(20), estado)
        .query(`
            UPDATE obl.Obligacion
            SET
                estado = @estado,
                fecha_cierre =
                    CASE
                        WHEN @estado IN ('ATENDIDA', 'CERRADA', 'CANCELADA')
                            THEN CAST(GETDATE() AS DATE)
                        ELSE fecha_cierre
                    END
            WHERE id_obligacion = @id_obligacion
        `);

    return { id_obligacion: idObligacion, estado };
}

module.exports = {
    sincronizarEstados,
    obtenerTipos,
    obtenerObligaciones,
    obtenerObligacionPorId,
    crearObligacion,
    actualizarObligacion,
    cambiarEstado
};
