const fs = require("fs");
const path = require("path");

// ======================================================
// GOJO BOT V15 | INFINITE + SELF RECOVERY
// ======================================================

const ADMIN_ID = "61594055835097";
const TARGET_USER_ID = ""; // Empty = lahat. Ilagay ang UID kung isang tao lang.

const DATA_FILE = path.join(__dirname, "gojo_data.json");
const LOG_FILE = path.join(__dirname, "gojo_error.log");

const MAX_QUEUE = 500;
const MAX_SEEN = 3000;
const MAX_RETRIES = 3;
const WORKER_CHECK = 5000;

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

let workerRunning = false;
let workerTimer = null;

// ======================================================
// DATA
// ======================================================

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(DEFAULT_DATA, null, 2)
      );

      return { ...DEFAULT_DATA };
    }

    return {
      ...DEFAULT_DATA,
      ...JSON.parse(
        fs.readFileSync(DATA_FILE, "utf8")
      )
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

// ======================================================
// ERROR LOG
// ======================================================

function logError(where, error) {
  try {
    fs.appendFileSync(
      LOG_FILE,
      `[${new Date().toISOString()}] ${where}: ${
        error?.stack || error
      }\n`
    );
  } catch (_) {}
}

// ======================================================
// UTILITIES
// ======================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isAdmin(id) {
  return String(id) === String(ADMIN_ID);
}

function isTargetUser(id) {
  if (!TARGET_USER_ID) return true;

  return String(id) === String(TARGET_USER_ID);
}

function randomReply() {
  const replies = [
    "😎 Nah, I'd win.",
    "🕶️ Relax, Gojo is here.",
    "♾️ Infinity activated.",
    "🌀 Domain Expansion.",
    "😏 Too easy.",
    "👀 Interesting...",
    "♾️ You can't touch this.",
    "😎 The strongest is here.",
    "🕶️ Calm down.",
    "🌀 Limitless mode."
  ];

  return replies[
    Math.floor(Math.random() * replies.length)
  ];
}

// ======================================================
// DUPLICATE PROTECTION
// ======================================================

function rememberMessage(messageID) {
  if (!messageID) return false;

  if (seenMessages.has(messageID)) {
    return true;
  }

  seenMessages.add(messageID);

  if (seenMessages.size > MAX_SEEN) {
    const first =
      seenMessages.values().next().value;

    seenMessages.delete(first);
  }

  return false;
}

// ======================================================
// SAFE SEND
// ======================================================

async function safeSend(api, message, threadID) {
  if (!api || !threadID) return false;

  for (
    let attempt = 1;
    attempt <= MAX_RETRIES;
    attempt++
  ) {
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
      logError(
        `send-attempt-${attempt}`,
        err
      );

      if (attempt < MAX_RETRIES) {
        await sleep(attempt * 1000);
      }
    }
  }

  return false;
}

// ======================================================
// SAFE REACTION
// ======================================================

