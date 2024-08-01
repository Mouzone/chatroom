const submit_button = document.querySelector("button")
submit_button.addEventListener("click", event => {
    const message_text = document.getElementById("message").value
    const username = document.getElementById("username").value
    sendToServer(username, message_text)
})


function getCurrentTime() {
    const options = {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: true
    };
    return new Date().toLocaleString('en-US', options)
}

function connectToClient() {
    socket.onopen = () => {
        console.log('Connected to server')
        socket.send('Hello Server!')
    };

    socket.onmessage = (event) => {
        console.log(`Message from server: ${event.data}`)
        updateMessages(event.data)
    };

    socket.onclose = () => {
        console.log('Disconnected from server')
    };
}

function updateMessages(message_info) {
    console.log(message_info.username, message_info.text)
    const past_messages = document.getElementById("past-messages")
    const past_message = document.createElement("div")
    past_message.classList.add("past_message")

    const username = document.createElement("span")
    username.classList.add("username")
    username.textContent = message_info['username'] + ":"
    const text = document.createElement("span")
    text.classList.add("text")
    text.textContent = message_info['text']

    past_message.appendChild(username)
    past_message.appendChild(text)

    past_messages.appendChild(past_message)
}

function sendToServer(username, message_text) {
    const date_time = getCurrentTime()
    const message_info =  {
        username: username,
        text: message_text,
        date_time: date_time
    }
    socket.send(JSON.stringify(message_info))
}



const socket = new WebSocket('ws://localhost:8080')
connectToClient()