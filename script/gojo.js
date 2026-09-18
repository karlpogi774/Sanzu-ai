// ============================================================
// GOJO BOT V13 | INFINITY EXTENDED + PERSON TARGET
// ============================================================

const fs = require("fs");
const path = require("path");

// ============================================================
// 01. BASIC CONFIG
// ============================================================

const ADMIN_ID = "61594055835097";

const BOT_NAME = "GOJO SATORU";
const BOT_VERSION = "13.1.0";

const DATA_FILE =
  path.join(__dirname, "gojo_data.json");

const BACKUP_FILE =
  path.join(__dirname, "gojo_data.backup.json");

const LOG_FILE =
  path.join(__dirname, "gojo_error.log");

// ============================================================
// 02. PERSON ACCOUNT TARGET
// ============================================================
//
// Ilagay ang Facebook User ID ng taong gusto mong i-target.
//
// Example:
// const TARGET_USER_ID = "123456789012345";
//
// Para lahat ng users:
// const TARGET_USER_ID = "";
//
// ============================================================

const TARGET_USER_ID = "";

function isTargetUser(id) {

  // Blank = lahat ng users
  if (!TARGET_USER_ID) {
    return true;
  }

  return (
    String(id) ===
    String(TARGET_USER_ID)
  );

}

// ============================================================
// 03. LIMITS
// ============================================================

const MAX_QUEUE = 500;
const MAX_SEEN_MESSAGES = 3000;
const MAX_RETRIES = 3;

const MIN_DELAY = 500;
const MAX_DELAY = 60000;

const MIN_COOLDOWN = 1000;
const MAX_COOLDOWN = 120000;

const MAX_COOLDOWN_USERS = 5000;

// ============================================================
// 04. DEFAULT DATA
// ============================================================

const DEFAULT_DATA = {

  active: true,

  autoReact: true,

  delay: 2000,

  cooldown: 3000,

  totalReplies: 0,

  totalErrors: 0,

  totalRetries: 0,

  totalReceived: 0,

  startedAt: Date.now(),

  lastReplyAt: 0,

  lastErrorAt: 0

};

// ============================================================
// 05. RUNTIME
// ============================================================

let data = {
  ...DEFAULT_DATA
};

let queue = [];

let queueRunning = false;

let shuttingDown = false;

let healthRunning = false;

const seenMessages = new Set();

const userLastReply = new Map();

// ============================================================
// 06. STATISTICS
// ============================================================

const stats = {

  received: 0,

  targetReceived: 0,

  replied: 0,

  failed: 0,

  retries: 0,

  reactions: 0,

  errors: 0,

  recoveredWorkers: 0,

  queuePeak: 0

};

// ============================================================
// 07. GOJO QUOTES
// ============================================================

const GOJO_QUOTES = [

  "Sa buong langit at lupa, ako lamang ang nag-iisang Honored One. ♾️",

  "Infinity ang pagitan natin. Hindi mo ako maaabot. 😎",

  "Domain Expansion: Infinite Void. 🌌",

  "Relax ka lang. Nandito na ang pinakamalakas. 💙",

  "Six Eyes activated. 👁️",

  "Gojo mode: ON. ♾️",

  "Infinity is always active. ♾️",

  "Welcome to Infinite Void. 🌌",

  "The strongest has arrived. 💙",

  "Six Eyes never misses. 👁️",

  "Gojo Satoru: present. 😎",

  "Walang makakalampas sa Infinity. ♾️",

  "Chill lang. Ako na bahala. 💙",

  "Infinite Void detected. 🌌",

  "Gojo is watching. 👁️",

  "Infinity protection activated. ♾️",

  "Honored One reporting. 😎",

  "Domain Expansion ready. 🌌",

  "Six Eyes online. 👁️",

  "Gojo system is online. 💙",

  "Infinite Void initialized. 🌌",

  "The strongest is here. 😎",

  "Infinity detected. ♾️",

  "Gojo protocol activated. 😎",

  "Six Eyes scanning. 👁️",

  "Infinity barrier deployed. ♾️",

  "Honored One mode activated. 💙",

  "Gojo Satoru online. 😎",

  "Domain Expansion available. 🌌",

  "Infinity never sleeps. ♾️",

  "Six Eyes operational. 👁️",

  "Gojo mode remains active. 😎",

  "Infinite Void standing by. 🌌",

  "Nobody gets past Infinity. ♾️",

  "The strongest is monitoring. 💙",

  "Six Eyes detected activity. 👁️",

  "Gojo has entered the chat. 😎",

  "Infinity shield active. ♾️",

  "Infinite Void is watching. 🌌",

  "Honored One has arrived. 💙",

  "Gojo Satoru: ready. 😎",

  "Six Eyes status: ONLINE. 👁️",

  "Infinity status: ACTIVE. ♾️",

  "Domain Expansion: READY. 🌌",

  "Gojo Infinity protocol initialized. ♾️",

  "Six Eyes monitoring complete. 👁️",

  "Infinite Void connection stable. 🌌",

  "Infinity barrier operational. ♾️",

  "Gojo system detected activity. 😎",

  "Honored One connection established. 💙",

  "Six Eyes are watching. 👁️",

  "Infinity protocol is ready. ♾️",

  "Gojo monitoring system active. 😎",

  "Infinite Void system ready. 🌌",

  "The strongest remains online. 💙",

  "Gojo protocol remains active. ♾️",

  "Infinity system is stable. 😎",

  "Six Eyes signal received. 👁️",

  "Domain Expansion system ready. 🌌",

  "Gojo system ready for another message. 😎"

];

