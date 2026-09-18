// ======================================================
// GOJO BOT V13 | INFINITY STABLE EDITION
// Sanzu-style command module
// Queue recovery + watchdog + render command
// ======================================================

const fs = require("fs");
const path = require("path");

// ==================== BASIC CONFIG ====================

const ADMIN_ID = "61594055835097";

const DATA_FILE = path.join(__dirname, "gojo_data.json");
const LOG_FILE = path.join(__dirname, "gojo_error.log");

const DEFAULT_DATA = {
  active: true,
  autoReact: true,
  delay: 2000,
  cooldown: 3000,
  totalReplies: 0
};

const MAX_QUEUE = 500;
const MAX_SEEN = 3000;
const MAX_RETRIES = 5;
const STUCK_TIMEOUT = 120000;

// ==================== RUNTIME STATE ==================

let data = { ...DEFAULT_DATA };

let queue = [];
let queueRunning = false;

let lastQueueActivity = Date.now();
let lastMaintenance = Date.now();

const seenMessages = new Set();
const userLastReply = new Map();

// ==================== LOGGER =========================

function logError(where, error) {
  const message =
    `[${new Date().toISOString()}] ${where}: ` +
    `${error?.stack || error}\n`;

  console.error(message);

  try {
    fs.appendFileSync(LOG_FILE, message);
  } catch (_) {}
}

function logInfo(message) {
  console.log(
    `[${new Date().toISOString()}] [GOJO] ${message}`
  );
}

// ==================== LOAD / SAVE =====================

function normalizeData() {
  if (typeof data !== "object" || data === null) {
    data = { ...DEFAULT_DATA };
  }

  data.active =
    typeof data.active === "boolean"
      ? data.active
      : DEFAULT_DATA.active;

  data.autoReact =
    typeof data.autoReact === "boolean"
      ? data.autoReact
      : DEFAULT_DATA.autoReact;

  data.delay =
    Number.isFinite(Number(data.delay))
      ? Number(data.delay)
      : DEFAULT_DATA.delay;

  data.cooldown =
    Number.isFinite(Number(data.cooldown))
      ? Number(data.cooldown)
      : DEFAULT_DATA.cooldown;

  data.totalReplies =
    Number.isFinite(Number(data.totalReplies))
      ? Number(data.totalReplies)
      : DEFAULT_DATA.totalReplies;

  if (data.delay < 0) data.delay = 0;
  if (data.delay > 10000) data.delay = 10000;

  if (data.cooldown < 0) data.cooldown = 0;
  if (data.cooldown > 60000) data.cooldown = 60000;
}

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      data = { ...DEFAULT_DATA };
      saveData();
      return;
    }

    const raw = fs.readFileSync(
      DATA_FILE,
      "utf8"
    );

    const saved = JSON.parse(raw);

    data = {
      ...DEFAULT_DATA,
      ...saved
    };

    normalizeData();

  } catch (error) {
    logError("Load data failed", error);
    data = { ...DEFAULT_DATA };
  }
}

function saveData() {
  try {
    const tempFile =
      DATA_FILE + ".tmp";

    fs.writeFileSync(
      tempFile,
      JSON.stringify(data, null, 2),
      "utf8"
    );

    fs.renameSync(
      tempFile,
      DATA_FILE
    );

  } catch (error) {
    logError("Save data failed", error);
  }
}

loadData();

// ==================== GOJO REPLIES ====================

