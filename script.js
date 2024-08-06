function updateMessages(data) {
    const username = data["username"]
    const message = data["message"]

    const past_messages = document.getElementById("past-messages")
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

function sendMessage(message_text) {
    const message_info =  {
        client_id: client_id,
        action: "send",
        message: message_text
    }
    socket.send(JSON.stringify(message_info))
}

function sendRoom(room_name) {
    const message_info = {
        client_id: client_id,
        action: "join",
        room_name: room_name
    }
    socket.send(JSON.stringify(message_info))
}

// todo: write logic when recieving success on joining room and setting and disabling room
const socket = new WebSocket('ws://localhost:8080')
socket.onmessage = async event => {
    try {
        const data = await JSON.parse(event.data)
        if (data["action"] === "client_id") {
            client_id = data["client_id"]
        } else if (data["action"] === "receive") {
            updateMessages(data)
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

const room_to_join = document.querySelector("form#room")
room_to_join.addEventListener("submit", event => {
    event.preventDefault()

    const room_name_element = document.getElementById("room-name")
    const room_name = room_name_element.value
    sendRoom(room_name)

    room_name_element.value = ""
})

const input_message = document.querySelector("form#message")
input_message.addEventListener("submit", event => {
    event.preventDefault()

    const message_element = document.getElementById("text")
    const message = message_element.value
    sendMessage(message)

    message_element.value = ""
})


let client_id = ""
