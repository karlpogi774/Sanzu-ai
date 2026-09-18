// ============================================================
// GOJO BOT V16 | PER-GC STABLE EDITION
// Sanzu-style command module
// Per-GC ON/OFF + Queue Limit + Cooldown + Auto React
// ============================================================

const fs = require("fs");
const path = require("path");

// ============================================================
// CONFIG
// ============================================================

const ADMIN_ID = "61594055835097";
const TARGET_USER_ID = ""; // Empty = all users

const DATA_FILE = path.join(__dirname, "gojo_data.json");

const DEFAULT_DELAY = 2000;
const DEFAULT_COOLDOWN = 5000;

const MIN_DELAY = 500;
const MAX_DELAY = 60000;

const MIN_COOLDOWN = 1000;
const MAX_COOLDOWN = 120000;

const MAX_QUEUE = 100;
const MAX_SEEN = 2000;
const MAX_RETRIES = 2;

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
// LOAD / SAVE
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

function saveData() {
  try {
    const temp = DATA_FILE + ".tmp";

    fs.writeFileSync(
      temp,
      JSON.stringify(data, null, 2)
    );

    fs.renameSync(temp, DATA_FILE);
  } catch (err) {
    console.error("[GOJO] Save error:", err);
  }
}

// ============================================================
// PER-GC ACTIVATION
// ============================================================

function isThreadActive(threadID) {
  return data.activeThreads[String(threadID)] === true;
}

function setThreadActive(threadID, enabled) {
  data.activeThreads[String(threadID)] = Boolean(enabled);
  saveData();
}

// ============================================================
// RUNTIME
// ============================================================

const queue = [];
const seenMessages = new Set();
const lastReplyByUser = new Map();

let queueRunning = false;
let shuttingDown = false;

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
  "🕶️ Gojo online."
];

function randomReply() {
  return REPLIES[
    Math.floor(Math.random() * REPLIES.length)
  ];
}

// ============================================================
// HELPERS
// ============================================================

function isAdmin(userID) {
  return String(userID) === String(ADMIN_ID);
}

function isTargetUser(userID) {
  return !TARGET_USER_ID ||
    String(userID) === String(TARGET_USER_ID);
}

function clamp(value, min, max, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, number));
}

function rememberMessage(messageID) {
  if (!messageID) return false;

  const id = String(messageID);

  if (seenMessages.has(id)) {
    return true;
  }

  seenMessages.add(id);

  if (seenMessages.size > MAX_SEEN) {
    const oldest = seenMessages.values().next().value;
    if (oldest) seenMessages.delete(oldest);
  }

  return false;
}

function cooldownKey(threadID, senderID) {
  return `${String(threadID)}:${String(senderID)}`;
}

// ============================================================
// SEND MESSAGE
// ============================================================

function sendMessage(api, message, threadID) {
  return new Promise(resolve => {
    if (!api || !threadID || !message) {
      return resolve(false);
    }

    try {
      api.sendMessage(message, threadID, err => {
        if (err) {
          console.error("[GOJO] Send error:", err);
          data.totalErrors++;
          saveData();
          return resolve(false);
        }

        resolve(true);
      });
    } catch (err) {
      console.error("[GOJO] Send exception:", err);
      data.totalErrors++;
      saveData();
      resolve(false);
    }
  });
}

// ============================================================
// SAFE REACTION
// ============================================================

function react(api, messageID) {
  return new Promise(resolve => {
    if (
      !data.autoReact ||
      !api ||
      !messageID ||
      typeof api.setMessageReaction !== "function"
    ) {
      return resolve(false);
    }

    try {
      api.setMessageReaction(
        "😎",
        messageID,
        err => resolve(!err),
        true
      );
    } catch (err) {
      console.error("[GOJO] Reaction error:", err);
      resolve(false);
    }
  });
}

// ============================================================
// QUEUE
// ============================================================

function enqueue(item) {
  if (!item || !item.threadID || !item.senderID) return;

  // Drop the new item if the queue is full.
  // This avoids growing memory without limit.
  if (queue.length >= MAX_QUEUE) {
    return;
  }

  queue.push(item);
  startQueue();
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
        console.error("[GOJO] Queue item error:", err);
        data.totalErrors++;
      }

      const delay = clamp(
        data.delay,
        MIN_DELAY,
        MAX_DELAY,
        DEFAULT_DELAY
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  } finally {
    queueRunning = false;

    // Restart if an item arrived while worker was ending.
    if (queue.length > 0 && !shuttingDown) {
      startQueue();
    }
  }
}

// ============================================================
// PROCESS MESSAGE
// ============================================================

async function processQueueItem(item) {
  // Verify that this specific GC is still enabled.
  if (!isThreadActive(item.threadID)) return;

  if (!isTargetUser(item.senderID)) return;

  const key = cooldownKey(
    item.threadID,
    item.senderID
  );

  const now = Date.now();

  const cooldown = clamp(
    data.cooldown,
    MIN_COOLDOWN,
    MAX_COOLDOWN,
    DEFAULT_COOLDOWN
  );

  const last = lastReplyByUser.get(key) || 0;

  if (now - last < cooldown) return;

  // Set cooldown before sending to avoid duplicate replies.
  lastReplyByUser.set(key, now);

  if (data.autoReact && item.messageID) {
    await react(item.api, item.messageID);
  }

  // Check again in case the GC was disabled during reaction.
  if (!isThreadActive(item.threadID)) return;

  const sent = await sendMessage(
    item.api,
    randomReply(),
    item.threadID
  );

  if (sent) {
    data.totalReplies++;
    data.lastReplyAt = Date.now();
    saveData();
  }
}

// ============================================================
// COMMAND CONFIG
// ============================================================

