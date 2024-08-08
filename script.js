function sendMessage(message_text) {
    const message_info =  {
        client_id: client_id,
        action: "send",
        message: message_text
    }
    socket.send(JSON.stringify(message_info))
}

const join_room = document.querySelector("#join-room")
function sendJoin() {
    const message_info = {
        client_id: client_id,
        action: "join",
        room_name: room_name
    }
    socket.send(JSON.stringify(message_info))
}

function sendLeave() {
    const message_info = {
        client_id: client_id,
        action: "leave",
        room_name: room_name
    }
    socket.send(JSON.stringify(message_info))
}

// todo: add button at the end to join
function initialize(data) {
    const rooms_list = document.getElementById("rooms-list")
    client_id = data["client_id"]

    console.log(data["rooms"])
    Object.entries(data["rooms"]).forEach(([possible_room, user_count]) => {

        const new_room = document.createElement("p")
        new_room.classList.add("room")
        new_room.dataset.room = possible_room
        new_room.textContent = `${possible_room}`

        const new_usercount = document.createElement("p")
        new_usercount.classList.add("usercount")
        new_usercount.dataset.room = possible_room
        new_usercount.textContent = `${user_count}`

        const join_button = document.createElement("button")
        join_button.classList.add("join")
        join_button.textContent = "Join"
        join_button.dataset.room = possible_room

        join_button.addEventListener("click", event => {
            room_name = event.currentTarget.dataset.room
            sendJoin()
        })

        rooms_list.appendChild(new_room)
        rooms_list.appendChild(new_usercount)
        rooms_list.appendChild(join_button)
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

function joinRoom() {
    room_error.textContent = ""
    room_error.classList.remove("error")
    room_error.classList.remove("active")

    room_name_element.value = room_name
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
    room_name = ""

}

function updateUsers(user_list) {
    const users = document.getElementById("users-list")
    user_list.forEach(username => {
        const new_user = document.createElement("div")
        new_user.textContent = username
        users.appendChild(new_user)
    })
}

const socket = new WebSocket('ws://localhost:8080')
socket.onmessage = async event => {
    try {
        const data = await JSON.parse(event.data)
        if (data["action"] === "initialize") {
            initialize(data)
        } else if (data["action"] === "receive") {
            updateMessages(data)
        } else if (data["action"] === "notify" && data["status"] === "success") {
            if (data["action_type"] === "join") {
                joinRoom()
            } else if (data["action_type"] === "leave") {
                leaveRoom()
            }
        } else if (data["action"] === "list") {
            updateUsers(data["users"])
        }
    } catch (error) {
        console.error('Error handling JSON:', error)
    }
}

socket.onclose = async event => {
    const close_message = {
        client_id: client_id,
        action: "disconnect",
    }
    socket.send(JSON.stringify(close_message))
}

const room_name_element = document.getElementById("room-name")

const input_room = document.querySelector("form#room")
input_room.addEventListener("submit", event => {
    event.preventDefault()
    room_name = room_name_element.value
    sendJoin()
})

const leave_room = document.querySelector("#leave-room")
leave_room.addEventListener("click", event => {
    confirmation.style.display = "block"
})

const confirmation = document.getElementById("leave")
const confirm = document.querySelector("button#confirm-leave")
confirm.addEventListener("click", event => {
    confirmation.style.display = "none"
    sendLeave()
})

const reject = document.querySelector("button#reject-leave")
reject.addEventListener("click", event => {
    confirmation.style.display = "none"
})

const input_message = document.querySelector("form#message")
const message_element = document.getElementById("text")
const room_error = document.getElementById("room-error")
input_message.addEventListener("submit", event => {
    event.preventDefault()

    if (room_name) {
        sendMessage(message_element.value)
    } else {
        room_error.textContent = "Enter room name"
        room_error.classList.add("error")
        room_error.classList.add("active")
    }


    message_element.value = ""
})

let client_id = ""
let room_name = ""

// todo: update room counts WITH REFRESH BUTTON to get another manifest
// todo: upon joining room show list of users
// todo: notification of person joining and leaving room (same for disconnecting)
