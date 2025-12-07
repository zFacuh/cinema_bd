

document.addEventListener('DOMContentLoaded', () => {

    const API_URL = 'http://localhost/absolute-cinema/api/api_asientos.php';
    const PRECIO_POR_TICKET = 8000; 

    const infoTitulo = document.getElementById('info-titulo');
    const infoHorario = document.getElementById('info-horario');
    const gridContainer = document.getElementById('sala-grid-container');
    const resumenCantidad = document.getElementById('resumen-cantidad');
    const resumenTotal = document.getElementById('resumen-total');
    const btnConfirmar = document.getElementById('btn-confirmar');
    const errorMsg = document.getElementById('error-msg');

    
    // Ahora guardamos objetos de asiento, no solo IDs
    let asientosSeleccionados = []; // Array para guardar objetos 
    let todosLosAsientosAPI = []; // Guardaremos la info de la API
    let infoFuncionAPI = {}; // Guardaremos la info de la función aquí

    const urlParams = new URLSearchParams(window.location.search);
    const idFuncion = urlParams.get('id_funcion');

    if (!idFuncion) {
        infoTitulo.textContent = 'Error: Función no encontrada.';
        return;
    }

    async function cargarAsientos() {
        try {
            const response = await fetch(`${API_URL}?id_funcion=${idFuncion}`);
            if (!response.ok) throw new Error('Error al cargar la sala.');
            
            const data = await response.json();
            
            todosLosAsientosAPI = data.asientos; 
            infoFuncionAPI = data.info_funcion; // Guardamos info de la función
            
            infoTitulo.textContent = infoFuncionAPI.titulo;
            infoHorario.textContent = `${infoFuncionAPI.fecha} - ${infoFuncionAPI.hora}`;

            dibujarSala(data.layout, data.asientos);

        } catch (error) {
            infoTitulo.textContent = 'Error';
            infoHorario.textContent = error.message;
        }
    }

    function dibujarSala(layout, asientos) {
        gridContainer.innerHTML = ''; 
        gridContainer.style.gridTemplateColumns = `repeat(${layout.columnas}, 1fr)`;

        asientos.forEach(asiento => {
            const divAsiento = document.createElement('div');
            divAsiento.classList.add('asiento');
            divAsiento.classList.add(asiento.estado);
            
            // Guardamos todos los datos en el elemento
            divAsiento.dataset.id = asiento.ID_Asiento; 
            divAsiento.dataset.label = `${asiento.Fila}${asiento.Numero}`; 

            gridContainer.appendChild(divAsiento);
        });
    }

    gridContainer.addEventListener('click', (e) => {
        const asientoClickeado = e.target;

        if (asientoClickeado.classList.contains('asiento') && !asientoClickeado.classList.contains('ocupado')) {
            
            const idAsiento = asientoClickeado.dataset.id;
            const labelAsiento = asientoClickeado.dataset.label;

            asientoClickeado.classList.toggle('seleccionado');

            
            // Actualizamos el array de objetos
            if (asientoClickeado.classList.contains('seleccionado')) {
                asientosSeleccionados.push({ id: idAsiento, label: labelAsiento });
            } else {
                asientosSeleccionados = asientosSeleccionados.filter(a => a.id !== idAsiento);
            }
            
            actualizarResumen();
        }
    });

    function actualizarResumen() {
        const cantidad = asientosSeleccionados.length;
        const total = cantidad * PRECIO_POR_TICKET;

        resumenCantidad.textContent = cantidad;
        resumenTotal.textContent = `$ ${total.toLocaleString('es-AR')}`; 
        
        if (cantidad > 0) errorMsg.textContent = '';
    }

    btnConfirmar.addEventListener('click', () => {
        if (asientosSeleccionados.length === 0) {
            errorMsg.textContent = 'Debes seleccionar al menos un asiento.';
            return;
        }

        const usuarioData = localStorage.getItem('usuario');
        if (!usuarioData) {
            alert('Debes iniciar sesión para confirmar tu compra.');
            localStorage.setItem('redirectUrl', window.location.href); 
            window.location.href = 'login.html'; 
            return;
        }
        
        const usuario = JSON.parse(usuarioData);
        
        
        // Guardamos los datos mejorados
        const datosCompra = {
            idCliente: usuario.id_cliente,
            idFuncion: idFuncion,
            idsAsientos: asientosSeleccionados, // Array de objetos 
            total: asientosSeleccionados.length * PRECIO_POR_TICKET,
            infoPelicula: {
                titulo: infoFuncionAPI.titulo,
                horario: `${infoFuncionAPI.fecha} - ${infoFuncionAPI.hora}`,
                salaNombre: infoFuncionAPI.salaNombre
            }
        };

        localStorage.setItem('compraPendiente', JSON.stringify(datosCompra));
        window.location.href = 'confirmacion_compra.html';
    });

    cargarAsientos();
});