// ============================================================
// 08. RESPONSE COMPONENTS
// ============================================================

const PREFIXES = [

  "♾️ Gojo mode",

  "👁️ Six Eyes",

  "🌌 Infinite Void",

  "💙 Honored One",

  "⚡ Infinity",

  "😎 Gojo Satoru",

  "🌀 Domain Expansion",

  "✨ Gojo System"

];

const MESSAGES = [

  "activated",

  "online",

  "detected",

  "ready",

  "checking the chat",

  "monitoring activity",

  "processing",

  "on standby",

  "watching",

  "reply system ready",

  "connection stable",

  "system active",

  "message detected",

  "status confirmed",

  "monitoring enabled"

];

const EMOJIS = [

  "😎",
  "⚡",
  "♾️",
  "💙",
  "🌌",
  "👁️",
  "✨",
  "🔥",
  "🌀"

];

// ============================================================
// 09. BUILD REPLIES
// ============================================================

const REPLIES = [
  ...GOJO_QUOTES
];

for (
  const prefix of PREFIXES
) {

  for (
    const message of MESSAGES
  ) {

    for (
      const emoji of EMOJIS
    ) {

      REPLIES.push(
        `${prefix}: ${message} ${emoji}`
      );

    }

  }

}

// ============================================================
// 10. RANDOM
// ============================================================

function randomReply() {

  return REPLIES[
    Math.floor(
      Math.random() *
      REPLIES.length
    )
  ];

}

// ============================================================
// 11. SLEEP
// ============================================================

function sleep(ms) {

  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );

}

// ============================================================
// 12. UPTIME
// ============================================================

function getUptime() {

  const seconds =
    Math.floor(
      (Date.now() -
        data.startedAt) /
      1000
    );

  const days =
    Math.floor(
      seconds / 86400
    );

  const hours =
    Math.floor(
      (seconds % 86400) /
      3600
    );

  const minutes =
    Math.floor(
      (seconds % 3600) /
      60
    );

  const secs =
    seconds % 60;

  return (
    `${days}d ` +
    `${hours}h ` +
    `${minutes}m ` +
    `${secs}s`
  );

}

// ============================================================
// 13. ADMIN
// ============================================================

function isAdmin(id) {

  return (
    String(id) ===
    String(ADMIN_ID)
  );

}

// ============================================================
// 14. ERROR LOG
// ============================================================

function logError(
  where,
  error
) {

  const message =

    `[${new Date().toISOString()}] ` +
    `${where}: ` +
    `${error?.stack || error}\n`;

  console.error(message);

  stats.errors++;

  data.totalErrors++;

  data.lastErrorAt =
    Date.now();

  try {

    fs.appendFileSync(
      LOG_FILE,
      message,
      "utf8"
    );

  } catch (_) {}

}

// ============================================================
// 15. SAVE
// ============================================================

function saveData() {

  try {

    const tempFile =
      DATA_FILE + ".tmp";

    fs.writeFileSync(

      tempFile,

      JSON.stringify(
        data,
        null,
        2
      ),

      "utf8"

    );

    fs.renameSync(
      tempFile,
      DATA_FILE
    );

  } catch (error) {

    logError(
      "Save failed",
      error
    );

  }

}

// ============================================================
// 16. BACKUP
// ============================================================

function backupData() {

  try {

    if (
      fs.existsSync(
        DATA_FILE
      )
    ) {

      fs.copyFileSync(
        DATA_FILE,
        BACKUP_FILE
      );

    }

  } catch (error) {

    logError(
      "Backup failed",
      error
    );

  }

}

// ============================================================
// 17. LOAD
// ============================================================