async function safeReact(api, messageID) {
  if (!api || !messageID) return false;

  try {
    await new Promise((resolve, reject) => {
      api.setMessageReaction(
        "😎",
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

// ======================================================
// QUEUE
// ======================================================

function enqueue(item) {
  if (queue.length >= MAX_QUEUE) {
    queue.shift();
  }

  queue.push(item);
}

async function processQueueItem(item) {
  if (!item) return;
  if (!data.active) return;
  if (!isTargetUser(item.senderID)) return;

  const now = Date.now();

  const last =
    userLastReply.get(item.senderID) || 0;

  if (
    now - last <
    Number(data.cooldown)
  ) {
    return;
  }

  userLastReply.set(
    item.senderID,
    now
  );

  if (
    data.autoReact &&
    item.messageID
  ) {
    await safeReact(
      item.api,
      item.messageID
    );
  }

  const sent = await safeSend(
    item.api,
    randomReply(),
    item.threadID
  );

  if (sent) {
    data.totalReplies++;
    saveData();
  }
}

// ======================================================
// INFINITE WORKER
// ======================================================

async function infiniteWorker() {
  if (workerRunning) return;

  workerRunning = true;

  while (true) {
    try {
      if (!data.active) {
        await sleep(WORKER_CHECK);
        continue;
      }

      if (queue.length === 0) {
        await sleep(WORKER_CHECK);
        continue;
      }

      const item = queue.shift();

      if (!item) {
        await sleep(1000);
        continue;
      }

      try {
        await processQueueItem(item);
      } catch (err) {
        data.totalErrors++;
        logError(
          "queue-item",
          err
        );
      }

      await sleep(
        Math.max(
          500,
          Number(data.delay) || 2000
        )
      );

    } catch (err) {
      data.totalErrors++;

      logError(
        "infinite-worker",
        err
      );

      await sleep(3000);
    }
  }
}

// ======================================================
// WORKER RECOVERY
// ======================================================

function startInfiniteWorker() {
  if (workerTimer) return;

  workerTimer = setInterval(() => {
    try {
      if (!workerRunning) {
        infiniteWorker().catch(err => {
          logError(
            "worker-recovery",
            err
          );

          workerRunning = false;
        });
      }
    } catch (err) {
      logError(
        "worker-check",
        err
      );
    }
  }, WORKER_CHECK);

  infiniteWorker().catch(err => {
    logError(
      "worker-start",
      err
    );

    workerRunning = false;
  });
}

// ======================================================
// COOLDOWN CLEANUP
// ======================================================

function clearCooldowns() {
  const now = Date.now();
  const timeout =
    Number(data.cooldown) * 3;

  for (const [id, time] of userLastReply) {
    if (now - time > timeout) {
      userLastReply.delete(id);
    }
  }
}

// ======================================================
// CONFIG
// ======================================================

module.exports.config = {
  name: "gojo",
  version: "15.0.0",
  hasPermission: 0,
  credits: "Gojo Infinity Edition",
  description:
    "Infinite Gojo auto-reply with queue and recovery",
  usePrefix: true,
  commandCategory: "AI",
  usages: "/gojo help",
  cooldowns: 2
};

// ======================================================
// EVENT
// ======================================================

module.exports.handleEvent =
async function ({ api, event }) {
  try {
    if (!event) return;

    const {
      threadID,
      senderID,
      messageID,
      body
    } = event;

    if (!threadID || !senderID) {
      return;
    }

    if (
      api.getCurrentUserID &&
      String(senderID) ===
      String(api.getCurrentUserID())
    ) {
      return;
    }

    if (rememberMessage(messageID)) {
      return;
    }

    if (!isTargetUser(senderID)) {
      return;
    }

    if (
      typeof body === "string" &&
      body.trim().startsWith("/")
    ) {
      return;
    }

    data.totalReceived++;

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
    logError(
      "handleEvent",
      err
    );
  }
};

// ======================================================
// COMMAND
// ======================================================

module.exports.run =
async function ({ api, event, args }) {
  try {
    const threadID = event.threadID;

    const command =
      String(args?.[0] || "")
      .toLowerCase();

    if (command === "on") {
      if (!isAdmin(event.senderID)) return;

      data.active = true;
      saveData();

      return safeSend(
        api,
        "😎 GOJO AUTO-REPLY: ON",
        threadID
      );
    }

    if (command === "off") {
      if (!isAdmin(event.senderID)) return;

      data.active = false;
      saveData();

      return safeSend(
        api,
        "🛑 GOJO AUTO-REPLY: OFF",
        threadID
      );
    }

    if (command === "reacton") {
      if (!isAdmin(event.senderID)) return;

      data.autoReact = true;
      saveData();

      return safeSend(
        api,
        "😎 AUTO REACT: ON",
        threadID
      );
    }

    if (command === "reactoff") {
      if (!isAdmin(event.senderID)) return;

      data.autoReact = false;
      saveData();

      return safeSend(
        api,
        "🛑 AUTO REACT: OFF",
        threadID
      );
    }

    if (command === "delay") {
      if (!isAdmin(event.senderID)) return;

      const value =
        Number(args[1]);

      if (
        !Number.isFinite(value) ||
        value < 500
      ) {
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
        `⏱️ Delay: ${value}ms`,
        threadID
      );
    }

    if (command === "cooldown") {
      if (!isAdmin(event.senderID)) return;

      const value =
        Number(args[1]);

      if (
        !Number.isFinite(value) ||
        value < 1000
      ) {
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
        `⏳ Cooldown: ${value}ms`,
        threadID
      );
    }

    if (command === "status") {
      return safeSend(
        api,
        `🕶️ GOJO STATUS

Admin: ${ADMIN_ID}
Active: ${data.active ? "ON" : "OFF"}
Auto React: ${data.autoReact ? "ON" : "OFF"}
Delay: ${data.delay}ms
Cooldown: ${data.cooldown}ms
Queue: ${queue.length}
Worker: ${workerRunning ? "RUNNING" : "RECOVERING"}
Target: ${TARGET_USER_ID || "ALL"}`,
        threadID
      );
    }

    if (command === "stats") {
      return safeSend(
        api,
        `📊 GOJO STATS

Received: ${data.totalReceived}
Replies: ${data.totalReplies}
Errors: ${data.totalErrors}
Queue: ${queue.length}
Worker: ${workerRunning ? "ON" : "RECOVERING"}`,
        threadID
      );
    }

    if (command === "queue") {
      return safeSend(
        api,
        `📦 Queue: ${queue.length}
Worker: ${workerRunning ? "RUNNING" : "RECOVERING"}`,
        threadID
      );
    }

    if (command === "clearqueue") {
      if (!isAdmin(event.senderID)) return;

      queue.length = 0;

      return safeSend(
        api,
        "🧹 Queue cleared.",
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
        "♻️ Statistics reset.",
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

    return safeSend(
      api,
      `🕶️ GOJO COMMANDS

/gojo on
/gojo off
/gojo reacton
/gojo reactoff
/gojo delay 2000
/gojo cooldown 3000
/gojo status
/gojo stats
/gojo queue
/gojo quote
/gojo clearqueue
/gojo resetstats`,
      threadID
    );

  } catch (err) {
    logError("run", err);
  }
};

// ======================================================
// RENDER
// ======================================================

module.exports.render =
async function ({ api, event }) {
  try {
    const threadID =
      event?.threadID;

    const output =
      `🕶️ GOJO RENDER

Admin: ${ADMIN_ID}
Status: ${data.active ? "ON" : "OFF"}
Reaction: ${data.autoReact ? "ON" : "OFF"}
Queue: ${queue.length}
Worker: ${workerRunning ? "RUNNING" : "RECOVERING"}
Replies: ${data.totalReplies}
Received: ${data.totalReceived}
Errors: ${data.totalErrors}
Target: ${TARGET_USER_ID || "ALL"}`;

    if (api && threadID) {
      return safeSend(
        api,
        output,
        threadID
      );
    }

    return output;

  } catch (err) {
    logError(
      "render",
      err
    );
  }
};

// ======================================================
// AUTO RECOVERY
// ======================================================

setInterval(() => {
  try {
    if (!workerRunning) {
      infiniteWorker().catch(err => {
        logError(
          "auto-recovery",
          err
        );

        workerRunning = false;
      });
    }

    if (queue.length > MAX_QUEUE) {
      queue.splice(
        0,
        queue.length - MAX_QUEUE
      );
    }

    clearCooldowns();
    saveData();

  } catch (err) {
    logError(
      "recovery-loop",
      err
    );
  }
}, 30000);

// ======================================================
// START
// ======================================================

startInfiniteWorker();

// ======================================================
// PROCESS ERROR PROTECTION
// ======================================================

process.on(
  "unhandledRejection",
  err => {
    logError(
      "unhandledRejection",
      err
    );
  }
);

process.on(
  "uncaughtException",
  err => {
    logError(
      "uncaughtException",
      err
    );

    // Hindi agad pinapatay ang process.
    // Ang worker ay may sariling recovery.
  }
);