const GOJO_QUOTES = [

  "Sa buong langit at lupa, ako lamang ang nag-iisang Honored One. ♾️",

  "Infinity ang pagitan natin. Hindi mo ako maaabot. 😎",

  "Domain Expansion: Infinite Void. 🌌",

  "Relax ka lang. Nandito na ang pinakamalakas. 💙",

  "Six Eyes activated. 👁️",

  "Hindi ako nagyayabang. Sinasabi ko lang ang katotohanan. 😏",

  "Gojo mode: ON. ♾️",

  "Masyado kang mabagal para sa Infinity ko. ⚡",

  "Walang drama. Isang reply lang, sapat na. 😂",

  "Nasa ibang level ang laro ko. 🌌",

  "Hindi pa nga ako seryoso. 💙",

  "Ang lakas mo naman... sa chat. 😂",

  "Infinity barrier: activated. ♾️",

  "Sige, tuloy mo lang. Nakikinig ang Six Eyes. 👁️",

  "Ang tunay na lakas ay marunong maghintay. ⏳",

  "Gojo Satoru reporting for duty. 😎",

  "Hindi ako late. Dramatic entrance lang. ✨",

  "Walang lag sa confidence ko. ⚡",

  "Random ang quote, pero Gojo ang dating. 😂",

  "Keep calm. Infinity is handling the messages. 🌌",

  "May bagong message? Gojo has entered the chat. 😎",

  "Isang reply lang, unlimited confidence. ♾️",

  "Ang bawat message ay may sariling oras. ⏱️",

  "Six Eyes online. System ready. 👁️",

  "Walang duplicate, walang kalituhan. 💙",

  "Ang reply ay darating sa tamang oras. ⏳",

  "Gojo energy: 100%. 🔋",

  "Hindi kailangang mag-spam para maging legendary. 😎",

  "Domain Expansion: Organized Reply Queue. 🌌",

  "Infinity activated. Reply queued. ♾️",

  "Sagot na may style, hindi puro ingay. 💙",

  "Gojo's random wisdom has arrived. ✨",

  "Ang tunay na flex ay stable na bot. ⚡",

  "Minsan, ang katahimikan ay bahagi ng strategy. 😌",

  "Message received. Infinity acknowledged. ♾️",

  "Walang panic. May error log naman. 🛠️",

  "Kung may problema, debug muna bago mag-drama. 😂",

  "Gojo's got this. 😎",

  "Naka-Infinity ang depensa, naka-queue ang sagot. 🌌",

  "Six Eyes detected: may bagong message. 👁️",

  "One message, one reply. Simple lang. 💙",

  "Ang confidence ay libre. Gamitin nang maayos. 😏",

  "Walang shortcut sa pagiging Honored One. ♾️",

  "Gojo bot: ready kapag kailangan. 💙",

  "Infinity mode: stable and ready. ⚡",

  "Sino'ng nagsabing kailangan kong mag-effort? 😏",

  "Walang makakalusot sa radar ng Gojo. 👁️",

  "Sapat na ang isang reply para mapansin. 😎",

  "Queue is moving. Infinity is watching. 🌌",

  "Gojo Satoru: present. 😎",

  "System check complete. Everything is ready. 🛠️",

  "Infinity engine is monitoring the queue. ♾️",

  "Message detected. Processing safely. ⚡",

  "Gojo core is still online. 💙",

  "Stable queue. Stable bot. 😎",

  "Six Eyes scan complete. 👁️",

  "Infinite Void connection established. 🌌",

  "No panic. Just process the queue. ⚡",

  "Gojo system initialized successfully. ♾️"

];

// ==================== GENERATED REPLIES =================

const PREFIXES = [
  "♾️ Gojo mode",
  "👁️ Six Eyes",
  "🌌 Infinite Void",
  "💙 Honored One",
  "⚡ Infinity",
  "🌀 Gojo System",
  "✨ Satoru Mode",
  "🔥 Gojo Core"
];

const MESSAGES = [
  "activated",
  "online",
  "detected",
  "ready",
  "checking the chat",
  "has entered the GC",
  "is watching",
  "is processing",
  "is on standby",
  "reply queued",
  "system stable",
  "monitoring messages",
  "queue active",
  "connection ready",
  "processing safely"
];

const EMOJIS = [
  "😎",
  "⚡",
  "♾️",
  "💙",
  "🌌",
  "👁️",
  "✨",
  "😂",
  "🔥",
  "🌀"
];

const REPLIES = [
  ...GOJO_QUOTES
];

for (const prefix of PREFIXES) {
  for (const message of MESSAGES) {
    for (const emoji of EMOJIS) {
      REPLIES.push(
        `${prefix}: ${message} ${emoji}`
      );
    }
  }
}

function randomReply() {
  if (!REPLIES.length) {
    return "♾️ Gojo system online.";
  }

  return REPLIES[
    Math.floor(
      Math.random() * REPLIES.length
    )
  ];
}

