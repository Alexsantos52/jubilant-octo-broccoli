const express = require("express");
const mysql2 = require("mysql2");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

dotenv.config();

const app = express();
const router = express.Router();

// Configuración de la base de datos MySQL
const pool = mysql2.createPool({
    host: "localhost",
    user: "root",
    password: "admin",
    database: "db_uno",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();

// Middlewares
app.use(cors());
app.use(cookieParser());
app.use(express.json());

/* ------------------- RUTAS ------------------- */

// Obtener todos los clientes
router.get("/clientes", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM clientes");
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener clientes:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Crear un nuevo cliente
router.post("/clientes", async (req, res) => {
    try {
        const { nombre, correo, telefono, id_provincia, id_cliente, id_ciudad } = req.body;
        if (!nombre || !correo || !telefono || !id_cliente || !id_provincia || !id_ciudad) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }
        const sql = `
            INSERT INTO clientes (nombre, correo, telefono, id_provincia, id_cliente, id_ciudad)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(sql, [nombre, correo, telefono, id_provincia, id_cliente, id_ciudad]);
        res.status(201).json({ message: "Cliente creado con éxito", id: result.insertId });
    } catch (error) {
        console.error("Error al crear cliente:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Obtener un cliente por ID
router.get("/clientes/id", async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query("SELECT * FROM clientes WHERE id_cliente = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Cliente no encontrado" });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error("Error al obtener cliente:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Eliminar un cliente por ID
router.delete("/clientes/id", async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query("DELETE FROM clientes WHERE id_cliente = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Cliente no encontrado" });
        }
        res.json({ message: "Cliente eliminado con éxito" });
    } catch (error) {
        console.error("Error al eliminar cliente:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Obtener todas las provincias
router.get("/provincia", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM provincia");
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener provincias:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Crear una nueva provincia
router.post("/provincia", async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!nombre) {
            return res.status(400).json({ error: "El nombre es obligatorio" });
        }
        const sql = "INSERT INTO provincia (nombre) VALUES (?)";
        const [result] = await pool.query(sql, [nombre]);
        res.status(201).json({ message: "Provincia creada con éxito", id: result.insertId });
    } catch (error) {
        console.error("Error al crear provincia:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Obtener todas las ciudades
router.get("/ciudad", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM ciudad");
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener ciudades:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Crear una nueva ciudad
router.post("/ciudad", async (req, res) => {
    try {
        const { nombre, id_provincia } = req.body;
        if (!nombre || !id_provincia) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }
        const sql = "INSERT INTO ciudad (nombre, id_provincia) VALUES (?, ?)";
        const [result] = await pool.query(sql, [nombre, id_provincia]);
        res.status(201).json({ message: "Ciudad creada con éxito", id: result.insertId });
    } catch (error) {
        console.error("Error al crear ciudad:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Obtener todos los departamentos
router.get("/departamento", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM departamento");
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener departamentos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Crear un nuevo departamento
router.post("/departamento", async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!nombre) {
            return res.status(400).json({ error: "El nombre es obligatorio" });
        }
        const sql = "INSERT INTO departamento (nombre) VALUES (?)";
        const [result] = await pool.query(sql, [nombre]);
        res.status(201).json({ message: "Departamento creado con éxito", id: result.insertId });
    } catch (error) {
        console.error("Error al crear departamento:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Eliminar una provincia por ID
router.delete("/provincia", async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query("DELETE FROM provincia WHERE id_provincia = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Provincia no encontrada" });
        }
        res.json({ message: "Provincia eliminada con éxito" });
    } catch (error) {
        console.error("Error al eliminar provincia:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

/* ------------------- RUTAS DE LOGIN Y SEGURIDAD ------------------- */

// LOGIN con JWT y Cookies
router.post("/login", async (req, res) => {
    const { correo, contraseña } = req.body;

    if (!correo || !contraseña) {
        return res.status(400).json({ mensaje: "Faltan campos requeridos" });
    }

    try {
        const [resultados] = await pool.query("SELECT * FROM usuario WHERE correo = ?", [correo]);
        if (resultados.length === 0) return res.status(404).json({ mensaje: "Usuario no encontrado" });

        const usuario = resultados[0];
        const valido = await bcrypt.compare(contraseña, usuario.contraseña);
        if (!valido) return res.status(401).json({ mensaje: "Contraseña incorrecta" });

        const token = jwt.sign({ id: usuario.id_usuario }, process.env.JWT_SECRET, { expiresIn: "2h" });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict"
        });

        res.json({ mensaje: "Inicio de sesión exitoso", token });
    } catch (error) {
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// LOGOUT
router.post("/logout", (req, res) => {
    try {
        res.clearCookie("token");
        res.json({ mensaje: "Sesión cerrada exitosamente" });
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        res.status(500).json({ mensaje: "Error al cerrar sesión" });
    }
});

// Middleware para verificar JWT
const verificarToken = (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(403).json({ mensaje: "Acceso denegado" });

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) return res.status(401).json({ mensaje: "Token inválido" });
            req.userId = decoded.id;
            next();
        });
    } catch (error) {
        res.status(500).json({ error: "Error al verificar token" });
    }
};

/* ------------------- CONFIGURACIÓN DEL SERVIDOR ------------------- */

const PORT = process.env.PORT || 4400;
app.use("/api", router);
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Manejo del cierre del servidor
process.on("SIGINT", () => {
    console.log("Servidor cerrado correctamente");
    process.exit();
});
