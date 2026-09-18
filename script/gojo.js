// ======================================================
// GOJO BOT V12 | INFINITY MAKUNAT EDITION
// Sanzu-style command module
// Queue Recovery + Retry + Watchdog + Safe Storage
// ======================================================

const fs = require("fs");
const path = require("path");

// ======================================================
// CONFIG
// ======================================================

const ADMIN_ID = "61594055835097";

const DATA_FILE = path.join(
  __dirname,
  "gojo_data.json"
);

const LOG_FILE = path.join(
  __dirname,
  "gojo_error.log"
);

const TEMP_FILE =
  DATA_FILE + ".tmp";

const DEFAULT_DATA = {
  active: true,
  autoReact: true,
  delay: 2000,
  cooldown: 3000,
  totalReplies: 0
};

// Queue limits
const MAX_QUEUE = 500;
const MAX_SEEN = 3000;

// Retry settings
const MAX_SEND_RETRIES = 5;
const RETRY_DELAY = 5000;

// Watchdog
const WATCHDOG_INTERVAL = 30000;
const STUCK_TIMEOUT = 120000;

// ======================================================
// RUNTIME STATE
// ======================================================

let data = {
  ...DEFAULT_DATA
};

let queue = [];

let queueRunning = false;

let watchdogRunning = false;

let lastQueueActivity = Date.now();

let lastSaveTime = 0;

const seenMessages = new Set();

const userLastReply = new Map();

// ======================================================
// LOGGING
// ======================================================

function logInfo(message) {
  const output =
    `[${new Date().toISOString()}] ${message}`;

  console.log(output);
}

function logError(where, error) {
  const message =
    `[${new Date().toISOString()}] ${where}: ` +
    `${error?.stack || error}\n`;

  console.error(message);

  try {
    fs.appendFileSync(
      LOG_FILE,
      message,
      "utf8"
    );
  } catch (_) {}
}

// ======================================================
// SLEEP
// ======================================================

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

// ======================================================
// DATA VALIDATION
// ======================================================

function normalizeData(input) {
  const result = {
    ...DEFAULT_DATA,
    ...(input &&
    typeof input === "object"
      ? input
      : {})
  };

  result.active =
    result.active !== false;

  result.autoReact =
    result.autoReact !== false;

  const delay =
    Number(result.delay);

  result.delay =
    Number.isFinite(delay)
      ? Math.max(
          0,
          Math.min(delay, 10000)
        )
      : DEFAULT_DATA.delay;

  const cooldown =
    Number(result.cooldown);

  result.cooldown =
    Number.isFinite(cooldown)
      ? Math.max(
          0,
          Math.min(cooldown, 60000)
        )
      : DEFAULT_DATA.cooldown;

  const totalReplies =
    Number(result.totalReplies);

  result.totalReplies =
    Number.isFinite(totalReplies)
      ? Math.max(0, totalReplies)
      : 0;

  return result;
}

// ======================================================
// LOAD DATA
// ======================================================

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      data = {
        ...DEFAULT_DATA
      };

      saveData();

      return;
    }

    const raw =
      fs.readFileSync(
        DATA_FILE,
        "utf8"
      );

    if (!raw.trim()) {
      data = {
        ...DEFAULT_DATA
      };

      return;
    }

    const saved =
      JSON.parse(raw);

    data =
      normalizeData(saved);

  } catch (error) {

    logError(
      "Load data failed",
      error
    );

    data = {
      ...DEFAULT_DATA
    };
  }
}

// ======================================================
// SAVE DATA
// ======================================================

function saveData() {
  try {

    const normalized =
      normalizeData(data);

    const json =
      JSON.stringify(
        normalized,
        null,
        2
      );

    fs.writeFileSync(
      TEMP_FILE,
      json,
      "utf8"
    );

    if (fs.existsSync(DATA_FILE)) {
      try {
        fs.copyFileSync(
          DATA_FILE,
          DATA_FILE + ".bak"
        );
      } catch (backupError) {
        logError(
          "Backup failed",
          backupError
        );
      }
    }

    fs.renameSync(
      TEMP_FILE,
      DATA_FILE
    );

    lastSaveTime =
      Date.now();

    return true;

  } catch (error) {

    logError(
      "Save data failed",
      error
    );

    try {
      if (
        fs.existsSync(TEMP_FILE)
      ) {
        fs.unlinkSync(
          TEMP_FILE
        );
      }
    } catch (_) {}

    return false;
  }
}

// Initial load
loadData();

// ======================================================
// GOJO REPLIES
// ======================================================

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
  "Gojo Satoru: present. 😎"
];

// ======================================================
// GENERATED REPLY BANK
// ======================================================

