function getCurrentTime() {
    const options = {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: true
    };
    return new Date().toLocaleString('en-US', options)
}

function updateMessages(message_info) {
    console.log(message_info.username, message_info.text)
    const past_messages = document.getElementById("past-messages")
    const past_message = document.createElement("div")
    past_message.classList.add("past-message")

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

function readBlobAsJson(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function() {
            try {
                const text = reader.result;
                const jsonObject = JSON.parse(text);
                resolve(jsonObject); // Resolve with parsed JSON
            } catch (error) {
                reject(new Error('Failed to parse JSON: ' + error.message));
            }
        };

        reader.onerror = function() {
            reject(new Error('Failed to read Blob: ' + reader.error.message));
        };

        reader.readAsText(blob); // Read Blob as text
    });
}

function setUsernameElement() {
    const username_element = document.getElementById("username")
    username_element.value = local_username
    username_element.disabled = true
}

// Create a new WebSocket connection
const socket = new WebSocket('ws://localhost:8080');
socket.onmessage = async (event) => {
    if (event.data instanceof Blob) {
        try {
            const jsonObject = await readBlobAsJson(event.data);
            updateMessages(jsonObject)
        } catch (error) {
            console.error('Error handling Blob:', error);
        }
    } else {
        console.log('Received non-Blob data:', event.data);
    }
};

const input = document.querySelector("form")
input.addEventListener("submit", event => {
    event.preventDefault()
    const message_element = document.getElementById("message")
    const message_text = message_element.value
    message_element.value = ""
    if (!local_username) {
        const username_input = document.getElementById("username").value
        // todo: do not submit if username_input is empty
        local_username = username_input
        setUsernameElement()
        localStorage.setItem("local_username", local_username)
    }
    sendToServer(local_username, message_text)
})

const reset_username_button = document.querySelector("button#reset-username")
reset_username_button.addEventListener("click", event => {
    local_username = ""
    localStorage.removeItem("local_username")
    const username_element = document.getElementById("username")
    username_element.disabled = false
    username_element.value = ""
})

let local_username = ""
if (localStorage.getItem("local_username")) {
    local_username = localStorage.getItem("local_username")
    setUsernameElement()
}
