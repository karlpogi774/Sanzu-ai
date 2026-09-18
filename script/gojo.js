const fs = require("fs");
const path = require("path");

const ADMIN_ID = "61594055835097";
const TARGET_USER_ID = ""; // Ilagay dito ang Facebook UID na ita-target. Empty = lahat.

const DATA_FILE = path.join(__dirname, "gojo_data.json");
const LOG_FILE = path.join(__dirname, "gojo_error.log");

const DEFAULT_DATA = {
  active: true,
  autoReact: true,
  delay: 2000,
  cooldown: 3000,
  totalReplies: 0,
  totalReceived: 0,
  totalErrors: 0,
  startedAt: Date.now()
};

let data = loadData();

const queue = [];
const seenMessages = new Set();
const userLastReply = new Map();

let queueRunning = false;
let healthRunning = false;

const MAX_QUEUE = 500;
const MAX_SEEN = 3000;
const MAX_RETRIES = 3;

const GOJO_QUOTES = [
  "Nah, I'd win. 😎",
  "Relax. Gojo is here. 🕶️",
  "Don't worry, I've got this. 😏",
  "You're talking to the strongest. 🌀",
  "Limitless mode activated. ♾️",
  "Too easy. 😎",
  "My infinity says no. ♾️",
  "Interesting... very interesting. 👀",
  "You really chose this fight? 😂",
  "Domain Expansion. 🌀",
  "Calm down, I'm still here. 😎",
  "The strongest doesn't need to rush. 🕶️",
  "Infinity remains undefeated. ♾️",
  "You can't touch this. 😏",
  "Gojo detected. 😎"
];

const REPLIES = [
  "😎 " + GOJO_QUOTES[0],
  "🕶️ " + GOJO_QUOTES[1],
  "😏 " + GOJO_QUOTES[2],
  "🌀 " + GOJO_QUOTES[3],
  "♾️ " + GOJO_QUOTES[4],
  "😂 " + GOJO_QUOTES[8],
  "👀 " + GOJO_QUOTES[7],
  "😎 " + GOJO_QUOTES[10],
  "♾️ " + GOJO_QUOTES[12],
  "🌀 " + GOJO_QUOTES[9]
];

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(DEFAULT_DATA, null, 2)
      );
      return { ...DEFAULT_DATA };
    }

    const saved = JSON.parse(
      fs.readFileSync(DATA_FILE, "utf8")
    );

    return {
      ...DEFAULT_DATA,
      ...saved
    };
  } catch (err) {
    logError("loadData", err);
    return { ...DEFAULT_DATA };
  }
}

function saveData() {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(data, null, 2)
    );
  } catch (err) {
    logError("saveData", err);
  }
}

function logError(where, error) {
  try {
    const message =
      `[${new Date().toISOString()}] ${where}: ` +
      `${error?.stack || error}\n`;

    fs.appendFileSync(LOG_FILE, message);
  } catch (_) {}
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomReply() {
  return REPLIES[
    Math.floor(Math.random() * REPLIES.length)
  ];
}

function isAdmin(id) {
  return String(id) === String(ADMIN_ID);
}

function isTargetUser(id) {
  if (!TARGET_USER_ID) return true;
  return String(id) === String(TARGET_USER_ID);
}

function rememberMessage(id) {
  if (!id) return false;

  if (seenMessages.has(id)) {
    return true;
  }

  seenMessages.add(id);

  if (seenMessages.size > MAX_SEEN) {
    const first = seenMessages.values().next().value;
    seenMessages.delete(first);
  }

  return false;
}

async function safeSend(api, message, threadID) {
  if (!api || !threadID) return false;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        api.sendMessage(
          message,
          threadID,
          err => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      return true;
    } catch (err) {
      data.totalErrors++;
      logError(`send attempt ${attempt}`, err);

      if (attempt < MAX_RETRIES) {
        await sleep(1000 * attempt);
      }
    }
  }

  return false;
}

async function safeReact(api, reaction, messageID) {
  if (!api || !messageID) return false;

  try {
    await new Promise((resolve, reject) => {
      api.setMessageReaction(
        reaction,
        messageID,
        err => {
          if (err) reject(err);
          else resolve();
        },
        true
      );
    });

    return true;
  } catch (err) {
    logError("reaction", err);
    return false;
  }
}