// ==================== HELPERS =========================

function isAdmin(id) {
  return String(id) === String(ADMIN_ID);
}

function sleep(ms) {
  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}

// ==================== SAFE SEND =======================

function send(api, message, threadID, messageID) {

  return new Promise(resolve => {

    if (!api || typeof api.sendMessage !== "function") {
      logError(
        "Send failed",
        new Error("api.sendMessage is unavailable")
      );

      return resolve(false);
    }

    try {

      api.sendMessage(
        message,
        threadID,
        error => {

          if (error) {
            logError(
              "Send message failed",
              error
            );

            return resolve(false);
          }

          resolve(true);
        },
        messageID
      );

    } catch (error) {

      logError(
        "Send exception",
        error
      );

      resolve(false);
    }

  });
}

// ==================== REACTION =========================

function react(api, messageID) {

  if (
    !api ||
    typeof api.setMessageReaction !== "function"
  ) {
    return;
  }

  try {

    api.setMessageReaction(
      "😆",
      messageID,
      error => {

        if (error) {
          logError(
            "Reaction failed",
            error
          );
        }

      },
      true
    );

  } catch (error) {

    logError(
      "Reaction exception",
      error
    );

  }
}

// ==================== MESSAGE MEMORY ==================

function rememberMessage(messageID) {

  if (!messageID) return false;

  const id = String(messageID);

  if (seenMessages.has(id)) {
    return false;
  }

  seenMessages.add(id);

  if (
    seenMessages.size > MAX_SEEN
  ) {

    const oldest =
      seenMessages.values()
        .next()
        .value;

    if (oldest) {
      seenMessages.delete(oldest);
    }

  }

  return true;
}

// ==================== QUEUE ===========================

function enqueue(item) {

  if (!item) return;

  if (queue.length >= MAX_QUEUE) {

    logInfo(
      "Queue full. Message skipped safely."
    );

    return;
  }

  queue.push({
    ...item,
    createdAt: Date.now(),
    retries: 0
  });

  lastQueueActivity = Date.now();

  startQueue();
}

// ==================== QUEUE START =====================

function startQueue() {

  if (queueRunning) {
    return;
  }

  queueRunning = true;

  lastQueueActivity = Date.now();

  processQueue()
    .catch(error => {

      logError(
        "Queue fatal error",
        error
      );

    })
    .finally(() => {

      queueRunning = false;

      lastQueueActivity =
        Date.now();

      // Restart queue if messages remain
      if (queue.length > 0) {

        setTimeout(
          startQueue,
          500
        );

      }

    });

}

// ==================== SAFE QUEUE SEND ================

async function safeQueueSend(item) {

  for (
    let attempt = 1;
    attempt <= MAX_RETRIES;
    attempt++
  ) {

    const success =
      await send(
        item.api,
        `♾️ [GOJO SATORU]\n\n${randomReply()}`,
        item.threadID,
        item.messageID
      );

    if (success) {
      return true;
    }

    logInfo(
      `Send retry ${attempt}/${MAX_RETRIES}`
    );

    await sleep(
      Math.min(
        2000 * attempt,
        10000
      )
    );
  }

  return false;
}

// ==================== PROCESS QUEUE ===================

async function processQueue() {

  while (queue.length > 0) {

    lastQueueActivity =
      Date.now();

    const item = queue[0];

    if (!item) {
      queue.shift();
      continue;
    }

    try {

      // If disabled, don't destroy queue
      if (!data.active) {
        await sleep(1000);
        continue;
      }

      const key =
        `${item.threadID}:${item.senderID}`;

      const last =
        userLastReply.get(key) || 0;

      const elapsed =
        Date.now() - last;

      const wait =
        Number(data.cooldown) - elapsed;

      if (wait > 0) {

        await sleep(
          Math.min(wait, 1000)
        );

        continue;
      }

      // Delay before sending
      if (data.delay > 0) {
        await sleep(data.delay);
      }

      if (!data.active) {
        continue;
      }

      const sent =
        await safeQueueSend(item);

      if (!sent) {

        item.retries =
          (item.retries || 0) + 1;

        queue.shift();

        logInfo(
          "Failed queue item removed after retries."
        );

        await sleep(2000);

        continue;
      }

      userLastReply.set(
        key,
        Date.now()
      );

      data.totalReplies += 1;

      queue.shift();

      lastQueueActivity =
        Date.now();

      // Save periodically instead of blocking every time
      if (
        data.totalReplies % 5 === 0
      ) {
        saveData();
      }

      await sleep(250);

    } catch (error) {

      logError(
        "Queue item failed",
        error
      );

      queue.shift();

      await sleep(1000);
    }
  }

  saveData();
}

