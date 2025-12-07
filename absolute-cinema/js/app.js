

const API_URL = 'http://localhost/absolute-cinema/api/api_peliculas.php';
const API_RESENA = 'http://localhost/absolute-cinema/api/api_reseña.php';

// AGRUPAR FUNCIONES POR FECHA 
function groupFunctionsByDate(funciones) {
    const grouped = {};
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now - offset)).toISOString().slice(0, 10);
    const today = localISOTime;

    const formatter = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'numeric' });
    
    funciones.forEach(func => {
        const dateStr = func.Fecha; 
        const dateObj = new Date(dateStr + 'T12:00:00'); 
        let label;
        if (dateStr === today) {
            label = 'Hoy';
        } else {
            label = formatter.format(dateObj); 
            label = label.charAt(0).toUpperCase() + label.slice(1);
        }
        if (!grouped[dateStr]) {
            grouped[dateStr] = { label: label, list: [] };
        }
        grouped[dateStr].list.push(func);
    });
    return grouped;
}

//   INICIALIZACIÓN 
document.addEventListener('DOMContentLoaded', () => {
    const navAuth = document.getElementById('nav-auth');
    const usuarioData = localStorage.getItem('usuario'); 

    if (usuarioData) {
        const usuario = JSON.parse(usuarioData);
        let htmlUsuario = `
            <span class="nav-username" style="color: #ccc; margin-right: 10px;">Hola, ${usuario.nombre}</span>
            <a href="#" id="logout-btn" class="nav-logout">Cerrar Sesión</a>
        `;
        navAuth.innerHTML = htmlUsuario;

        if (usuario.rol === 'admin') {
            const placeholder = document.getElementById('admin-links-placeholder');
            if (placeholder) {
                placeholder.outerHTML = `
                    <li><a href="admin_dashboard.html">Admin Dashboard</a></li>
                    <li><a href="reporte_ventas.html">Reporte de Ventas</a></li>
                `;
            }
        }

        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault(); 
            localStorage.removeItem('usuario');
            
            showToast('Sesión cerrada correctamente.');
            
            setTimeout(() => {
                window.location.reload(); 
            }, 1000); // Esperamos 1 seg para que se vea el mensaje
        });
    }

    fetchPeliculas();
});

// --- 3. FETCH PRINCIPAL ---
async function fetchPeliculas() {
    const container = document.getElementById('movie-grid-container');
    container.innerHTML = '<p style="color: white;">Cargando cartelera...</p>';

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const peliculas = await response.json();

        if (!Array.isArray(peliculas) || peliculas.length === 0) {
            container.innerHTML = '<p style="color: white;">No hay funciones programadas próximamente.</p>';
            return;
        }

        container.innerHTML = '';
        peliculas.forEach(pelicula => {
            const movieCard = crearTarjetaPelicula(pelicula);
            container.appendChild(movieCard);
        });
        
        document.querySelectorAll('.rating-container').forEach(container => {
            initRatingSystem(container);
        });

    } catch (error) {
        console.error('Error JS:', error);
        container.innerHTML = `<p style="color: red;">Error al procesar los datos.</p>`;
    }
}

//  MOSTAR TARJETA 
function crearTarjetaPelicula(pelicula) {
    const card = document.createElement('article');
    card.className = 'movie-card';

    const imgUrl = pelicula.Imagen && pelicula.Imagen.trim() !== '' 
                   ? pelicula.Imagen 
                   : `https://placehold.co/300x450/222/f4f4f4?text=${encodeURIComponent(pelicula.Titulo)}`;
    
    const trailerLink = pelicula.Trailer ? pelicula.Trailer : '#';
    const targetAttr = pelicula.Trailer ? 'target="_blank"' : '';
    
    let formattedDuration = 'N/A';
    if (pelicula.Duracion) {
        const [h, m] = pelicula.Duracion.split(':');
        formattedDuration = `${parseInt(h)}h ${parseInt(m)}min`;
    }

    let horariosHtml = '';
    
    if (pelicula.funciones && pelicula.funciones.length > 0) {
        const funcionesAgrupadas = groupFunctionsByDate(pelicula.funciones);
        const fechasOrdenadas = Object.keys(funcionesAgrupadas).sort();

        fechasOrdenadas.forEach(dateKey => {
            const grupo = funcionesAgrupadas[dateKey];
            horariosHtml += `
                <div class="date-group">
                    <p style="font-weight: bold; color: #aaa; margin-top: 10px; margin-bottom: 5px; border-bottom: 1px solid #333;">
                        ${grupo.label}
                    </p>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 5px;">
            `;
            grupo.list.forEach(funcion => {
                const horaFormateada = funcion.Hora.substring(0, 5);
                horariosHtml += `
                    <a href="seleccion_asientos.html?id_funcion=${funcion.ID_Funcion}" class="time-btn">
                       ${horaFormateada}
                    </a>
                `;
            });
            horariosHtml += `</div></div>`;
        });
    } else {
        horariosHtml = '<p>No hay funciones programadas.</p>';
    }

    card.innerHTML = `
        <a href="${trailerLink}" ${targetAttr} style="display: block; position: relative;">
            <img src="${imgUrl}" alt="${pelicula.Titulo}" style="width: 100%; height: 360px; object-fit: cover;">
            ${pelicula.Trailer ? '<div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.6); padding:10px; border-radius:50%; font-size:24px;">▶️</div>' : ''}
        </a>
        
        <div class="movie-info">
            <h3>${pelicula.Titulo}</h3>
            <p>
                <span class="tag">${pelicula.Genero || 'N/A'}</span>
                <span class="tag">${pelicula.Clasificacion || 'N/A'}</span>
                <span class="tag">${formattedDuration}</span>
            </p>
            
            <p class="sinopsis" style="font-size: 0.9rem; color: #ccc; margin: 10px 0; line-height: 1.4; min-height: 3em;">
                ${pelicula.Sinopsis || 'Sin sinopsis disponible.'}
            </p>
            
            <div class="rating-container" 
                 data-movie-id="${pelicula.ID_Pelicula}"
                 data-avg-rating="${pelicula.CalificacionPromedio}">
                <div class="rating-display">
                    <span class="rating-value">${pelicula.CalificacionPromedio}</span>
                    <div class="rating-stars"></div>
                </div>
                <p class="rating-info">Califica para actualizar el promedio.</p>
            </div>

            <div class="showtimes">
                <p><strong>Funciones próximas:</strong></p>
                ${horariosHtml}
            </div>
        </div>
    `;
    
    return card;
}

