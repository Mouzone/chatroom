const WebSocket = require('ws')
const crypto = require('crypto')

const clients_sockets = {}
const clients_usernames = {}
const clients_rooms = {}
const rooms_clients = {}
let counter = 0

const server = new WebSocket.Server({port: 8080})
server.on('connection', socket => {
    sendOnJoin(socket)

    socket.on('message', message => {
        const data = JSON.parse(message)
        console.log(data)
        if (data["action"] === "send") {
            const room_to_send = clients_rooms[data["client_id"]]
            const username = clients_usernames[data["client_id"]]
            sendMessage(room_to_send, username, data["message"])

        } else if (data["action"] === "join") {
            if (data["client_id"] in clients_rooms) {
                // notify all other users that current user is leaving
                const room_to_send = clients_rooms[data["client_id"]]
                const username = clients_usernames[data["client_id"]]
                const client_id = data["client_id"]
                sendLeave(room_to_send, username, client_id)
            }

            clients_rooms[data["client_id"]] = data["room_name"]
            if (!(data["room_name"] in rooms_clients)) {
                rooms_clients[data["room_name"]] = new Set()
            }
            rooms_clients[data["room_name"]].add(data["client_id"])
            // notify all other users of user_name JOINING in next room
            rooms_clients[data["room_name"]].forEach(client_id => {
                clients_sockets[client_id].send(JSON.stringify({
                    action: "notify",
                    reason: "join",
                    message: `${clients_usernames[client_id]} has joined`
                }))
            })

            sendUserList(data["room_name"], data["client_id"])

        } else if (data["action"] === "leave") {

            sendLeave(data["room_name"], clients_usernames["client_id"], data["client_id"])

        } else if (data["action"] === "disconnect") {
            const room_to_send = clients_rooms[data["client_id"]]
            const username = clients_usernames["client_id"]
            sendLeave(room_to_send, username, data["client_id"])

            delete clients_sockets[data["client_id"]]
            delete clients_usernames[data["client_id"]]
        }

        clients_sockets[data["client_id"]].send(JSON.stringify(
            {
                action: "notify",
                action_type: `${data["action"]}`,
                status: "success",
            }
        ))
    })
})

function sendOnJoin(socket) {
    const client_id = crypto.randomBytes(16).toString('hex');
    const username = `anon${counter}`

    socket.send(JSON.stringify({
        action: "initialize",
        client_id: client_id,
        username: username
    }))

    sendRoomList(socket)
    counter++

    clients_sockets[client_id] = socket
    clients_usernames[client_id] = username
}

function sendMessage(room, username, message) {
    const clients_to_receive = rooms_clients[room]
    clients_to_receive.forEach(client => {
        clients_sockets[client].send(JSON.stringify(
            {
                action: "receive",
                username: username,
                message: message
            }))
    })
}

function sendLeave(room, username, client_id) {
    rooms_clients[room].forEach(other_client_id => {
        if (other_client_id !== client_id) {
            clients_sockets[client_id].send(JSON.stringify({
                action: "notify",
                reason: "leave",
                message: `${username} has left`
            }))
        }
    })

    rooms_clients[room].delete(client_id)
    if (rooms_clients[room].size === 0) {
        delete rooms_clients[room]
    }

    delete clients_rooms[client_id]
}

function sendRoomList(socket) {
    const rooms = {}
    Object.entries(rooms_clients).forEach(([key, set]) => {
        rooms[key] = set.size
    })

    socket.send(JSON.stringify(
        {
            action: "update-rooms",
            rooms: rooms
        }
    ))
}

function sendUserList(room, self_client_id) {
    // send user list
    clients_sockets["client_id"].send(JSON.stringify({
        action: "list",
        room_name: room,
        users: [...rooms_clients[room]].map(
            client_id => {
                if (client_id !== self_client_id) {
                    return clients_usernames[client_id]
                }
            })
    }))
}


// maybe rewrite to send message saying receive, then send message upon completion of task
console.log('WebSocket server is listening on ws://localhost:8080')