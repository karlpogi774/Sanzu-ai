
/*
 * GOJO BOT V11 | INFINITY EDITION
 * File: gojo.js
 *
 * Features:
 * - gojo trigger reply
 * - Admin commands
 * - Auto-react toggle
 * - Queue with limit
 * - Cooldown and duplicate protection
 * - JSON settings and error log
 *
 * Note:
 * The bot's uptime depends on your hosting and bot framework.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const ADMIN_ID = "61594055835097";
const DATA_FILE = path.join(__dirname, "gojo_data.json");
const ERROR_FILE = path.join(__dirname, "gojo_error.log");

const DEFAULTS = {
  active: true,
  autoReact: true,
  delay: 2000,
  cooldown: 3000,
  totalReplies: 0
};

const MAX_QUEUE = 100;
const MAX_SEEN = 1000;

let settings = loadSettings();
let queue = [];
let processing = false;

const seenMessages = new Set();
const cooldowns = new Map();

const GOJO_QUOTES = [
  "The strongest doesn't need to prove anything.",
  "Stay calm. Keep your focus.",
  "Your next move matters more than your last mistake.",
  "Even the strongest need a moment to think.",
  "Focus on what you can control.",
  "Keep your confidence, but stay humble."
];

const REACTIONS = ["😎", "🔥", "✨", "💙", "⚡"];

function loadSettings() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      saveSettings(DEFAULTS);
      return { ...DEFAULTS };
    }

    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return { ...DEFAULTS, ...parsed };
  } catch (error) {
    logError("loadSettings", error);
    return { ...DEFAULTS };
  }
}

function saveSettings(nextSettings = settings) {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(nextSettings, null, 2),
      "utf8"
    );
  } catch (error) {
    logError("saveSettings", error);
  }
}

function logError(location, error) {
  const message =
    `[${new Date().toISOString()}] ${location}: ` +
    `${error && error.stack ? error.stack : error}\n`;

  try {
    fs.appendFileSync(ERROR_FILE, message, "utf8");
  } catch (_) {
    console.error(message);
  }
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function isAdmin(senderID) {
  return String(senderID) === ADMIN_ID;
}

function getBody(event) {
  return String(event?.body || "").trim();
}

function getMessageID(event) {
  return String(
    event?.messageID ||
    event?.messageId ||
    event?.threadID + ":" + event?.timestamp ||
    ""
  );
}

function rememberMessage(messageID) {
  if (!messageID) return false;
  if (seenMessages.has(messageID)) return true;

  seenMessages.add(messageID);

  if (seenMessages.size > MAX_SEEN) {
    const first = seenMessages.values().next().value;
    seenMessages.delete(first);
  }

  return false;
}

function isOnCooldown(senderID) {
  const now = Date.now();
  const previous = cooldowns.get(String(senderID)) || 0;

  if (now - previous < Number(settings.cooldown)) {
    return true;
  }

  cooldowns.set(String(senderID), now);
  return false;
}

function safeSend(api, message, threadID) {
  return new Promise((resolve, reject) => {
    if (!api || typeof api.sendMessage !== "function") {
      return reject(new Error("api.sendMessage is unavailable"));
    }

    api.sendMessage(message, threadID, (error, info) => {
      if (error) return reject(error);
      resolve(info);
    });
  });
}

function safeReact(api, messageID, reaction) {
  return new Promise((resolve, reject) => {
    if (!api || typeof api.setMessageReaction !== "function") {
      return reject(new Error("api.setMessageReaction is unavailable"));
    }

    api.setMessageReaction(reaction, messageID, (error) => {
      if (error) return reject(error);
      resolve();
    });
  });
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function enqueue(task) {
  if (queue.length >= MAX_QUEUE) {
    queue.shift();
  }

  queue.push(task);
  startQueue();
}

function startQueue() {
  if (processing) return;

  processing = true;

  processQueue()
    .catch(error => logError("processQueue", error))
    .finally(() => {
      processing = false;

      // Restart only if tasks remain.
      if (queue.length > 0 && settings.active) {
        startQueue();
      }
    });
}

async function processQueue() {
  while (queue.length > 0) {
    if (!settings.active) {
      queue.length = 0;
      break;
    }

    const task = queue.shift();
    if (!task) continue;

    try {
      await safeSend(task.api, task.message, task.threadID);
      settings.totalReplies += 1;
      saveSettings();
    } catch (error) {
      logError("sendReply", error);
    }

    await wait(Math.max(500, Number(settings.delay) || 2000));
  }
}

function helpText() {
  return [
    "╭─ GOJO BOT COMMANDS",
    "│ gojo help",
    "│ gojo status",
    "│ gojo on",
    "│ gojo off",
    "│ gojo quote",
    "│ gojo reacton",
    "│ gojo reactoff",
    "│ gojo delay <milliseconds>",
    "│ gojo cooldown <milliseconds>",
    "╰─ Trigger: send exactly `gojo`"
  ].join("\n");
}

function statusText() {
  return [
    "╭─ GOJO BOT STATUS",
    `│ Status: ${settings.active ? "ON" : "OFF"}`,
    `│ Auto-react: ${settings.autoReact ? "ON" : "OFF"}`,
    `│ Delay: ${settings.delay} ms`,
    `│ Cooldown: ${settings.cooldown} ms`,
    `│ Replies: ${settings.totalReplies}`,
    `│ Queue: ${queue.length}/${MAX_QUEUE}`,
    "╰─ GOJO BOT"
  ].join("\n");
}

function parseCommand(body) {
  const normalized = body.trim().toLowerCase();
  if (!normalized.startsWith("gojo")) return null;

  const parts = normalized.split(/\s+/);
  return {
    command: parts[1] || "",
    value: parts[2] || ""
  };
}

module.exports = {
  config: {
    name: "gojo",
    version: "11.0.0",
    author: "Gojo Bot",
    countDown: 2,
    role: 0,
    shortDescription: "Gojo trigger bot",
    longDescription: "Gojo bot with admin controls and auto-react",
    category: "utility",
    usePrefix: false
  },

  /*
   * Command handler.
   * Adjust this signature if your Sanzu fork uses another format.
   */
  onStart: async function ({ api, event, args }) {
    const senderID = String(event?.senderID || "");
    const threadID = event?.threadID;
    const command = String(args?.[0] || "").toLowerCase();
    const value = String(args?.[1] || "");

    if (!threadID) return;

    if (command === "help" || !command) {
      return safeSend(api, helpText(), threadID).catch(
        error => logError("help", error)
      );
    }

    if (command === "status") {
      return safeSend(api, statusText(), threadID).catch(
        error => logError("status", error)
      );
    }

    // Settings commands are admin-only.
    if (!isAdmin(senderID)) {
      return safeSend(
        api,
        "Admin lang ang puwedeng magbago ng Gojo settings.",
        threadID
      ).catch(error => logError("adminCheck", error));
    }

    if (command === "on") {
      settings.active = true;
      saveSettings();
      return safeSend(api, "Gojo bot is ON.", threadID);
    }

    if (command === "off") {
      settings.active = false;
      queue.length = 0;
      saveSettings();
      return safeSend(api, "Gojo bot is OFF. Queue cleared.", threadID);
    }

    if (command === "reacton") {
      settings.autoReact = true;
      saveSettings();
      return safeSend(api, "Auto-react is ON.", threadID);
    }

    if (command === "reactoff") {
      settings.autoReact = false;
      saveSettings();
      return safeSend(api, "Auto-react is OFF.", threadID);
    }

    if (command === "quote") {
      return safeSend(api, randomItem(GOJO_QUOTES), threadID);
    }

    if (command === "delay") {
      const ms = Number(value);

      if (!Number.isFinite(ms) || ms < 500 || ms > 60000) {
        return safeSend(
          api,
          "Gamitin: gojo delay 2000\nRange: 500–60000 ms",
          threadID
        );
      }

      settings.delay = ms;
      saveSettings();
      return safeSend(api, `Delay set to ${ms} ms.`, threadID);
    }

    if (command === "cooldown") {
      const ms = Number(value);

      if (!Number.isFinite(ms) || ms < 1000 || ms > 120000) {
        return safeSend(
          api,
          "Gamitin: gojo cooldown 3000\nRange: 1000–120000 ms",
          threadID
        );
      }

      settings.cooldown = ms;
      saveSettings();
      return safeSend(api, `Cooldown set to ${ms} ms.`, threadID);
    }

    return safeSend(api, helpText(), threadID);
  },

  /*
   * Event handler:
   * - Reacts only to the exact "gojo" trigger.
   * - Replies only to the exact "gojo" trigger.
   * - Ignores bot messages and duplicate message IDs.
   */
  handleEvent: async function ({ api, event }) {
    try {
      if (!event || !event.threadID) return;
      if (event.isGroup === false) return;
      if (event.senderID == null) return;

      const senderID = String(event.senderID);
      if (senderID === ADMIN_ID) return;

      // Avoid reacting to messages sent by the bot itself.
      if (event.isBot === true || event.senderID === api?.getCurrentUserID?.()) {
        return;
      }

      const body = getBody(event).toLowerCase();
      if (body !== "gojo") return;

      const messageID = getMessageID(event);
      if (rememberMessage(messageID)) return;

      if (settings.autoReact && messageID) {
        safeReact(api, messageID, randomItem(REACTIONS))
          .catch(error => logError("autoReact", error));
      }

      if (!settings.active) return;
      if (isOnCooldown(senderID)) return;

      enqueue({
        api,
        threadID: event.threadID,
        message: randomItem(GOJO_QUOTES)
      });
    } catch (error) {
      logError("handleEvent", error);
    }
  }
};
  
