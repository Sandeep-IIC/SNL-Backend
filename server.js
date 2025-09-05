const express = require("express");
const port = 5000;
const http = require('http');
const WebSocket = require("ws");
const redisClient = require("./redis-connection");
const app = express();

app.get("/", (req, res) => {
  res.send("Hello World! asdfasf");
});

const server = http.createServer(app);
const webSocketServer = new WebSocket.Server({ server });

webSocketServer.on("connection", (ws) => {
  console.log("Client connected");
  webSocketServer.on("message", (message) => {
    console.log(`Received: ${message}`);
    webSocketServer.send(`Echo: ${message}`)
  });
  webSocketServer.on("close", () => console.log("Client disconnected"));
});

server.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
