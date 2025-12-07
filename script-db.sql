--------------------------------
  ABSOLUTE CINEMA
--------------------------------

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


-- 1. Creación de la Base de Datos


DROP DATABASE IF EXISTS AbsoluteCinema;
CREATE DATABASE AbsoluteCinema CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE AbsoluteCinema;

----------------------------------------------------------


-- 2. Estructura de Tabla: PELICULA


CREATE TABLE Pelicula (
  ID_Pelicula INT AUTO_INCREMENT PRIMARY KEY,
  Titulo VARCHAR(255) NOT NULL,
  Duracion TIME DEFAULT NULL,
  Clasificacion VARCHAR(10) DEFAULT NULL,
  Genero VARCHAR(100) DEFAULT NULL,
  Sinopsis TEXT DEFAULT NULL,
  Imagen VARCHAR(500) DEFAULT NULL, -- Nuevo: URL del Poster
  Trailer VARCHAR(500) DEFAULT NULL -- Nuevo: URL de YouTube
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 3. Estructura de Tabla: SALA


CREATE TABLE Sala (
  ID_Sala INT AUTO_INCREMENT PRIMARY KEY,
  Nombre_Identificador VARCHAR(100) NOT NULL,
  Capacidad INT NOT NULL,
  Filas INT NOT NULL DEFAULT 8,    -- Nuevo: Para el layout
  Columnas INT NOT NULL DEFAULT 10 -- Nuevo: Para el layout
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 4. Estructura de Tabla: CLIENTE


CREATE TABLE Cliente (
  ID_Cliente INT AUTO_INCREMENT PRIMARY KEY,
  Nombre VARCHAR(100) NOT NULL,
  Apellido VARCHAR(100) NOT NULL,
  Email VARCHAR(255) NOT NULL UNIQUE,
  Contrasena VARCHAR(255) NOT NULL,
  Telefono VARCHAR(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 5. Estructura de Tabla: ASIENTO

CREATE TABLE Asiento (
  ID_Asiento INT AUTO_INCREMENT PRIMARY KEY,
  ID_Sala INT NOT NULL,
  Fila VARCHAR(5) NOT NULL,
  Numero INT NOT NULL,
  FOREIGN KEY (ID_Sala) REFERENCES Sala(ID_Sala) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 6. Estructura de Tabla: FUNCION


CREATE TABLE Funcion (
  ID_Funcion INT AUTO_INCREMENT PRIMARY KEY,
  ID_Pelicula INT NOT NULL,
  ID_Sala INT NOT NULL,
  Fecha DATE NOT NULL,
  Hora TIME NOT NULL,
  FOREIGN KEY (ID_Pelicula) REFERENCES Pelicula(ID_Pelicula) ON DELETE CASCADE,
  FOREIGN KEY (ID_Sala) REFERENCES Sala(ID_Sala) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 7. Estructura de Tabla: RESENA


CREATE TABLE Resena (
  ID_Resena INT AUTO_INCREMENT PRIMARY KEY,
  ID_Cliente INT NOT NULL,
  ID_Pelicula INT NOT NULL,
  Puntuacion FLOAT NOT NULL, -- Escala interna 1-10
  Comentario TEXT DEFAULT NULL,
  Fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ID_Cliente) REFERENCES Cliente(ID_Cliente) ON DELETE CASCADE,
  FOREIGN KEY (ID_Pelicula) REFERENCES Pelicula(ID_Pelicula) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 8. Estructura de Tabla: COMPRA

CREATE TABLE Compra (
  ID_Compra INT AUTO_INCREMENT PRIMARY KEY,
  ID_Cliente INT NOT NULL,
  Fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  MedioPago VARCHAR(50) NOT NULL,
  FOREIGN KEY (ID_Cliente) REFERENCES Cliente(ID_Cliente) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 9. Estructura de Tabla: TICKET

CREATE TABLE Ticket (
  ID_Ticket INT AUTO_INCREMENT PRIMARY KEY,
  ID_Compra INT NOT NULL,
  ID_Funcion INT NOT NULL,
  ID_Asiento INT NOT NULL,
  Tipo_de_ticket VARCHAR(50) NOT NULL,
  Precio DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (ID_Compra) REFERENCES Compra(ID_Compra) ON DELETE CASCADE,
  FOREIGN KEY (ID_Funcion) REFERENCES Funcion(ID_Funcion) ON DELETE CASCADE,
  FOREIGN KEY (ID_Asiento) REFERENCES Asiento(ID_Asiento) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

---------------------------------
-- DATOS INICIALES
----------------------------------

-- Insertar SALAS 
INSERT INTO Sala (Nombre_Identificador, Capacidad, Filas, Columnas) VALUES
('Sala 1 - 2D', 80, 8, 10),  -- 8 filas x 10 columnas
('Sala 2 - 3D', 40, 5, 8);   -- 5 filas x 8 columnas

-- Insertar ASIENTOS para Sala 1


INSERT INTO Asiento (ID_Sala, Fila, Numero) VALUES
(1,'A',1),(1,'A',2),(1,'A',3),(1,'A',4),(1,'A',5),(1,'A',6),(1,'A',7),(1,'A',8),(1,'A',9),(1,'A',10),
(1,'B',1),(1,'B',2),(1,'B',3),(1,'B',4),(1,'B',5),(1,'B',6),(1,'B',7),(1,'B',8),(1,'B',9),(1,'B',10),
(1,'C',1),(1,'C',2),(1,'C',3),(1,'C',4),(1,'C',5),(1,'C',6),(1,'C',7),(1,'C',8),(1,'C',9),(1,'C',10),
(1,'D',1),(1,'D',2),(1,'D',3),(1,'D',4),(1,'D',5),(1,'D',6),(1,'D',7),(1,'D',8),(1,'D',9),(1,'D',10),
(1,'E',1),(1,'E',2),(1,'E',3),(1,'E',4),(1,'E',5),(1,'E',6),(1,'E',7),(1,'E',8),(1,'E',9),(1,'E',10),
(1,'F',1),(1,'F',2),(1,'F',3),(1,'F',4),(1,'F',5),(1,'F',6),(1,'F',7),(1,'F',8),(1,'F',9),(1,'F',10),
(1,'G',1),(1,'G',2),(1,'G',3),(1,'G',4),(1,'G',5),(1,'G',6),(1,'G',7),(1,'G',8),(1,'G',9),(1,'G',10),
(1,'H',1),(1,'H',2),(1,'H',3),(1,'H',4),(1,'H',5),(1,'H',6),(1,'H',7),(1,'H',8),(1,'H',9),(1,'H',10);

-- Insertar asientos para Sala 2 
INSERT INTO Asiento (ID_Sala, Fila, Numero) VALUES
(2,'A',1),(2,'A',2),(2,'A',3),(2,'A',4),(2,'B',1),(2,'B',2);


--  Insertar PELÍCULAS precargadas (default)

INSERT INTO Pelicula (Titulo, Duracion, Clasificacion, Genero, Sinopsis, Imagen, Trailer) VALUES
('El Padrino', '02:55:00', '+18', 'Crimen, Drama', 'El patriarca de una organización criminal traslada el control de su imperio clandestino a su reacio hijo.', 'https://i.ebayimg.com/images/g/X~cAAOSwz2ZiaB2w/s-l1200.jpg', 'https://www.youtube.com/watch?v=gCVj1LeYnsc'),
('Dune: Parte Dos', '02:46:00', '+13', 'Ciencia Ficción', 'Paul Atreides se une a los Fremen y busca venganza contra los conspiradores que destruyeron a su familia.', 'https://m.media-amazon.com/images/M/MV5BN2QyZGU4ZDctOWMzMy00NTc5LThlOGQtODg3NjllYmUyYjQwXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg', 'https://www.youtube.com/watch?v=Way9Dexny3w'),
('Barbie', '01:54:00', 'ATP', 'Comedia, Fantasía', 'Barbie sufre una crisis que la lleva a cuestionar su mundo y su existencia.', 'https://m.media-amazon.com/images/M/MV5BOWIwZGY0OTYtZjUzYy00NzRmLTg5YzgtYWMzNWQ0MmZiY2MwXkEyXkFqcGdeQXVyMTUzMTg2ODkz._V1_.jpg', 'https://www.youtube.com/watch?v=pBk4NYhWNMM');


COMMIT;

