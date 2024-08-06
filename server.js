const WebSocket = require('ws')
const crypto = require('crypto')

const clients_sockets = {}
const clients_usernames = {}
const clients_rooms = {}
const rooms_clients = {}
let counter = 0

const server = new WebSocket.Server({port: 8080})
server.on('connection', socket => {
    const client_id = crypto.randomBytes(16).toString('hex');
    const username = `anon${counter}`
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
            const room_to_send = clients_rooms[data["client_id"]]
            const clients_to_receive = rooms_clients[room_to_send]
            clients_to_receive.forEach(client => {
                if (client !== data["client_id"]) {
                    clients_sockets[client].send(JSON.stringify(
                        {
                            action: "receive",
                            username: clients_usernames[data["client_id"]],
                            message: data["message"]
                        }))
                }
            })
        } else if (data["action"] === "join") {
            clients_rooms[data["client_id"]] = data["room_name"]
            if (!data["room_name"] in rooms_clients) {
                data["room_name"] = new Set()
            }
            clients_rooms[data["client_id"]].add(data["client_id"])
        } else if (data["type"] === "disconnect") {
            delete clients_sockets[data["client_id"]]
            delete clients_usernames[data["client_id"]]
            delete clients_rooms["client_id"]

            const room_to_clear = clients_rooms["client_id"]
            rooms_clients[room_to_clear].remove(data["client_id"])
            if (rooms_clients[room_to_clear].length === 0) {
                delete rooms_clients[room_to_clear]
            }
        }
    })
})

// todo: Join rooms, no passwords
// -- if it DNE then create and join
console.log('WebSocket server is listening on ws://localhost:8080')