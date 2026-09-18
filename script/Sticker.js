// ======================================================
// STICKER.JS V2 | MAKUNAT EDITION
// SANZU COMPATIBLE
// RANDOM STICKER + AUTO STICKER
// QUEUE + COOLDOWN + RETRY + RENDER
// ======================================================

const ADMIN_ID = "61594055835097";

// ======================================================
// SETTINGS
// ======================================================

const AUTO_COOLDOWN = 15000; // 15 seconds per GC
const SEND_DELAY = 1000;
const MAX_QUEUE = 50;
const MAX_SEEN = 1000;
const MAX_RETRIES = 3;

// ======================================================
// STICKER COLLECTION
// ======================================================
//
// PALITAN ANG SAMPLE IDs NG ACTUAL STICKER IDs.
//
// Format:
// "STICKER_ID": "NAME"
//
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

let queueRunning = false;

let totalSent = 0;
let totalReceived = 0;
let totalErrors = 0;

// ======================================================
// CONFIG
// ======================================================

module.exports.config = {
  name: "sticker",
  version: "2.0.0",
  hasPermission: 0,
  credits: "Ryuk",
  description:
    "Makunat random sticker system",
  usePrefix: true,
  commandCategory: "Fun",
  usages:
    "/sticker | /sticker random | /sticker list | /sticker auto on",
  cooldowns: 3
};

// ======================================================
// HELPERS
// ======================================================

function isAdmin(id) {
  return String(id) === String(ADMIN_ID);
}

function sleep(ms) {
  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}

function sendMessage(api, message, threadID) {
  return new Promise(resolve => {
    try {
      api.sendMessage(
        message,
        threadID,
        () => resolve()
      );
    } catch (err) {
      totalErrors++;

      console.error(
        "[STICKER SEND ERROR]",
        err
      );

      resolve();
    }
  });
}

// ======================================================
// RANDOM STICKER
// ======================================================

function randomSticker() {
  const ids = Object.keys(STICKERS);

  if (!ids.length) {
    return null;
  }

  return ids[
    Math.floor(
      Math.random() * ids.length
    )
  ];
}

// ======================================================
// DUPLICATE PROTECTION
// ======================================================

function isDuplicate(messageID) {
  if (!messageID) {
    return false;
  }

  const id = String(messageID);

  if (seenMessages.has(id)) {
    return true;
  }

  seenMessages.add(id);

  if (seenMessages.size > MAX_SEEN) {
    const first =
      seenMessages.values()
        .next()
        .value;

    if (first) {
      seenMessages.delete(first);
    }
  }

  return false;
}

// ======================================================
// SAFE STICKER SEND
// ======================================================

async function safeSendSticker(
  api,
  threadID,
  stickerID
) {
  if (
    !api ||
    !threadID ||
    !stickerID
  ) {
    return false;
  }

  for (
    let attempt = 1;
    attempt <= MAX_RETRIES;
    attempt++
  ) {
    try {

      await new Promise(
        (resolve, reject) => {

          api.sendMessage(
            {
              sticker: String(stickerID)
            },
            threadID,
            err => {

              if (err) {
                return reject(err);
              }

              resolve();
            }
          );

        }
      );

      totalSent++;

      return true;

    } catch (err) {

      totalErrors++;

      console.error(
        `[STICKER RETRY ${attempt}]`,
        err
      );

      if (
        attempt < MAX_RETRIES
      ) {
        await sleep(
          attempt * 2000
        );
      }
    }
  }

  return false;
}

// ======================================================
// QUEUE
// ======================================================

function enqueue(item) {

  if (!item) {
    return;
  }

  // Protect against unlimited queue growth.
  if (
    queue.length >= MAX_QUEUE
  ) {
    queue.shift();
  }

  queue.push(item);

  startQueue();
}

// ======================================================
// QUEUE WORKER
// ======================================================

async function startQueue() {

  if (queueRunning) {
    return;
  }

  queueRunning = true;

  try {

    while (queue.length > 0) {

      const item =
        queue.shift();

      if (!item) {
        continue;
      }

      await processQueueItem(
        item
      );

      await sleep(
        SEND_DELAY
      );
    }

  } catch (err) {

    totalErrors++;

    console.error(
      "[STICKER QUEUE ERROR]",
      err
    );

  } finally {

    queueRunning = false;
  }

  // Restart worker if something
  // was added while shutting down.
  if (queue.length > 0) {

    setTimeout(
      startQueue,
      1000
    );
  }
}

// ======================================================
// PROCESS QUEUE ITEM
// ======================================================

async function processQueueItem(
  item
) {
  try {

    if (
      !item ||
      !item.api ||
      !item.threadID
    ) {
      return;
    }

    const stickerID =
      randomSticker();

    if (!stickerID) {
      return;
    }

    await safeSendSticker(
      item.api,
      item.threadID,
      stickerID
    );

  } catch (err) {

    totalErrors++;

    console.error(
      "[STICKER PROCESS ERROR]",
      err
    );
  }
}