function enqueue(item) {
  if (queue.length >= MAX_QUEUE) {
    queue.shift();
  }

  queue.push(item);

  startQueue();
}

async function startQueue() {
  if (queueRunning) return;

  queueRunning = true;

  try {
    while (queue.length > 0) {
      const item = queue.shift();

      if (!item) continue;

      await processQueueItem(item);
      await sleep(Number(data.delay) || 2000);
    }
  } catch (err) {
    logError("queue", err);
  }

  queueRunning = false;

  if (queue.length > 0) {
    setTimeout(startQueue, 100);
  }
}

async function processQueueItem(item) {
  if (!data.active) return;
  if (!isTargetUser(item.senderID)) return;

  const now = Date.now();
  const last = userLastReply.get(item.senderID) || 0;

  if (now - last < Number(data.cooldown)) {
    return;
  }

  userLastReply.set(item.senderID, now);

  if (data.autoReact && item.messageID) {
    await safeReact(
      item.api,
      "😎",
      item.messageID
    );
  }

  const reply = randomReply();

  const sent = await safeSend(
    item.api,
    reply,
    item.threadID
  );

  if (sent) {
    data.totalReplies++;
    saveData();
  }
}

function clearCooldowns() {
  const now = Date.now();

  for (const [id, time] of userLastReply) {
    if (now - time > Number(data.cooldown) * 3) {
      userLastReply.delete(id);
    }
  }
}

function healthCheck() {
  if (healthRunning) return;

  healthRunning = true;

  setInterval(() => {
    try {
      clearCooldowns();

      if (!queueRunning && queue.length > 0) {
        startQueue();
      }

      if (queue.length > MAX_QUEUE) {
        queue.splice(0, queue.length - MAX_QUEUE);
      }

      saveData();
    } catch (err) {
      logError("healthCheck", err);
    }
  }, 30000);
}

healthCheck();

module.exports.config = {
  name: "gojo",
  version: "14.0.0",
  hasPermission: 0,
  credits: "Gojo Infinity Edition",
  description: "Gojo auto reply with render, target, queue and retry",
  usePrefix: true,
  commandCategory: "AI",
  usages: "/gojo help",
  cooldowns: 2
};

module.exports.handleEvent = async function ({
  api,
  event
}) {
  try {
    if (!event) return;

    const {
      threadID,
      senderID,
      messageID,
      body
    } = event;

    if (!threadID || !senderID) return;

    if (String(senderID) === String(api.getCurrentUserID?.())) {
      return;
    }

    if (rememberMessage(messageID)) {
      return;
    }

    if (!isTargetUser(senderID)) {
      return;
    }

    data.totalReceived++;

    if (
      typeof body === "string" &&
      body.trim().startsWith("/")
    ) {
      return;
    }

    enqueue({
      api,
      event,
      threadID,
      senderID,
      messageID,
      body
    });
  } catch (err) {
    data.totalErrors++;
    logError("handleEvent", err);
  }
};

