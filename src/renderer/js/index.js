const btnProbarConexion =
    document.getElementById('btnProbarConexion');

const btnEmpresas =
    document.getElementById('btnEmpresas');

const estadoConexion =
    document.getElementById('estadoConexion');

const tablaEmpresas =
    document.getElementById('tablaEmpresas');

btnProbarConexion.addEventListener(
    'click',
    async () => {
        estadoConexion.textContent =
            'Probando conexión...';

        const resultado =
            await window.api.probarConexion();

        if (resultado.ok) {
            estadoConexion.textContent =
                `Conectado a ${resultado.datos.base_datos}
                 - Servidor: ${resultado.datos.servidor}`;
        } else {
            estadoConexion.textContent =
                `Error: ${resultado.mensaje}`;
        }
    }
);

btnEmpresas.addEventListener(
    'click',
    async () => {
        tablaEmpresas.innerHTML = '';

        const resultado =
            await window.api.obtenerEmpresas();

        if (!resultado.ok) {
            estadoConexion.textContent =
                `Error: ${resultado.mensaje}`;

            return;
        }

        resultado.datos.forEach((empresa) => {

            const fila =
                document.createElement('tr');

            const codigo =
                document.createElement('td');

            const nombre =
                document.createElement('td');

            const nombreComercial =
                document.createElement('td');

            const rubro =
                document.createElement('td');

            codigo.textContent =
                empresa.codigo ?? '';

            nombre.textContent =
                empresa.nombre ?? '';

            nombreComercial.textContent =
                empresa.nombre_comercial ?? '';

            rubro.textContent =
                empresa.rubro ?? '';

            fila.appendChild(codigo);
            fila.appendChild(nombre);
            fila.appendChild(nombreComercial);
            fila.appendChild(rubro);

            tablaEmpresas.appendChild(fila);
        });
    }
);