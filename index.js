const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs'); // Módulo para trabajar con el sistema de archivos
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const MESSAGES_FILE = 'messages.json';
let messages = [];

// Función para cargar mensajes desde el archivo
function loadMessages() {
    try {
        const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
        messages = JSON.parse(data);
        console.log('Mensajes cargados:', messages.length);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('No se encontró el archivo de mensajes. Creando uno nuevo.');
            messages = []; // Inicializa un array vacío si el archivo no existe
            saveMessages(); // Guarda un archivo vacío para empezar
        } else {
            console.error('Error al cargar mensajes:', error);
            messages = []; // Por seguridad, si hay un error, empezamos con array vacío
        }
    }
}

// Función para guardar mensajes en el archivo
function saveMessages() {
    try {
        fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf8');
    } catch (error) {
        console.error('Error al guardar mensajes:', error);
    }
}

// Cargar mensajes al iniciar el servidor
loadMessages();

// Sirve el archivo HTML (el front-end)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Lógica de Socket.IO para manejar el chat
io.on('connection', (socket) => {
    console.log('¡Un usuario se ha conectado!');

    // Enviar historial de mensajes al nuevo usuario
    socket.emit('history', messages);

    // Escucha los mensajes que llegan del front-end
    socket.on('chat message', (msg) => {
        const messageData = {
            text: msg,
            timestamp: new Date().toLocaleTimeString(), // Hora del mensaje
            sender: socket.id // Puedes añadir un nombre de usuario si lo implementas
        };
        messages.push(messageData); // Añadir al array de mensajes
        saveMessages(); // Guardar el array actualizado en el archivo

        // Envía el mensaje a todos los usuarios conectados
        io.emit('chat message', messageData);
    });

    // Maneja la desconexión
    socket.on('disconnect', () => {
        console.log('Un usuario se ha desconectado.');
    });
});

// Inicia el servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});