// ==================== QUEUE WATCHDOG ==================

function queueWatchdog() {

  try {

    if (
      queue.length > 0 &&
      !queueRunning
    ) {

      logInfo(
        "Watchdog detected stopped queue. Restarting..."
      );

      startQueue();

      return;
    }

    if (
      queueRunning &&
      queue.length > 0 &&
      Date.now() - lastQueueActivity >
        STUCK_TIMEOUT
    ) {

      logInfo(
        "Watchdog detected stuck queue. Resetting..."
      );

      queueRunning = false;
      lastQueueActivity =
        Date.now();

      startQueue();
    }

  } catch (error) {

    logError(
      "Watchdog error",
      error
    );

  }
}

// ==================== MEMORY CLEANUP ==================

function cleanupMemory() {

  try {

    if (
      seenMessages.size >
      MAX_SEEN
    ) {

      const removeCount =
        Math.floor(
          seenMessages.size / 3
        );

      for (
        let i = 0;
        i < removeCount;
        i++
      ) {

        const oldest =
          seenMessages.values()
            .next()
            .value;

        if (!oldest) break;

        seenMessages.delete(oldest);
      }
    }

    // Prevent user cooldown map from growing forever
    if (
      userLastReply.size > 5000
    ) {

      const now = Date.now();

      for (
        const [
          key,
          timestamp
        ] of userLastReply
      ) {

        if (
          now - timestamp >
          3600000
        ) {

          userLastReply.delete(key);
        }

      }

    }

  } catch (error) {

    logError(
      "Memory cleanup error",
      error
    );

  }
}

// ==================== MAINTENANCE ====================

setInterval(() => {

  try {

    normalizeData();

    queueWatchdog();

    cleanupMemory();

    lastMaintenance =
      Date.now();

  } catch (error) {

    logError(
      "Maintenance error",
      error
    );

  }

}, 30000);

// ==================== AUTO SAVE ======================

setInterval(() => {

  try {
    saveData();
  } catch (error) {
    logError(
      "Auto save error",
      error
    );
  }

}, 60000);

// ==================== PROCESS ERROR RECOVERY =========

process.on(
  "uncaughtException",
  error => {

    logError(
      "UNCAUGHT EXCEPTION",
      error
    );

    // Try to keep the queue alive
    queueRunning = false;

    setTimeout(() => {

      try {
        startQueue();
      } catch (restartError) {
        logError(
          "Queue restart failed",
          restartError
        );
      }

    }, 2000);
  }
);

process.on(
  "unhandledRejection",
  reason => {

    logError(
      "UNHANDLED REJECTION",
      reason
    );

    queueRunning = false;

    setTimeout(() => {

      try {
        startQueue();
      } catch (error) {
        logError(
          "Recovery restart failed",
          error
        );
      }

    }, 2000);
  }
);

// ==================== CONFIG ==========================

module.exports.config = {

  name: "gojo",

  version: "13.0.0",

  hasPermission: 0,

  credits:
    "Gojo Infinity Stable Edition",

  description:
    "Gojo auto-reply with queue recovery, watchdog and admin controls",

  usePrefix: true,

  commandCategory: "AI",

  usages:
    "/gojo help",

  cooldowns: 2
};

// ==================== EVENT HANDLER ===================

module.exports.handleEvent =
async function ({
  api,
  event
}) {

  try {

    if (!api || !event) {
      return;
    }

    const {
      threadID,
      senderID,
      messageID,
      body
    } = event;

    if (
      !threadID ||
      !senderID ||
      !message
