const WebSocket = require('ws')
const crypto = require('crypto')

const server = new WebSocket.Server({port: 8080})
const clients = {}

server.on('connection', socket => {
    const client_id = crypto.randomBytes(16).toString('hex');

    // Send the hash or ID to the client immediately upon connection
    socket.send(JSON.stringify({
        action: "client_id",
        client_id: client_id
    }))

    clients[client_id] = socket
    console.log(`${client_id} joined`)

    socket.on('message', message => {
        const data = JSON.parse(message)
        if (data["action"] === "send") {
            console.log(data["client_id"])
            Object.entries(clients).forEach(([key, other_socket]) => {
                console.log(key)
                if (key !== data["client_id"]) {
                    other_socket.send(JSON.stringify(
                        {
                            action: "receive",
                            message: data["message"]
                        }))
                }
            })
        } else if (data["type"] === "disconnect") {
            delete clients[data["client_id"]]
        }
    })
})

console.log('WebSocket server is listening on ws://localhost:8080')