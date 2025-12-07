
document.addEventListener('DOMContentLoaded', () => {

    const API_URL = 'http://localhost/absolute-cinema/api/api_reporte_ventas.php';

    // Referencias al DOM
    const inputFechaInicio = document.getElementById('fecha-inicio');
    const inputFechaFin = document.getElementById('fecha-fin');
    const inputFiltroCliente = document.getElementById('filtro-cliente'); // ¡Nuevo!
    const btnGenerar = document.getElementById('btn-generar-reporte');
    
    const spanTotalVentas = document.getElementById('total-ventas');
    const spanTotalTickets = document.getElementById('total-tickets');
    const tablaBody = document.getElementById('tabla-reporte-body');
    
    const topPeliculasList = document.getElementById('top-peliculas-list');
    const topHorariosList = document.getElementById('top-horarios-list');

    function getHoy() {
        return new Date().toISOString().split('T')[0];
    }

    //  LÓGICA DE DIBUJO DE ESTRELLAS (para la columna de reseña) 
    function renderEstrellas(ratingValue) {
        let starsHtml = '';
        const maxStars = 5;
        const fullStars = Math.round(ratingValue);
        
        for (let i = 1; i <= maxStars; i++) {
            // Usamos la clase 'star-gold' que está en style.css
            const isFilled = i <= fullStars;
            starsHtml += `<span style="font-size: 1.1rem; color: ${isFilled ? '#e6c200' : '#444'}">★</span>`;
        }
        return starsHtml;
    }


    async function generarReporte() {
        const fechaInicio = inputFechaInicio.value || getHoy();
        const fechaFin = inputFechaFin.value || fechaInicio;
        const clienteFiltro = inputFiltroCliente.value; // Obtener el texto del filtro
        
        // Limpiamos la tabla y preparamos el mensaje de carga
        const loadingRow = '<tr><td colspan="9">Cargando reporte...</td></tr>';
        tablaBody.innerHTML = loadingRow;
        topPeliculasList.innerHTML = '<li>Cargando...</li>';
        topHorariosList.innerHTML = '<li>Cargando...</li>';
        
        inputFechaInicio.value = fechaInicio;
        inputFechaFin.value = fechaFin;
        
        try {
            // Construimos la URL con los filtros
            let url = `${API_URL}?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
            if (clienteFiltro) {
                url += `&cliente=${encodeURIComponent(clienteFiltro)}`;
            }
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Error al consultar la API.');
            }

            const data = await response.json();

            //  Actualizar los Totales
            const totalVentas = parseFloat(data.totales.TotalVentas) || 0;
            spanTotalVentas.textContent = `$ ${totalVentas.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
            spanTotalTickets.textContent = data.totales.TotalTickets || 0;

            //  Llenar la tabla de detalle 
            tablaBody.innerHTML = ''; 
            if (data.detalle.length === 0) {
                tablaBody.innerHTML = '<tr><td colspan="9">No se encontraron transacciones con esos filtros.</td></tr>';
            } else {
                 data.detalle.forEach(venta => {
                    const tr = document.createElement('tr');
                    // Renderizamos las estrellas 
                    const ratingHtml = venta.CalificacionCliente > 0 
                                       ? `${venta.CalificacionCliente} ${renderEstrellas(venta.CalificacionCliente)}`
                                       : 'N/A';
                                       
                    tr.innerHTML = `
                        <td>${new Date(venta.FechaCompra).toLocaleString('es-AR')}</td>
                        <td>${venta.Nombre} ${venta.Apellido} (ID: ${venta.ID_Cliente})</td>
                        <td>${venta.Email}</td>
                        <td>${venta.Pelicula}</td>
                        <td>${venta.Sala}</td>
                        <td>${venta.AsientoFila}${venta.AsientoNumero}</td>
                        <td>${venta.MedioPago}</td>
                        <td>$ ${parseFloat(venta.Precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                        <td>${ratingHtml}</td>
                    `;
                    tablaBody.appendChild(tr);
                });
            }
            
            //  Llenar las Estadísticas
            
            // Top Películas
            topPeliculasList.innerHTML = '';
            if (data.estadisticas.top_peliculas.length === 0) {
                topPeliculasList.innerHTML = '<li>Sin datos de recaudación.</li>';
            } else {
                data.estadisticas.top_peliculas.forEach(pelicula => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span>${pelicula.Titulo}</span>
                        <span>$ ${parseFloat(pelicula.Recaudacion).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    `;
                    topPeliculasList.appendChild(li);
                });
            }
            
            // Top Horarios
            topHorariosList.innerHTML = '';
            if (data.estadisticas.top_horarios.length === 0) {
                topHorariosList.innerHTML = '<li>Sin datos de horarios.</li>';
            } else {
                data.estadisticas.top_horarios.forEach(horario => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span>${horario.Hora.substring(0, 5)}</span>
                        <span>${horario.TicketsVendidos} tickets</span>
                    `;
                    topHorariosList.appendChild(li);
                });
            }

        } catch (error) {
            console.error('Error al generar reporte:', error);
            tablaBody.innerHTML = `<tr><td colspan="9">Error: ${error.message}</td></tr>`;
            spanTotalVentas.textContent = '$ 0.00';
            spanTotalTickets.textContent = '0';
        }
    }

    //  EVENT LISTENERS 
    btnGenerar.addEventListener('click', generarReporte);

    //  CARGA INICIAL 
    generarReporte();
});