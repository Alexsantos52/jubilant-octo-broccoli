CREATE DATABASE IF NOT EXISTS db_uno;
USE db_uno;

-- Crear la tabla clientes
CREATE TABLE clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre_cliente VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear la tabla departamento
CREATE TABLE departamento (
    id_departamento INT AUTO_INCREMENT PRIMARY KEY,
    nombre_departamento VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear la tabla ciudad
CREATE TABLE ciudad (
    id_ciudad INT AUTO_INCREMENT PRIMARY KEY,
    nombre_ciudad VARCHAR(100) NOT NULL,
    id_departamento INT NOT NULL,
    FOREIGN KEY (id_departamento) REFERENCES departamento(id_departamento) ON DELETE CASCADE,
    INDEX (id_departamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear la tabla provincia
CREATE TABLE provincia (
    id_provincia INT AUTO_INCREMENT PRIMARY KEY,
    nombre_provincia VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear la tabla usuario
CREATE TABLE usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(100) NOT NULL,
    correo VARCHAR(255) UNIQUE NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    INDEX (correo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear la tabla bitacora
CREATE TABLE bitacora (
    id_bitacora INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    metodo VARCHAR(10) NOT NULL,
    parametros TEXT NULL,
    respuesta TEXT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    INDEX (id_usuario),
    INDEX (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER //
CREATE TRIGGER usuario_insertar
AFTER INSERT ON usuario
FOR EACH ROW
BEGIN
    INSERT INTO bitacora (id_usuario, endpoint, metodo, parametros, respuesta)
    VALUES (NEW.id_usuario, 'usuario', 'INSERT', 
            CONCAT('nombre_usuario=', NEW.nombre_usuario, ', correo=', NEW.correo),
            'Usuario insertado correctamente');
END//

CREATE TRIGGER usuario_actualizar
AFTER UPDATE ON usuario
FOR EACH ROW
BEGIN
    INSERT INTO bitacora (id_usuario, endpoint, metodo, parametros, respuesta)
    VALUES (NEW.id_usuario, 'usuario', 'UPDATE', 
            CONCAT('nombre_usuario_antes=', OLD.nombre_usuario, ', nombre_usuario_despues=', NEW.nombre_usuario,
                   ', correo_antes=', OLD.correo, ', correo_despues=', NEW.correo),
            'Usuario actualizado correctamente');
END//

CREATE TRIGGER usuario_despues_eliminar
AFTER DELETE ON usuario
FOR EACH ROW
BEGIN
    INSERT INTO bitacora (id_usuario, endpoint, metodo, parametros, respuesta)
    VALUES (OLD.id_usuario, 'usuario', 'DELETE', 
            CONCAT('nombre_usuario=', OLD.nombre_usuario, ', correo=', OLD.correo),
            'Usuario eliminado correctamente');
END//

-- Crear la tabla login
CREATE TABLE login (
    id_login INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    exito BOOLEAN NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    INDEX (id_usuario),
    INDEX (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER //

CREATE TRIGGER login_despues_insertar
AFTER INSERT ON login
FOR EACH ROW
BEGIN
    INSERT INTO bitacora (id_usuario, endpoint, metodo, parametros, respuesta)
    VALUES (NEW.id_usuario, 'login', 'INSERT', 
            CONCAT('exito=', NEW.exito),
            IF(NEW.exito = 1, 'Inicio de sesión exitoso', 'Inicio de sesión fallido'));
END //

DELIMITER ;