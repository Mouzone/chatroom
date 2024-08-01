const submit_button = document.querySelector("button")
submit_button.addEventListener("click", event => {
    const message_text = document.getElementById("input").value
    createJSON(message_text)
})

function createJSON(message_text) {
    const date_time = getCurrentTime()
    return {
        message_text: message_text,
        current_info: date_time
    }
}

function getCurrentTime() {
    const options = {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: true
    };
    return new Date().toLocaleString('en-US', options);
}