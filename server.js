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
        action: "initialize",
        client_id: client_id,
        rooms: Object.keys(rooms_clients),
        username: username
    }))
    counter++

    clients_sockets[client_id] = socket
    clients_usernames[client_id] = username

    socket.on('message', message => {
        const data = JSON.parse(message)
        console.log(data)
        if (data["action"] === "send") {
            const room_to_send = clients_rooms[data["client_id"]]
            const clients_to_receive = rooms_clients[room_to_send]
            clients_to_receive.forEach(client => {
                clients_sockets[client].send(JSON.stringify(
                    {
                        action: "receive",
                        username: clients_usernames[data["client_id"]],
                        message: data["message"]
                    }))
            })
        } else if (data["action"] === "join") {
            if (data["client_id"] in clients_rooms) {
                // notify all other users that current user is leaving
                rooms_clients[clients_rooms[data["client_id"]]].forEach(client_id => {
                    if (client_id !== data["client_id"]) {
                        clients_sockets[client_id].send({
                            action: "notify",
                            reason: "leave",
                            message: `${clients_usernames[client_id]} has left`
                        })
                    }
                })
                rooms_clients[clients_rooms[data["client_id"]]].delete(data["client_id"])
                if (rooms_clients[clients_rooms[data["client_id"]]].length === 0) {
                    delete rooms_clients[data["room_name"]]
                }
            }

            clients_rooms[data["client_id"]] = data["room_name"]
            if (!(data["room_name"] in rooms_clients)) {
                rooms_clients[data["room_name"]] = new Set()
            }
            rooms_clients[data["room_name"]].add(data["client_id"])
            // notify all other users of user_name JOINING in next room
            rooms_clients[data["room_name"]].forEach(client_id => {
                clients_sockets[client_id].send({
                    action: "notify",
                    reason: "join",
                    message: `${clients_usernames[client_id]} has joined`
                })
            })
            clients_sockets[client_id].send({
                action: "list",
                room_name: data["room_name"],
                users: [...rooms_clients[data["room_name"]]]
            })
        } else if (data["action"] === "leave") {
            // notify all other users of user_name leaving
            rooms_clients[data["room_name"]].forEach(client_id => {
                if (client_id !== data["client_id"]) {
                    clients_sockets[client_id].send({
                        action: "notify",
                        reason: "leave",
                        message: `${clients_usernames[client_id]} has left`
                    })
                }
            })
            rooms_clients[data["room_name"]].delete(data["client_id"])
            if (rooms_clients[data["room_name"]].length === 0) {
                delete rooms_clients[data["room_name"]]
            }
            delete clients_rooms[data["client_id"]]
        } else if (data["type"] === "disconnect") {
            rooms_clients[clients_rooms[data["client_id"]]].forEach(client_id => {
                if (client_id !== data["client_id"]) {
                    clients_sockets[client_id].send({
                        action: "notify",
                        reason: "leave",
                        message: `${clients_usernames[client_id]} has left`
                    })
                }
            })
            delete clients_sockets[data["client_id"]]
            delete clients_usernames[data["client_id"]]
            delete clients_rooms[data["client_id"]]

            const room_to_clear = clients_rooms[data["client_id"]]
            rooms_clients[room_to_clear].delete(data["client_id"])
            if (rooms_clients[room_to_clear].length === 0) {
                delete rooms_clients[room_to_clear]
            }
            // notify all other users of user_name leaving
        }

        clients_sockets[data["client_id"]].send(JSON.stringify(
            {
                action: "notify",
                action_type: `${data["action"]}`,
                status: "success",
            }
        ))
        // todo: send all users update list of rooms, upon creation or deletion of room
    })
})
// maybe rewrite to send message saying receive, then send message upon completion of task
console.log('WebSocket server is listening on ws://localhost:8080')