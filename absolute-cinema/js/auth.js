

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/absolute-cinema/api/api_auth.php';
    const mensajeError = document.getElementById('mensaje-error');
    const btnSubmit = document.getElementById('btn-submit');

    function mostrarErrorInline(mensaje) {
        if (mensajeError) {
            mensajeError.textContent = mensaje;
            mensajeError.style.display = 'block';
        }
        btnSubmit.disabled = false;
        btnSubmit.textContent = btnSubmit.dataset.originalText || 'Intentar de nuevo';
        // También lanzamos un toast de error
        showToast(mensaje, 'error');
    }

    //  LOGIN 
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        btnSubmit.dataset.originalText = btnSubmit.textContent;

        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Ingresando...';
            
            const datosLogin = {
                accion: 'login',
                email: document.getElementById('email').value,
                password: document.getElementById('password').value
            };

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosLogin)
                });

                const data = await response.json();

                if (!response.ok) throw new Error(data.error || 'Error desconocido');

                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                
                // REEMPLAZO DE ALERT
                showToast(`¡Bienvenido de nuevo, ${data.usuario.nombre}!`, 'success');
                
                setTimeout(() => {
                    const redirectUrl = localStorage.getItem('redirectUrl');
                    if (redirectUrl) {
                        localStorage.removeItem('redirectUrl');
                        window.location.href = redirectUrl;
                    } else {
                        window.location.href = 'index.html';
                    }
                }, 1500);

            } catch (error) {
                mostrarErrorInline(error.message);
            }
        });
    }

    //  REGISTRO 
    const formRegistro = document.getElementById('form-registro');
    if (formRegistro) {
        btnSubmit.dataset.originalText = btnSubmit.textContent;

        formRegistro.addEventListener('submit', async (e) => {
            e.preventDefault();
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Registrando...';

            const datosRegistro = {
                accion: 'registro',
                nombre: document.getElementById('nombre').value,
                apellido: document.getElementById('apellido').value,
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
                telefono: document.getElementById('telefono').value
            };

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosRegistro)
                });

                const data = await response.json();

                if (!response.ok) throw new Error(data.error || 'Error desconocido');

                // REEMPLAZO DE ALERT
                showToast('¡Registro exitoso! Ahora inicia sesión.', 'success');
                
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);

            } catch (error) {
                mostrarErrorInline(error.message);
            }
        });
    }
});

// --- FUNCIÓN TOAST COPIADA 
function showToast(message, type = 'normal') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}