// SISTEMA DE ESTRELLAS 
function renderStars(containerStars, ratingValue) {
    containerStars.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.textContent = '★';
        star.dataset.value = i;
        
        if (ratingValue >= i) {
            star.className = 'star-gold';
        } else if (ratingValue >= i - 0.5) {
            star.className = 'star-half';
        } else {
            star.className = ''; 
        }
        containerStars.appendChild(star);
    }
}

function initRatingSystem(container) {
    const movieId = container.dataset.movieId;
    let currentAvg = parseFloat(container.dataset.avgRating) || 0;
    const starsElement = container.querySelector('.rating-stars');
    const infoElement = container.querySelector('.rating-info');

    renderStars(starsElement, currentAvg);

    const usuarioData = localStorage.getItem('usuario');
    if (!usuarioData) {
        infoElement.textContent = 'Inicia sesión para calificar.';
        return; 
    }
    const userId = JSON.parse(usuarioData).id_cliente;

    starsElement.classList.add('active');

    starsElement.addEventListener('mousemove', (e) => {
        const target = e.target;
        if (target.tagName === 'SPAN') {
            const rect = target.getBoundingClientRect();
            const width = rect.width;
            const clickX = e.clientX - rect.left; 
            let starValue = parseInt(target.dataset.value);
            let isHalf = clickX < (width / 2);
            let finalValue = isHalf ? starValue - 0.5 : starValue;
            renderStars(starsElement, finalValue);
            infoElement.textContent = `Calificar con: ${finalValue}`;
            starsElement.dataset.tempValue = finalValue;
        }
    });

    starsElement.addEventListener('mouseleave', () => {
        renderStars(starsElement, currentAvg);
        infoElement.textContent = 'Tu opinión es importante.';
    });

    starsElement.addEventListener('click', async () => {
        const ratingSeleccionado = parseFloat(starsElement.dataset.tempValue);
        if (!ratingSeleccionado) return;

        infoElement.textContent = 'Guardando...';
        infoElement.style.color = '#e6c200';
        starsElement.style.pointerEvents = 'none';

        try {
            const response = await fetch(API_RESENA, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_cliente: userId,
                    id_pelicula: movieId,
                    puntuacion: ratingSeleccionado 
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Error al calificar');

            currentAvg = parseFloat(data.nueva_puntuacion_5);
            
            container.querySelector('.rating-value').textContent = currentAvg;
            renderStars(starsElement, currentAvg);
            
            infoElement.textContent = '¡Gracias por tu calificación!';
            infoElement.style.color = '#0f0';
            
            setTimeout(() => {
                infoElement.style.color = '#ccc';
                infoElement.textContent = 'Calificación guardada.';
            }, 2000);

        } catch (error) {
            infoElement.textContent = 'Error al guardar.';
            infoElement.style.color = '#f00';
        } finally {
            starsElement.style.pointerEvents = 'auto';
        }
    });
}

// FUNCIÓN GLOBAL PARA NOTIFICACIONES 
function showToast(message, type = 'normal') {
    // Buscar o crear el contenedor
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    // Crear el toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    
    container.appendChild(toast);

    // Mostrar 
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    
    setTimeout(() => {
        toast.classList.remove('show');
        // Esperar a que termine la animación de salida para borrar del DOM
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}