
"use strict";

// ======================================================
// STICKER.JS V3 | MAKUNAT EDITION
// SANZU COMPATIBLE STYLE
// RANDOM + AUTO + QUEUE + COOLDOWN + RETRY
// ======================================================

const ADMIN_ID = "61594055835097";

const AUTO_COOLDOWN = 15000;
const SEND_DELAY = 1200;
const MAX_QUEUE = 30;
const MAX_SEEN = 1000;
const MAX_RETRIES = 2;

// ======================================================
// STICKER COLLECTION
// PALITAN NG VALID MESSENGER STICKER IDs
// ======================================================

const STICKERS = {
  "123456789012345": "Gojo",
  "123456789012346": "Ryuk",
  "123456789012347": "Funny",
  "123456789012348": "Random"
};

// ======================================================
// MEMORY
// ======================================================

const autoStickerThreads = new Set();
const cooldowns = new Map();
const seenMessages = new Set();

const queue = [];
const queuedThreads = new Set();

let queueRunning = false;
let totalSent = 0;
let totalReceived = 0;
let totalErrors = 0;

// ======================================================
// CONFIG
// ======================================================

module.exports.config = {
  name: "sticker",
  version: "3.0.0",
  hasPermission: 0,
  credits: "Ryuk",
  description: "Makunat random sticker system",
  usePrefix: true,
  commandCategory: "Fun",
  usages: "/sticker | random | list | send ID | auto on/off",
  cooldowns: 3
};

// ======================================================
// HELPERS
// ======================================================

function isAdmin(id) {
  return String(id) === ADMIN_ID;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sendText(api, text, threadID) {
  return new Promise(resolve => {
    try {
      api.sendMessage(text, threadID, err => {
        if (err) {
          totalErrors++;
          console.error("[STICKER TEXT ERROR]", err);
        }
        resolve(!err);
      });
    } catch (err) {
      totalErrors++;
      console.error("[STICKER TEXT ERROR]", err);
      resolve(false);
    }
  });
}

function validStickerID(id) {
  return /^\d+$/.test(String(id || "").trim());
}

function randomSticker() {
  const ids = Object.keys(STICKERS);
  if (!ids.length) return null;

  return ids[Math.floor(Math.random() * ids.length)];
}

// ======================================================
// STICKER SENDER
// ======================================================

async function safeSendSticker(api, threadID, stickerID) {
  if (!api || !threadID || !validStickerID(stickerID)) {
    return false;
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        api.sendMessage(
          { sticker: String(stickerID).trim() },
          threadID,
          err => err ? reject(err) : resolve()
        );
      });

      totalSent++;
      return true;

    } catch (err) {
      totalErrors++;

      console.error(
        `[STICKER SEND ERROR ${attempt}/${MAX_RETRIES}]`,
        err
      );

      if (attempt < MAX_RETRIES) {
        await sleep(attempt * 1500);
      }
    }
  }

  return false;
}

// ======================================================
// DUPLICATE PROTECTION
// ======================================================

function isDuplicate(messageID) {
  if (!messageID) return false;

  const id = String(messageID);

  if (seenMessages.has(id)) return true;

  seenMessages.add(id);

  if (seenMessages.size > MAX_SEEN) {
    const oldest = seenMessages.values().next().value;
    seenMessages.delete(oldest);
  }

  return false;
}

// ======================================================
// QUEUE
// ======================================================

function enqueue(item) {
  if (!item || !item.threadID) return;

  // One pending auto sticker per GC.
  if (queuedThreads.has(item.threadID)) return;

  // Drop new item if queue is full.
  if (queue.length >= MAX_QUEUE) return;

  queue.push(item);
  queuedThreads.add(item.threadID);

  startQueue();
}

async function startQueue() {
  if (queueRunning) return;

  queueRunning = true;

  try {
    while (queue.length > 0) {
      const item = queue.shift();

      if (!item) continue;

      queuedThreads.delete(item.threadID);

      // Do not send if auto was switched off.
      if (!autoStickerThreads.has(item.threadID)) continue;

      const stickerID = randomSticker();

      if (stickerID) {
        await safeSendSticker(
          item.api,
          item.threadID,
          stickerID
        );
      }

      await sleep(SEND_DELAY);
    }
  } catch (err) {
    totalErrors++;
    console.error("[STICKER QUEUE ERROR]", err);
  } finally {
    queueRunning = false;

    if (queue.length > 0) {
      startQueue();
    }
  }
}

// ======================================================
// COMMAND
// ======================================================

