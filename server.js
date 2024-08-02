const WebSocket = require('ws')

const server = new WebSocket.Server({port: 8080})

// room_name: password
const room_passwords = {

}

// client: room_name
const client_room = {

}

// room_name: set() (of clients)
const room_clients = {

}

server.on('connection', (socket) => {
    const clientId = crypto.randomBytes(16).toString('hex');

    // Send the hash or ID to the client immediately upon connection
    socket.send(JSON.stringify({
        type: "id",
        client_id: clientId
    }));

    socket.on('message', message => {
        if (message["type"] === "message") {
            // if it is message search for room client belongs to and send to all other clients connected
            // probably broadcast to all and if it is their room then open it, else ignore it
            client_room[message["client_id"]].forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message)
                }
            })
        } else {
            // todo: account for if room name is already taken
            // keeping track of client id and using that to dictate if client is in room etc...
            // change current client's room
            // keeping track of room and password to verify if join or create
            if (message["action"] === "create") {
                client_room[message["client_id"]] = message["room_name"]

                room_passwords[message["room_name"]] = message["room_password"]

                room_clients[message["room_name"]] = new Set()
                room_clients[message["room_name"]].add(message["client_id"])
            } else if (message["action"] === "join") {
                if (message["room_name"] in room_passwords && message["room_password"] === room_passwords[message["room_name"]]) {
                    // todo: delete room if no people
                    room_clients[message["room_name"]].remove(message["client_id"])

                    client_room[message["client_id"]] = message["room_name"]
                }
                // todo: return error messages
            } else if (message["action"] === "join") {
                room_clients[message["room_name"]].remove(message["client_id"])
                client_room[message["client_id"]] = null
            }
        }

        server.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message)
            }
        })
    })

    socket.on('close', () => {
        console.log('Client disconnected')
    })

})

console.log('WebSocket server is listening on ws://localhost:8080')