// ============================================================
// GOJO BOT V17 | MAKUNAT EDITION
// Per-GC ON/OFF | Queue Guard | Retry | Cooldown | Auto React
// ============================================================

"use strict";

const fs = require("fs");
const path = require("path");

// ============================================================
// CONFIG
// ============================================================

const ADMIN_ID = "61594055835097";
const TARGET_USER_ID = ""; // Empty = all users

const DATA_FILE = path.join(__dirname, "gojo_data.json");
const TEMP_FILE = DATA_FILE + ".tmp";

const DEFAULT_DELAY = 2000;
const DEFAULT_COOLDOWN = 5000;

const MIN_DELAY = 500;
const MAX_DELAY = 60000;

const MIN_COOLDOWN = 1000;
const MAX_COOLDOWN = 120000;

const MAX_QUEUE = 100;
const MAX_SEEN = 2000;
const MAX_COOLDOWN_ENTRIES = 3000;

const MAX_RETRIES = 2;
const SEND_TIMEOUT = 20000;

// ============================================================
// DEFAULT DATA
// ============================================================

const DEFAULT_DATA = {
  activeThreads: {},
  autoReact: true,
  delay: DEFAULT_DELAY,
  cooldown: DEFAULT_COOLDOWN,
  totalReplies: 0,
  totalReceived: 0,
  totalErrors: 0,
  totalRetries: 0,
  startedAt: Date.now(),
  lastReplyAt: 0
};

// ============================================================
// DATA LOAD / SAVE
// ============================================================

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
      ...saved,
      activeThreads:
        saved.activeThreads &&
        typeof saved.activeThreads === "object"
          ? saved.activeThreads
          : {}
    };
  } catch (err) {
    console.error("[GOJO] Load error:", err);
    return { ...DEFAULT_DATA };
  }
}

let data = loadData();

let saveRunning = false;
let savePending = false;

function saveData() {
  if (saveRunning) {
    savePending = true;
    return;
  }

  saveRunning = true;

  try {
    fs.writeFileSync(
      TEMP_FILE,
      JSON.stringify(data, null, 2)
    );

    fs.renameSync(TEMP_FILE, DATA_FILE);
  } catch (err) {
    console.error("[GOJO] Save error:", err);
  } finally {
    saveRunning = false;

    if (savePending) {
      savePending = false;
      saveData();
    }
  }
}

// ============================================================
// PER-GC STATUS
// ============================================================

function isThreadActive(threadID) {
  return data.activeThreads[String(threadID)] === true;
}

function setThreadActive(threadID, enabled) {
  data.activeThreads[String(threadID)] = Boolean(enabled);
  saveData();
}

// ============================================================
// RUNTIME STATE
// ============================================================

const queue = [];
const seenMessages = new Set();
const lastReplyByUser = new Map();

let queueRunning = false;
let shuttingDown = false;

const stats = {
  received: 0,
  replied: 0,
  failed: 0,
  reactions: 0,
  errors: 0,
  retries: 0,
  queuePeak: 0
};

// ============================================================
// REPLIES
// ============================================================

const REPLIES = [
  "😎 Nah, I'd win.",
  "🕶️ Relax. Gojo is here.",
  "😏 You're talking to the strongest.",
  "♾️ Limitless mode activated.",
  "🌀 Domain Expansion.",
  "😂 Nice try.",
  "👀 I saw that.",
  "😎 Infinity is working.",
  "♾️ You cannot bypass Infinity.",
  "🕶️ The strongest has arrived.",
  "😏 Easy.",
  "🌀 Unlimited Void.",
  "😎 Still here.",
  "♾️ Limitless.",
  "🕶️ Gojo online.",
  "😎 Infinity remains undefeated.",
  "👀 Interesting...",
  "🌀 Unlimited power.",
  "😂 You really tried that?",
  "♾️ Gojo detected."
];

function randomReply() {
  return REPLIES[
    Math.floor(Math.random() * REPLIES.length)
  ];
}

// ============================================================
// HELPERS
// ============================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function clamp(value, min, max, fallback) {
  const n = Number(value);

  if (!Number.isFinite(n)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, n));
}

function isAdmin(userID) {
  return String(userID) === String(ADMIN_ID);
}

