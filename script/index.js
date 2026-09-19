// ======================================================
// STABLE FB BOT | ws3-fca
// Rate Limit + Cooldown + Error Handling + Reconnect
// Render Health Server
// ======================================================

const fs = require("fs");
const path = require("path");
const express = require("express");
const login = require("ws3-fca");

// ------------------------------------------------------
// CONFIG
// ------------------------------------------------------

const PORT = process.env.PORT || 3000;
const APPSTATE_PATH = path.join(__dirname, "appstate.json");

const RECONNECT_DELAY = 10000;
const MESSAGE_COOLDOWN = 2500;
const MAX_COMMANDS_PER_MINUTE = 25;

// ------------------------------------------------------
// STATE
// ------------------------------------------------------

let api = null;
let reconnecting = false;
let lastMessageTime = 0;

const commandCounter = new Map();

// ------------------------------------------------------
// RENDER HEALTH SERVER
// ------------------------------------------------------

const app = express();

app.get("/", (req, res) => {
  res.status(200).send("FB BOT ONLINE");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "online",
    facebook: api ? "connected" : "disconnected",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[RENDER] Health server running on port ${PORT}`);
});

// ------------------------------------------------------
// LOAD COMMANDS
// ------------------------------------------------------

const commands = new Map();
const commandsPath = path.join(__dirname, "commands");

function loadCommands() {
  if (!fs.existsSync(commandsPath)) {
    console.log("[COMMANDS] commands folder not found.");
    return;
  }

  const files = fs
    .readdirSync(commandsPath)
    .filter(file => file.endsWith(".js"));

  for (const file of files) {
    try {
      const command = require(path.join(commandsPath, file));

      if (!command.config || !command.run) {
        console.log(`[COMMANDS] Skipped ${file}`);
        continue;
      }

      const name = String(command.config.name).toLowerCase();

      commands.set(name, command);

      console.log(`[COMMANDS] Loaded: ${name}`);
    } catch (error) {
      console.error(`[COMMANDS] Failed: ${file}`);
      console.error(error);
    }
  }
}

loadCommands();

// ------------------------------------------------------
// COMMAND RATE LIMIT
// ------------------------------------------------------

function canRunCommand(senderID) {
  const now = Date.now();
  const key = String(senderID);

  let info = commandCounter.get(key);

  if (!info || now - info.time >= 60000) {
    info = {
      time: now,
      count: 0
    };
  }

  if (info.count >= MAX_COMMANDS_PER_MINUTE) {
    commandCounter.set(key, info);
    return false;
  }

  info.count++;
  commandCounter.set(key, info);

  return true;
}

// ------------------------------------------------------
// MESSAGE HANDLER
// ------------------------------------------------------

async function handleMessage(event) {
  if (!event || !event.body) return;

  const now = Date.now();

  // Global message cooldown
  if (now - lastMessageTime < MESSAGE_COOLDOWN) {
    return;
  }

  lastMessageTime = now;

  const body = String(event.body).trim();

  if (!body) return;

  // Prefixless commands:
  // Example:
  // gojo help
  // lockgc status
  // titan on
  // void status

  const parts = body.split(/\s+/);

  const commandName = String(parts.shift() || "").toLowerCase();
  const args = parts;

  const command = commands.get(commandName);

  if (command) {
    if (!canRunCommand(event.senderID)) {
      console.log(
        `[RATE LIMIT] ${event.senderID} reached command limit`
      );

      return;
    }

    try {
      await command.run({
        api,
        event,
        args
      });
    } catch (error) {
      console.error(
        `[COMMAND ERROR] ${commandName}`
      );

      console.error(error);
    }

    return;
  }

  // ----------------------------------------------------
  // OPTIONAL EVENT HANDLERS
  // ----------------------------------------------------

  for (const [name, commandModule] of commands) {
    if (
      typeof commandModule.handleEvent === "function"
    ) {
      try {
        await commandModule.handleEvent({
          api,
          event
        });
      } catch (error) {
        console.error(
          `[EVENT ERROR] ${name}`
        );

        console.error(error);
      }
    }
  }
}

// ------------------------------------------------------
// LISTENER
// ------------------------------------------------------

function startListener() {
  if (!api) return;

  console.log("[BOT] Starting message listener...");

  try {
    api.listenMqtt(
      async (error, event) => {
        if (error) {
          console.error("[MQTT ERROR]", error);

          scheduleReconnect();
          return;
        }

        try {
          await handleMessage(event);
        } catch (error) {
          console.error("[MESSAGE ERROR]", error);
        }
      }
    );
  } catch (error) {
    console.error("[LISTENER ERROR]", error);
    scheduleReconnect();
  }
}

// ------------------------------------------------------
// RECONNECT
// ------------------------------------------------------

function scheduleReconnect() {
  if (reconnecting) return;

  reconnecting = true;

  console.log(
    `[RECONNECT] Retrying in ${RECONNECT_DELAY / 1000}s...`
  );

  setTimeout(() => {
    reconnecting = false;

    console.log("[RECONNECT] Restarting listener...");

    startListener();
  }, RECONNECT_DELAY);
}

// ------------------------------------------------------
// LOGIN
// ------------------------------------------------------

function startBot() {
  if (!fs.existsSync(APPSTATE_PATH)) {
    console.error(
      "[LOGIN] appstate.json was not found."
    );

    console.error(
      "[LOGIN] Put your existing valid appstate.json in the project."
    );

    return;
  }

  let appState;

  try {
    appState = JSON.parse(
      fs.readFileSync(APPSTATE_PATH, "utf8")
    );
  } catch (error) {
    console.error(
      "[LOGIN] Invalid appstate.json"
    );

    console.error(error);

    return;
  }

  console.log("[LOGIN] Connecting...");

  login(
    {
      appState
    },
    (error, loggedApi) => {
      if (error) {
        console.error("[LOGIN ERROR]", error);

        // Do not repeatedly login immediately.
        setTimeout(() => {
          startBot();
        }, RECONNECT_DELAY);

        return;
      }

      api = loggedApi;

      console.log(
        "[LOGIN] Facebook bot connected."
      );

      startListener();
    }
  );
}

// ------------------------------------------------------
// PROCESS ERROR HANDLING
// ------------------------------------------------------

process.on("uncaughtException", error => {
  console.error("[UNCAUGHT EXCEPTION]");
  console.error(error);
});

process.on("unhandledRejection", error => {
  console.error("[UNHANDLED REJECTION]");
  console.error(error);
});

// ------------------------------------------------------
// START
// ------------------------------------------------------

startBot();
