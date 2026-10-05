let empresas = [];

document.addEventListener('DOMContentLoaded', async () => {
    await app.iniciarShell('empresas');

    document.getElementById('btnNuevaEmpresa')
        .addEventListener('click', abrirNueva);

    document.getElementById('btnCerrarModal')
        .addEventListener('click', cerrarModal);

    document.getElementById('btnCancelar')
        .addEventListener('click', cerrarModal);

    document.getElementById('empresaForm')
        .addEventListener('submit', guardarEmpresa);

    document.getElementById('buscarEmpresa')
        .addEventListener('input', aplicarFiltros);

    document.getElementById('filtroEstado')
        .addEventListener('change', aplicarFiltros);

    document.getElementById('modalEmpresa')
        .addEventListener('click', (event) => {
            if (event.target.id === 'modalEmpresa') {
                cerrarModal();
            }
        });

    await cargarEmpresas();
});

async function cargarEmpresas() {
    const mensaje = document.getElementById('mensaje');
    app.ocultarAlerta(mensaje);

    const result = await window.api.empresas.listar(true);

    if (!result.ok) {
        app.mostrarAlerta(mensaje, result.mensaje);
        return;
    }

    empresas = result.datos;
    aplicarFiltros();
}

function aplicarFiltros() {
    const texto = document.getElementById('buscarEmpresa')
        .value
        .trim()
        .toLowerCase();

    const estado = document.getElementById('filtroEstado').value;

    const filtradas = empresas.filter((empresa) => {
        const coincideTexto =
            !texto ||
            empresa.codigo?.toLowerCase().includes(texto) ||
            empresa.nombre?.toLowerCase().includes(texto) ||
            empresa.nombre_comercial?.toLowerCase().includes(texto) ||
            empresa.rubro?.toLowerCase().includes(texto);

        const coincideEstado =
            estado === 'TODAS' ||
            (estado === 'ACTIVAS' && empresa.activo) ||
            (estado === 'INACTIVAS' && !empresa.activo);

        return coincideTexto && coincideEstado;
    });

    renderTabla(filtradas);
}

function renderTabla(datos) {
    const tbody = document.getElementById('tablaEmpresas');
    const empty = document.getElementById('sinEmpresas');

    tbody.innerHTML = '';
    empty.hidden = datos.length > 0;

    datos.forEach((empresa) => {
        const fila = document.createElement('tr');

        fila.innerHTML = `
            <td><strong>${app.escapeHtml(empresa.codigo)}</strong></td>
            <td>
                ${app.escapeHtml(empresa.nombre)}
                ${empresa.nombre_comercial
                    ? `<br><span class="text-muted">${app.escapeHtml(empresa.nombre_comercial)}</span>`
                    : ''}
            </td>
            <td>${app.escapeHtml(empresa.rubro || '—')}</td>
            <td>${app.escapeHtml(empresa.rtn || '—')}</td>
            <td>
                ${app.escapeHtml(empresa.telefono || '—')}
                ${empresa.correo
                    ? `<br><span class="text-muted">${app.escapeHtml(empresa.correo)}</span>`
                    : ''}
            </td>
            <td>
                <span class="badge ${empresa.activo ? 'badge-ATENDIDA' : 'badge-CANCELADA'}">
                    ${empresa.activo ? 'ACTIVA' : 'INACTIVA'}
                </span>
            </td>
            <td>
                <div class="actions">
                    <button class="btn btn-secondary btn-sm" data-editar="${empresa.id_empresa}">
                        Editar
                    </button>
                    <button
                        class="btn ${empresa.activo ? 'btn-danger' : 'btn-success'} btn-sm"
                        data-estado="${empresa.id_empresa}"
                        data-activo="${empresa.activo ? '0' : '1'}"
                    >
                        ${empresa.activo ? 'Desactivar' : 'Activar'}
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(fila);
    });

    tbody.querySelectorAll('[data-editar]').forEach((boton) => {
        boton.addEventListener('click', () => editarEmpresa(boton.dataset.editar));
    });

    tbody.querySelectorAll('[data-estado]').forEach((boton) => {
        boton.addEventListener('click', () => cambiarEstado(
            boton.dataset.estado,
            boton.dataset.activo === '1'
        ));
    });
}

function abrirNueva() {
    document.getElementById('empresaForm').reset();
    document.getElementById('idEmpresa').value = '';
    document.getElementById('modalTitulo').textContent = 'Registrar empresa';
    app.ocultarAlerta(document.getElementById('modalMensaje'));
    document.getElementById('modalEmpresa').classList.add('open');
    document.getElementById('codigo').focus();
}

async function editarEmpresa(idEmpresa) {
    const result = await window.api.empresas.obtener(Number(idEmpresa));

    if (!result.ok || !result.datos) {
        app.mostrarAlerta(
            document.getElementById('mensaje'),
            result.mensaje || 'No se encontró la empresa.'
        );
        return;
    }

    const empresa = result.datos;

    document.getElementById('idEmpresa').value = empresa.id_empresa;
    document.getElementById('codigo').value = empresa.codigo || '';
    document.getElementById('nombre').value = empresa.nombre || '';
    document.getElementById('nombreComercial').value = empresa.nombre_comercial || '';
    document.getElementById('rtn').value = empresa.rtn || '';
    document.getElementById('rubro').value = empresa.rubro || '';
    document.getElementById('telefono').value = empresa.telefono || '';
    document.getElementById('correo').value = empresa.correo || '';
    document.getElementById('direccion').value = empresa.direccion || '';

    document.getElementById('modalTitulo').textContent = 'Editar empresa';
    app.ocultarAlerta(document.getElementById('modalMensaje'));
    document.getElementById('modalEmpresa').classList.add('open');
}

async function guardarEmpresa(event) {
    event.preventDefault();

    const idEmpresa = document.getElementById('idEmpresa').value;
    const boton = document.getElementById('btnGuardarEmpresa');
    const modalMensaje = document.getElementById('modalMensaje');

    const datos = {
        codigo: document.getElementById('codigo').value,
        nombre: document.getElementById('nombre').value,
        nombre_comercial: document.getElementById('nombreComercial').value,
        rtn: document.getElementById('rtn').value,
        rubro: document.getElementById('rubro').value,
        telefono: document.getElementById('telefono').value,
        correo: document.getElementById('correo').value,
        direccion: document.getElementById('direccion').value
    };

    boton.disabled = true;
    boton.textContent = 'Guardando...';
    app.ocultarAlerta(modalMensaje);

    const result = idEmpresa
        ? await window.api.empresas.actualizar(Number(idEmpresa), datos)
        : await window.api.empresas.crear(datos);

    boton.disabled = false;
    boton.textContent = 'Guardar empresa';

    if (!result.ok) {
        app.mostrarAlerta(modalMensaje, result.mensaje);
        return;
    }

    cerrarModal();
    app.mostrarAlerta(
        document.getElementById('mensaje'),
        idEmpresa ? 'Empresa actualizada correctamente.' : 'Empresa registrada correctamente.',
        'success'
    );

    await cargarEmpresas();
}

async function cambiarEstado(idEmpresa, activo) {
    const result = await window.api.empresas.cambiarEstado(
        Number(idEmpresa),
        activo
    );

    if (!result.ok) {
        app.mostrarAlerta(document.getElementById('mensaje'), result.mensaje);
        return;
    }

    await cargarEmpresas();
}

function cerrarModal() {
    document.getElementById('modalEmpresa').classList.remove('open');
}
