const express = require("express");
const port = 5000;
const http = require("http");
const WebSocket = require("ws");
const redisClient = require("./redis-connection");
const app = express();

app.get("/", (req, res) => {
  res.send("Hello World! asdfasf");
});

const server = http.createServer(app);
const webSocketServer = new WebSocket.Server({ server });

webSocketServer.on("connection", async (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const userId = url.searchParams.get("userId");

  console.log("User connected:", userId);
  await redisClient.sAdd("onlineUsers", userId);
  const onlineUsers = await redisClient.sMembers("onlineUsers");

  ws.on("message", (message) => {
    console.log(`Received from ${userId}: ${message}`);
    ws.send(`Echo: ${message}`);
  });

  ws.on("close", async () => {
    console.log("User disconnected:", userId);
    await redisClient.sRem("onlineUsers", userId);
  });
});

server.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