function loadData() {

  try {

    if (
      !fs.existsSync(
        DATA_FILE
      )
    ) {

      data = {
        ...DEFAULT_DATA,
        startedAt: Date.now()
      };

      saveData();

      return;

    }

    const saved =
      JSON.parse(
        fs.readFileSync(
          DATA_FILE,
          "utf8"
        )
      );

    data = {

      ...DEFAULT_DATA,

      ...saved

    };

    data.delay =
      Math.max(
        MIN_DELAY,
        Math.min(
          MAX_DELAY,
          Number(data.delay) ||
          DEFAULT_DATA.delay
        )
      );

    data.cooldown =
      Math.max(
        MIN_COOLDOWN,
        Math.min(
          MAX_COOLDOWN,
          Number(data.cooldown) ||
          DEFAULT_DATA.cooldown
        )
      );

  } catch (error) {

    logError(
      "Load failed",
      error
    );

    data = {
      ...DEFAULT_DATA
    };

  }

}

loadData();

backupData();

// ============================================================
// 18. SAFE SEND
// ============================================================

function send(
  api,
  message,
  threadID,
  messageID = null
) {

  return new Promise(
    resolve => {

      try {

        api.sendMessage(

          message,

          threadID,

          error => {

            if (error) {

              logError(
                "sendMessage failed",
                error
              );

              resolve(false);

              return;

            }

            resolve(true);

          },

          messageID

        );

      } catch (error) {

        logError(
          "send exception",
          error
        );

        resolve(false);

      }

    }
  );

}

// ============================================================
// 19. REACTION
// ============================================================