// ======================================================
// COMMAND
// ======================================================

module.exports.run = async function ({
  api,
  event,
  args
}) {
  try {

    const threadID =
      event?.threadID;

    const senderID =
      event?.senderID;

    if (!threadID) {
      return;
    }

    const command =
      String(
        args?.[0] || ""
      ).toLowerCase();

    // ==================================================
    // /sticker
    // ==================================================

    if (
      command === "" ||
      command === "random"
    ) {

      const stickerID =
        randomSticker();

      if (!stickerID) {

        return sendMessage(
          api,
          "❌ Walang sticker sa collection.",
          threadID
        );
      }

      return safeSendSticker(
        api,
        threadID,
        stickerID
      );
    }

    // ==================================================
    // /sticker list
    // ==================================================

    if (
      command === "list"
    ) {

      const ids =
        Object.keys(
          STICKERS
        );

      if (!ids.length) {

        return sendMessage(
          api,
          "❌ Empty ang sticker collection.",
          threadID
        );
      }

      let text =
        "🎨 STICKER COLLECTION\n\n";

      ids.forEach(
        (id, index) => {

          text +=
            `${index + 1}. ` +
            `${STICKERS[id]}\n` +
            `ID: ${id}\n\n`;
        }
      );

      return sendMessage(
        api,
        text,
        threadID
      );
    }

    // ==================================================
    // /sticker auto on
    // ==================================================

    if (
      command === "auto" &&
      String(
        args?.[1] || ""
      ).toLowerCase() === "on"
    ) {

      if (!isAdmin(senderID)) {

        return sendMessage(
          api,
          "❌ Admin only.",
          threadID
        );
      }

      autoStickerThreads.add(
        threadID
      );

      return sendMessage(
        api,
        "🎨 AUTO STICKER: ON\n\n" +
        `Cooldown: ${AUTO_COOLDOWN}ms\n` +
        "Queue protection: ON",
        threadID
      );
    }

    // ==================================================
    // /sticker auto off
    // ==================================================

    if (
      command === "auto" &&
      String(
        args?.[1] || ""
      ).toLowerCase() === "off"
    ) {

      if (!isAdmin(senderID)) {

        return sendMessage(
          api,
          "❌ Admin only.",
          threadID
        );
      }

      autoStickerThreads.delete(
        threadID
      );

      cooldowns.delete(
        threadID
      );

      return sendMessage(
        api,
        "🛑 AUTO STICKER: OFF",
        threadID
      );
    }

    // ==================================================
    // /sticker add
    // ==================================================

    if (
      command === "add"
    ) {

      if (!isAdmin(senderID)) {

        return sendMessage(
          api,
          "❌ Admin only.",
          threadID
        );
      }

      const stickerID =
        String(
          args?.[1] || ""
        ).trim();

      const name =
        args
          .slice(2)
          .join(" ")
          .trim() ||
        "Custom Sticker";

      if (!stickerID) {

        return sendMessage(
          api,
          "Usage:\n" +
          "/sticker add ID NAME",
          threadID
        );
      }

      STICKERS[
        stickerID
      ] = name;

      return sendMessage(
        api,
        "✅ STICKER ADDED\n\n" +
        `Name: ${name}\n` +
        `ID: ${stickerID}`,
        threadID
      );
    }

    // ==================================================
    // /sticker remove
    // ==================================================

    if (
      command === "remove"
    ) {

      if (!isAdmin(senderID)) {

        return sendMessage(
          api,
          "❌ Admin only.",
          threadID
        );
      }

      const stickerID =
        String(
          args?.[1] || ""
        ).trim();

      if (!stickerID) {

        return sendMessage(
          api,
          "Usage:\n" +
          "/sticker remove ID",
          threadID
        );
      }

      if (
        !Object.prototype
          .hasOwnProperty
          .call(
            STICKERS,
            stickerID
          )
      ) {

        return sendMessage(
          api,
          "❌ Sticker ID not found.",
          threadID
        );
      }

      delete STICKERS[
        stickerID
      ];

      return sendMessage(
        api,
        "🗑️ Sticker removed.",
        threadID
      );
    }

    // ==================================================
    // /sticker send
    // ==================================================

    if (
      command === "send"
    ) {

      const stickerID =
        String(
          args?.[1] || ""
        ).trim();

      if (!stickerID) {

        return sendMessage(
          api,
          "Usage:\n" +
          "/sticker send ID",
          threadID
        );
      }

      return safeSendSticker(
        api,
        threadID,
        stickerID
      );
    }

    // ==================================================
    // /sticker queue
    // ==================================================

    if (
      command === "queue"
    ) {

      return sendMessage(
        api,
        "📦 STICKER QUEUE\n\n" +
        `Queue: ${queue.length}\n` +
        `Limit: ${MAX_QUEUE}\n` +
        `Worker: ${
          queueRunning
            ? "RUNNING"
            : "IDLE"
        }`,
        threadID
      );
    }

    // ==================================================
    // /sticker clear
    // ==================================================

    if (
      command === "clear"
    ) {

      if (!isAdmin(senderID)) {

        return sendMessage(
          api,
          "❌ Admin only.",
          threadID
        );
      }

      queue.length = 0;

      cooldowns.clear();

      return sendMessage(
        api,
        "🧹 Sticker queue and cooldowns cleared.",
        threadID
      );
    }

    // ==================================================
    // /sticker status
    // ==================================================

    if (
      command === "status"
    ) {

      return sendMessage(
        api,
        "🎨 STICKER STATUS\n\n" +
        `Stickers: ${
          Object.keys(STICKERS).length
        }\n` +
        `Auto: ${
          autoStickerThreads.has(
            threadID
          )
            ? "ON"
            : "OFF"
        }\n` +
        `Cooldown: ${AUTO_COOLDOWN}ms\n` +
        `Queue: ${queue.length}\n` +
        `Worker: ${
          queueRunning
            ? "RUNNING"
            : "IDLE"
        }\n` +
        `Sent: ${totalSent}\n` +
        `Received: ${totalReceived}\n` +
        `Errors: ${totalErrors}`,
        threadID
      );
    }

    // ==================================================
    // HELP
    // ==================================================

    return sendMessage(
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

  } catch (err) {

    totalErrors++;

    console.error(
      "[STICKER COMMAND ERROR]",
      err
    );
  }
};

// ======================================================
// HANDLE EVENT
// ======================================================

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
      messageID
    } = event;

    if (
      !threadID ||
      !senderID
    ) {
      return;
    }

    totalReceived++;

    // ==================================================
    // DUPLICATE EVENT PROTECTION
    // ==================================================

    if (
      isDuplicate(messageID)
    ) {
      return;
    }

    // ==================================================
    // AUTO STICKER CHECK
    // ==================================================

    if (
      !autoStickerThreads.has(
        threadID
      )
    ) {
      return;
    }

    // ==================================================
    // IGNORE BOT
    // ==================================================

    try {

      const botID =
        api.getCurrentUserID?.();

      if (
        botID &&
        String(botID) ===
        String(senderID)
      ) {
        return;
      }

    } catch (_) {}

    // ==================================================
    // PER-GC COOLDOWN
    // ==================================================

    const now =
      Date.now();

    const last =
      cooldowns.get(
        threadID
      ) || 0;

    if (
      now - last <
      AUTO_COOLDOWN
    ) {
      return;
    }

    cooldowns.set(
      threadID,
      now
    );

    // ==================================================
    // QUEUE
    // ==================================================

    enqueue({
      api,
      event,
      threadID,
      senderID,
      messageID
    });

    // ==================================================
    // CLEAN COOLDOWNS
    // ==================================================

    if (
      cooldowns.size > 1000
    ) {

      const entries =
        Array.from(
          cooldowns.keys()
        );

      for (
        const key of
        entries.slice(0, 500)
      ) {
        cooldowns.delete(
          key
        );
      }
    }

  } catch (err) {

    totalErrors++;

    console.error(
      "[STICKER EVENT ERROR]",
      err
    );
  }
};

