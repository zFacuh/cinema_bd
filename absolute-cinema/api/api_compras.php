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

// Validar datos
if (
    !isset($datos->idCliente) || !isset($datos->idFuncion) || 
    !isset($datos->idsAsientos) || !is_array($datos->idsAsientos) || 
    empty($datos->idsAsientos) || !isset($datos->total) || !isset($datos->medioPago)
) {
    http_response_code(400);
    echo json_encode(['error' => 'Datos de la compra incompletos o inválidos.']);
    exit;
}

$id_cliente = $datos->idCliente;
$id_funcion = $datos->idFuncion;
$ids_asientos = $datos->idsAsientos; 
$total_compra = $datos->total;
$medio_pago = $datos->medioPago;
$precio_por_ticket = $total_compra / count($ids_asientos);

$pdo->beginTransaction();

try {
    // Crear el registro en Compra
    $sql_compra = "INSERT INTO Compra (ID_Cliente, MedioPago, Fecha) VALUES (?, ?, NOW())";
    $stmt_compra = $pdo->prepare($sql_compra);
    $stmt_compra->execute([$id_cliente, $medio_pago]);
    $id_compra = $pdo->lastInsertId();

    // Crear los Tickets
    $sql_ticket = "INSERT INTO Ticket (ID_Compra, ID_Funcion, ID_Asiento, Tipo_de_ticket, Precio) 
                   VALUES (?, ?, ?, ?, ?)";
    $stmt_ticket = $pdo->prepare($sql_ticket);

    foreach ($ids_asientos as $asiento) {
        $stmt_ticket->execute([
            $id_compra,
            $id_funcion,
            $asiento->id, // El ID del asiento
            "Adulto", 
            $precio_por_ticket
        ]);
    }

    $pdo->commit();
    
    http_response_code(201); 
    echo json_encode([
        'status' => 'success',
        'id_compra' => $id_compra,
        'message' => 'Compra registrada exitosamente.'
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode([
        'error' => 'Error al procesar la compra: ' . $e->getMessage()
    ]);
}
?>