const PREFIXES = [
  "♾️ Gojo mode",
  "👁️ Six Eyes",
  "🌌 Infinite Void",
  "💙 Honored One",
  "⚡ Infinity"
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
  "reply queued"
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

// ======================================================
// RANDOM REPLY
// ======================================================

function randomReply() {
  if (!REPLIES.length) {
    return "♾️ Gojo is online.";
  }

  const index =
    Math.floor(
      Math.random() *
      REPLIES.length
    );

  return REPLIES[index];
}

// ======================================================
// ADMIN
// ======================================================

function isAdmin(id) {
  return (
    String(id) ===
    String(ADMIN_ID)
  );
}

// ======================================================
// SEND NORMAL MESSAGE
// ======================================================

function send(
  api,
  message,
  threadID,
  messageID
) {

  return new Promise(resolve => {

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

            resolve(false);
            return;
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

// ======================================================
// REACTION
// ======================================================

function react(
  api,
  messageID
) {

  try {

    if (
      !api ||
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

// ======================================================
// TYPING INDICATOR
// ======================================================

function typing(
  api,
  threadID
) {

  try {

    if (
      !api ||
      typeof api.sendTypingIndicator !==
        "function"
    ) {
      return;
    }

    api.sendTypingIndicator(
      threadID,
      () => {}
    );

  } catch (error) {

    logError(
      "Typing indicator failed",
      error
    );
  }
}

// ======================================================
// REMEMBER MESSAGE
// ======================================================

function rememberMessage(
  messageID
) {

  const id =
    String(messageID);

  if (
    seenMessages.has(id)
  ) {
    return false;
  }

  seenMessages.add(id);

  while (
    seenMessages.size >
    MAX_SEEN
  ) {

    const oldest =
      seenMessages
        .values()
        .next()
        .value;

    if (
      oldest === undefined
    ) {
      break;
    }

    seenMessages.delete(
      oldest
    );
  }

  return true;
}

// ======================================================
// QUEUE
// ======================================================

function enqueue(item) {

  if (
    !item ||
    !item.api ||
    !item.threadID ||
    !item.senderID ||
    !item.messageID
  ) {
    return;
  }

  if (
    queue.length >=
    MAX_QUEUE
  ) {

    logInfo(
      "Queue full. Oldest pending item removed."
    );

    queue.shift();
  }

  queue.push(item);

  lastQueueActivity =
    Date.now();

  logInfo(
    `Message queued | Queue=${queue.length}`
  );

  startQueue();
}

// ======================================================
// START QUEUE
// ======================================================

function startQueue() {

  if (queueRunning) {
    return;
  }

  if (!queue.length) {
    return;
  }

  queueRunning = true;

  lastQueueActivity =
    Date.now();

  processQueue()
    .catch(error => {

      logError(
        "Queue processor crashed",
        error
      );

    })
    .finally(() => {

      queueRunning = false;

      lastQueueActivity =
        Date.now();

      // Automatic recovery.
      if (
        queue.length > 0
      ) {

        setTimeout(() => {
          startQueue();
        }, 1000);

      }

    });
}

// ======================================================
// SAFE API SEND WITH RETRIES
// ======================================================

async function safeQueueSend(
  api,
  message,
  threadID,
  messageID
) {

  for (
    let attempt = 1;
    attempt <= MAX_SEND_RETRIES;
    attempt++
  ) {

    try {

      const success =
        await new Promise(
          resolve => {

            let finished = false;

            const done =
              value => {

                if (finished) {
                  return;
                }

                finished = true;

                resolve(value);
              };

            try {

              api.sendMessage(
                message,
                threadID,
                error => {

                  if (error) {

                    logError(
                      `Queue send attempt ${attempt}`,
                      error
                    );

                    done(false);
                    return;
                  }

                  done(true);
                },
                messageID
              );

            } catch (error) {

              logError(
                "Queue send exception",
                error
              );

              done(false);
            }
          }
        );

      if (success) {
        return true;
      }

    } catch (error) {

      logError(
        "Safe send failed",
        error
      );
    }

    if (
      attempt <
      MAX_SEND_RETRIES
    ) {

      const retry =
        Math.min(
          RETRY_DELAY *
            attempt,
          30000
        );

      await sleep(retry);
    }
  }

  return false;
}

// ======================================================
// PROCESS QUEUE
// ======================================================

async function processQueue() {

  while (
    queue.length > 0
  ) {

    lastQueueActivity =
      Date.now();

    const item =
      queue[0];

    if (!item) {
      queue.shift();
      continue;
    }

    try {

      // ----------------------------------------------
      // RELOAD SETTINGS
      // ----------------------------------------------

      loadData();

      // ----------------------------------------------
      // BOT OFF
      // ----------------------------------------------

      if (!data.active) {

        await sleep(1000);

        continue;
      }

      // ----------------------------------------------
      // USER COOLDOWN
      // ----------------------------------------------

      const key =
        `${item.threadID}:${item.senderID}`;

      const last =
        userLastReply.get(key) || 0;

      const elapsed =
        Date.now() - last;

      const cooldown =
        Number(data.cooldown) || 0;

      const remaining =
        cooldown - elapsed;

      if (
        remaining > 0
      ) {

        await sleep(
          Math.min(
            remaining,
            5000
          )
        );

        continue;
      }

      // ----------------------------------------------
      // TYPING
      // ----------------------------------------------

      typing(
        item.api,
        item.threadID
      );

      // ----------------------------------------------
      // DELAY
      // ----------------------------------------------

      const delay =
        Math.max(
          0,
          Math.min(
            Number(data.delay) || 0,
            10000
          )
        );

      if (
        delay > 0
      ) {

        await sleep(delay);
      }

      // ----------------------------------------------
      // CHECK AGAIN
      // ----------------------------------------------

      loadData();

      if (!data.active) {
        continue;
      }

      // ----------------------------------------------
      // BUILD REPLY
      // ----------------------------------------------

      const reply =
        `♾️ [GOJO SATORU]\n\n${randomReply()}`;

      // ----------------------------------------------
      // SEND
      // ----------------------------------------------

      const sent =
        await safeQueueSend(
          item.api,
          reply,
          item.threadID,
          item.messageID
        );

      // ----------------------------------------------
      // SUCCESS
      // ----------------------------------------------

      if (sent) {

        userLastReply.set(
          key,
          Date.now()
        );

        data.totalReplies =
          Number(
            data.totalReplies || 0
          ) + 1;

        saveData();

        queue.shift();

        logInfo(
          `Reply sent | Remaining=${queue.length} | Total=${data.totalReplies}`
        );

        lastQueueActivity =
          Date.now();

        continue;
      }

      // ----------------------------------------------
      // FAILED AFTER RETRIES
      // ----------------------------------------------

      logInfo(
        "Message could not be sent after retries. Removing failed item."
      );

      queue.shift();

      await sleep(
        3000
      );

    } catch (error) {

      logError(
        "Queue item failed",
        error
      );

      // Remove only the broken item
      // so it cannot permanently block
      // every item behind it.
      queue.shift();

      await sleep(
        3000
      );
    }
  }
}

// ======================================================
// QUEUE WATCHDOG
// ======================================================

function startWatchdog() {

  if (
    watchdogRunning
  ) {
    return;
  }

  watchdogRunning = true;

  setInterval(() => {

    try {

      // Queue exists but processor stopped.
      if (
        queue.length > 0 &&
        !queueRunning
      ) {

        logInfo(
          "WATCHDOG: Queue stopped. Restarting processor."
        );

        startQueue();

        return;
      }

      // Queue processor has not moved
      // for a long time.
      if (
        queue.length > 0 &&
        queueRunning &&
        Date.now() -
          lastQueueActivity >
          STUCK_TIMEOUT
      ) {

        logInfo(
          "WATCHDOG: Queue appears stuck. Attempting recovery."
        );

        queueRunning =
          false;

        setTimeout(
          () => {
            startQueue();
          },
          1000
        );

      }

    } catch (error) {

      logError(
        "Watchdog error",
        error
      );

    }

  }, WATCHDOG_INTERVAL);

  logInfo(
    "♾️ Infinity Watchdog started."
  );
}

// ======================================================
// MEMORY CLEANUP
// ======================================================

function cleanupMemory() {

  try {

    while (
      seenMessages.size >
      MAX_SEEN
    ) {

      const oldest =
        seenMessages
          .values()
          .next()
          .value;

      if (
        oldest === undefined
      ) {
        break;
      }

      seenMessages.delete(
        oldest
      );
    }

    // Remove old cooldown entries.
    const now =
      Date.now();

    const MAX_COOLDOWN_MEMORY =
      60 * 60 * 1000;

    for (
      const [
        key,
        timestamp
      ] of userLastReply.entries()
    ) {

      if (
        now - timestamp >
        MAX_COOLDOWN_MEMORY
      ) {

        userLastReply.delete(
          key
        );
      }
    }

  } catch (error) {

    logError(
      "Memory cleanup failed",
      error
    );
  }
}

// ======================================================
// MAINTENANCE LOOP
// ======================================================

setInterval(() => {

  try {

    cleanupMemory();

    loadData();

    if (
      queue.length > 0 &&
      !queueRunning &&
      data.active
    ) {

      startQueue();
    }

  } catch (error) {

    logError(
      "Maintenance failed",
      error
    );

  }

}, 60000);

// ===========================