// ======================================================
// RENDER
// ======================================================

module.exports.render =
async function ({
  api,
  event
}) {
  try {

    const threadID =
      event?.threadID;

    const autoStatus =
      threadID &&
      autoStickerThreads.has(
        threadID
      )
        ? "ON"
        : "OFF";

    const output =
      "🎨 STICKER RENDER\n\n" +

      `Sticker Count: ${
        Object.keys(STICKERS).length
      }\n` +

      `Auto Sticker: ${
        autoStatus
      }\n` +

      `Cooldown: ${
        AUTO_COOLDOWN
      }ms\n` +

      `Queue: ${
        queue.length
      }/${MAX_QUEUE}\n` +

      `Worker: ${
        queueRunning
          ? "RUNNING"
          : "IDLE"
      }\n\n` +

      `Sent: ${totalSent}\n` +
      `Received: ${totalReceived}\n` +
      `Errors: ${totalErrors}`;

    if (
      api &&
      threadID
    ) {

      return sendMessage(
        api,
        output,
        threadID
      );
    }

    return output;

  } catch (err) {

    console.error(
      "[STICKER RENDER ERROR]",
      err
    );

    return null;
  }
};

// ======================================================
// ERROR PROTECTION
// ======================================================

process.on(
  "unhandledRejection",
  err => {

    console.error(
      "[STICKER UNHANDLED]",
      err
    );
  }
);

// ======================================================
// END STICKER V2
// ======================================================
