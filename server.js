const WebSocket = require('ws')
const crypto = require('crypto')

const server = new WebSocket.Server({port: 8080})
const clients_sockets = {}
const clients_usernames = {}
let counter = 0

server.on('connection', socket => {
    const client_id = crypto.randomBytes(16).toString('hex');
    const username = `anon${counter}`
    // Send the hash or ID to the client immediately upon connection
    socket.send(JSON.stringify({
        action: "client_id",
        client_id: client_id,
        username: username
    }))
    counter++

    clients_sockets[client_id] = socket
    clients_usernames[client_id] = username

    socket.on('message', message => {
        const data = JSON.parse(message)
        if (data["action"] === "send") {
            Object.entries(clients_sockets).forEach(([key, other_socket]) => {
                other_socket.send(JSON.stringify(
                    {
                        action: "receive",
                        username: clients_usernames[data["client_id"]],
                        message: data["message"]
                    }))
            })
        } else if (data["type"] === "disconnect") {
            delete clients_sockets[data["client_id"]]
        }
    })
})

console.log('WebSocket server is listening on ws://localhost:8080')