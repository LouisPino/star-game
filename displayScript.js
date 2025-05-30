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

function handleNewStar(text) {
    console.log(text)
}