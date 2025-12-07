<?php
// api/api_peliculas.php (VERSIÓN FINAL Y CORREGIDA)

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

require_once 'db.php'; 

try {
    // Definimos el límite temporal: 7 días desde hoy
    $current_datetime = date('Y-m-d H:i:s');
    $end_date = date('Y-m-d', strtotime('+6 days'));

    $filtro_genero = isset($_GET['genero']) ? $_GET['genero'] : '';
    
    // 1. CONSULTA DE PELÍCULAS
    $sql_peliculas = "SELECT 
                        P.ID_Pelicula, P.Titulo, P.Genero, P.Clasificacion, P.Duracion, P.Sinopsis, P.Imagen, P.Trailer,
                        COALESCE(ROUND(AVG(R.Puntuacion) / 2, 1), 0) AS CalificacionPromedio
                      FROM Pelicula P
                      LEFT JOIN Resena R ON P.ID_Pelicula = R.ID_Pelicula
                      WHERE 1=1 ";
    
    // Si hay filtro de género
    $params_peliculas = [];
    if (!empty($filtro_genero)) {
        $sql_peliculas .= " AND P.Genero LIKE ?";
        $params_peliculas = ["%$filtro_genero%"];
    }

    $sql_peliculas .= " GROUP BY P.ID_Pelicula, P.Titulo, P.Genero, P.Clasificacion, P.Duracion, P.Sinopsis, P.Imagen, P.Trailer
                        ORDER BY P.Titulo";

    $stmt_peliculas = $pdo->prepare($sql_peliculas);
    $stmt_peliculas->execute($params_peliculas);
    $peliculas = $stmt_peliculas->fetchAll();                                 
    
    // 2. CONSULTA DE FUNCIONES
    $sql_funciones = "SELECT ID_Funcion, ID_Sala, Fecha, Hora 
                      FROM Funcion 
                      WHERE ID_Pelicula = ? 
                        AND ((Fecha = CURDATE() AND Hora > CURTIME()) OR Fecha > CURDATE())
                        AND Fecha <= ? 
                      ORDER BY Fecha, Hora";
    $stmt_funciones = $pdo->prepare($sql_funciones);

    $peliculas_con_funciones = [];

    // 3. Bucle para adjuntar las funciones
    foreach ($peliculas as $pelicula) {

        $stmt_funciones->execute([ $pelicula['ID_Pelicula'], $end_date ]);
        $funciones = $stmt_funciones->fetchAll();
        
        $pelicula['funciones'] = $funciones;
        $peliculas_con_funciones[] = $pelicula;
    }
    
    // 4. Devolver la respuesta
    echo json_encode($peliculas_con_funciones);

} catch (\PDOException $e) {
    http_response_code(500);
    // error
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]); 
}
?>