function isTargetUser(userID) {
  return !TARGET_USER_ID ||
    String(userID) === String(TARGET_USER_ID);
}

function cooldownKey(threadID, senderID) {
  return `${String(threadID)}:${String(senderID)}`;
}

function rememberMessage(messageID) {
  if (!messageID) return false;

  const id = String(messageID);

  if (seenMessages.has(id)) return true;

  seenMessages.add(id);

  if (seenMessages.size > MAX_SEEN) {
    const oldest = seenMessages.values().next().value;
    if (oldest) seenMessages.delete(oldest);
  }

  return false;
}

function clearOldCooldowns() {
  const now = Date.now();
  const duration = Math.max(
    Number(data.cooldown) || DEFAULT_COOLDOWN,
    DEFAULT_COOLDOWN
  );

  for (const [key, timestamp] of lastReplyByUser) {
    if (now - timestamp > duration * 3) {
      lastReplyByUser.delete(key);
    }
  }

  while (lastReplyByUser.size > MAX_COOLDOWN_ENTRIES) {
    const oldest = lastReplyByUser.keys().next().value;
    if (!oldest) break;
    lastReplyByUser.delete(oldest);
  }
}

// ============================================================
// SAFE SEND WITH LIMITED RETRIES
// ============================================================

async function sendOnce(api, message, threadID) {
  if (!api || !threadID || !message) return false;

  return new Promise(resolve => {
    let settled = false;

    const finish = result => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve(result);
    };

    const timeout = setTimeout(() => {
      finish(false);
    }, SEND_TIMEOUT);

    try {
      api.sendMessage(message, threadID, err => {
        finish(!err);
      });
    } catch (err) {
      console.error("[GOJO] sendMessage exception:", err);
      finish(false);
    }
  });
}

async function safeSend(api, message, threadID) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const sent = await sendOnce(api, message, threadID);

    if (sent) return true;

    data.totalErrors++;
    stats.errors++;

    if (attempt < MAX_RETRIES) {
      data.totalRetries++;
      stats.retries++;

      // Exponential backoff: 1s, then 2s.
      await sleep(1000 * Math.pow(2, attempt));
    }
  }

  stats.failed++;
  saveData();
  return false;
}

// ============================================================
// SAFE REACTION
// ============================================================

async function safeReact(api, messageID) {
  if (
    !data.autoReact ||
    !api ||
    !messageID ||
    typeof api.setMessageReaction !== "function"
  ) {
    return false;
  }

  return new Promise(resolve => {
    let settled = false;

    const finish = result => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve(result);
    };

    const timeout = setTimeout(() => finish(false), 10000);

    try {
      api.setMessageReaction(
        "😎",
        messageID,
        err => {
          if (!err) stats.reactions++;
          finish(!err);
        },
        true
      );
    } catch (err) {
      console.error("[GOJO] Reaction error:", err);
      finish(false);
    }
  });
}

// ============================================================
// QUEUE MANAGEMENT
// ============================================================

function enqueue(item) {
  if (!item || !item.threadID || !item.senderID) return;

  if (queue.length >= MAX_QUEUE) {
    // Do not grow memory without limit.
    return;
  }

  queue.push(item);

  if (queue.length > stats.queuePeak) {
    stats.queuePeak = queue.length;
  }

  void startQueue();
}

async function startQueue() {
  if (queueRunning || shuttingDown) return;

  queueRunning = true;

  try {
    while (queue.length > 0 && !shuttingDown) {
      const item = queue.shift();
      if (!item) continue;

      try {
        await processQueueItem(item);
      } catch (err) {
        data.totalErrors++;
        stats.errors++;
        console.error("[GOJO] Worker item error:", err);
      }

      const delay = clamp(
        data.delay,
        MIN_DELAY,
        MAX_DELAY,
        DEFAULT_DELAY
      );

      await sleep(delay);
    }
  } catch (err) {
    data.totalErrors++;
    stats.errors++;
    console.error("[GOJO] Queue worker error:", err);
  } finally {
    queueRunning = false;

    // Recover if items remain.
    if (queue.length > 0 && !shuttingDown) {
      setImmediate(() => {
        void startQueue();
      });
    }
  }
}

