window.app = (() => {
    function escapeHtml(valor) {
        return String(valor ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function fecha(valor) {
        if (!valor) return '—';
        const date = new Date(valor);
        if (Number.isNaN(date.getTime())) return '—';

        return new Intl.DateTimeFormat('es-HN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    }

    function dinero(valor) {
        if (valor === null || valor === undefined || valor === '') {
            return '—';
        }

        return new Intl.NumberFormat('es-HN', {
            style: 'currency',
            currency: 'HNL'
        }).format(Number(valor));
    }

    function mostrarAlerta(elemento, mensaje, tipo = 'error') {
        if (!elemento) return;
        elemento.textContent = mensaje;
        elemento.className = `alert show alert-${tipo}`;
    }

    function ocultarAlerta(elemento) {
        if (!elemento) return;
        elemento.className = 'alert';
        elemento.textContent = '';
    }

    async function ir(page, params = {}) {
        const result = await window.api.navigation.go(page, params);

        if (!result.ok) {
            console.error(result.mensaje);
        }
    }

    async function iniciarShell(activo) {
        const sesion = await window.api.auth.actual();

        if (!sesion.ok || !sesion.usuario) {
            await ir('login');
            return null;
        }

        const nombre = document.getElementById('userName');
        const avatar = document.getElementById('userAvatar');

        if (nombre) {
            nombre.textContent = sesion.usuario.nombre_completo;
        }

        if (avatar) {
            const partes = sesion.usuario.nombre_completo
                .split(/\s+/)
                .filter(Boolean);

            avatar.textContent = partes
                .slice(0, 2)
                .map((parte) => parte[0])
                .join('')
                .toUpperCase();
        }

        document.querySelectorAll('[data-nav]').forEach((boton) => {
            const page = boton.dataset.nav;

            if (page === activo) {
                boton.classList.add('active');
            }

            boton.addEventListener('click', () => ir(page));
        });

        const logout = document.getElementById('btnLogout');

        if (logout) {
            logout.addEventListener('click', async () => {
                await window.api.auth.logout();
            });
        }

        return sesion.usuario;
    }

    return {
        escapeHtml,
        fecha,
        dinero,
        mostrarAlerta,
        ocultarAlerta,
        ir,
        iniciarShell
    };
})();
