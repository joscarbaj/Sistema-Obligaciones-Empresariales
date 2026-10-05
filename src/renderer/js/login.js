const form = document.getElementById('loginForm');
const usuarioInput = document.getElementById('usuario');
const passwordInput = document.getElementById('password');
const btnLogin = document.getElementById('btnLogin');
const mensaje = document.getElementById('mensaje');

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const usuario = usuarioInput.value.trim();
    const password = passwordInput.value;

    mensaje.className = 'message';
    mensaje.textContent = '';

    if (!usuario || !password) {
        mensaje.textContent = 'Ingrese usuario y contraseña.';
        mensaje.className = 'message show error';
        return;
    }

    btnLogin.disabled = true;
    btnLogin.textContent = 'Ingresando...';

    try {
        const result = await window.api.auth.login({
            usuario,
            password
        });

        if (!result.ok) {
            mensaje.textContent = result.mensaje;
            mensaje.className = 'message show error';
            return;
        }

        mensaje.textContent = `Bienvenido, ${result.usuario.nombre_completo}.`;
        mensaje.className = 'message show success';

        await window.api.navigation.go('dashboard');
    } catch (error) {
        console.error(error);
        mensaje.textContent = 'No fue posible iniciar sesión.';
        mensaje.className = 'message show error';
    } finally {
        btnLogin.disabled = false;
        btnLogin.textContent = 'Iniciar sesión';
    }
});
