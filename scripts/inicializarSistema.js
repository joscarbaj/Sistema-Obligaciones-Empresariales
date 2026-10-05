const { getPool, sql, cerrarConexion } = require('../src/main/database');
const {
    crearSalt,
    crearHash
} = require('../src/services/passwordService');
const {
    obtenerGrupoPrincipal
} = require('../src/services/empresaService');

async function asegurarTipos(pool) {
    const tipos = [
        ['CONTRATO', 'Contrato', 5],
        ['PERMISO', 'Permiso', 5],
        ['PRESTAMO', 'Préstamo', 5],
        ['CUOTA', 'Cuota de préstamo', 3],
        ['RENOVACION', 'Renovación', 5],
        ['OTRO', 'Otro compromiso', 5]
    ];

    for (const [codigo, nombre, dias] of tipos) {
        const result = await pool
            .request()
            .input('codigo', sql.VarChar(40), codigo)
            .query(`
                SELECT id_tipo_obligacion
                FROM obl.TipoObligacion
                WHERE codigo = @codigo
            `);

        if (result.recordset.length === 0) {
            await pool
                .request()
                .input('codigo', sql.VarChar(40), codigo)
                .input('nombre', sql.NVarChar(150), nombre)
                .input('dias', sql.Int, dias)
                .query(`
                    INSERT INTO obl.TipoObligacion
                        (codigo, nombre, dias_alerta_default, activo)
                    VALUES
                        (@codigo, @nombre, @dias, 1)
                `);
        }
    }
}

async function asegurarAdmin(pool) {
    const nombreUsuario = 'admin';

    const existe = await pool
        .request()
        .input('usuario', sql.VarChar(80), nombreUsuario)
        .query(`
            SELECT id_usuario
            FROM seg.Usuario
            WHERE nombre_usuario = @usuario
        `);

    if (existe.recordset.length > 0) {
        console.log('✓ El usuario admin ya existe.');
        return;
    }

    const password = 'Admin123*';
    const salt = crearSalt();
    const hash = crearHash(password, salt);

    await pool
        .request()
        .input('usuario', sql.VarChar(80), nombreUsuario)
        .input('nombre', sql.NVarChar(180), 'Administrador General')
        .input('correo', sql.VarChar(150), 'admin@grupojd.local')
        .input('hash', sql.VarBinary(512), hash)
        .input('salt', sql.VarBinary(256), salt)
        .query(`
            INSERT INTO seg.Usuario
                (
                    nombre_usuario,
                    nombre_completo,
                    correo,
                    password_hash,
                    password_salt,
                    activo,
                    bloqueado
                )
            VALUES
                (
                    @usuario,
                    @nombre,
                    @correo,
                    @hash,
                    @salt,
                    1,
                    0
                )
        `);

    console.log('✓ Usuario inicial creado.');
    console.log('  Usuario: admin');
    console.log('  Contraseña: Admin123*');
}

async function ejecutar() {
    try {
        const pool = await getPool();

        await obtenerGrupoPrincipal();
        console.log('✓ Grupo Empresarial JD listo.');

        await asegurarTipos(pool);
        console.log('✓ Tipos de obligación listos.');

        await asegurarAdmin(pool);

        console.log('');
        console.log('Inicialización completada correctamente.');
    } catch (error) {
        console.error('Error inicializando el sistema:', error);
        process.exitCode = 1;
    } finally {
        try {
            await cerrarConexion();
        } catch (_) {}
    }
}

ejecutar();
