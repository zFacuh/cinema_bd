<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php';
$metodo = $_SERVER['REQUEST_METHOD'];

try {
    switch ($metodo) {
        // LISTAR SALAS
        case 'GET':
            $sql = "SELECT ID_Sala, Nombre_Identificador, Filas, Columnas, Capacidad 
                    FROM Sala 
                    ORDER BY Nombre_Identificador";
            $stmt = $pdo->query($sql);
            echo json_encode($stmt->fetchAll());
            break;

        // CREAR SALA Y ASIENTOS
        case 'POST':
            $datos = json_decode(file_get_contents("php://input"));

            if (!isset($datos->nombre) || !isset($datos->filas) || !isset($datos->columnas)) {
                http_response_code(400);
                echo json_encode(['error' => 'Datos incompletos.']);
                exit;
            }

            $nombre = $datos->nombre;
            $filas = (int)$datos->filas;
            $columnas = (int)$datos->columnas;
            $capacidad = $filas * $columnas; // Calculamos la capacidad

            // INICIO DE LA TRANSACCIÓN
            // Esto asegura que si falla la creación de asientos,
            // tampoco se cree la sala. O todo, o nada.
            $pdo->beginTransaction();

            try {
                // 1. Crear la Sala
                $sql_sala = "INSERT INTO Sala (Nombre_Identificador, Capacidad, Filas, Columnas) 
                             VALUES (?, ?, ?, ?)";
                $stmt_sala = $pdo->prepare($sql_sala);
                $stmt_sala->execute([$nombre, $capacidad, $filas, $columnas]);
                
                // Obtenemos el ID de la sala que acabamos de crear
                $id_sala = $pdo->lastInsertId();

                // 2. Generar los Asientos
                $asientos_placeholders = [];
                $asientos_params = [];
                
                for ($f = 0; $f < $filas; $f++) {
                    $filaLetra = chr(65 + $f); // A, B, C...
                    for ($n = 1; $n <= $columnas; $n++) {
                        $asientos_placeholders[] = '(?, ?, ?)';
                        // Agregamos los valores reales
                        $asientos_params[] = $id_sala;
                        $asientos_params[] = $filaLetra;
                        $asientos_params[] = $n;
                    }
                }

                // Creamos la consulta
                $sql_asientos = "INSERT INTO Asiento (ID_Sala, Fila, Numero) VALUES " . 
                                implode(', ', $asientos_placeholders);
                
                $stmt_asientos = $pdo->prepare($sql_asientos);
                $stmt_asientos->execute($asientos_params);

                // 3. Si todo salió bien, confirmamos la transacción
                $pdo->commit();
                
                http_response_code(201); // CREAR
                echo json_encode([
                    'status' => 'success', 
                    'id_sala' => $id_sala,
                    'asientos_creados' => count($asientos_placeholders)
                ]);

            } catch (Exception $e) {
                // 4. Si algo falló, revertimos la transacción
                $pdo->rollBack();
                throw $e; // Lanzamos el error
            }
            // FIN DE LA TRANSACCIÓN 
            break;

        // BORRAR SALA
        case 'DELETE':
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'No se especificó un ID de sala.']);
                exit;
            }
            $id = $_GET['id'];
            
            $sql = "DELETE FROM Sala WHERE ID_Sala = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$id]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(['status' => 'success', 'message' => 'Sala y todos sus datos asociados eliminados.']);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'No se encontró la sala.']);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido.']);
            break;
    }
} catch (\PDOException $e) {
    http_response_code(500);
    // error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['error' => 'Error de base de datos: ' . $e->getMessage()]);
}
?>