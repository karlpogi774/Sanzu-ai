
"use strict";

// ============================================================
// GOJO BOT V16 | INFINITY MAKUNAT EDITION
// Per-GC Activation + Queue Protection + Retry
// Per-GC/User Cooldown + Auto React + Persistence
// Watchdog + Backup + Error Log + Render Status
// ============================================================

const fs = require("fs");
const path = require("path");

// ============================================================
// CONFIG
// ============================================================

const ADMIN_ID = "61594055835097";

// Empty = lahat ng users.
// Kapag may UID, siya lang ang rereplyan.
const TARGET_USER_ID = "";

const DATA_FILE = path.join(__dirname, "gojo_data.json");
const BACKUP_FILE = path.join(__dirname, "gojo_data.backup.json");
const TEMP_FILE = path.join(__dirname, "gojo_data.tmp.json");
const LOG_FILE = path.join(__dirname, "gojo_error.log");

const MAX_QUEUE = 300;
const MAX_SEEN = 3000;
const MAX_COOLDOWN_USERS = 3000;

const MAX_RETRIES = 3;
const SEND_TIMEOUT = 15000;

const DEFAULT_DELAY = 2000;
const DEFAULT_COOLDOWN = 3000;

const MIN_DELAY = 500;
const MAX_DELAY = 60000;

const MIN_COOLDOWN = 1000;
const MAX_COOLDOWN = 120000;

const HEALTH_INTERVAL = 30000;
const SAVE_INTERVAL = 60000;
const BACKUP_INTERVAL = 300000;

// ============================================================
// DEFAULT DATA
// ============================================================

const DEFAULT_DATA = {
  // Active threads lang ang naka-on.
  activeThreads: [],

  autoReact: true,
  delay: DEFAULT_DELAY,
  cooldown: DEFAULT_COOLDOWN,

  totalReplies: 0,
  totalReceived: 0,
  totalErrors: 0,
  totalRetries: 0,

  startedAt: Date.now(),
  lastReplyAt: 0,
  lastErrorAt: 0
};

// ============================================================
// ERROR LOG
// ============================================================

function logError(where, error) {
  try {
    const message =
      `[${new Date().toISOString()}] ${where}: ` +
      `${error?.stack || error}\n`;

    fs.appendFileSync(LOG_FILE, message);
  } catch (_) {}
}

// ============================================================
// DATA LOAD / SAVE
// ============================================================

function loadData() {
  try {
    let saved;

    if (fs.existsSync(DATA_FILE)) {
      saved = JSON.parse(
        fs.readFileSync(DATA_FILE, "utf8")
      );
    } else if (fs.existsSync(BACKUP_FILE)) {
      saved = JSON.parse(
        fs.readFileSync(BACKUP_FILE, "utf8")
      );
    } else {
      return { ...DEFAULT_DATA };
    }

    const merged = {
      ...DEFAULT_DATA,
      ...saved
    };

    if (!Array.isArray(merged.activeThreads)) {
      merged.activeThreads = [];
    }

    merged.activeThreads = [
      ...new Set(
        merged.activeThreads
          .filter(Boolean)
          .map(String)
      )
    ];

    merged.delay = clampNumber(
      merged.delay,
      MIN_DELAY,
      MAX_DELAY,
      DEFAULT_DELAY
    );

    merged.cooldown = clampNumber(
      merged.cooldown,
      MIN_COOLDOWN,
      MAX_COOLDOWN,
      DEFAULT_COOLDOWN
    );

    merged.autoReact = merged.autoReact !== false;

    return merged;
  } catch (error) {
    logError("loadData", error);

    try {
      if (fs.existsSync(BACKUP_FILE)) {
        const backup = JSON.parse(
          fs.readFileSync(BACKUP_FILE, "utf8")
        );

        return {
          ...DEFAULT_DATA,
          ...backup,
          activeThreads: Array.isArray(backup.activeThreads)
            ? backup.activeThreads.map(String)
            : []
        };
      }
    } catch (backupError) {
      logError("loadBackup", backupError);
    }

    return { ...DEFAULT_DATA };
  }
}

let data = loadData();

function saveData() {
  try {
    fs.writeFileSync(
      TEMP_FILE,
      JSON.stringify(data, null, 2)
    );

    fs.renameSync(TEMP_FILE, DATA_FILE);
  } catch (error) {
    logError("saveData", error);
  }
}