module.exports.run = async function ({ api, event, args }) {
  const threadID = event?.threadID;
  const senderID = event?.senderID;

  if (!threadID) return;

  const cmd = String(args?.[0] || "").toLowerCase();
  const sub = String(args?.[1] || "").toLowerCase();

  // /sticker or /sticker random
  if (!cmd || cmd === "random") {
    const id = randomSticker();

    if (!id) {
      return sendText(api, "❌ Walang sticker sa collection.", threadID);
    }

    return safeSendSticker(api, threadID, id);
  }

  // /sticker list
  if (cmd === "list") {
    const ids = Object.keys(STICKERS);

    if (!ids.length) {
      return sendText(api, "❌ Empty ang sticker collection.", threadID);
    }

    const text = ids.map((id, i) =>
      `${i + 1}. ${STICKERS[id]}\nID: ${id}`
    ).join("\n\n");

    return sendText(api, "🎨 STICKER COLLECTION\n\n" + text, threadID);
  }

  // /sticker send ID
  if (cmd === "send") {
    const id = String(args?.[1] || "").trim();

    if (!validStickerID(id)) {
      return sendText(api, "Usage: /sticker send ID", threadID);
    }

    return safeSendSticker(api, threadID, id);
  }

  // Admin commands
  if (["auto", "add", "remove", "clear"].includes(cmd)) {
    if (!isAdmin(senderID)) {
      return sendText(api, "❌ Admin only.", threadID);
    }
  }

  // /sticker auto on
  if (cmd === "auto" && sub === "on") {
    autoStickerThreads.add(threadID);

    return sendText(
      api,
      `🎨 AUTO STICKER ON\nCooldown: ${AUTO_COOLDOWN / 1000}s`,
      threadID
    );
  }

  // /sticker auto off
  if (cmd === "auto" && sub === "off") {
    autoStickerThreads.delete(threadID);
    cooldowns.delete(threadID);

    // Remove pending items for this GC.
    for (let i = queue.length - 1; i >= 0; i--) {
      if (queue[i].threadID === threadID) {
        queue.splice(i, 1);
      }
    }

    queuedThreads.delete(threadID);

    return sendText(api, "🛑 AUTO STICKER OFF", threadID);
  }

  // /sticker add ID NAME
  if (cmd === "add") {
    const id = String(args?.[1] || "").trim();
    const name = args.slice(2).join(" ").trim() || "Custom Sticker";

    if (!validStickerID(id)) {
      return sendText(api, "Usage: /sticker add ID NAME", threadID);
    }

    STICKERS[id] = name;

    return sendText(api, `✅ Added: ${name}\nID: ${id}`, threadID);
  }

  // /sticker remove ID
  if (cmd === "remove") {
    const id = String(args?.[1] || "").trim();

    if (!Object.prototype.hasOwnProperty.call(STICKERS, id)) {
      return sendText(api, "❌ Sticker ID not found.", threadID);
    }

    delete STICKERS[id];

    return sendText(api, "🗑️ Sticker removed.", threadID);
  }

  // /sticker clear
  if (cmd === "clear") {
    queue.length = 0;
    queuedThreads.clear();
    cooldowns.clear();

    return sendText(api, "🧹 Queue and cooldowns cleared.", threadID);
  }

  // /sticker status
  if (cmd === "status") {
    return sendText(
      api,
      "🎨 STICKER STATUS\n\n" +
      `Stickers: ${Object.keys(STICKERS).length}\n` +
      `Auto: ${autoStickerThreads.has(threadID) ? "ON" : "OFF"}\n` +
      `Queue: ${queue.length}/${MAX_QUEUE}\n` +
      `Worker: ${queueRunning ? "RUNNING" : "IDLE"}\n` +
      `Sent: ${totalSent}\nErrors: ${totalErrors}`,
      threadID
    );
  }

  // /sticker queue
  if (cmd === "queue") {
    return sendText(
      api,
      `📦 Queue: ${queue.length}/${MAX_QUEUE}\nWorker: ${queueRunning ? "RUNNING" : "IDLE"}`,
      threadID
    );
  }

  return sendText(
    api,
    "🎨 STICKER COMMANDS\n\n" +
    "/sticker\n" +
    "/sticker random\n" +
    "/sticker list\n" +
    "/sticker send ID\n" +
    "/sticker status\n" +
    "/sticker queue\n\n" +
    "ADMIN:\n" +
    "/sticker auto on\n" +
    "/sticker auto off\n" +
    "/sticker add ID NAME\n" +
    "/sticker remove ID\n" +
    "/sticker clear",
    threadID
  );
};

// ======================================================
// HANDLE EVENT
// ======================================================

module.exports.handleEvent = async function ({ api, event }) {
  try {
    if (!event?.threadID || !event?.senderID) return;

    const { threadID, senderID, messageID } = event;

    totalReceived++;

    if (isDuplicate(messageID)) return;

    if (!autoStickerThreads.has(threadID)) return;

    // Ignore bot's own messages.
    try {
      const botID = api.getCurrentUserID?.();

      if (botID && String(botID) === String(senderID)) {
        return;
      }
    } catch (_) {}

    const now = Date.now();
    const last = cooldowns.get(threadID) || 0;

    if (now - last < AUTO_COOLDOWN) return;

    cooldowns.set(threadID, now);

    enqueue({ api, threadID, senderID, messageID });

    // Keep cooldown memory bounded.
    if (cooldowns.size > 1000) {
      const oldestKeys = Array.from(cooldowns.keys()).slice(0, 500);

      for (const key of oldestKeys) {
        cooldowns.delete(key);
      }
    }

  } catch (err) {
    totalErrors++;
    console.error("[STICKER EVENT ERROR]", err);
  }
};

// ======================================================
// RENDER
// ======================================================

module.exports.render = async function ({ api, event }) {
  const threadID = event?.threadID;

  const output =
    "🎨 STICKER RENDER\n\n" +
    `Sticker Count: ${Object.keys(STICKERS).length}\n` +
    `Auto: ${threadID && autoStickerThreads.has(threadID) ? "ON" : "OFF"}\n` +
    `Cooldown: ${AUTO_COOLDOWN / 1000}s\n` +
    `Queue: ${queue.length}/${MAX_QUEUE}\n` +
    `Worker: ${queueRunning ? "RUNNING" : "IDLE"}\n\n` +
    `Sent: ${totalSent}\n` +
    `Received: ${totalReceived}\n` +
    `Errors: ${totalErrors}`;

  if (api && threadID) {
    return sendText(api, output, threadID);
  }

  return output;
};

// ======================================================
// END STICKER V3
// ======================================================
                                           
