const express = require("express");
const port = 5000;
const http = require("http");
const WebSocket = require("ws");
const redisClient = require("./redis-connection");
const app = express();
const { Events, ReturnEvents } = require("./constants");

app.get("/", (req, res) => {
  res.send("Hello World! asdfasf");
});

const server = http.createServer(app);
const webSocketServer = new WebSocket.Server({ server });

webSocketServer.on("connection", async (ws, req) => {
  ws.on("message", async (message) => {
    let data = JSON.parse(message);

    if (data.event === Events.DICE_NUMBER) {
      const userId = data.payload.userId;
      webSocketServer.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              event: Events.DICE_NUMBER,
              payload: { userId: userId, number: data.payload.number },
            })
          );
        }
      });
    }

    if (data.event === Events.SET_POSITION) {
      const userId = data.payload.userId;
      const roomId = data.payload.userId;
      await redisClient.set(
        userId.toString(),
        data.payload.position.toString()
      );
      webSocketServer.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              event: Events.SET_POSITION,
              payload: { position: data.payload.position, userId: userId },
            })
          );
        }
      });
    }

    if (data.event === Events.GET_POSITION) {
      const userId = data.payload.userId;
      await redisClient.get(userId).then((res) => {
        ws.send(res);
      });
    }

    if (data.event === Events.CREATE_ROOM) {
      const roomId = data.payload.roomId;
      await redisClient.sAdd("rooms", roomId);
      ws.send(
        JSON.stringify({
          event: ReturnEvents.ROOM_CREATED,
          payload: { roomId },
        })
      );
    }

    if (data.event === Events.JOIN_ROOM) {
      console.log("Join Room", data);
      const roomId = data.payload.roomId;
      const userId = data.payload.userId;
      await redisClient.sMembers(`room-${roomId}-users`).then(async (res) => {
        if (res.length === 4) {
          ws.send(
            JSON.stringify({
              event: ReturnEvents.ROOM_FULL,
              payload: { roomId },
            })
          );
          return;
        } else {
          await redisClient.sAdd(`room-${roomId}-users`, userId);
          ws.send(
            JSON.stringify({
              event: ReturnEvents.ROOM_JOINED,
              payload: { roomId },
            })
          );
        }
      });
    }

    if (data.event === Events.GET_ROOMS_USERS) {
      const roomId = data.payload.roomId;
      await redisClient.sMembers(`room-${roomId}-users`).then((res) => {
        ws.send(
          JSON.stringify({
            event: ReturnEvents.ROOMS_USERS,
            payload: { users: res },
          })
        );
      });
    }

    if (data.event === Events.GET_ROOM) {
      await redisClient.sMembers("rooms").then(async (res) => {
        const roomUserMapEntries = await Promise.all(
          res.map(async (roomId) => {
            const users = await redisClient.sMembers(`room-${roomId}-users`);
            return [roomId, users];
          })
        );

        const roomUserMap = new Map(roomUserMapEntries);

        const rooms = res.map((roomId) => {
          return {
            roomId,
            users: roomUserMap.get(roomId) || [],
          };
        });

        ws.send(
          JSON.stringify({
            event: ReturnEvents.ROOMS,
            payload: { rooms },
          })
        );
      });
    }

    if (data.event === Events.GET_ROOM_USER_POSITION) {
      const roomId = data.payload.roomId;
      await redisClient.sMembers(`room-${roomId}-users`).then(async (res) => {
        const roomUserPositionMapEntries = await Promise.all(
          res.map(async (userId) => {
            const userPosition = await redisClient.get(userId);
            return [userId, userPosition];
          })
        );

        const roomUserPositionMap = new Map(roomUserPositionMapEntries);

        const positions = res.map((userId) => {
          return {
            userId,
            position: roomUserPositionMap.get(userId) || [],
          };
        });
        ws.send(
          JSON.stringify({
            event: ReturnEvents.GET_USER_CHANCE,
            payload: { positions },
          })
        );
      });
    }
  });

  const url = new URL(req.url, `http://${req.headers.host}`);
  const userId = url.searchParams.get("userId");

  console.log("User connected:", userId);
  await redisClient.sAdd("onlineUsers", userId);
  const onlineUsers = await redisClient.sMembers("onlineUsers");

  ws.on("close", async () => {
    console.log("User disconnected:", userId);
    await redisClient.sRem("onlineUsers", userId);
  });
});

server.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