function backupData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      fs.copyFileSync(DATA_FILE, BACKUP_FILE);
    }
  } catch (error) {
    logError("backupData", error);
  }
}

// ============================================================
// RUNTIME STATE
// ============================================================

const activeThreads = new Set(
  data.activeThreads.map(String)
);

const queue = [];
const seenMessages = new Set();
const userLastReply = new Map();

let queueRunning = false;
let shuttingDown = false;
let maintenanceStarted = false;

let lastWorkerActivity = Date.now();

const stats = {
  received: 0,
  replied: 0,
  failed: 0,
  reactions: 0,
  errors: 0,
  retries: 0,
  dropped: 0,
  queuePeak: 0,
  recoveredWorkers: 0
};

// ============================================================
// GOJO REPLIES
// ============================================================

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
  "🌀 " + GOJO_QUOTES[9],
  "😎 Infinity is working.",
  "🕶️ Gojo online.",
  "♾️ You cannot bypass Infinity.",
  "🌀 Unlimited Void.",
  "😏 Easy.",
  "😂 Nice try.",
  "👀 I saw that.",
  "😎 Still here.",
  "♾️ Limitless.",
  "🕶️ The strongest has arrived."
];

// ============================================================
// UTILITY
// ============================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomReply() {
  return REPLIES[
    Math.floor(Math.random() * REPLIES.length)
  ];
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(Math.max(number, min), max);
}

function isAdmin(id) {
  return String(id) === String(ADMIN_ID);
}

function isTargetUser(id) {
  if (!TARGET_USER_ID) return true;
  return String(id) === String(TARGET_USER_ID);
}

function isActive(threadID) {
  return activeThreads.has(String(threadID));
}

function setActive(threadID, enabled) {
  const id = String(threadID);

  if (enabled) {
    activeThreads.add(id);
  } else {
    activeThreads.delete(id);
  }

  data.activeThreads = [...activeThreads];
  saveData();
}

function formatUptime() {
  const seconds = Math.floor(
    (Date.now() - data.startedAt) / 1000
  );

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

// ============================================================
// MESSAGE MEMORY
// ============================================================

function rememberMessage(messageID) {
  if (!messageID) return false;

  const id = String(messageID);

  if (seenMessages.has(id)) {
    return true;
  }

  seenMessages.add(id);

  if (seenMessages.size > MAX_SEEN) {
    const oldest = seenMessages.values().next().value;

    if (oldest) {
      seenMessages.delete(oldest);
    }
  }

  return false;
}

// ============================================================
// COOLDOWN CLEANUP
// ============================================================

function clearCooldowns() {
  const now = Date.now();
  const cooldown = Number(data.cooldown) || DEFAULT_COOLDOWN;

  for (const [key, timestamp] of userLastReply) {
    if (now - timestamp > cooldown * 3) {
      userLastReply.delete(key);
    }
  }

  if (userLastReply.size > MAX_COOLDOWN_USERS) {
    const excess = userLastReply.size - MAX_COOLDOWN_USERS;
    let removed = 0;

    for (const key of userLastReply.keys()) {
      userLastReply.delete(key);
      removed++;

      if (removed >= excess) break;
    }
  }
}

// ============================================================
// CALLBACK WITH TIMEOUT
// ============================================================

function callbackRequest(run, timeout = SEND_TIMEOUT) {
  return new Promise((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error("API callback timed out"));
    }, timeout);

    const done = error => {
      if (settled) return;

      settled = true;
      clearTimeout(timer);

      if (error) reject(error);
      else resolve(true);
    };

    try {
      run(done);
    } catch (error) {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(error);
      }
    }
  });
}

// ============================================================
// SAFE SEND
// ============================================================

async function safeSend(api, message, threadID) {
  if (!api || !threadID || !message) {
    return false;
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await callbackRequest(done => {
        api.sendMessage(message, threadID, done);
      });

      return true;
    } catch (error) {
      data.totalErrors++;
      data.lastErrorAt = Date.now();
      stats.errors++;

      logError(`safeSend attempt ${attempt}`, error);

      if (attempt < MAX_RETRIES) {
        data.totalRetries++;
        stats.retries++;

        const wait = 1000 * Math.pow(2, attempt - 1);
        await sleep(wait);
      }
    }
  }

  stats.failed++;
  return false;
}

// ============================================================
// SAFE REACTION
// ============================================================

