let idObligacion = null;
let tiposObligacion = [];

document.addEventListener('DOMContentLoaded', async () => {
    await app.iniciarShell('nueva-obligacion');

    const params = new URLSearchParams(window.location.search);
    idObligacion = params.get('id');

    document.getElementById('btnVolver')
        .addEventListener('click', () => app.ir('obligaciones'));

    document.getElementById('btnCancelar')
        .addEventListener('click', () => app.ir('obligaciones'));

    document.getElementById('obligacionForm')
        .addEventListener('submit', guardar);

    document.getElementById('tipo')
        .addEventListener('change', aplicarDiasTipo);

    await cargarCatalogos();

    if (idObligacion) {
        document.getElementById('tituloPagina').textContent = 'Editar obligación';
        document.getElementById('btnGuardar').textContent = 'Guardar cambios';
        await cargarObligacion();
    }
});

async function cargarCatalogos() {
    const mensaje = document.getElementById('mensaje');

    const [empresasResult, tiposResult, usuariosResult] = await Promise.all([
        window.api.empresas.listar(false),
        window.api.obligaciones.tipos(),
        window.api.auth.usuariosActivos()
    ]);

    if (!empresasResult.ok) {
        app.mostrarAlerta(mensaje, empresasResult.mensaje);
        return;
    }

    if (!tiposResult.ok) {
        app.mostrarAlerta(mensaje, tiposResult.mensaje);
        return;
    }

    if (!usuariosResult.ok) {
        app.mostrarAlerta(mensaje, usuariosResult.mensaje);
        return;
    }

    const empresaSelect = document.getElementById('empresa');
    empresasResult.datos.forEach((empresa) => {
        const option = document.createElement('option');
        option.value = empresa.id_empresa;
        option.textContent = empresa.nombre;
        empresaSelect.appendChild(option);
    });

    tiposObligacion = tiposResult.datos;
    const tipoSelect = document.getElementById('tipo');

    tiposObligacion.forEach((tipo) => {
        const option = document.createElement('option');
        option.value = tipo.id_tipo_obligacion;
        option.textContent = tipo.nombre;
        tipoSelect.appendChild(option);
    });

    const responsableSelect = document.getElementById('responsable');
    usuariosResult.datos.forEach((usuario) => {
        const option = document.createElement('option');
        option.value = usuario.id_usuario;
        option.textContent = usuario.nombre_completo;
        responsableSelect.appendChild(option);
    });
}

function aplicarDiasTipo() {
    if (idObligacion) return;

    const tipoId = Number(document.getElementById('tipo').value);

    const tipo = tiposObligacion.find(
        (item) => item.id_tipo_obligacion === tipoId
    );

    if (tipo) {
        document.getElementById('diasAlerta').value =
            tipo.dias_alerta_default;
    }
}

async function cargarObligacion() {
    const result = await window.api.obligaciones.obtener(Number(idObligacion));

    if (!result.ok || !result.datos) {
        app.mostrarAlerta(
            document.getElementById('mensaje'),
            result.mensaje || 'No se encontró la obligación.'
        );
        return;
    }

    const item = result.datos;

    document.getElementById('empresa').value = item.id_empresa;
    document.getElementById('tipo').value = item.id_tipo_obligacion;
    document.getElementById('codigo').value = item.codigo || '';
    document.getElementById('titulo').value = item.titulo || '';
    document.getElementById('descripcion').value = item.descripcion || '';
    document.getElementById('fechaInicio').value = toInputDate(item.fecha_inicio);
    document.getElementById('fechaVencimiento').value = toInputDate(item.fecha_vencimiento);
    document.getElementById('diasAlerta').value = item.dias_alerta ?? 5;
    document.getElementById('prioridad').value = item.prioridad || 'MEDIA';
    document.getElementById('responsable').value = item.responsable_usuario || '';
    document.getElementById('monto').value = item.monto_referencia ?? '';
    document.getElementById('renovacion').checked = !!item.requiere_renovacion;
}

function toInputDate(value) {
    if (!value) return '';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

async function guardar(event) {
    event.preventDefault();

    const mensaje = document.getElementById('mensaje');
    const boton = document.getElementById('btnGuardar');

    const datos = {
        id_empresa: document.getElementById('empresa').value,
        id_tipo_obligacion: document.getElementById('tipo').value,
        codigo: document.getElementById('codigo').value,
        titulo: document.getElementById('titulo').value,
        descripcion: document.getElementById('descripcion').value,
        fecha_inicio: document.getElementById('fechaInicio').value,
        fecha_vencimiento: document.getElementById('fechaVencimiento').value,
        dias_alerta: document.getElementById('diasAlerta').value,
        prioridad: document.getElementById('prioridad').value,
        responsable_usuario: document.getElementById('responsable').value,
        monto_referencia: document.getElementById('monto').value,
        requiere_renovacion: document.getElementById('renovacion').checked
    };

    app.ocultarAlerta(mensaje);
    boton.disabled = true;
    boton.textContent = 'Guardando...';

    const result = idObligacion
        ? await window.api.obligaciones.actualizar(Number(idObligacion), datos)
        : await window.api.obligaciones.crear(datos);

    boton.disabled = false;
    boton.textContent = idObligacion
        ? 'Guardar cambios'
        : 'Guardar obligación';

    if (!result.ok) {
        app.mostrarAlerta(mensaje, result.mensaje);
        return;
    }

    await app.ir('obligaciones');
}
