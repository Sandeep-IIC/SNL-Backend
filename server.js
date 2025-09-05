const express = require("express");
const port = 5000;
const app = express();
const redisClient = require("./redis-connection");

app.get("/", (req, res) => {
  res.send("Hello World! asdfasf");
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
