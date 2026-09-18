"use strict";

const fs = require("fs");
const path = require("path");

// ============================================================
// BOT CONFIG
// ============================================================

const ADMIN_ID = "61594055835097";
const DATA_FILE = path.join(__dirname, "adminbot_data.json");

const MAX_QUEUE = 100;
const COOLDOWN = 5000;
const REPLY_DELAY = 2000;

// ============================================================
// DATA
// ============================================================

const DEFAULT_DATA = {
  activeThreads: {},
  autoReact: true
};

let data;

try {
  data = fs.existsSync(DATA_FILE)
    ? { ...DEFAULT_DATA, ...JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) }
    : { ...DEFAULT_DATA };

  if (!data.activeThreads || typeof data.activeThreads !== "object") {
    data.activeThreads = {};
  }
} catch {
  data = { ...DEFAULT_DATA };
}

function save() {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(data, null, 2)
    );
  } catch {}
}

// ============================================================
// STATE
// ============================================================

const queue = [];
const cooldowns = new Map();

let running = false;
let stopped = false;

// ============================================================
// HELPERS
// ============================================================

function isAdmin(id) {
  return String(id) === ADMIN_ID;
}

function isActive(threadID) {
  return data.activeThreads[String(threadID)] === true;
}

function isSilent(body) {
  return (
    typeof body === "string" &&
    /^\/silent(?:\s|$)/i.test(body.trim())
  );
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// SAFE SEND
// ============================================================

function send(api, message, threadID) {
  return new Promise(resolve => {
    try {
      api.sendMessage(message, threadID, () => {
        resolve(true);
      });
    } catch {
      resolve(false);
    }
  });
}

// ============================================================
// REPLIES
// ============================================================

const REPLIES = [
  "😎 Gojo is still online.",
  "♾️ Limitless active.",
  "🕶️ Still here.",
  "😏 Nice try.",
  "👀 I saw that.",
  "🌀 Domain Expansion.",
  "♾️ Infinity remains active.",
  "😎 Bot online.",
  "😂 Still running.",
  "🕶️ Gojo detected."
];

function randomReply() {
  return REPLIES[
    Math.floor(Math.random() * REPLIES.length)
  ];
}

// ============================================================
// QUEUE
// ============================================================

function addQueue(item) {
  if (!item) return;
  if (queue.length >= MAX_QUEUE) return;

  queue.push(item);
  void worker();
}

async function worker() {
  if (running || stopped) return;

  running = true;

  try {
    while (queue.length && !stopped) {
      const item = queue.shift();

      if (!item) continue;
      if (!isActive(item.threadID)) continue;

      const key =
        `${item.threadID}:${item.senderID}`;

      const now = Date.now();
      const last = cooldowns.get(key) || 0;

      if (now - last < COOLDOWN) continue;

      cooldowns.set(key, now);

      if (
        data.autoReact &&
        item.messageID &&
        typeof item.api.setMessageReaction === "function"
      ) {
        try {
          item.api.setMessageReaction(
            "😎",
            item.messageID,
            () => {},
            true
          );
        } catch {}
      }

      await sleep(REPLY_DELAY);

      if (!isActive(item.threadID)) continue;

      await send(
        item.api,
        randomReply(),
        item.threadID
      );
    }
  } catch (err) {
    console.error("[ADMINBOT] Worker error:", err);
  }

  running = false;

  if (queue.length && !stopped) {
    setImmediate(() => void worker());
  }
}

// ============================================================
// COMMAND CONFIG
// ============================================================

module.exports.config = {
  name: "adminbot",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: true,
  commandCategory: "Admin",
  cooldowns: 2
};

// ============================================================
// EVENT HANDLER
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

    // Ignore bot itself
    try {
      const botID = api.getCurrentUserID?.();

      if (
        botID &&
        String(senderID) === String(botID)
      ) {
        return;
      }
    } catch {}

    // /silent is ignored by this module.
    if (isSilent(body)) return;

    // Ignore all commands.
    if (
      typeof body === "string" &&
      body.trim().startsWith("/")
    ) {
      return;
    }

    if (!isActive(threadID)) return;

    addQueue({
      api,
      threadID: String(threadID),
      senderID: String(senderID),
      messageID,
      body
    });

  } catch (err) {
    console.error("[ADMINBOT] Event error:", err);

    // Recover worker if an event causes an error.
    if (!running && queue.length) {
      setImmediate(() => void worker());
    }
  }
};

