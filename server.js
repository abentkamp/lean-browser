const WebSocket = require("ws");
const express = require("express");
const app = express()
const path = require("path")
const fs = require("fs");
const { spawn } = require('child_process');


const PORT = process.env.PORT || 8080;

const server = app
  .use(express.static('./build'))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new WebSocket.Server({ server })

let leanCmd = "./lean";
if (!fs.existsSync(leanCmd)) {
    leanCmd = "lean"
}

class ClientConnection {

    header = ""
    content = ""
    contentLength = null
    headerMode = true

    re = /Content-Length: (\d+)\r\n/i;

    constructor(ws){
        console.log("Socket opened.")
        this.ws = ws    
        this.ws.on("message", (msg) => {
            this.send(JSON.parse(msg.toString("utf8")));
        })

        this.ws.on("close", () => {
            this.lean.kill();
            console.log("Socket closed.")
        })

        this.lean = spawn(leanCmd, ['--server']);

        this.lean.stdout.on('readable', () => {
            this.read();
        });

        this.lean.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });
    }

    read () {
        if (this.headerMode) {
            let chr;
            while (chr = this.lean.stdout.read(1)) {
                chr = chr.toString("ascii")
                this.header += chr
                if (this.header.endsWith("\r\n\r\n")) {
                    var found = this.header.match(this.re);
                    this.contentLength = parseInt(found[1]);
                    // console.log(`HEADER: ${header}`);
                    // console.log(`LENGTH: ${contentLength}`);
                    this.content = ""
                    this.headerMode = false;
                    this.read();
                }
            }
        } else {
            let str;
            while (str = this.lean.stdout.read(Math.min(this.lean.stdout.readableLength, this.contentLength))) {
                this.contentLength -= str.length
                str = str.toString("utf8")
                this.content += str;
                if (this.contentLength <= 0) {
                    
                    if (this.ws.readyState === WebSocket.OPEN) {     // check if client is ready
                        this.ws.send(this.content);
                    }
                    this.headerMode = true;
                    this.header = "";
                    this.read();
                }
            }
        }
    }

    send(data) {
        const str = JSON.stringify(data) + "\r\n";
        const byteLength = Buffer.byteLength(str, "utf-8");
    
        this.lean.stdin.cork();
        this.lean.stdin.setEncoding('ascii');
        this.lean.stdin.write(`Content-Length: ${byteLength}\r\n\r\n`);
        this.lean.stdin.setEncoding('utf-8');
        this.lean.stdin.write(str);
        this.lean.stdin.uncork();
    }
}

wss.on("connection", function(ws) {    // what should a websocket do on connection
    new ClientConnection(ws)
})

// server.on('upgrade', async function upgrade(request, socket, head) {
//     wss.handleUpgrade(request, socket, head, function done(ws) {
//         wss.emit('connection', ws, request);
//     });
// });




