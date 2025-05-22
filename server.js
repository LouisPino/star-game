const fs = require('fs');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');
const url = require('url');
/////////////////////////Initialize server
const server = http.createServer((req, res) => {
    let filePath
    switch (req.url) {
        case "/":
            filePath = path.join(__dirname, './mobile/html/default.html');
            break
        case "/display":
            filePath = path.join(__dirname, './display/html/default.html');
            break
        case "/qrcode.min.js":
            filePath = path.join(__dirname, 'qrcode.min.js');
            break;
        default:
            // Ensure static files from /assets, /images, /scripts are served
            filePath = path.join(__dirname, req.url);

            // Security check to prevent directory traversal attacks
            if (!filePath.startsWith(__dirname)) {
                res.writeHead(403);
                res.end('Access Denied');
                return;
            }
    }

    let extname = String(path.extname(filePath)).toLowerCase();
    let mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'font/otf',
        '.json': 'application/json'
    };

    let contentType = mimeTypes[extname] || 'application/octet-stream';

    //Get html/css/js and write as response to client.
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                // File not found
                fs.readFile(path.join(__dirname, '404.html'), (error, content) => {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(content, 'utf-8');
                });
            } else {
                // Some server error
                res.writeHead(500);
                res.end(`Sorry, check with the site admin for error: ${error.code} ..\n`);
            }
        } else {
            // Success
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Listen on port 8000 for http requests
server.listen(8000);


// Initiate Web Socket Server to piggyback on HTTP Server port
const wss = new WebSocket.Server({ server });
let connectedClients = [];

// On connection to web client, add to list of web clients
wss.on('connection', (ws, req) => {
    ws.id = Date.now()
    const locationPath = url.parse(req.url).pathname;
    ws.path = locationPath; // Store the path in the ws object
    connectedClients.push(ws)
    if (locationPath === "/display") {
        sendToDisplay({ type: 'initialFileServe', data: "" })
    } else {
        ws.send(JSON.stringify({ type: 'initialFileServe', data: "" }))
    }

    // On receiving a message from web client
    ws.on('message', message => {
        console.log(`Client Message: ${message}`)
        data = JSON.parse(message)
        switch (data.type) {
            case "win":
                handleNewStar(data.val)
                break
        }
    });
    ws.on('close', () => {
        connectedClients = connectedClients.filter((client) => client.id != ws.id)
    })
});






///////////////////////////Sending data to web clients
function sendToWebClients(data) {
    if (connectedClients.length) {
        for (client of connectedClients) {
            if (client.path === "/") { client.send(JSON.stringify(data)) }
        }
    }
}

function sendToDisplay(data) {
    for (client of connectedClients) {
        if (client.path === "/display") { client.send(JSON.stringify(data)); break }
    }
}



//star functions
function handleNewStar(text) {
    sendToDisplay({ type: "newStar", data: text })
}




module.exports = [
    sendToWebClients,
    sendToDisplay,
    sendSectionChange
]


