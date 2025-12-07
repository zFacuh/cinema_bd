<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

require_once 'db.php'; 

try {
    // 1. OBTENER FILTROS
    $fecha_inicio = isset($_GET['fecha_inicio']) ? $_GET['fecha_inicio'] : date('Y-m-d');
    $fecha_fin = isset($_GET['fecha_fin']) ? $_GET['fecha_fin'] : date('Y-m-d');
    $filtro_cliente = isset($_GET['cliente']) ? '%' . $_GET['cliente'] . '%' : null; // Filtro por nombre/email

    $params_base = [$fecha_inicio, $fecha_fin];
    $params_total = $params_base; // Parámetros para consultas sin filtro de cliente

    // 2. CONSTRUIR FILTRO DE CLIENTE 
    $cliente_where = '';
    if ($filtro_cliente) {
        $cliente_where = " AND (cl.Nombre LIKE ? OR cl.Apellido LIKE ? OR cl.Email LIKE ?) ";
        $params_total = array_merge($params_base, [$filtro_cliente, $filtro_cliente, $filtro_cliente]);
    }
    
    // CONSULTAS DETALLE Y TOTALES
    
    // Total Recaudado
    $sql_totales = "SELECT 
                        SUM(t.Precio) AS TotalVentas,
                        COUNT(t.ID_Ticket) AS TotalTickets
                    FROM Ticket t
                    JOIN Compra c ON t.ID_Compra = c.ID_Compra
                    JOIN Cliente cl ON c.ID_Cliente = cl.ID_Cliente 
                    WHERE DATE(c.Fecha) BETWEEN ? AND ? " . $cliente_where;
    
    $stmt_totales = $pdo->prepare($sql_totales);
    $stmt_totales->execute($params_total);
    $totales = $stmt_totales->fetch();

    // Detalle de Ventas
    $sql_detalle = "SELECT 
                        c.Fecha AS FechaCompra,
                        cl.ID_Cliente,
                        cl.Nombre,
                        cl.Apellido,
                        cl.Email,
                        p.Titulo AS Pelicula,
                        s.Nombre_Identificador AS Sala,
                        a.Fila AS AsientoFila,
                        a.Numero AS AsientoNumero,
                        c.MedioPago,
                        t.Precio,
                        -- Obtener la reseña del cliente para esta película, escalada a 0-5
                        COALESCE(ROUND(r.Puntuacion / 2, 1), 0) AS CalificacionCliente
                    FROM Ticket t
                    JOIN Compra c ON t.ID_Compra = c.ID_Compra
                    JOIN Funcion f ON t.ID_Funcion = f.ID_Funcion
                    JOIN Pelicula p ON f.ID_Pelicula = p.ID_Pelicula
                    JOIN Cliente cl ON c.ID_Cliente = cl.ID_Cliente
                    JOIN Sala s ON f.ID_Sala = s.ID_Sala
                    JOIN Asiento a ON t.ID_Asiento = a.ID_Asiento 
                    LEFT JOIN Resena r ON r.ID_Cliente = cl.ID_Cliente AND r.ID_Pelicula = p.ID_Pelicula
                    WHERE DATE(c.Fecha) BETWEEN ? AND ? " . $cliente_where . "
                    ORDER BY c.Fecha DESC, a.Fila, a.Numero";
    
    $stmt_detalle = $pdo->prepare($sql_detalle);
    $stmt_detalle->execute($params_total);
    $detalle = $stmt_detalle->fetchAll();
    
    // CONSULTAS DE ESTADÍSTICAS
    
    // 1. Películas más taquilleras (Top 5 por Recaudación)
    $sql_top_peliculas = "SELECT 
                            p.Titulo, 
                            SUM(t.Precio) AS Recaudacion
                          FROM Ticket t
                          JOIN Compra c ON t.ID_Compra = c.ID_Compra
                          JOIN Funcion f ON t.ID_Funcion = f.ID_Funcion
                          JOIN Pelicula p ON f.ID_Pelicula = p.ID_Pelicula
                          JOIN Cliente cl ON c.ID_Cliente = cl.ID_Cliente
                          WHERE DATE(c.Fecha) BETWEEN ? AND ? " . $cliente_where . "
                          GROUP BY p.Titulo
                          ORDER BY Recaudacion DESC
                          LIMIT 5";
    $stmt_top_peliculas = $pdo->prepare($sql_top_peliculas);
    $stmt_top_peliculas->execute($params_total);
    $top_peliculas = $stmt_top_peliculas->fetchAll();
    
    // 2. Horario más vendido (Top 3 por Cantidad de Tickets)
    $sql_top_horarios = "SELECT 
                            f.Hora, 
                            COUNT(t.ID_Ticket) AS TicketsVendidos
                         FROM Ticket t
                         JOIN Compra c ON t.ID_Compra = c.ID_Compra
                         JOIN Funcion f ON t.ID_Funcion = f.ID_Funcion
                         JOIN Cliente cl ON c.ID_Cliente = cl.ID_Cliente
                         WHERE DATE(c.Fecha) BETWEEN ? AND ? " . $cliente_where . "
                         GROUP BY f.Hora
                         ORDER BY TicketsVendidos DESC
                         LIMIT 3";
    $stmt_top_horarios = $pdo->prepare($sql_top_horarios);
    $stmt_top_horarios->execute($params_total);
    $top_horarios = $stmt_top_horarios->fetchAll();
    

    // 4. COMBINAR Y DEVOLVER RESPUESTA
    $respuesta = [
        'filtros' => [
            'fecha_inicio' => $fecha_inicio,
            'fecha_fin' => $fecha_fin,
            'cliente' => str_replace('%', '', $filtro_cliente)
        ],
        'totales' => $totales,
        'detalle' => $detalle,
        'estadisticas' => [
            'top_peliculas' => $top_peliculas,
            'top_horarios' => $top_horarios
        ]
    ];

    echo json_encode($respuesta);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de base de datos: ' . $e->getMessage()]);
}
?>