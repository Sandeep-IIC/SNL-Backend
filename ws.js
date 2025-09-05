const WebSocket = require("ws");
const webSocketServer = new WebSocket.Server({ port: 8080 });

webSocketServer.on("connection", (ws) => {
  console.log("Client connected");
  webSocketServer.on("message", (message) => {
    console.log(`Received: ${message}`);
    webSocketServer.send(`Echo: ${message}`);
  });
  webSocketServer.on("close", () => console.log("Client disconnected"));
});

server.listen(3000, () => console.log("Server listening on port 3000"));

console.log("WebSocket server started on port 8080");