// ============================================================
// COMMANDS
// ============================================================

module.exports.run = async function ({
  api,
  event,
  args
}) {
  try {
    if (!event?.threadID) return;

    const threadID = String(event.threadID);
    const senderID = String(event.senderID || "");
    const command =
      String(args?.[0] || "status").toLowerCase();

    // --------------------------------------------------------
    // ON
    // --------------------------------------------------------

    if (command === "on") {
      if (!isAdmin(senderID)) {
        return send(
          api,
          "⛔ Admin only.",
          threadID
        );
      }

      data.activeThreads[threadID] = true;
      save();

      return send(
        api,
        "♾️ ADMINBOT ON\n😎 Active sa GC na ito.",
        threadID
      );
    }

    // --------------------------------------------------------
    // OFF
    // --------------------------------------------------------

    if (command === "off") {
      if (!isAdmin(senderID)) {
        return send(
          api,
          "⛔ Admin only.",
          threadID
        );
      }

      data.activeThreads[threadID] = false;
      save();

      return send(
        api,
        "🛑 ADMINBOT OFF",
        threadID
      );
    }

    // --------------------------------------------------------
    // STATUS
    // --------------------------------------------------------

    if (command === "status") {
      return send(
        api,
        [
          "♾️ ADMINBOT STATUS",
          `GC: ${isActive(threadID) ? "ON 😎" : "OFF 🛑"}`,
          `Queue: ${queue.length}/${MAX_QUEUE}`,
          `Cooldown: ${COOLDOWN}ms`,
          `React: ${data.autoReact ? "ON" : "OFF"}`
        ].join("\n"),
        threadID
      );
    }

    // --------------------------------------------------------
    // REACT ON/OFF
    // --------------------------------------------------------

    if (
      command === "reacton" ||
      command === "reactoff"
    ) {
      if (!isAdmin(senderID)) {
        return send(
          api,
          "⛔ Admin only.",
          threadID
        );
      }

      data.autoReact =
        command === "reacton";

      save();

      return send(
        api,
        `😎 Auto React: ${
          data.autoReact ? "ON" : "OFF"
        }`,
        threadID
      );
    }

    // --------------------------------------------------------
    // HELP
    // --------------------------------------------------------

    return send(
      api,
      [
        "♾️ ADMINBOT COMMANDS",
        "/adminbot on",
        "/adminbot off",
        "/adminbot status",
        "/adminbot reacton",
        "/adminbot reactoff"
      ].join("\n"),
      threadID
    );

  } catch (err) {
    console.error("[ADMINBOT] Command error:", err);
  }
};

// ============================================================
// CLEANUP
// ============================================================

setInterval(() => {
  try {
    const now = Date.now();

    for (const [key, time] of cooldowns) {
      if (now - time > COOLDOWN * 3) {
        cooldowns.delete(key);
      }
    }

    while (cooldowns.size > 3000) {
      cooldowns.delete(
        cooldowns.keys().next().value
      );
    }

    save();

    // Restart worker if something interrupted it.
    if (!running && queue.length && !stopped) {
      void worker();
    }

  } catch (err) {
    console.error("[ADMINBOT] Cleanup error:", err);
  }
}, 60000);

// ============================================================
// START
// ============================================================

console.log(
  "[ADMINBOT] Makunat Admin Bot loaded."
);
