
// Importamos la librería jsPDF que cargamos en el HTML
const { jsPDF } = window.jspdf;

document.addEventListener('DOMContentLoaded', () => {

    const API_URL = 'http://localhost/absolute-cinema/api/api_compras.php';

    // Referencias al DOM (con los nuevos campos)
    const resumenComprador = document.getElementById('resumen-comprador');
    const resumenPelicula = document.getElementById('resumen-pelicula');
    const resumenSala = document.getElementById('resumen-sala');
    const resumenHorario = document.getElementById('resumen-horario');
    const resumenFecha = document.getElementById('resumen-fecha');
    const resumenAsientos = document.getElementById('resumen-asientos');
    const selectMedioPago = document.getElementById('medio-pago');
    const resumenTotal = document.getElementById('resumen-total');
    
    const btnPagar = document.getElementById('btn-pagar');
    const mensajeFinal = document.getElementById('mensaje-final');
    const resumenWrapper = document.getElementById('resumen-wrapper');

    //  Verificar y cargar datos del Usuario
    const usuarioData = localStorage.getItem('usuario');
    if (!usuarioData) {
        alert('Error de autenticación.');
        window.location.href = 'index.html';
        return;
    }
    const usuario = JSON.parse(usuarioData);
    document.getElementById('nav-auth').innerHTML = `<span class="nav-username">Hola, ${usuario.nombre}</span>`;

    // Leer datos de la Compra
    const compraPendienteJSON = localStorage.getItem('compraPendiente');
    if (!compraPendienteJSON) {
        resumenWrapper.innerHTML = '<h1>No hay ninguna compra para confirmar.</h1>';
        return;
    }
    const compraPendiente = JSON.parse(compraPendienteJSON);

    //  Llenar el resumen en la página (CON TODOS LOS DATOS)
    resumenComprador.textContent = `${usuario.nombre} ${usuario.apellido}`;
    resumenPelicula.textContent = compraPendiente.infoPelicula.titulo;
    resumenSala.textContent = compraPendiente.infoPelicula.salaNombre;
    resumenHorario.textContent = compraPendiente.infoPelicula.horario;
    resumenFecha.textContent = new Date().toLocaleDateString('es-AR');
    
    // Convertimos el array de asientos en un string 
    const asientosLabels = compraPendiente.idsAsientos.map(a => a.label).join(', ');
    resumenAsientos.textContent = asientosLabels;
    
    resumenTotal.textContent = `$ ${compraPendiente.total.toLocaleString('es-AR')}`;

    //  Asignar el evento al botón de "Pagar"
    btnPagar.addEventListener('click', async () => {
        btnPagar.disabled = true;
        btnPagar.textContent = 'Procesando...';

        // Leemos el medio de pago seleccionado
        const medioPagoSeleccionado = selectMedioPago.value;
        
        // Añadimos el medio de pago a los datos que enviaremos a la API
        const datosParaAPI = {
            ...compraPendiente,
            medioPago: medioPagoSeleccionado 
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosParaAPI)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Error al procesar el pago.');

        
            localStorage.removeItem('compraPendiente');
            resumenWrapper.style.display = 'none'; 
            
            //  Botón para descargar PDF
            mensajeFinal.innerHTML = `
                <h2>¡Compra Exitosa!</h2>
                <p>Tu código de compra es: <strong>#${data.id_compra}</strong></p>
                <p>¡Disfruta la función!</p>
                <br>
                <button id="btn-descargar-pdf" class="btn-guardar">Descargar Ticket (PDF)</button>
                <a href="index.html" class="btn-guardar" style="background-color: #555; margin-top: 10px;">Volver a la Cartelera</a>
            `;
            mensajeFinal.className = 'success';
            mensajeFinal.style.display = 'block';

            // Agregamos el listener al nuevo botón del PDF
            document.getElementById('btn-descargar-pdf').addEventListener('click', () => {
                generarPDF(usuario, compraPendiente, data.id_compra, medioPagoSeleccionado);
            });

        } catch (error) {
            resumenWrapper.style.display = 'none';
            mensajeFinal.innerHTML = `<h2>Error en la Compra</h2><p>${error.message}</p><br><a href="index.html" class="btn-guardar">Volver</a>`;
            mensajeFinal.className = 'error';
            mensajeFinal.style.display = 'block';
        }
    });

    // GENERAR PDF 
    function generarPDF(usuario, compra, idCompra, medioPago) {
        const doc = new jsPDF();
        const ticketWidth = 140; 
        const ticketHeight = 110; 
        const startX = 15;
        const startY = 15;

        //  Borde exterior redondeado 
        doc.setLineWidth(0.5);
        doc.setDrawColor(0); // Negro
        doc.roundedRect(startX, startY, ticketWidth, ticketHeight, 5, 5, 'S'); // 'S' es solo borde

        // Cabecera del Ticket 
        doc.setFillColor(34, 34, 34); 
        doc.roundedRect(startX, startY, ticketWidth, 20, 5, 5, 'F');
        
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(230, 194, 0); 
        doc.text("ABSOLUTE CINEMA", startX + 10, startY + 13);
        
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255); 
        doc.text(`Compra #${idCompra}`, startX + ticketWidth - 10, startY + 13, { align: 'right' });

        // Área de Contenido 
        let currentY = startY + 30;
        
        // Función
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0); 
        doc.text("PELÍCULA", startX + 10, currentY);
        doc.setFontSize(16);
        doc.text(compra.infoPelicula.titulo, startX + 10, currentY + 7);
        currentY += 15;

        // Sala y Horario
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0);
        doc.text("SALA", startX + 10, currentY);
        doc.text("FUNCIÓN", startX + 50, currentY);
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(compra.infoPelicula.salaNombre, startX + 10, currentY + 6);
        doc.text(compra.infoPelicula.horario, startX + 50, currentY + 6);
        currentY += 15;

        // Asientos
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0);
        doc.text("ASIENTOS", startX + 10, currentY);
        doc.text("CANTIDAD", startX + 50, currentY);

        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        const asientosStr = compra.idsAsientos.map(a => a.label).join(', ');
        doc.text(asientosStr, startX + 10, currentY + 6);
        doc.text(String(compra.idsAsientos.length), startX + 50, currentY + 6);
        

        // Línea divisoria
        currentY += 15;
        doc.setLineDashPattern([1, 1], 0);
        doc.line(startX + 5, currentY, startX + ticketWidth - 5, currentY);
        currentY += 10;

        //  Comprador y Pago 
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0);
        doc.text("COMPRADOR:", startX + 10, currentY);
        doc.text("TOTAL PAGADO:", startX + 70, currentY);

        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(`${usuario.nombre} ${usuario.apellido}`, startX + 10, currentY + 5);
        doc.text(`Email: ${usuario.email}`, startX + 10, currentY + 9);
        doc.text(`Pago: ${medioPago}`, startX + 10, currentY + 13);
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`$ ${compra.total.toLocaleString('es-AR')}`, startX + 70, currentY + 8);
        
        //  Pie de página 
        doc.setFontSize(8);
        doc.setFont(undefined, 'italic');
        doc.setTextColor(100);
        doc.text("Gracias por tu compra. Este ticket es tu comprobante.", 105, startY + ticketHeight - 5, { align: 'center' });

        // Guardar el archivo
        doc.save(`ticket_absolute_cinema_${idCompra}.pdf`);
    }

});