const crypto = require('crypto');

const ITERACIONES = 120000;
const LONGITUD = 64;
const ALGORITMO = 'sha512';

function crearSalt() {
    return crypto.randomBytes(32);
}

function crearHash(password, salt) {
    return crypto.pbkdf2Sync(
        password,
        salt,
        ITERACIONES,
        LONGITUD,
        ALGORITMO
    );
}

function verificarPassword(password, salt, hashGuardado) {
    if (!Buffer.isBuffer(salt)) {
        salt = Buffer.from(salt);
    }

    if (!Buffer.isBuffer(hashGuardado)) {
        hashGuardado = Buffer.from(hashGuardado);
    }

    const hashGenerado = crearHash(password, salt);

    if (hashGenerado.length !== hashGuardado.length) {
        return false;
    }

    return crypto.timingSafeEqual(hashGenerado, hashGuardado);
}

module.exports = {
    crearSalt,
    crearHash,
    verificarPassword
};
