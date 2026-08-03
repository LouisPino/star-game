# Usage

How to run and operate Star Game. For how to actually play, see [GAMEPLAY.md](GAMEPLAY.md).

## What it is

Star Game is a two-screen installation:

- **Game station** (`/`) — a player types a wish, then plays a 75-second dodging game to send it up to the stars.
- **Wish wall** (`/display`) — a separate screen that collects every winning wish and floats it up into a tiled grid.

Both pages share `transport.js`, which carries a wish from the game station to the wall over two paths at once:

- **BroadcastChannel** — same browser on one machine. Needs no server at all, so this path works on plain static hosting (GitHub Pages or any static host).
- **WebSocket relay** — `server.js`, for screens on two different machines.

Both fire on every send; the wall dedupes on a per-wish id, so a wish never lands twice when both paths are live. That means the Node server is only required when the two screens are on separate machines.

## Requirements

- Node.js (any recent LTS) — only for the two-machine setup; one machine, one browser needs no server
- A browser on each screen. The game area is a fixed **900 × 900 px** box, so the game station needs a display at least that tall — this is not a responsive or mobile layout.
- Keyboard at the game station (arrow keys are the only controls).
- Internet access on first load is nice but optional — the pages pull the "Caveat" font from Google Fonts and fall back to a generic cursive face without it.

## Option A — one machine, two browser tabs (no server)

Serve the folder from any static host and open both pages as tabs **in the same browser**:

1. `…/display.html`
2. `…/index.html`

BroadcastChannel carries the wishes. Order doesn't matter, and nothing needs installing. The catch: it only reaches tabs in the same browser on the same machine and same origin — a second machine, or a second browser, sees nothing. Serve over http(s) rather than opening the files directly; `file://` pages get an opaque origin and won't see each other.

## Option B — two machines (relay server)

```bash
npm install   # only dependency: ws
node server.js
```

The server listens on **port 8000** for both HTTP and WebSocket traffic. There is no `npm start` script and no port config — to change the port, edit `server.listen(8000)` in `server.js`. The client no longer hardcodes a port: `transport.js` builds its socket URL from `location.host`, and picks `wss:` on an https page, `ws:` otherwise.

### Order matters here

**Open the wish wall first, then the game station.**

1. On the wall screen: `http://<host>:8000/display`
2. On the game screen: `http://<host>:8000/`

The server routes each winning wish to the *first* client that connected on the `/display` path. The game page also opens its socket on `/display`, so if the game station connects before the wall, the wall stays empty and wishes go nowhere visible. If the wall goes blank mid-event, reload the wall page **and** the game page, wall first.

`<host>` is the LAN IP of the machine running `server.js`. No client config is needed for LAN use — just make sure port 8000 is reachable through the firewall.

Note that an https page cannot open a `ws:` socket, so hosting the pages over https without a `wss:` relay leaves you with the BroadcastChannel path only. `transport.js` treats that as normal and logs `No relay server - BroadcastChannel only.` rather than failing.

## Running the event

- One wish per playthrough. After a win or a loss, the **"Make Anoter Wish?"** button reloads the page for the next player.
- Only wins reach the wall. A player who runs out of lives sees the lose modal and their wish is discarded.
- The wall never clears itself. Reload `/display` to start a fresh wall — there is no persistence, so **reloading erases every wish collected so far**.
- The wall tiles wishes into 6 columns, always filling the shortest column next. Long wishes make tall tiles; with enough entries, columns will eventually run past the bottom of the screen, since there is no scroll or overflow handling.
- Wish text is inserted as HTML (`innerHTML`), so anything a player types is rendered as markup. Fine for a supervised installation; do not expose the game station to untrusted or unattended input.

## Layout of the code

| File | Role |
| --- | --- |
| `server.js` | HTTP static file server + WebSocket relay on port 8000 |
| `transport.js` | Shared `StarTransport` — BroadcastChannel + WebSocket send/receive with id dedupe. Loaded by both pages, before their own script |
| `index.html` / `script.js` / `style.css` | Game station: start screen, game loop, win/lose modals. Calls `StarTransport.send(text)` on a win |
| `display.html` / `displayScript.js` / `displayStyle.css` | Wish wall: registers `StarTransport.onStar(handleNewStar)` and tiles each wish |
| `starWish.png` | The player sprite and life-counter icon |
| `badGuy*.gif` / `badGuy*.png` | Obstacle sprites, tiers 1–5 |
| `Extended_BG.png` | The 7000 px-tall scrolling background |
| `old/` | Uncropped source art, not used at runtime |

## Message protocol

A wish is an object, not a bare string: `{ id: "<timestamp>-<random>", text: "<wish text>" }`. The id exists only so the wall can drop the second copy when both transport paths deliver the same wish. (It's a hand-rolled id rather than `crypto.randomUUID`, which is undefined on a plain-http LAN address — exactly the two-machine case.)

On BroadcastChannel, that object is posted as-is.

Over the socket, three message shapes, all JSON:

- `{ type: "initialFileServe", data: "" }` — server → client on connect; a handshake ping, no payload, ignored by the client.
- `{ type: "win", val: <star> }` — game → server on a win.
- `{ type: "newStar", data: <star> }` — server → wall, re-emitting the same star object.

## Troubleshooting

**Wishes don't appear on the wall (two machines).** Almost always connection order — see above. Reload the wall page first, then the game page. The server logs every `Client Message:` it receives, so check the terminal to confirm the win actually arrived.

**Wishes don't appear on the wall (one machine).** BroadcastChannel is scoped to one browser and one origin. Both tabs must be the same browser (not one Chrome, one Safari), not a private window paired with a normal one, and served from the same host and port — `localhost:8000` and `127.0.0.1:8000` count as different origins.

**`No relay server - BroadcastChannel only.`** Expected on static hosting, and harmless if both screens are tabs on one machine. On a two-machine setup it means the browser can't reach `server.js` — check that it's running, that port 8000 is open through the firewall, and that you loaded the page over http rather than https.

**A wish shows up twice.** Shouldn't happen — dedupe is by id. If it does, the two copies came from separate sends (e.g. `gameWin()` firing twice), not from the two transport paths.

**A 404 shows a blank page.** The server tries to serve `404.html`, which doesn't exist in this repo. The status code is still correct; the body is just empty.

**Game area is cut off.** The 900 × 900 box is fixed. Zoom the browser out (⌘−) or use a taller display.
