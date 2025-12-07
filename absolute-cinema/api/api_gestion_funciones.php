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
        // LISTAR
        case 'GET':
            // Verificamos si se pide listar Peliculas o Salas para los <select>
            if (isset($_GET['recurso'])) {
                if ($_GET['recurso'] == 'peliculas') {
                    $sql = "SELECT ID_Pelicula, Titulo FROM Pelicula ORDER BY Titulo";
                } elseif ($_GET['recurso'] == 'salas') {
                    $sql = "SELECT ID_Sala, Nombre_Identificador FROM Sala ORDER BY Nombre_Identificador";
                } else {
                    http_response_code(400);
                    echo json_encode(['error' => 'Recurso no válido.']);
                    exit;
                }
                $stmt = $pdo->query($sql);
                echo json_encode($stmt->fetchAll());
            
            // Si no se pide un recurso, listamos las FUNCIONES existentes
            } else {
                $sql = "SELECT 
                            f.ID_Funcion, 
                            p.Titulo AS Pelicula, 
                            s.Nombre_Identificador AS Sala, 
                            f.Fecha, 
                            f.Hora 
                        FROM Funcion f
                        JOIN Pelicula p ON f.ID_Pelicula = p.ID_Pelicula
                        JOIN Sala s ON f.ID_Sala = s.ID_Sala
                        WHERE f.Fecha >= CURDATE() -- Solo funciones de hoy en adelante
                        ORDER BY f.Fecha, f.Hora";
                
                $stmt = $pdo->query($sql);
                echo json_encode($stmt->fetchAll());
            }
            break;

        // AGREGAR
        case 'POST':
            $datos = json_decode(file_get_contents("php://input"));

            if (!isset($datos->id_pelicula) || !isset($datos->id_sala) || !isset($datos->fecha) || !isset($datos->hora)) {
                http_response_code(400);
                echo json_encode(['error' => 'Datos incompletos.']);
                exit;
            }

            $sql = "INSERT INTO Funcion (ID_Pelicula, ID_Sala, Fecha, Hora) VALUES (?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $datos->id_pelicula,
                $datos->id_sala,
                $datos->fecha,
                $datos->hora
            ]);

            http_response_code(201); // CREAR
            echo json_encode(['status' => 'success', 'id' => $pdo->lastInsertId()]);
            break;

        // BORRAR 
        case 'DELETE':
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'No se especificó un ID de función.']);
                exit;
            }
            
            $id = $_GET['id'];
            $sql = "DELETE FROM Funcion WHERE ID_Funcion = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$id]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(['status' => 'success', 'message' => 'Función eliminada.']);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'No se encontró la función.']);
            }
            break;

        default:
            http_response_code(405); // METODO NO PERMITIDO
            echo json_encode(['error' => 'Método no permitido.']);
            break;
    }

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de base de datos: ' . $e->getMessage()]);
}
?>