module.exports.run = async function ({
  api,
  event,
  args
}) {
  try {
    const threadID = event.threadID;

    const command = String(args?.[0] || "")
      .toLowerCase();

    if (command === "on") {
      if (!isAdmin(event.senderID)) return;

      data.active = true;
      saveData();

      return safeSend(
        api,
        "😎 Gojo auto-reply: ON",
        threadID
      );
    }

    if (command === "off") {
      if (!isAdmin(event.senderID)) return;

      data.active = false;
      saveData();

      return safeSend(
        api,
        "🛑 Gojo auto-reply: OFF",
        threadID
      );
    }

    if (command === "reacton") {
      if (!isAdmin(event.senderID)) return;

      data.autoReact = true;
      saveData();

      return safeSend(
        api,
        "😎 Auto reaction: ON",
        threadID
      );
    }

    if (command === "reactoff") {
      if (!isAdmin(event.senderID)) return;

      data.autoReact = false;
      saveData();

      return safeSend(
        api,
        "🛑 Auto reaction: OFF",
        threadID
      );
    }

    if (command === "delay") {
      if (!isAdmin(event.senderID)) return;

      const value = Number(args[1]);

      if (!Number.isFinite(value) || value < 0) {
        return safeSend(
          api,
          "Usage: /gojo delay 2000",
          threadID
        );
      }

      data.delay = value;
      saveData();

      return safeSend(
        api,
        `⏱️ Delay set to ${value}ms`,
        threadID
      );
    }

    if (command === "cooldown") {
      if (!isAdmin(event.senderID)) return;

      const value = Number(args[1]);

      if (!Number.isFinite(value) || value < 0) {
        return safeSend(
          api,
          "Usage: /gojo cooldown 3000",
          threadID
        );
      }

      data.cooldown = value;
      saveData();

      return safeSend(
        api,
        `⏳ Cooldown set to ${value}ms`,
        threadID
      );
    }

    if (command === "quote") {
      return safeSend(
        api,
        randomReply(),
        threadID
      );
    }

    if (command === "queue") {
      return safeSend(
        api,
        `📦 Queue: ${queue.length}\n` +
        `Running: ${queueRunning ? "YES" : "NO"}`,
        threadID
      );
    }

    if (command === "stats") {
      return safeSend(
        api,
        `📊 GOJO STATS\n\n` +
        `Active: ${data.active}\n` +
        `Received: ${data.totalReceived}\n` +
        `Replies: ${data.totalReplies}\n` +
        `Errors: ${data.totalErrors}\n` +
        `Queue: ${queue.length}\n` +
        `Target: ${TARGET_USER_ID || "ALL"}`,
        threadID
      );
    }

    if (command === "status") {
      return safeSend(
        api,
        `🕶️ GOJO STATUS\n\n` +
        `Auto Reply: ${data.active ? "ON" : "OFF"}\n` +
        `Reaction: ${data.autoReact ? "ON" : "OFF"}\n` +
        `Delay: ${data.delay}ms\n` +
        `Cooldown: ${data.cooldown}ms\n` +
        `Queue: ${queue.length}\n` +
        `Target: ${TARGET_USER_ID || "ALL"}`,
        threadID
      );
    }

    if (command === "clearqueue") {
      if (!isAdmin(event.senderID)) return;

      queue.length = 0;

      return safeSend(
        api,
        "🧹 Gojo queue cleared.",
        threadID
      );
    }

    if (command === "resetstats") {
      if (!isAdmin(event.senderID)) return;

      data.totalReplies = 0;
      data.totalReceived = 0;
      data.totalErrors = 0;

      saveData();

      return safeSend(
        api,
        "♻️ Gojo statistics reset.",
        threadID
      );
    }

    if (command === "help") {
      return safeSend(
        api,
        `🕶️ GOJO COMMANDS\n\n` +
        `/gojo on\n` +
        `/gojo off\n` +
        `/gojo reacton\n` +
        `/gojo reactoff\n` +
        `/gojo delay 2000\n` +
        `/gojo cooldown 3000\n` +
        `/gojo quote\n` +
        `/gojo status\n` +
        `/gojo stats\n` +
        `/gojo queue\n` +
        `/gojo clearqueue\n` +
        `/gojo resetstats`,
        threadID
      );
    }

    return safeSend(
      api,
      "🕶️ Use /gojo help",
      threadID
    );
  } catch (err) {
    logError("run", err);
  }
};

/*
==================================================
RENDER
==================================================
*/

module.exports.render = async function ({
  api,
  event,
  args
}) {
  try {
    const threadID = event?.threadID;

    const target =
      TARGET_USER_ID || "ALL USERS";

    const output =
      `🕶️ GOJO RENDER\n\n` +
      `Status: ${data.active ? "ON" : "OFF"}\n` +
      `Reaction: ${data.autoReact ? "ON" : "OFF"}\n` +
      `Delay: ${data.delay}ms\n` +
      `Cooldown: ${data.cooldown}ms\n` +
      `Queue: ${queue.length}\n` +
      `Replies: ${data.totalReplies}\n` +
      `Received: ${data.totalReceived}\n` +
      `Errors: ${data.totalErrors}\n` +
      `Target: ${target}`;

    if (api && threadID) {
      return safeSend(
        api,
        output,
        threadID
      );
    }

    return output;
  } catch (err) {
    logError("render", err);
    return null;
  }
};

process.on("unhandledRejection", err => {
  logError("unhandledRejection", err);
});

process.on("uncaughtException", err => {
  logError("uncaughtException", err);
});
