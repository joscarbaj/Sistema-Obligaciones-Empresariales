let temporizadorBusqueda = null;

document.addEventListener('DOMContentLoaded', async () => {
    await app.iniciarShell('obligaciones');

    document.getElementById('btnNueva')
        .addEventListener('click', () => app.ir('nueva-obligacion'));

    document.getElementById('empresaFiltro')
        .addEventListener('change', cargarObligaciones);

    document.getElementById('estadoFiltro')
        .addEventListener('change', cargarObligaciones);

    document.getElementById('busqueda')
        .addEventListener('input', () => {
            clearTimeout(temporizadorBusqueda);
            temporizadorBusqueda = setTimeout(cargarObligaciones, 250);
        });

    const params = new URLSearchParams(window.location.search);
    const estadoInicial = params.get('estado');

    if (estadoInicial) {
        document.getElementById('estadoFiltro').value = estadoInicial;
    }

    await cargarEmpresas();
    await cargarObligaciones();
});

async function cargarEmpresas() {
    const result = await window.api.empresas.listar(false);

    if (!result.ok) {
        app.mostrarAlerta(document.getElementById('mensaje'), result.mensaje);
        return;
    }

    const select = document.getElementById('empresaFiltro');

    result.datos.forEach((empresa) => {
        const option = document.createElement('option');
        option.value = empresa.id_empresa;
        option.textContent = empresa.nombre;
        select.appendChild(option);
    });
}

async function cargarObligaciones() {
    const mensaje = document.getElementById('mensaje');
    app.ocultarAlerta(mensaje);

    const filtros = {
        busqueda: document.getElementById('busqueda').value,
        id_empresa: document.getElementById('empresaFiltro').value,
        estado: document.getElementById('estadoFiltro').value
    };

    const result = await window.api.obligaciones.listar(filtros);

    if (!result.ok) {
        app.mostrarAlerta(mensaje, result.mensaje);
        return;
    }

    renderTabla(result.datos);
}

function renderTabla(datos) {
    const tbody = document.getElementById('tablaObligaciones');
    const empty = document.getElementById('sinObligaciones');

    tbody.innerHTML = '';
    empty.hidden = datos.length > 0;

    datos.forEach((item) => {
        const fila = document.createElement('tr');

        const dias = Number(item.dias_restantes);
        const diasTexto = dias < 0
            ? `${Math.abs(dias)} atrasado`
            : dias === 0
                ? 'Hoy'
                : `${dias} días`;

        fila.innerHTML = `
            <td><strong>${app.escapeHtml(item.codigo)}</strong></td>
            <td>${app.escapeHtml(item.empresa)}</td>
            <td>
                <strong>${app.escapeHtml(item.titulo)}</strong><br>
                <span class="text-muted">${app.escapeHtml(item.tipo_obligacion)}</span>
            </td>
            <td>${app.fecha(item.fecha_vencimiento)}</td>
            <td>${app.escapeHtml(diasTexto)}</td>
            <td>${app.escapeHtml(item.prioridad)}</td>
            <td>
                <span class="badge badge-${app.escapeHtml(item.estado)}">
                    ${app.escapeHtml(item.estado)}
                </span>
            </td>
            <td>
                <div class="actions">
                    <button class="btn btn-secondary btn-sm" data-editar="${item.id_obligacion}">
                        Editar
                    </button>
                    ${!['ATENDIDA', 'CERRADA', 'CANCELADA'].includes(item.estado)
                        ? `
                            <button class="btn btn-success btn-sm" data-atender="${item.id_obligacion}">
                                Atender
                            </button>
                            <button class="btn btn-warning btn-sm" data-cerrar="${item.id_obligacion}">
                                Cerrar
                            </button>
                        `
                        : ''}
                </div>
            </td>
        `;

        tbody.appendChild(fila);
    });

    tbody.querySelectorAll('[data-editar]').forEach((boton) => {
        boton.addEventListener('click', () => {
            app.ir('nueva-obligacion', { id: boton.dataset.editar });
        });
    });

    tbody.querySelectorAll('[data-atender]').forEach((boton) => {
        boton.addEventListener('click', () => {
            cambiarEstado(boton.dataset.atender, 'ATENDIDA');
        });
    });

    tbody.querySelectorAll('[data-cerrar]').forEach((boton) => {
        boton.addEventListener('click', () => {
            cambiarEstado(boton.dataset.cerrar, 'CERRADA');
        });
    });
}

async function cambiarEstado(idObligacion, estado) {
    const result = await window.api.obligaciones.cambiarEstado(
        Number(idObligacion),
        estado
    );

    if (!result.ok) {
        app.mostrarAlerta(document.getElementById('mensaje'), result.mensaje);
        return;
    }

    app.mostrarAlerta(
        document.getElementById('mensaje'),
        `Obligación marcada como ${estado.toLowerCase()}.`,
        'success'
    );

    await cargarObligaciones();
}
