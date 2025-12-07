<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

require_once 'db.php';

if (!isset($_GET['id_funcion'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No se especificó un ID de función.']);
    exit;
}
$id_funcion = $_GET['id_funcion'];

try {
    // OBTENER DATOS DE LA SALA (Ahora incluye el nombre de la sala)
    $sql_sala = "SELECT 
                    s.Filas, s.Columnas, s.ID_Sala, 
                    s.Nombre_Identificador AS SalaNombre, 
                    p.Titulo, f.Hora, f.Fecha
                 FROM Funcion f
                 JOIN Sala s ON f.ID_Sala = s.ID_Sala
                 JOIN Pelicula p ON f.ID_Pelicula = p.ID_Pelicula
                 WHERE f.ID_Funcion = ?";
    
    $stmt_sala = $pdo->prepare($sql_sala);
    $stmt_sala->execute([$id_funcion]);
    $info_sala = $stmt_sala->fetch();

    if (!$info_sala) {
        http_response_code(404);
        echo json_encode(['error' => 'Función no encontrada.']);
        exit;
    }

    // OBTENER TODOS LOS ASIENTOS DE ESA SALA
    $sql_asientos = "SELECT ID_Asiento, Fila, Numero FROM Asiento WHERE ID_Sala = ?";
    $stmt_asientos = $pdo->prepare($sql_asientos);
    $stmt_asientos->execute([$info_sala['ID_Sala']]);
    $todos_asientos = $stmt_asientos->fetchAll();

    // OBTENER ASIENTOS OCUPADOS
    $sql_ocupados = "SELECT ID_Asiento FROM Ticket WHERE ID_Funcion = ?";
    $stmt_ocupados = $pdo->prepare($sql_ocupados);
    $stmt_ocupados->execute([$id_funcion]);
    $ids_ocupados = $stmt_ocupados->fetchAll(PDO::FETCH_COLUMN, 0);

    // PREPARAR RESPUESTA (incluimos Fila y Numero)
    $asientos_con_estado = [];
    foreach ($todos_asientos as $asiento) {
        $asiento['estado'] = in_array($asiento['ID_Asiento'], $ids_ocupados) ? 'ocupado' : 'disponible';
        $asientos_con_estado[] = $asiento; 
    }

    $respuesta = [
        'info_funcion' => [
            'titulo' => $info_sala['Titulo'],
            'hora' => substr($info_sala['Hora'], 0, 5),
            'fecha' => $info_sala['Fecha'],
            'salaNombre' => $info_sala['SalaNombre'] 
        ],
        'layout' => [
            'filas' => $info_sala['Filas'],
            'columnas' => $info_sala['Columnas']
        ],
        'asientos' => $asientos_con_estado 
    ];

    echo json_encode($respuesta);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de base de datos: ' . $e->getMessage()]);
}
?>