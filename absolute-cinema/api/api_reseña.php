<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php'; 
$datos = json_decode(file_get_contents("php://input"));

if (!isset($datos->id_cliente) || !isset($datos->id_pelicula) || !isset($datos->puntuacion)) {
    http_response_code(400);
    echo json_encode(['error' => 'Datos incompletos para la reseña.']);
    exit;
}

$id_cliente = $datos->id_cliente;
$id_pelicula = $datos->id_pelicula;
$puntuacion_5 = $datos->puntuacion;

// Convertimos la puntuación (0-5) a la escala de la BD (1-10)
// La puntuación mínima es 1 (si el usuario da 0.5), si da 5, es 10.
$puntuacion_10 = max(1, round($puntuacion_5 * 2)); 

try {
    // 1. Verificar si el usuario YA dejó una reseña
    $sql_check = "SELECT ID_Resena FROM Resena WHERE ID_Cliente = ? AND ID_Pelicula = ?";
    $stmt_check = $pdo->prepare($sql_check);
    $stmt_check->execute([$id_cliente, $id_pelicula]);
    $reseña_existente = $stmt_check->fetch();

    if ($reseña_existente) {
        // 2. Si existe, actualizamos la reseña
        $sql = "UPDATE Resena SET Puntuacion = ?, Fecha = NOW() WHERE ID_Resena = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$puntuacion_10, $reseña_existente['ID_Resena']]);
        $message = "Reseña actualizada.";
    } else {
        // 3. Si no existe, creamos una nueva 
        $sql = "INSERT INTO Resena (ID_Cliente, ID_Pelicula, Puntuacion, Comentario, Fecha) 
                VALUES (?, ?, ?, NULL, NOW())"; 
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$id_cliente, $id_pelicula, $puntuacion_10]);
        $message = "Reseña registrada.";
    }

    echo json_encode([
        'status' => 'success', 
        'message' => $message,
        'nueva_puntuacion_5' => $puntuacion_5 // Devolvemos la escala de 0-5
    ]);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al guardar la reseña: ' . $e->getMessage()]);
}
?>