function react(
  api,
  messageID
) {

  if (!api) return;

  if (!messageID) return;

  try {

    if (
      typeof api.setMessageReaction !==
      "function"
    ) {

      return;

    }

    api.setMessageReaction(

      "😆",

      messageID,

      error => {

        if (error) {

          logError(
            "Reaction failed",
            error
          );

          return;

        }

        stats.reactions++;

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

// ============================================================
// 20. DUPLICATE CHECK
// ============================================================

function isDuplicate(
  messageID
) {

  if (!messageID) {
    return false;
  }

  if (
    seenMessages.has(
      messageID
    )
  ) {

    return true;

  }

  seenMessages.add(
    messageID
  );

  while (
    seenMessages.size >
    MAX_SEEN_MESSAGES
  ) {

    const oldest =
      seenMessages
        .values()
        .next()
        .value;

    if (!oldest) {
      break;
    }

    seenMessages.delete(
      oldest
    );

  }

  return false;

}

// ============================================================
// 21. ENQUEUE
// ============================================================

function enqueue(item) {

  if (!item) {
    return false;
  }

  if (!item.api) {
    return false;
  }

  if (!item.threadID) {
    return false;
  }

  if (
    queue.length >=
    MAX_QUEUE
  ) {

    logError(
      "Queue full",
      new Error(
        "Maximum queue reached"
      )
    );

    return false;

  }

  queue.push({

    ...item,

    retries: 0,

    createdAt:
      Date.now()

  });

  stats.queuePeak =
    Math.max(
      stats.queuePeak,
      queue.length
    );

  startQueue();

  return true;

}

// ============================================================
// 22. START QUEUE
// ============================================================

function startQueue() {

  if (shuttingDown) {
    return;
  }

  if (queueRunning) {
    return;
  }

  if (queue.length === 0) {
    return;
  }

  queueRunning = true;

  processQueue()

    .catch(error => {

      logError(
        "Queue crashed",
        error
      );

    })

    .finally(() => {

      queueRunning = false;

      if (
        !shuttingDown &&
        queue.length > 0
      ) {

        setTimeout(
          startQueue,
          1000
        );

      }

    });

}

// ============================================================
// 23. PROCESS QUEUE
// ============================================================

async function processQueue() {

  while (
    queue.length > 0 &&
    !shuttingDown
  ) {

    const item =
      queue[0];

    if (!item) {

      queue.shift();

      continue;

    }

    if (!data.active) {

      await sleep(1000);

      continue;

    }

    const userKey =

      `${item.threadID}:` +
      `${item.senderID}`;

    const lastReply =
      userLastReply.get(
        userKey
      ) || 0;

    const elapsed =
      Date.now() -
      lastReply;

    const remaining =
      data.cooldown -
      elapsed;

    if (remaining > 0) {

      await sleep(
        Math.min(
          remaining,
          1000
        )
      );

      continue;

    }

    await sleep(
      data.delay
    );

    if (!data.active) {
      continue;
    }

    const reply =

      `♾️ [GOJO SATORU]\n\n` +
      `${randomReply()}`;

    let sent = false;

    try {

      sent = await send(

        item.api,

        reply,

        item.threadID,

        item.messageID

      );

    } catch (error) {

      logError(
        "Queue send exception",
        error
      );

    }

    if (sent) {

      userLastReply.set(
        userKey,
        Date.now()
      );

      data.totalReplies++;

      data.lastReplyAt =
        Date.now();

      stats.replied++;

      saveData();

      queue.shift();

      continue;

    }

    item.retries++;

    stats.retries++;

    data.totalRetries++;

    saveData();

    if (
      item.retries >=
      MAX_RETRIES
    ) {

      queue.shift();

      await sleep(2000);

      continue;

    }

    const retryDelay =
      Math.min(
        15000,
        2000 *
        Math.pow(
          2,
          item.retries - 1
        )
      );

    await sleep(
      retryDelay
    );

  }

}

// ============================================================
// 24. CLEANUP
// ============================================================

function cleanupCooldowns() {

  const now =
    Date.now();

  const MAX_AGE =
    60 * 60 * 1000;

  for (
    const [
      key,
      timestamp
    ]
    of userLastReply.entries()
  ) {

    if (
      now - timestamp >
      MAX_AGE
    ) {

      userLastReply.delete(
        key
      );

    }

  }

}

// ============================================================
// 25. HEALTH CHECK
// ============================================================

setInterval(
  () => {

    if (healthRunning) {
      return;
    }

    healthRunning = true;

    try {

      cleanupCooldowns();

      if (
        data.active &&
        queue.length > 0 &&
        !queueRunning &&
        !shuttingDown
      ) {

        stats.recoveredWorkers++;

        console.log(
          "[GOJO] Queue worker recovered."
        );

        startQueue();

      }

    } catch (error) {

      logError(
        "Health check failed",
        error
      );

    } finally {

      healthRunning = false;

    }

  },
  30000
);

// ============================================================
// 26. BACKUP TIMER
// ============================================================

setInterval(
  () => {

    try {

      saveData();

      backupData();

    } catch (error) {

      logError(
        "Automatic backup failed",
        error
      );

    }

  },
  5 * 60 * 1000
);

// ============================================================
// 27. UNHANDLED REJECTION
// ============================================================

process.on(
  "unhandledRejection",
  error => {

    logError(
      "Unhandled rejection",
      error
    );

    setTimeout(
      () => {

        if (
          data.active &&
          queue.length > 0 &&
          !queueRunning &&
          !shuttingDown
        ) {

          startQueue();

        }

      },
      3000
    );

  }
);

// ============================================================
// 28. UNCaught EXCEPTION
// ============================================================

process.on(
  "uncaughtException",
  error => {

    logError(
      "Uncaught exception",
      error
    );

    setTimeout(
      () => {

        if (
          data.active &&
          queue.length > 0 &&
          !queueRunning &&
          !shuttingDown
        ) {

          startQueue();

        }

      },
      3000
    );

  }
);

// ============================================================
// 29. HANDLE EVENT
// ============================================================

module.exports.handleEvent =
async function ({
  api,
  event
}) {

  try {

    if (!event) {
      return;
    }

    const {
      threadID,
      senderID,
      messageID,
      body
    } = event;

    if (!threadID) {
      return;
    }

    if (!senderID) {
      return;
    }

    if (!messageID) {
      return;
    }

    // --------------------------------------------------------
    // IGNORE BOT'S OWN MESSAGE
    // --------------------------------------------------------

    try {

      if (
        typeof api.getCurrentUserID ===
        "function"
      ) {

        const botID =
          api.getCurrentUserID();

        if (
          String(senderID) ===
          String(botID)
        ) {

          return;

        }

      }

    } catch (error) {

      logError(
        "Bot ID check failed",
        error
      );

    }

    // --------------------------------------------------------
    // DUPLICATE
    // --------------------------------------------------------

    if (
      isDuplicate(
        messageID
      )
    ) {

      return;

    }

    stats.received++;

    data.totalReceived++;

    // --------------------------------------------------------
    // TARGET PERSON
    // --------------------------------------------------------

    if (
      !isTargetUser(
        senderID
      )
    ) {

      return;

    }

    stats.targetReceived++;

    // --------------------------------------------------------
    // AUTO REACT
    // --------------------------------------------------------

    if (
      data.autoReact
    ) {

      react(
        api,
        messageID
      );

    }

    // --------------------------------------------------------
    // BOT STATUS
    // --------------------------------------------------------

    if (
      !data.active
    ) {

      return;

    }

    // -----------------------------------------------------
