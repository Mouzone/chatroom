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

const socket = new WebSocket('ws://localhost:8080')
socket.onmessage = async event => {
    try {
        const data = await JSON.parse(event.data)
        if (data["action"] === "client_id") {
            client_id = data["client_id"]
        } else if (data["action"] === "receive") {
            updateMessages(data)
        } else if (data["action"] === "notify" && data["status"] === "success") {
            if (data["action_type"] === "join") {
                joinRoom()
            } else if (data["action_type"] === "leave") {
                leaveRoom()
            }
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

// todo: notification of person joining and leaving room (same for disconnecting)
// todo: list of rooms upon joining
