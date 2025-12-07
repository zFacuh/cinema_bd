<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
// Permitir métodos específicos
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Manejar la solicitud OPCIONES
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php';

// Determinar el método de la solicitud
$metodo = $_SERVER['REQUEST_METHOD'];

try {
    switch ($metodo) {
        // LISTAR
        case 'GET':
            $sql = "SELECT ID_Pelicula, Titulo, Genero, Clasificacion FROM Pelicula ORDER BY Titulo";
            $stmt = $pdo->query($sql);
            $peliculas = $stmt->fetchAll();
            echo json_encode($peliculas);
            break;

        // AGREGAR
        case 'POST':
            $datos = json_decode(file_get_contents("php://input"));

            if (
                !isset($datos->titulo) || !isset($datos->genero) || 
                !isset($datos->clasificacion) || !isset($datos->duracion)
            ) {
                http_response_code(400); 
                echo json_encode(['error' => 'Datos incompletos.']);
                exit;
            }

            $sql = "INSERT INTO Pelicula (Titulo, Genero, Clasificacion, Duracion, Sinopsis, Imagen, Trailer) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $datos->titulo,
                $datos->genero,
                $datos->clasificacion,
                $datos->duracion,
                $datos->sinopsis ?? '', 
                $datos->imagen ?? '',   
                $datos->trailer ?? ''   
            ]);

            http_response_code(201); 
            echo json_encode([
                'status' => 'success', 
                'id' => $pdo->lastInsertId()
            ]);
            break;
        // ACTUALIZAR
        case 'PUT':
            $datos = json_decode(file_get_contents("php://input"));

            if (!isset($datos->id) || !isset($datos->titulo)) {
                http_response_code(400);
                echo json_encode(['error' => 'Datos incompletos para la actualización.']);
                exit;
            }

            $sql = "UPDATE Pelicula SET 
                        Titulo = ?, 
                        Genero = ?, 
                        Clasificacion = ?, 
                        Duracion = ?, 
                        Sinopsis = ?, 
                        Imagen = ?, 
                        Trailer = ?
                    WHERE ID_Pelicula = ?";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $datos->titulo,
                $datos->genero,
                $datos->clasificacion,
                $datos->duracion,
                $datos->sinopsis ?? '',
                $datos->imagen ?? '',
                $datos->trailer ?? '',
                $datos->id
            ]);

            echo json_encode(['status' => 'success', 'message' => 'Película actualizada correctamente.']);
            break;
        // BORRAR
        case 'DELETE':
            if (!isset($_GET['id'])) {
                http_response_code(400); 
                echo json_encode(['error' => 'No se especificó un ID.']);
                exit;
            }
            
            $id = $_GET['id'];
            $sql = "DELETE FROM Pelicula WHERE ID_Pelicula = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$id]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(['status' => 'success', 'message' => 'Película eliminada.']);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'No se encontró la película o ya fue eliminada.']);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido.']);
            break;
    }

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de base de datos: ' . $e->getMessage()]);
}
?>