function updateMessages(message) {
    const past_messages = document.getElementById("past-messages")
    const past_message = document.createElement("div")
    past_message.classList.add("past-message")

    const text = document.createElement("span")
    text.classList.add("text")
    text.textContent = message

    past_message.appendChild(text)

    past_messages.prepend(past_message)
}

function sendToServer(message_text) {
    const message_info =  {
        client_id: client_id,
        action: "send",
        message: message_text
    }
    socket.send(JSON.stringify(message_info))
}

const socket = new WebSocket('ws://localhost:8080')

socket.onmessage = async event => {
    try {
        const data = await JSON.parse(event.data)
        if (data["action"] === "client_id") {
            client_id = data["client_id"]
        } else if (data["action"] === "receive") {
            updateMessages(data["message"])
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

const input_message = document.querySelector("form#message")
input_message.addEventListener("submit", event => {
    event.preventDefault()

    const message_element = document.getElementById("text")
    const message = message_element.value
    updateMessages(message)
    sendToServer(message)

    message_element.value = ""
})

let client_id = ""
