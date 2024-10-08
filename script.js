function sendMessage(message_text) {
    json_template["action"] = "send"
    json_template["message"] = message_text
    socket.send(JSON.stringify(json_template))
    delete json_template["message"]
}

const join_room = document.querySelector("#join-room")
function sendJoin() {
    json_template["action"] = "join"
    socket.send(JSON.stringify(json_template))
}

function sendLeave() {
    json_template["action"] = "leave"
    socket.send(JSON.stringify(json_template))
}

function initialize(data) {
    json_template["username"] = data["username"]
    json_template["client_id"] = data["client_id"]
}

function updateRooms(rooms_list) {
    const rooms_list_element = document.getElementById("rooms-list")
    const current_rooms = document.querySelectorAll("div.room-info")
    current_rooms.forEach(element => {
        rooms_list_element.removeChild(element)
    })

    Object.entries(rooms_list).forEach(([possible_room, user_count]) => {
        const room_container = document.createElement("div")
        room_container.classList.add("room-info")

        const new_room = document.createElement("p")
        new_room.classList.add("room")
        new_room.dataset.room = possible_room
        new_room.textContent = `${possible_room}`

        const new_user_count = document.createElement("p")
        new_user_count.classList.add("user_count")
        new_user_count.dataset.room = possible_room
        new_user_count.textContent = `${user_count}`

        const join_button = document.createElement("button")
        join_button.classList.add("join")
        join_button.textContent = "Join"
        join_button.dataset.room = possible_room

        join_button.addEventListener("click", event => {
            const new_room = event.currentTarget.dataset.room
            if (json_template["room"]) {
                sendLeave()
            }
            json_template["room"] = new_room
            sendJoin()
        })

        room_container.appendChild(new_room)
        room_container.appendChild(new_user_count)
        room_container.appendChild(join_button)

        rooms_list_element.appendChild(room_container)
    })
}

const past_messages = document.getElementById("past-messages")
function updateMessages(data) {
    const username = data["username"]
    const message = data["message"]

    const past_message = document.createElement("div")
    past_message.classList.add("past-message")

    const message_element = document.createElement("span")
    message_element.classList.add("message")
    message_element.textContent = message

    const username_element = document.createElement("span")
    username_element.classList.add("username")
    username_element.textContent = `${username}:`

    past_message.appendChild(username_element)
    past_message.appendChild(message_element)

    past_messages.prepend(past_message)
}

function updateUsers(user_list) {
    // clear out all users
    const old_users = document.querySelectorAll(".name")
    const user_list_element = document.getElementById("users-list")
    old_users.forEach(element => {
        user_list_element.removeChild(element)
    })
    user_list.forEach(username => {
        const new_user = document.createElement("div")
        new_user.classList.add("name")
        new_user.textContent = username
        user_list_element.appendChild(new_user)
    })
}

function updateUsersMessage(reason, message) {
    const new_message = document.createElement("div")
    past_messages.prepend(new_message)
    new_message.textContent = message
    if (reason === "join") {
        new_message.classList.add("join-message")
    } else {
        new_message.classList.add("leave-message")
    }
}

function joinRoom() {
    room_error.textContent = ""
    room_error.classList.remove("error")
    room_error.classList.remove("active")

    room_name_element.value = json_template["room"]
    join_room.disabled = true
    leave_room.disabled = false
    room_name_element.disabled = true
}

function leaveRoom() {
    leave_room.disabled = true
    join_room.disabled = false
    past_messages.innerHTML = ""
    room_name_element.disabled = false
    room_name_element.value = ""
    json_template["room"] = ""
    updateUsers([])
    const heading = document.createElement("p")
    heading.classList.add("head")
    heading.textContent = "Users"

}

const socket = new WebSocket('ws://localhost:8080')
socket.onmessage = async event => {
    try {
        const data = await JSON.parse(event.data)
        if (data["action"] === "initialize") {
            initialize(data)
        } else if (data["action"] === "receive") {
            updateMessages(data)
        } else if (data["action"] === "notify") {
            if (data["action_type"] === "join") {
                joinRoom()
            } else if (data["action_type"] === "leave") {
                leaveRoom()
            } else if (["leave", "join"].includes(data["reason"])) {
                updateUsersMessage(data["reason"], data["message"])
            }
        } else if (data["action"] === "update-users") {
            updateUsers(data["users"])
        } else if (data["action"] === "update-rooms") {
            updateRooms(data["rooms"])
        }
    } catch (error) {
        console.error('Error handling JSON:', error)
    }
}

window.onbeforeunload = () => {
    json_template["action"] = "disconnect"
    socket.send(JSON.stringify(json_template))
}

const room_name_element = document.getElementById("room-name")

const input_room = document.querySelector("form#room")
input_room.addEventListener("submit", event => {
    event.preventDefault()
    json_template["room"] = room_name_element.value
    sendJoin()
})

const leave_room = document.querySelector("#leave-room")
leave_room.addEventListener("click", () => {
    confirmation.style.display = "block"
})

const confirmation = document.getElementById("leave")
const confirm = document.querySelector("button#confirm-leave")
confirm.addEventListener("click", () => {
    confirmation.style.display = "none"
    sendLeave()
})

const reject = document.querySelector("button#reject-leave")
reject.addEventListener("click", () => {
    confirmation.style.display = "none"
})

const refresh_rooms_button = document.getElementById("refresh-rooms")
refresh_rooms_button.addEventListener("click", () => {
    json_template["action"] = "update-rooms"
    socket.send(JSON.stringify(json_template))
})

const refresh_users_button = document.getElementById("refresh-users")
refresh_users_button.addEventListener("click", () => {
    if (json_template["room"]) {
        json_template["action"] = "update-users"
        socket.send(JSON.stringify(json_template))
    }
})

const input_message = document.querySelector("form#message")
const message_element = document.getElementById("text")
const room_error = document.getElementById("room-error")
input_message.addEventListener("submit", event => {
    event.preventDefault()

    if (json_template["room"]) {
        sendMessage(message_element.value)
    } else {
        room_error.textContent = "Enter room name"
        room_error.classList.add("error")
        room_error.classList.add("active")
    }


    message_element.value = ""
})

const json_template = {
    action: "",
    client_id: "",
    room: "",
    username: "",
}

// todo: truncate room_names and usernames in usernames list and rooms list if too long