const redis = require("redis");

const redisClient = redis.createClient({
  socket: {
    host: "redis-19914.c44.us-east-1-2.ec2.redns.redis-cloud.com",
    port: 19914,
  },
  password: "b67cwImtHBVjJ07RpShvnHH8vMtdxdrF",
});

redisClient.on("connect", () => {
  console.log("Connecting to Redis...");
});

redisClient.on("error", (err) => {
  console.error("Error connecting to Redis:", err);
});

(async () => {
  await redisClient.connect();
})();
