const WebSocket = require('ws')

const server = new WebSocket.Server({port: 8080})

server.on('connection', (socket) => {
    console.log("A new client connected")

    socket.on('message', (message) => {
        try {
            socket.send(message)
        } catch(error) {
            console.error('Invalid JSON received:', message)
        }
    })

    socket.on('close', () => {
        console.log('Client disconnected')
    })

    socket.send('Welcome to the WebSocket Server')
})

console.log('WebSocket server is listening on ws://localhost:8080')