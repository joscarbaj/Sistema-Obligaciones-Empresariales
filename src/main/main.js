const {
    app,
    BrowserWindow,
    ipcMain
} = require('electron');

const path = require('path');

const {
    iniciarSesion,
    obtenerUsuariosActivos
} = require('../services/authService');

const {
    obtenerEmpresas,
    obtenerEmpresaPorId,
    crearEmpresa,
    actualizarEmpresa,
    cambiarEstadoEmpresa
} = require('../services/empresaService');

const {
    obtenerTipos,
    obtenerObligaciones,
    obtenerObligacionPorId,
    crearObligacion,
    actualizarObligacion,
    cambiarEstado
} = require('../services/obligacionService');

const {
    obtenerResumen,
    obtenerProximas,
    obtenerRecientes
} = require('../services/dashboardService');

let ventanaPrincipal = null;
let usuarioActual = null;

const paginas = {
    login: 'login.html',
    dashboard: 'dashboard.html',
    empresas: 'empresas.html',
    obligaciones: 'obligaciones.html',
    'nueva-obligacion': 'nueva-obligacion.html'
};

function resultadoError(error) {
    console.error(error);
    return {
        ok: false,
        mensaje: error.message || 'Ocurrió un error inesperado.'
    };
}

function validarSesion() {
    if (!usuarioActual) {
        throw new Error('La sesión ha finalizado. Inicie sesión nuevamente.');
    }
}

async function cargarPagina(page, params = {}) {
    const archivo = paginas[page];

    if (!archivo) {
        throw new Error('Página no permitida.');
    }

    if (page !== 'login' && !usuarioActual) {
        page = 'login';
    }

    const archivoFinal = paginas[page];

    const query = {};
    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            query[key] = String(value);
        }
    });

    await ventanaPrincipal.loadFile(
        path.join(__dirname, '../renderer', archivoFinal),
        { query }
    );
}

function crearVentana() {
    ventanaPrincipal = new BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 1080,
        minHeight: 680,
        backgroundColor: '#f4f7fb',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    });

    ventanaPrincipal.setMenuBarVisibility(false);
    cargarPagina('login');
}

ipcMain.handle('auth:login', async (_event, credenciales) => {
    try {
        const result = await iniciarSesion(
            credenciales.usuario,
            credenciales.password
        );

        if (result.ok) {
            usuarioActual = result.usuario;
        }

        return result;
    } catch (error) {
        return resultadoError(error);
    }
});

ipcMain.handle('auth:logout', async () => {
    usuarioActual = null;
    await cargarPagina('login');
    return { ok: true };
});

ipcMain.handle('auth:actual', async () => {
    return {
        ok: !!usuarioActual,
        usuario: usuarioActual
    };
});

ipcMain.handle('auth:usuarios-activos', async () => {
    try {
        validarSesion();
        return { ok: true, datos: await obtenerUsuariosActivos() };
    } catch (error) {
        return resultadoError(error);
    }
});

ipcMain.handle('app:navigate', async (_event, payload) => {
    try {
        if (payload.page !== 'login') {
            validarSesion();
        }

        await cargarPagina(payload.page, payload.params || {});
        return { ok: true };
    } catch (error) {
        return resultadoError(error);
    }
});

ipcMain.handle('empresas:listar', async (_event, incluirInactivas) => {
    try {
        validarSesion();
        return {
            ok: true,
            datos: await obtenerEmpresas(incluirInactivas)
        };
    } catch (error) {
        return resultadoError(error);
    }
});

ipcMain.handle('empresas:obtener', async (_event, idEmpresa) => {
    try {
        validarSesion();
        return {
            ok: true,
            datos: await obtenerEmpresaPorId(idEmpresa)
        };
    } catch (error) {
        return resultadoError(error);
    }
});

ipcMain.handle('empresas:crear', async (_event, datos) => {
    try {
        validarSesion();
        return {
            ok: true,
            datos: await crearEmpresa(datos)
        };
    } catch (error) {
        return resultadoError(error);
    }
});

ipcMain.handle('empresas:actualizar', async (_event, payload) => {
    try {
        validarSesion();
        return {
            ok: true,
            datos: await actualizarEmpresa(payload.idEmpresa, payload.datos)
        };
    } catch (error) {
        return resultadoError(error);
    }
});

ipcMain.handle('empresas:cambiar-estado', async (_event, payload) => {
    try {
        validarSesion();
        return {
            ok: true,
            datos: await cambiarEstadoEmpresa(payload.idEmpresa, payload.activo)
        };
    } catch (error) {
        return resultadoError(error);
    }
});

ipcMain.handle('obligaciones:tipos', async () => {
    try {
        validarSesion();
        return { ok: true, datos: await obtenerTipos() };
    } catch (error) {
        return resultadoError(error);
    }
});

ipcMain.handle('obligaciones:listar', async (_event, filtros) => {
    try {
        validarSesion();
        return {
            ok: true,
            datos: await obtenerObligaciones(filtros)
        };
    } catch (error) {
        return resultadoError(error);
    }
});

ipcMain.handle('obligaciones:obtener', async (_event, idObligacion) => {
    try {
        validarSesion();
        return {
            ok: true,
            datos: await obtenerObligacionPorId(idObligacion)
        };
    } catch (error) {
        return resultadoError(error);
    }
});

ipcMain.handle('obligaciones:crear', async (_event, datos) => {
    try {
        validarSesion();
        return {
            ok: true,
            datos: await crearObligacion(datos, usuarioActual.id_usuario)
        };
    } catch (error) {
        return resultadoError(error);
    }
});

ipcMain.handle('obligaciones:actualizar', async (_event, payload) => {
    try {
        validarSesion();
        return {
            ok: true,
            datos: await actualizarObligacion(payload.idObligacion, payload.datos)
        };
    } catch (error) {
        return resultadoError(error);
    }
});

ipcMain.handle('obligaciones:cambiar-estado', async (_event, payload) => {
    try {
        validarSesion();
        return {
            ok: true,
            datos: await cambiarEstado(payload.idObligacion, payload.estado)
        };
    } catch (error) {
        return resultadoError(error);
    }
});

ipcMain.handle('dashboard:resumen', async () => {
    try {
        validarSesion();
        return { ok: true, datos: await obtenerResumen() };
    } catch (error) {
        return resultadoError(error);
    }
});

ipcMain.handle('dashboard:proximas', async () => {
    try {
        validarSesion();
        return { ok: true, datos: await obtenerProximas() };
    } catch (error) {
        return resultadoError(error);
    }
});

ipcMain.handle('dashboard:recientes', async () => {
    try {
        validarSesion();
        return { ok: true, datos: await obtenerRecientes() };
    } catch (error) {
        return resultadoError(error);
    }
});

app.whenReady().then(() => {
    crearVentana();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            crearVentana();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