module.exports.config = {
  name: "gojo",
  version: "16.0.0",
  hasPermission: 0,
  credits: "Gojo Per-GC Stable Edition",
  description: "Gojo auto reply with per-GC activation, cooldown and auto reaction",
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

    if (typeof body === "string" && body.trim().startsWith("/")) {
      return;
    }

    // Only process messages in enabled GCs.
    if (!isThreadActive(threadID)) return;

    data.totalReceived++;

    enqueue({
      api,
      threadID,
      senderID,
      messageID,
      body
    });
  } catch (err) {
    console.error("[GOJO] handleEvent error:", err);
    data.totalErrors++;
    saveData();
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
    // ON - only this GC
    // --------------------------------------------------------

    if (command === "on") {
      if (!isAdmin(senderID)) {
        return sendMessage(
          api,
          "⛔ Admin lang ang puwedeng mag-on ng Gojo.",
          threadID
        );
      }

      setThreadActive(threadID, true);

      return sendMessage(
        api,
        "😎 Gojo auto-reply: ON\n📍 Enabled lang sa GC na ito.",
        threadID
      );
    }

    // --------------------------------------------------------
    // OFF - only this GC
    // --------------------------------------------------------

    if (command === "off") {
      if (!isAdmin(senderID)) {
        return sendMessage(
          api,
          "⛔ Admin lang ang puwedeng mag-off ng Gojo.",
          threadID
        );
      }

      setThreadActive(threadID, false);

      // Remove only this GC's pending messages.
      for (let i = queue.length - 1; i >= 0; i--) {
        if (String(queue[i].threadID) === threadID) {
          queue.splice(i, 1);
        }
      }

      return sendMessage(
        api,
        "🛑 Gojo auto-reply: OFF\n📍 Disabled lang sa GC na ito.",
        threadID
      );
    }

    // --------------------------------------------------------
    // STATUS
    // --------------------------------------------------------

    if (command === "status") {
      const active = isThreadActive(threadID);

      return sendMessage(
        api,
        [
          "♾️ GOJO STATUS",
          `GC: ${active ? "ON 😎" : "OFF 🛑"}`,
          `Auto React: ${data.autoReact ? "ON" : "OFF"}`,
          `Delay: ${data.delay}ms`,
          `Cooldown: ${data.cooldown}ms`,
          `Total Replies: ${data.totalReplies}`,
          `Total Received: ${data.totalReceived}`,
          `Total Errors: ${data.totalErrors}`,
          `Queue: ${queue.length}/${MAX_QUEUE}`
        ].join("\n"),
        threadID
      );
    }

    // --------------------------------------------------------
    // AUTO REACTION
    // --------------------------------------------------------

    if (command === "reacton" || command === "reactoff") {
      if (!isAdmin(senderID)) {
        return sendMessage(
          api,
          "⛔ Admin lang ang puwedeng magbago ng settings.",
          threadID
        );
      }

      data.autoReact = command === "reacton";
      saveData();

      return sendMessage(
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
        return sendMessage(
          api,
          "⛔ Admin lang ang puwedeng magbago ng settings.",
          threadID
        );
      }

      const value = Number(args?.[1]);

      if (!Number.isFinite(value)) {
        return sendMessage(
          api,
          `Gamitin: /gojo delay ${DEFAULT_DELAY}\nAllowed: ${MIN_DELAY}-${MAX_DELAY}ms`,
          threadID
        );
      }

      data.delay = clamp(
        value,
        MIN_DELAY,
        MAX_DELAY,
        DEFAULT_DELAY
      );

      saveData();

      return sendMessage(
        api,
        `⏱️ Delay set to ${data.delay}ms`,
        threadID
      );
    }

    // --------------------------------------------------------
    // COOLDOWN
    // --------------------------------------------------------

    if (command === "cooldown") {
      if (!isAdmin(senderID)) {
        return sendMessage(
          api,
          "⛔ Admin lang ang puwedeng magbago ng settings.",
          threadID
        );
      }

      const value = Number(args?.[1]);

      if (!Number.isFinite(value)) {
        return sendMessage(
          api,
          `Gamitin: /gojo cooldown ${DEFAULT_COOLDOWN}\nAllowed: ${MIN_COOLDOWN}-${MAX_COOLDOWN}ms`,
          threadID
        );
      }

      data.cooldown = clamp(
        value,
        MIN_COOLDOWN,
        MAX_COOLDOWN,
        DEFAULT_COOLDOWN
      );

      saveData();

      return sendMessage(
        api,
        `⏳ Cooldown set to ${data.cooldown}ms`,
        threadID
      );
    }

    // --------------------------------------------------------
    // HELP
    // --------------------------------------------------------

    if (command === "help") {
      return sendMessage(
        api,
        [
          "♾️ GOJO COMMANDS",
          "/gojo on - Enable sa GC na ito",
          "/gojo off - Disable sa GC na ito",
          "/gojo status - Tingnan ang status ng GC",
          "/gojo reacton - Enable auto reaction",
          "/gojo reactoff - Disable auto reaction",
          "/gojo delay 2000 - Set reply delay (ms)",
          "/gojo cooldown 5000 - Set user cooldown (ms)",
          "/gojo help - Ipakita ang commands"
        ].join("\n"),
        threadID
      );
    }

    return sendMessage(
      api,
      "Unknown command. Gamitin ang /gojo help",
      threadID
    );
  } catch (err) {
    console.error("[GOJO] run error:", err);
    data.totalErrors++;
    saveData();
  }
};

// ============================================================
// CLEAN SHUTDOWN
// ============================================================

process.on("SIGTERM", () => {
  shuttingDown = true;
  saveData();
});

process.on("SIGINT", () => {
  shuttingDown = true;
  saveData();
});
