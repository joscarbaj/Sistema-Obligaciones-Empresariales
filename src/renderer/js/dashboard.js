document.addEventListener('DOMContentLoaded', async () => {
    await app.iniciarShell('dashboard');

    document.getElementById('btnNuevaObligacion')
        .addEventListener('click', () => app.ir('nueva-obligacion'));

    document.getElementById('btnVerObligaciones')
        .addEventListener('click', () => app.ir('obligaciones'));

    document.getElementById('quickEmpresas')
        .addEventListener('click', () => app.ir('empresas'));

    document.getElementById('quickObligaciones')
        .addEventListener('click', () => app.ir('obligaciones'));

    document.getElementById('quickNueva')
        .addEventListener('click', () => app.ir('nueva-obligacion'));

    document.getElementById('quickVencidas')
        .addEventListener('click', () => app.ir('obligaciones', { estado: 'VENCIDA' }));

    await cargarDashboard();
});

async function cargarDashboard() {
    const mensaje = document.getElementById('mensaje');

    try {
        const [resumen, proximas, recientes] = await Promise.all([
            window.api.dashboard.resumen(),
            window.api.dashboard.proximas(),
            window.api.dashboard.recientes()
        ]);

        if (!resumen.ok) throw new Error(resumen.mensaje);
        if (!proximas.ok) throw new Error(proximas.mensaje);
        if (!recientes.ok) throw new Error(recientes.mensaje);

        document.getElementById('statEmpresas').textContent = resumen.datos.empresas ?? 0;
        document.getElementById('statActivas').textContent = resumen.datos.activas ?? 0;
        document.getElementById('statProximas').textContent = resumen.datos.proximas ?? 0;
        document.getElementById('statVencidas').textContent = resumen.datos.vencidas ?? 0;
        document.getElementById('statAtendidas').textContent = resumen.datos.atendidas ?? 0;

        renderProximas(proximas.datos);
        renderRecientes(recientes.datos);
    } catch (error) {
        app.mostrarAlerta(mensaje, error.message);
    }
}

function renderProximas(datos) {
    const tbody = document.getElementById('tablaProximas');
    const empty = document.getElementById('sinProximas');

    tbody.innerHTML = '';
    empty.hidden = datos.length > 0;

    datos.forEach((item) => {
        const fila = document.createElement('tr');

        fila.innerHTML = `
            <td>${app.escapeHtml(item.empresa)}</td>
            <td>
                <strong>${app.escapeHtml(item.titulo)}</strong><br>
                <span class="text-muted">${app.escapeHtml(item.codigo)}</span>
            </td>
            <td>${app.escapeHtml(item.tipo_obligacion)}</td>
            <td>${app.fecha(item.fecha_vencimiento)}</td>
            <td>${Number(item.dias_restantes)}</td>
            <td>
                <span class="badge badge-${app.escapeHtml(item.estado)}">
                    ${app.escapeHtml(item.estado)}
                </span>
            </td>
        `;

        tbody.appendChild(fila);
    });
}

function renderRecientes(datos) {
    const tbody = document.getElementById('tablaRecientes');
    const empty = document.getElementById('sinRecientes');

    tbody.innerHTML = '';
    empty.hidden = datos.length > 0;

    datos.forEach((item) => {
        const fila = document.createElement('tr');

        fila.innerHTML = `
            <td>${app.escapeHtml(item.codigo)}</td>
            <td>${app.escapeHtml(item.empresa)}</td>
            <td>${app.escapeHtml(item.titulo)}</td>
            <td>${app.escapeHtml(item.tipo_obligacion)}</td>
            <td>
                <span class="badge badge-${app.escapeHtml(item.estado)}">
                    ${app.escapeHtml(item.estado)}
                </span>
            </td>
            <td>${app.fecha(item.creado_en)}</td>
        `;

        tbody.appendChild(fila);
    });
}
