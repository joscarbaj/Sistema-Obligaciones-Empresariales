const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    auth: {
        login: (credenciales) => ipcRenderer.invoke('auth:login', credenciales),
        logout: () => ipcRenderer.invoke('auth:logout'),
        actual: () => ipcRenderer.invoke('auth:actual'),
        usuariosActivos: () => ipcRenderer.invoke('auth:usuarios-activos')
    },

    navigation: {
        go: (page, params = {}) => ipcRenderer.invoke('app:navigate', { page, params })
    },

    empresas: {
        listar: (incluirInactivas = true) =>
            ipcRenderer.invoke('empresas:listar', incluirInactivas),
        obtener: (idEmpresa) =>
            ipcRenderer.invoke('empresas:obtener', idEmpresa),
        crear: (datos) =>
            ipcRenderer.invoke('empresas:crear', datos),
        actualizar: (idEmpresa, datos) =>
            ipcRenderer.invoke('empresas:actualizar', { idEmpresa, datos }),
        cambiarEstado: (idEmpresa, activo) =>
            ipcRenderer.invoke('empresas:cambiar-estado', { idEmpresa, activo })
    },

    obligaciones: {
        listar: (filtros = {}) =>
            ipcRenderer.invoke('obligaciones:listar', filtros),
        tipos: () =>
            ipcRenderer.invoke('obligaciones:tipos'),
        obtener: (idObligacion) =>
            ipcRenderer.invoke('obligaciones:obtener', idObligacion),
        crear: (datos) =>
            ipcRenderer.invoke('obligaciones:crear', datos),
        actualizar: (idObligacion, datos) =>
            ipcRenderer.invoke('obligaciones:actualizar', { idObligacion, datos }),
        cambiarEstado: (idObligacion, estado) =>
            ipcRenderer.invoke('obligaciones:cambiar-estado', { idObligacion, estado })
    },

    dashboard: {
        resumen: () =>
            ipcRenderer.invoke('dashboard:resumen'),
        proximas: () =>
            ipcRenderer.invoke('dashboard:proximas'),
        recientes: () =>
            ipcRenderer.invoke('dashboard:recientes')
    }
});
