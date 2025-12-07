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

//  LISTA DE ADMINISTRADORES

const ADMIN_EMAILS = [
    'zfacuh@gmail.com',
    'tobiasalejandrourrazafoglia@gmail.com'
];


$datos = json_decode(file_get_contents("php://input"));

if (!isset($datos->accion)) {
    http_response_code(400);
    echo json_encode(['error' => 'No se especificó una acción.']);
    exit;
}

try {
    
    switch ($datos->accion) {
        
        // REGISTRO 
        case 'registro':
            if (!isset($datos->nombre) || !isset($datos->apellido) || !isset($datos->email) || !isset($datos->password)) {
                http_response_code(400);
                echo json_encode(['error' => 'Datos de registro incompletos.']);
                exit;
            }

            $sql_check = "SELECT ID_Cliente FROM Cliente WHERE Email = ?";
            $stmt_check = $pdo->prepare($sql_check);
            $stmt_check->execute([$datos->email]);
            
            if ($stmt_check->rowCount() > 0) {
                http_response_code(409); 
                echo json_encode(['error' => 'El correo electrónico ya está registrado.']);
                exit;
            }

            $password_hash = password_hash($datos->password, PASSWORD_DEFAULT);

            $sql_insert = "INSERT INTO Cliente (Nombre, Apellido, Email, Contrasena, Telefono) 
                           VALUES (?, ?, ?, ?, ?)";
            $stmt_insert = $pdo->prepare($sql_insert);
            $stmt_insert->execute([
                $datos->nombre,
                $datos->apellido,
                $datos->email,
                $password_hash,
                $datos->telefono ?? null 
            ]);

            http_response_code(201);
            echo json_encode(['status' => 'success', 'message' => 'Usuario registrado con éxito.']);
            break;

        // LOGIN
        case 'login':
            if (!isset($datos->email) || !isset($datos->password)) {
                http_response_code(400);
                echo json_encode(['error' => 'Email o contraseña no proporcionados.']);
                exit;
            }

            // Buscamos al usuario
            $sql_login = "SELECT ID_Cliente, Nombre, Apellido, Email, Telefono, Contrasena 
                          FROM Cliente WHERE Email = ?";
            $stmt_login = $pdo->prepare($sql_login);
            $stmt_login->execute([$datos->email]);

            $cliente = $stmt_login->fetch();

            // Verificamos la contraseña
            if ($cliente && password_verify($datos->password, $cliente['Contrasena'])) {
                
                
                // Determinamos el rol basado en nuestra lista
                $rol_asignado = 'cliente'; // Por defecto es cliente
                if (in_array($cliente['Email'], ADMIN_EMAILS)) {
                    $rol_asignado = 'admin'; // Si está en la lista, es admin
                }
                
                // Enviamos la respuesta con el rol "calculado"
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Login exitoso.',
                    'usuario' => [
                        'id_cliente' => $cliente['ID_Cliente'],
                        'nombre' => $cliente['Nombre'],
                        'apellido' => $cliente['Apellido'],
                        'email' => $cliente['Email'],
                        'telefono' => $cliente['Telefono'],
                        'rol' => $rol_asignado 
                    ]
                ]);
            } else {
                http_response_code(401); 
                echo json_encode(['error' => 'Email o contraseña incorrectos.']);
            }
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Acción no válida.']);
            break;
    } 
} 
catch (\PDOException $e) { 
    http_response_code(500);
    echo json_encode(['error' => 'Error de base de datos: ' . $e->getMessage()]);
}
?>