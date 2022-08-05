const WebSocket = require("ws");
const express = require("express");
const app = express()
const path = require("path")


const myServer = app.listen(9876)

const wsServer = new WebSocket.Server({
    noServer: true
})

function send(data) {
    const str = JSON.stringify(data) + "\r\n";
    const byteLength = Buffer.byteLength(str, "utf-8");

    lean.stdin.cork();
    lean.stdin.setEncoding('ascii');
    lean.stdin.write(`Content-Length: ${byteLength}\r\n\r\n`);
    lean.stdin.setEncoding('utf-8');
    lean.stdin.write(str);
    lean.stdin.uncork();
}

wsServer.on("connection", function(ws) {    // what should a websocket do on connection
    ws.on("message", function(msg) {        // what to do on message event
        send(JSON.parse(msg.toString("utf8")));
    })
})

myServer.on('upgrade', async function upgrade(request, socket, head) {
    wsServer.handleUpgrade(request, socket, head, function done(ws) {
      wsServer.emit('connection', ws, request);
    });
});

const { spawn } = require('child_process');

const lean = spawn('lean', ['--server']);

var header = ""
var content = ""
var contentLength = null
var headerMode = true

var re = /Content-Length: (\d+)\r\n/i;

function read () {
    if (headerMode) {
        while (chr = lean.stdout.read(1)) {
            chr = chr.toString("ascii")
            header += chr
            if (header.endsWith("\r\n\r\n")) {
                var found = header.match(re);
                contentLength = parseInt(found[1]);
                // console.log(`HEADER: ${header}`);
                // console.log(`LENGTH: ${contentLength}`);
                content = ""
                headerMode = false;
                read();
            }
        }
    } else {
        while (str = lean.stdout.read(Math.min(lean.stdout.readableLength, contentLength))) {
            contentLength -= str.length
            str = str.toString("utf8")
            content += str;
            if (contentLength <= 0) {
                
                wsServer.clients.forEach(function each(client) {
                    if (client.readyState === WebSocket.OPEN) {     // check if client is ready
                        client.send(content);
                    }
                })
                headerMode = true;
                header = "";
                read();
            }
        }
    }
}

lean.stdout.on('readable', () => {
    read();
});

lean.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
});