// ============================================================
// PROCESS QUEUED MESSAGE
// ============================================================

async function processQueueItem(item) {
  // Check this GC only.
  if (!isThreadActive(item.threadID)) return;
  if (!isTargetUser(item.senderID)) return;

  const key = cooldownKey(item.threadID, item.senderID);
  const now = Date.now();

  const cooldown = clamp(
    data.cooldown,
    MIN_COOLDOWN,
    MAX_COOLDOWN,
    DEFAULT_COOLDOWN
  );

  const last = lastReplyByUser.get(key) || 0;

  if (now - last < cooldown) return;

  lastReplyByUser.set(key, now);

  if (data.autoReact && item.messageID) {
    await safeReact(item.api, item.messageID);
  }

  // Re-check after reaction in case GC was disabled.
  if (!isThreadActive(item.threadID)) return;

  const sent = await safeSend(
    item.api,
    randomReply(),
    item.threadID
  );

  if (sent) {
    data.totalReplies++;
    data.lastReplyAt = Date.now();
    stats.replied++;
    saveData();
  }
}

// ============================================================
// COMMAND CONFIG
// ============================================================

module.exports.config = {
  name: "gojo",
  version: "17.0.0",
  hasPermission: 0,
  credits: "Gojo Makunat Edition",
  description: "Per-GC Gojo auto-reply with queue protection and recovery",
  usePrefix: true,
  commandCategory: "AI",
  usages: "/gojo on | off | status | help",
  cooldowns: 2
};

// ============================================================
// HANDLE EVENT
// ============================================================

module.exports.handleEvent = async function ({ api, event }) {
  try {
    if (!event) return;

    const {
      threadID,
      senderID,
      messageID,
      body
    } = event;

    if (!threadID || !senderID) return;

    // Ignore bot's own messages.
    try {
      const botID = api.getCurrentUserID?.();

      if (botID && String(senderID) === String(botID)) {
        return;
      }
    } catch (_) {}

    if (rememberMessage(messageID)) return;
    if (!isTargetUser(senderID)) return;

    // Ignore command messages.
    if (typeof body === "string" && body.trim().startsWith("/")) {
      return;
    }

    // Only enabled GC can enqueue messages.
    if (!isThreadActive(threadID)) return;

    data.totalReceived++;
    stats.received++;

    enqueue({
      api,
      threadID: String(threadID),
      senderID: String(senderID),
      messageID,
      body
    });
  } catch (err) {
    data.totalErrors++;
    stats.errors++;
    console.error("[GOJO] handleEvent error:", err);
  }
};

// ============================================================
// COMMAND RUNNER
// ============================================================