async function safeReact(api, reaction, messageID) {
  if (!api || !messageID || !api.setMessageReaction) {
    return false;
  }

  try {
    await callbackRequest(done => {
      api.setMessageReaction(
        reaction,
        messageID,
        done,
        true
      );
    });

    stats.reactions++;
    return true;
  } catch (error) {
    data.totalErrors++;
    data.lastErrorAt = Date.now();
    stats.errors++;

    logError("safeReact", error);
    return false;
  }
}

// ============================================================
// QUEUE
// ============================================================

function enqueue(item) {
  if (
    !item ||
    !item.threadID ||
    !item.senderID
  ) {
    return false;
  }

  // Do not delete older queued messages silently.
  if (queue.length >= MAX_QUEUE) {
    stats.dropped++;
    return false;
  }

  queue.push(item);

  if (queue.length > stats.queuePeak) {
    stats.queuePeak = queue.length;
  }

  startQueue();
  return true;
}

function clearThreadQueue(threadID) {
  const id = String(threadID);

  for (let i = queue.length - 1; i >= 0; i--) {
    if (String(queue[i].threadID) === id) {
      queue.splice(i, 1);
    }
  }
}

// ============================================================
// QUEUE WORKER
// ============================================================

async function startQueue() {
  if (queueRunning || shuttingDown) return;

  queueRunning = true;
  lastWorkerActivity = Date.now();

  try {
    while (queue.length > 0 && !shuttingDown) {
      const item = queue.shift();

      if (!item) continue;

      lastWorkerActivity = Date.now();

      try {
        await processQueueItem(item);
      } catch (error) {
        data.totalErrors++;
        data.lastErrorAt = Date.now();
        stats.errors++;

        logError("processQueueItem", error);
      }

      lastWorkerActivity = Date.now();

      const delay = clampNumber(
        data.delay,
        MIN_DELAY,
        MAX_DELAY,
        DEFAULT_DELAY
      );

      await sleep(delay);
    }
  } catch (error) {
    data.totalErrors++;
    data.lastErrorAt = Date.now();
    stats.errors++;

    logError("queueWorker", error);
  } finally {
    queueRunning = false;
    lastWorkerActivity = Date.now();

    // Recover any item added while worker was finishing.
    if (queue.length > 0 && !shuttingDown) {
      stats.recoveredWorkers++;

      setTimeout(() => {
        startQueue();
      }, 250);
    }
  }
}

// ============================================================
// PROCESS QUEUE ITEM
// ============================================================

async function processQueueItem(item) {
  const threadID = String(item.threadID);
  const senderID = String(item.senderID);

  // Per-GC ON/OFF check.
  if (!isActive(threadID)) return;

  if (!isTargetUser(senderID)) return;

  const cooldown = clampNumber(
    data.cooldown,
    MIN_COOLDOWN,
    MAX_COOLDOWN,
    DEFAULT_COOLDOWN
  );

  // Cooldown is separated per GC and per sender.
  const cooldownKey = `${threadID}:${senderID}`;
  const now = Date.now();
  const last = userLastReply.get(cooldownKey) || 0;

  if (now - last < cooldown) return;

  // Mark before actions to prevent rapid duplicate replies.
  userLastReply.set(cooldownKey, now);

  if (data.autoReact && item.messageID) {
    await safeReact(item.api, "😎", item.messageID);
  }

  // Check again in case /gojo off was used during reaction.
  if (!isActive(threadID)) return;

  const sent = await safeSend(
    item.api,
    randomReply(),
    threadID
  );

  if (sent) {
    data.totalReplies++;
    data.lastReplyAt = Date.now();
    stats.replied++;

    saveData();
  }
}

// ============================================================
// WATCHDOG + MAINTENANCE
// ============================================================

function startMaintenance() {
  if (maintenanceStarted) return;
  maintenanceStarted = true;

  setInterval(() => {
    try {
      if (shuttingDown) return;

      clearCooldowns();

      data.delay = clampNumber(
        data.delay,
        MIN_DELAY,
        MAX_DELAY,
        DEFAULT_DELAY
      );

      data.cooldown = clampNumber(
        data.cooldown,
        MIN_COOLDOWN,
        MAX_COOLDOWN,
        DEFAULT_COOLDOWN
      );

      // Worker recovery if queue is waiting but worker is idle.
      if (queue.length > 0 && !queueRunning) {
        stats.recoveredWorkers++;
        startQueue();
      }

      // Stuck-worker detection.
      if (
        queueRunning &&
        queue.length > 0 &&
        Date.now() - lastWorkerActivity > SEND_TIMEOUT * 2
      ) {
        logError(
          "watchdog",
          new Error("Worker appears stalled; waiting for current API request to settle")
        );
      }
    } catch (error) {
      data.totalErrors++;
      data.lastErrorAt = Date.now();

      logError("watchdog", error);
    }
  }, HEALTH_INTERVAL);

  setInterval(() => {
    if (!shuttingDown) saveData();
  }, SAVE_INTERVAL);

  setInterval(() => {
    if (!shuttingDown) backupData();
  }, BACKUP_INTERVAL);
}

