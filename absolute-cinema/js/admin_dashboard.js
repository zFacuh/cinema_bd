

// ---  AUTORIZACIÓN ---
(function() {
    const usuarioData = localStorage.getItem('usuario');
    if (!usuarioData) {
        window.location.href = 'login.html';
        return;
    }
    const usuario = JSON.parse(usuarioData);
    if (usuario.rol !== 'admin') {
        alert('Acceso denegado. Esta sección es solo para administradores.'); 
        window.location.href = 'index.html';
        return;
    }
})();

document.addEventListener('DOMContentLoaded', () => {

    const API_PELICULAS = 'http://localhost/absolute-cinema/api/api_gestion_peliculas.php';
    const API_FUNCIONES = 'http://localhost/absolute-cinema/api/api_gestion_funciones.php';
    const API_SALAS = 'http://localhost/absolute-cinema/api/api_gestion_salas.php';

    // --- Referencias DOM ---
    const formAgregarPeli = document.getElementById('form-agregar-pelicula');
    const tablaBodyPelis = document.getElementById('tabla-peliculas-body');
    const peliculaIdInput = document.getElementById('pelicula-id');
    const btnCancelarEdicion = document.getElementById('btn-cancelar-edicion');
    const btnSubmitPeli = document.getElementById('btn-submit-peli');

    const formAgregarFunc = document.getElementById('form-agregar-funcion');
    const selectPelicula = document.getElementById('select-pelicula');
    const selectSala = document.getElementById('select-sala');
    const tablaBodyFuncs = document.getElementById('tabla-funciones-body');
    
    const formAgregarSala = document.getElementById('form-agregar-sala');
    const tablaBodySalas = document.getElementById('tabla-salas-body');


    //  LÓGICA DE PELÍCULAS
    
    async function cargarPeliculas() {
        tablaBodyPelis.innerHTML = '<tr><td colspan="4">Cargando...</td></tr>'; 
        try {
            const response = await fetch(API_PELICULAS);
            const peliculas = await response.json();
            tablaBodyPelis.innerHTML = '';
            if (peliculas.length === 0) {
                tablaBodyPelis.innerHTML = '<tr><td colspan="4">No hay películas.</td></tr>';
                return;
            }
            peliculas.forEach(peli => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${peli.ID_Pelicula}</td>
                    <td>${peli.Titulo}</td>
                    <td>${peli.Genero}</td>
                    <td>
                        <button class="btn-guardar btn-modificar-peli" style="background-color: #007bff; padding: 5px 10px; font-size: 0.8rem;" data-id="${peli.ID_Pelicula}">Modificar</button>
                        <button class="btn-borrar btn-borrar-peli" data-id="${peli.ID_Pelicula}">Borrar</button>
                    </td>
                `;
                tr.dataset.peli = JSON.stringify(peli);
                tablaBodyPelis.appendChild(tr);
            });
        } catch (error) { console.error(error); }
    }

    async function guardarPelicula(e) {
        e.preventDefault();
        const id = peliculaIdInput.value; 
        const datosPelicula = {
            titulo: document.getElementById('titulo').value,
            genero: document.getElementById('genero').value,
            clasificacion: document.getElementById('clasificacion').value,
            duracion: document.getElementById('duracion').value,
            sinopsis: document.getElementById('sinopsis').value,
            imagen: document.getElementById('imagen').value,
            trailer: document.getElementById('trailer').value
        };

        try {
            let url = API_PELICULAS;
            let method = 'POST';
            if (id) {
                method = 'PUT';
                datosPelicula.id = id; 
            }

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosPelicula)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Error al guardar');

            
            showToast(id ? '¡Película actualizada correctamente!' : '¡Película creada exitosamente!');
            
            limpiarFormularioPeliculas();
            cargarPeliculas();
            cargarSelects(); 

        } catch (error) { 
            showToast(error.message, 'error');
        }
    }

    function prepararEdicion(peli) {
        peliculaIdInput.value = peli.ID_Pelicula;
        document.getElementById('titulo').value = peli.Titulo;
        document.getElementById('genero').value = peli.Genero;
        document.getElementById('clasificacion').value = peli.Clasificacion;
        document.getElementById('duracion').value = peli.Duracion;
        document.getElementById('sinopsis').value = peli.Sinopsis || '';
        document.getElementById('imagen').value = peli.Imagen || '';
        document.getElementById('trailer').value = peli.Trailer || '';

        btnSubmitPeli.textContent = 'Actualizar Película';
        btnCancelarEdicion.style.display = 'inline-block';
        document.getElementById('col-peliculas').scrollIntoView({ behavior: 'smooth' });
        showToast('Modo edición activado: ' + peli.Titulo);
    }

    function limpiarFormularioPeliculas() {
        formAgregarPeli.reset();
        peliculaIdInput.value = '';
        btnSubmitPeli.textContent = 'Guardar Película';
        btnCancelarEdicion.style.display = 'none';
    }

    async function borrarPelicula(id) {
        if (!confirm('¿Borrar esta película? (Se borrarán sus funciones y tickets)')) return;
        try {
            await fetch(`${API_PELICULAS}?id=${id}`, { method: 'DELETE' });
            showToast('Película eliminada.', 'success');
            cargarPeliculas();
            cargarSelects(); 
            cargarFunciones(); 
        } catch (error) { showToast('Error al borrar', 'error'); }
    }

    
    //  LÓGICA DE FUNCIONES
    
    async function cargarSelects() {
        try {
            const [respPelis, respSalas] = await Promise.all([
                fetch(`${API_FUNCIONES}?recurso=peliculas`),
                fetch(`${API_FUNCIONES}?recurso=salas`)
            ]);
            const peliculas = await respPelis.json();
            const salas = await respSalas.json();

            selectPelicula.innerHTML = '<option value="">Seleccione una película</option>';
            peliculas.forEach(peli => {
                selectPelicula.innerHTML += `<option value="${peli.ID_Pelicula}">${peli.Titulo}</option>`;
            });

            selectSala.innerHTML = '<option value="">Seleccione una sala</option>';
            salas.forEach(sala => {
                selectSala.innerHTML += `<option value="${sala.ID_Sala}">${sala.Nombre_Identificador}</option>`;
            });
        } catch (error) { console.error(error); }
    }

    async function cargarFunciones() {
        tablaBodyFuncs.innerHTML = '<tr><td colspan="5">Cargando...</td></tr>';
        try {
            const response = await fetch(API_FUNCIONES);
            const funciones = await response.json();
            tablaBodyFuncs.innerHTML = '';
            if (funciones.length === 0) {
                tablaBodyFuncs.innerHTML = '<tr><td colspan="5">No hay funciones.</td></tr>';
                return;
            }
            funciones.forEach(func => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${func.Pelicula}</td>
                    <td>${func.Sala}</td>
                    <td>${func.Fecha}</td>
                    <td>${func.Hora.substring(0, 5)}</td>
                    <td><button class="btn-borrar btn-borrar-func" data-id="${func.ID_Funcion}">Borrar</button></td>
                `;
                tablaBodyFuncs.appendChild(tr);
            });
        } catch (error) { console.error(error); }
    }

    async function agregarFuncion(e) {
        e.preventDefault();
        const nuevaFuncion = {
            id_pelicula: selectPelicula.value,
            id_sala: selectSala.value,
            fecha: document.getElementById('fecha').value,
            hora: document.getElementById('hora').value
        };
        try {
            await fetch(API_FUNCIONES, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nuevaFuncion) });
            
           
            showToast('¡Función programada correctamente!');
            
            formAgregarFunc.reset();
            cargarFunciones();
        } catch (error) { showToast('Error al agregar función', 'error'); }
    }

    async function borrarFuncion(id) {
        if (!confirm('¿Borrar esta función?')) return;
        try {
            await fetch(`${API_FUNCIONES}?id=${id}`, { method: 'DELETE' });
            showToast('Función eliminada.', 'success');
            cargarFunciones();
        } catch (error) { showToast('Error borrando', 'error'); }
    }
    
   
    //  LÓGICA DE SALAS
   
    async function cargarSalas() {
        tablaBodySalas.innerHTML = '<tr><td colspan="5">Cargando...</td></tr>';
        try {
            const response = await fetch(API_SALAS);
            const salas = await response.json();
            tablaBodySalas.innerHTML = '';
            if (salas.length === 0) {
                tablaBodySalas.innerHTML = '<tr><td colspan="5">No hay salas creadas.</td></tr>';
                return;
            }
            salas.forEach(sala => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${sala.ID_Sala}</td>
                    <td>${sala.Nombre_Identificador}</td>
                    <td>${sala.Filas}x${sala.Columnas}</td>
                    <td>${sala.Capacidad}</td>
                    <td><button class="btn-borrar btn-borrar-sala" data-id="${sala.ID_Sala}">Borrar</button></td>
                `;
                tablaBodySalas.appendChild(tr);
            });
        } catch (error) { console.error(error); }
    }

    async function agregarSala(e) {
        e.preventDefault();
        const nuevaSala = {
            nombre: document.getElementById('sala-nombre').value,
            filas: document.getElementById('sala-filas').value,
            columnas: document.getElementById('sala-columnas').value
        };
        try {
            const response = await fetch(API_SALAS, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nuevaSala) });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Error al crear la sala.');
            
            
            showToast(`¡Sala "${nuevaSala.nombre}" creada! (${data.asientos_creados} asientos)`, 'success');
            
            formAgregarSala.reset();
            cargarSalas();
            cargarSelects();
        } catch (error) { 
            showToast(error.message, 'error');
        }
    }

    async function borrarSala(id) {
        if (!confirm('¿Borrar esta sala? ¡¡Se borrarán todos sus asientos, funciones y tickets asociados!!')) return;
        try {
            await fetch(`${API_SALAS}?id=${id}`, { method: 'DELETE' });
            showToast('Sala eliminada.', 'success');
            cargarSalas();
            cargarSelects();
            cargarFunciones(); 
        } catch (error) { showToast('Error borrando sala', 'error'); }
    }


    
    //  EVENT LISTENERS
    
    formAgregarPeli.addEventListener('submit', guardarPelicula);
    btnCancelarEdicion.addEventListener('click', limpiarFormularioPeliculas);

    tablaBodyPelis.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-borrar-peli')) {
            borrarPelicula(e.target.dataset.id);
        }
        if (e.target.classList.contains('btn-modificar-peli')) {
            const tr = e.target.closest('tr');
            const peli = JSON.parse(tr.dataset.peli);
            prepararEdicion(peli);
        }
    });

    formAgregarFunc.addEventListener('submit', agregarFuncion);
    tablaBodyFuncs.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-borrar-func')) {
            borrarFuncion(e.target.dataset.id);
        }
    });
    
    formAgregarSala.addEventListener('submit', agregarSala);
    tablaBodySalas.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-borrar-sala')) {
            borrarSala(e.target.dataset.id);
        }
    });

    //  CARGA INICIAL
    
    cargarPeliculas();
    cargarSelects();
    cargarFunciones();
    cargarSalas();

});

// FUNCIÓN GLOBAL 
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