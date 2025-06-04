document.addEventListener("DOMContentLoaded", function () {
    initializeWebSocket(location.hostname);
    function initializeWebSocket(ip) {
        socket = new WebSocket(`ws://${ip}:8000/display`);
        // Confirm connection success
        socket.onopen = function (e) {
            console.log("WebSocket connection established!");
        };

        // Run when message is received from server (Max -> Server -> Client)
        socket.onmessage = function (event) {
            let msg = JSON.parse(event.data);
            switch (msg.type) {
                case `initialFileServe`:
                    break;
                case "newStar":
                    handleNewStar(msg.data)
                    break;
            }
        };
    }
});


function sendToServer(msg) {
    socket.send(JSON.stringify(msg));
}

let starCount = 0;

const columnHeights = {};
const boxWidth = window.innerWidth / 6;

function handleNewStar(text) {
    const message = document.createElement("h1");
    message.classList.add("message");
    message.innerHTML = text;
    message.style.width = `${boxWidth}px`;


    // Set initial position off-screen (center bottom)
    const startLeft = window.innerWidth / 2 - boxWidth / 2;
    const startTop = window.innerHeight + 50;

    message.style.left = `${startLeft}px`;
    message.style.top = `${startTop}px`;

    // Place offscreen first so it's in DOM and measurable
    document.body.appendChild(message);

    // Get actual height
    const messageHeight = message.offsetHeight;

    const messagesPerRow = Math.floor(window.innerWidth / boxWidth);

    // Find shortest column
    let shortestColumn = 0;
    let minHeight = columnHeights[0] ?? 0;

    for (let i = 1; i < messagesPerRow; i++) {
        const colHeight = columnHeights[i] ?? 0;
        if (colHeight < minHeight) {
            shortestColumn = i;
            minHeight = colHeight;
        }
    }

    const finalLeft = shortestColumn * boxWidth;
    const finalTop = minHeight;

    // Update column height
    columnHeights[shortestColumn] = minHeight + messageHeight;

    // Trigger transition to final position
    requestAnimationFrame(() => {
        message.style.left = `${finalLeft}px`;
        message.style.top = `${finalTop}px`;
        message.classList.add("float-up");
    });
}
