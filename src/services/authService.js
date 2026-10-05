const { getPool, sql } = require('../main/database');
const { verificarPassword } = require('./passwordService');

async function iniciarSesion(nombreUsuario, password) {
    const pool = await getPool();

    const result = await pool
        .request()
        .input('nombre_usuario', sql.VarChar(80), nombreUsuario)
        .query(`
            SELECT
                id_usuario,
                nombre_usuario,
                nombre_completo,
                correo,
                password_hash,
                password_salt,
                activo,
                bloqueado
            FROM seg.Usuario
            WHERE nombre_usuario = @nombre_usuario
        `);

    if (result.recordset.length === 0) {
        return { ok: false, mensaje: 'Usuario o contraseña incorrectos.' };
    }

    const usuario = result.recordset[0];

    if (!usuario.activo) {
        return { ok: false, mensaje: 'El usuario está inactivo.' };
    }

    if (usuario.bloqueado) {
        return { ok: false, mensaje: 'El usuario está bloqueado.' };
    }

    if (!usuario.password_hash || !usuario.password_salt) {
        return {
            ok: false,
            mensaje: 'El usuario no tiene una contraseña configurada.'
        };
    }

    const passwordValida = verificarPassword(
        password,
        usuario.password_salt,
        usuario.password_hash
    );

    if (!passwordValida) {
        return { ok: false, mensaje: 'Usuario o contraseña incorrectos.' };
    }

    await pool
        .request()
        .input('id_usuario', sql.Int, usuario.id_usuario)
        .query(`
            UPDATE seg.Usuario
            SET ultimo_acceso = SYSUTCDATETIME()
            WHERE id_usuario = @id_usuario
        `);

    return {
        ok: true,
        usuario: {
            id_usuario: usuario.id_usuario,
            nombre_usuario: usuario.nombre_usuario,
            nombre_completo: usuario.nombre_completo,
            correo: usuario.correo
        }
    };
}

async function obtenerUsuariosActivos() {
    const pool = await getPool();
    const result = await pool.request().query(`
        SELECT id_usuario, nombre_usuario, nombre_completo, correo
        FROM seg.Usuario
        WHERE activo = 1 AND bloqueado = 0
        ORDER BY nombre_completo
    `);

    return result.recordset;
}

module.exports = {
    iniciarSesion,
    obtenerUsuariosActivos
};
