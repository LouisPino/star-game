// Shared wish transport for the game station and the wish wall.
//
// Two delivery paths, used together:
//   BroadcastChannel - same browser on one machine. Needs no server, so this
//                      is the path that works on static hosting like GitHub Pages.
//   WebSocket        - the relay in server.js, for screens on separate machines.
//
// Every available path fires on send; receivers dedupe on message id, so a
// wish never lands on the wall twice when both paths are live.

const CHANNEL_NAME = "star-game";
const RELAY_PATH = "/display";

const StarTransport = (function () {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    const seen = new Set();
    let onStarCallback = null;
    let socket = null;

    function newId() {
        // Not crypto.randomUUID - that is undefined over plain http on a LAN
        // address, which is exactly the two-machine setup this has to survive.
        return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    // A wish arriving by either path. First id wins, later copies are dropped.
    function receive(star) {
        if (!star || seen.has(star.id)) return;
        seen.add(star.id);
        if (onStarCallback) onStarCallback(star.text);
    }

    channel.onmessage = (event) => receive(event.data);

    // Reach for the relay server. Its absence is normal on static hosting, and
    // BroadcastChannel already covers the same-machine case without it.
    try {
        const proto = location.protocol === "https:" ? "wss:" : "ws:";
        socket = new WebSocket(`${proto}//${location.host}${RELAY_PATH}`);

        socket.onopen = () => console.log("Relay server connected.");
        socket.onerror = () => console.log("No relay server - BroadcastChannel only.");
        socket.onmessage = function (event) {
            const msg = JSON.parse(event.data);
            switch (msg.type) {
                case "initialFileServe":
                    break;
                case "newStar":
                    receive(msg.data);
                    break;
            }
        };
    } catch (e) {
        // Thrown up front when an https page asks for a ws:// socket.
        console.log("No relay server - BroadcastChannel only.");
    }

    return {
        // Game station: send a winning wish to the wall.
        send(text) {
            const star = { id: newId(), text: text };
            channel.postMessage(star);
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: "win", val: star }));
            }
        },

        // Wish wall: run this for each new wish, once.
        onStar(callback) {
            onStarCallback = callback;
        }
    };
})();