startMaintenance();

// ============================================================
// COMMAND CONFIG
// ============================================================

module.exports.config = {
  name: "gojo",
  version: "16.0.0",
  hasPermission: 0,
  credits: "Gojo Infinity Makunat Edition",
  description:
    "Per-GC Gojo auto reply with queue protection, cooldown, retry, auto reaction and persistence",
  usePrefix: true,
  commandCategory: "AI",
  usages: "/gojo help",
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
      const botID = api?.getCurrentUserID?.();

      if (botID && String(senderID) === String(botID)) {
        return;
      }
    } catch (_) {}

    // Ignore duplicate events.
    if (rememberMessage(messageID)) return;

    // Count received messages.
    stats.received++;
    data.totalReceived++;

    // Commands should not trigger auto-reply.
    if (
      typeof body === "string" &&
      body.trim().startsWith("/")
    ) {
      return;
    }

    // Per-GC activation check.
    if (!isActive(threadID)) return;

    // Optional target user filter.
    if (!isTargetUser(senderID)) return;

    enqueue({
      api,
      event,
      threadID: String(threadID),
      senderID: String(senderID),
      messageID,
      body
    });
  } catch (error) {
    data.totalErrors++;
    data.lastErrorAt = Date.now();
    stats.errors++;

    logError("handleEvent", error);
  }
};

// ============================================================
// COMMAND RUN
// ============================================================

module.exports.run = async function ({ api, event, args }) {
  try {
    if (!event || !event.threadID) return;

    const threadID = String(event.threadID);
    const command = String(args?.[0] || "").toLowerCase();

    const admin = isAdmin(event.senderID);

    // --------------------------------------------------------
    // HELP
    // --------------------------------------------------------

    if (!command || command === "help") {
      return safeSend(
        api,
        [
          "♾️ GOJO V16 COMMANDS",
          "",
          "/gojo on - Enable sa GC na ito",
          "/gojo off - Disable sa GC na ito",
          "/gojo status - Status ng GC na ito",
          "/gojo reacton - Enable auto reaction",
          "/gojo reactoff - Disable auto reaction",
          "/gojo delay 2000 - Set reply delay",
          "/gojo cooldown 3000 - Set user cooldown",
          "/gojo stats - Bot statistics",
          "/gojo clear - Clear pending queue ng GC na ito",
          "/gojo help - Show commands",
          "",
          "Note: ON/OFF ay per-GC. Hindi nito gagalawin ang ibang GC."
        ].join("\n"),
        threadID
      );
    }

    // --------------------------------------------------------
    // ADMIN-ONLY COMMANDS
    // --------------------------------------------------------

    const adminCommands = [
      "on",
      "off",
      "reacton",
      "reactoff",
      "delay",
      "cooldown",
      "clear"
    ];

    if (adminCommands.includes(command) && !admin) {
      return safeSend(
        api,
        "⛔ Admin only ang command na ito.",
        threadID
      );
    }

    // --------------------------------------------------------
    // ON - THIS GC ONLY
    // --------------------------------------------------------

    if (command === "on") {
      setActive(threadID, true);

      return safeSend(
        api,
        "😎 Gojo ON sa GC na ito lamang.\n♾️ Ibang GC: walang pagbabago.",
        threadID
      );
    }

    // --------------------------------------------------------
    // OFF - THIS GC ONLY
    // --------------------------------------------------------

    if (command === "off") {
      setActive(threadID, false);
      clearThreadQueue(threadID);

      return safeSend(
        api,
        "🛑 Gojo OFF sa GC na ito lamang.\n📦 Pending messages ng GC na ito ay nilinis.",
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
          "♾️ GOJO V16 STATUS",
          `GC Status: ${isActive(threadID) ? "ON 😎" : "OFF 🛑"}`,
          `Auto React: ${data.autoReact ? "ON" : "OFF"}`,
      
