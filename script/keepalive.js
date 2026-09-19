const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.status(200).send("GOJO • LOCKGC • TITAN • VOID ONLINE");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "online",
    commands: [
      "gojo",
      "lockgc",
      "titan",
      "void"
    ],
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `[KEEPALIVE] GOJO • LOCKGC • TITAN • VOID | PORT ${PORT}`
  );
});

process.on("uncaughtException", (error) => {
  console.error("[BOT ERROR]", error);
});

process.on("unhandledRejection", (error) => {
  console.error("[PROMISE ERROR]", error);
});