module.exports.run = async function ({ api, event, args }) {
  try {
    if (!event || !event.threadID) return;

    const threadID = String(event.threadID);
    const senderID = String(event.senderID || "");
    const command = String(args?.[0] || "help").toLowerCase();

    // --------------------------------------------------------
    // ON: this GC only
    // --------------------------------------------------------

    if (command === "on") {
      if (!isAdmin(senderID)) {
        return safeSend(api, "⛔ Admin lang ang puwedeng mag-on ng Gojo.", threadID);
      }

      setThreadActive(threadID, true);

      return safeSend(
        api,
        "😎 Gojo ON!\n📍 Active lang sa GC na ito.",
        threadID
      );
    }

    // --------------------------------------------------------
    // OFF: this GC only
    // --------------------------------------------------------

    if (command === "off") {
      if (!isAdmin(senderID)) {
        return safeSend(api, "⛔ Admin lang ang puwedeng mag-off ng Gojo.", threadID);
      }

      setThreadActive(threadID, false);

      // Clear pending messages from this GC only.
      for (let i = queue.length - 1; i >= 0; i--) {
        if (String(queue[i].threadID) === threadID) {
          queue.splice(i, 1);
        }
      }

      return safeSend(
        api,
        "🛑 Gojo OFF!\n📍 Disabled lang sa GC na ito.",
        threadID
      );
    }

    // --------------------------------------------------------
    // STATUS
    // --------------------------------------------------------

    if (command === "status") {
      return safeSend(
        api,
        [
          "♾️ GOJO STATUS",
          `GC: ${isThreadActive(threadID) ? "ON 😎" : "OFF 🛑"}`,
          `Auto React: ${data.autoReact ? "ON" : "OFF"}`,
          `Delay: ${data.delay}ms`,
          `Cooldown: ${data.cooldown}ms`,
          `Replies: ${data.totalReplies}`,
          `Received: ${data.totalReceived}`,
          `Errors: ${data.totalErrors}`,
          `Retries: ${data.totalRetries}`,
          `Queue: ${queue.length}/${MAX_QUEUE}`
        ].join("\n"),
        threadID
      );
    }

    // --------------------------------------------------------
    // AUTO REACT
    // --------------------------------------------------------

    if (command === "reacton" || command === "reactoff") {
      if (!isAdmin(senderID)) {
        return safeSend(api, "⛔ Admin lang ang puwedeng magbago ng settings.", threadID);
      }

      data.autoReact = command === "reacton";
      saveData();

      return safeSend(
        api,
        `😎 Auto reaction: ${data.autoReact ? "ON" : "OFF"}`,
        threadID
      );
    }

    // --------------------------------------------------------
    // DELAY
    // --------------------------------------------------------

    if (command === "delay") {
      if (!isAdmin(senderID)) {
        return safeSend(api, "⛔ Admin lang ang puwedeng magbago ng settings.", threadID);
      }

      const value = Number(args?.[1]);

      if (!Number.isFinite(value)) {
        return safeSend(
          api,
          `Usage: /gojo delay ${DEFAULT_DELAY}\nAllowed: ${MIN_DELAY}-${MAX_DELAY}ms`,
          threadID
        );
      }

      data.delay = clamp(value, MIN_DELAY, MAX_DELAY, DEFAULT_DELAY);
      saveData();

      return safeSend(api, `⏱️ Delay set: ${data.delay}ms`, threadID);
    }

    // --------------------------------------------------------
    // COOLDOWN
    // --------------------------------------------------------

    if (command === "cooldown") {
      if (!isAdmin(senderID)) {
        return safeSend(api, "⛔ Admin lang ang puwedeng magbago ng settings.", threadID);
      }

      const value = Number(args?.[1]);

      if (!Number.isFinite(value)) {
        return safeSend(
          api,
          `Usage: /gojo cooldown ${DEFAULT_COOLDOWN}\nAllowed: ${MIN_COOLDOWN}-${MAX_COOLDOWN}ms`,
          threadID
        );
      }

      data.cooldown = clamp(value, MIN_COOLDOWN, MAX_COOLDOWN, DEFAULT_COOLDOWN);
      saveData();

      return safeSend(api, `⏳ Cooldown set: ${data.cooldown}ms`, threadID);
    }

    // --------------------------------------------------------
    // HELP
    // --------------------------------------------------------

    if (command === "help") {
      return safeSend(
        api,
        [
          "♾️ GOJO V17 COMMANDS",
          "/gojo on - Enable sa GC na ito",
          "/gojo off - Disable sa GC na ito",
          "/gojo status - Status ng GC",
          "/gojo reacton - Enable auto reaction",
          "/gojo reactoff - Disable auto reaction",
          "/gojo delay 2000 - Set reply delay",
          "/gojo cooldown 5000 - Set cooldown",
          "/gojo help - Show commands"
        ].join("\n"),
        threadID
      );
    }

    return safeSend(
      api,
      "Unknown command. Gamitin: /gojo help",
      threadID
    );
  } catch (err) {
    data.totalErrors++;
    stats.errors++;
    console.error("[GOJO] Command error:", err);
  }
};

// ============================================================
// PERIODIC CLEANUP
// ============================================================

const cleanupTimer = setInterval(() => {
  try {
    if (shuttingDown) return;

    clearOldCooldowns();
    saveData();
  } catch (err) {
    console.error("[GOJO] Cleanup error:", err);
  }
}, 60000);

// Prevent timer from being the only thing keeping Node alive.
if (typeof cleanupTimer.unref === "function") {
  cleanupTimer.unref();
}

// ============================================================
// SHUTDOWN SAVE
// ============================================================

function shutdownSave() {
  shuttingDown = true;
  saveData();
}

process.once("SIGTERM", shutdownSave);
process.once("SIGINT", shutdownSave);
