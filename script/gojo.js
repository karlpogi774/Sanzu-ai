
"use strict";

// ======================================================
// GOJO BOT | Command Module
// Command: /gojo
// File: scripts/commands/gojo.js
// ======================================================

const fs = require("fs");
const path = require("path");

const ADMIN_ID = "61594055835097";
const DATA_FILE = path.join(__dirname, "gojo_data.json");
const LOG_FILE = path.join(__dirname, "gojo_error.log");

const DEFAULTS = {
  active: true,
  autoReact: true,
  trigger: "gojo",
  cooldownMs: 5000,
  lastReact: {},
  totalReplies: 0
};

let settings = loadSettings();
const cooldowns = new Map();

const QUOTES = [
  "Relax. Hindi lahat ng ingay kailangan mong patulan.",
  "Minsan, ang katahimikan ang pinakamalinaw na sagot.",
  "Hindi mo kailangang patunayan ang sarili mo sa lahat.",
  "Focus sa sarili mong goals. Hayaan mong sila ang maingay.",
  "Confidence is quiet. Insecurity is loud.",
  "Kung may problema, ayusin. Kung wala, huwag gumawa.",
  "Hindi lahat ng challenge kailangan mong tanggapin.",
  "Keep your focus. Huwag hayaang maagaw nila ang attention mo.",
  "Ang tunay na control ay nagsisimula sa sarili.",
  "Stay calm. Think clearly. Move wisely."
];

function logError(error) {
  const line =
    `[${new Date().toISOString()}] ` +
    `${error && error.stack ? error.stack : String(error)}\n`;

  try {
    fs.appendFileSync(LOG_FILE, line, "utf8");
  } catch (e) {
    console.error("[GOJO] Failed to write log:", e.message);
  }
}

function loadSettings() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { ...DEFAULTS };
    }

    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return { ...DEFAULTS, ...parsed };
  } catch (error) {
    logError(error);
    return { ...DEFAULTS };
  }
}

function saveSettings() {
  const tempFile = `${DATA_FILE}.tmp`;

  try {
    fs.writeFileSync(
      tempFile,
      JSON.stringify(settings, null, 2),
      "utf8"
    );

    fs.renameSync(tempFile, DATA_FILE);
    return true;
  } catch (error) {
    logError(error);

    try {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    } catch (_) {}

    return false;
  }
}

function isAdmin(senderID) {
  return String(senderID || "") === ADMIN_ID;
}

function getRandomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

function getSenderID(event) {
  return (
    event?.senderID ||
    event?.author ||
    event?.userID ||
    event?.participantIDs?.[0] ||
    ""
  );
}

function getThreadID(event) {
  return event?.threadID || event?.threadId || "";
}

function getMessageID(event) {
  return event?.messageID || event?.messageId || "";
}

function getMessageText(event) {
  return String(
    event?.body ||
    event?.text ||
    event?.message?.body ||
    ""
  ).trim();
}

function isOnCooldown(key, duration) {
  const now = Date.now();
  const last = cooldowns.get(key) || 0;

  if (now - last < duration) {
    return true;
  }

  cooldowns.set(key, now);
  return false;
}

async function sendMessage(api, message, threadID) {
  if (!api || typeof api.sendMessage !== "function") {
    throw new Error("API sendMessage() is unavailable.");
  }

  return new Promise((resolve, reject) => {
    try {
      api.sendMessage(message, threadID, (error, info) => {
        if (error) return reject(error);
        resolve(info);
      });
    } catch (error) {
      reject(error);
    }
  });
}

async function reactToMessage(api, messageID, reaction = "✨") {
  if (!api || typeof api.setMessageReaction !== "function") {
    return false;
  }

  if (!messageID) return false;

  return new Promise((resolve) => {
    try {
      api.setMessageReaction(
        reaction,
        messageID,
        (error) => resolve(!error),
        true
      );
    } catch (error) {
      logError(error);
      resolve(false);
    }
  });
}

function parseArgs(input) {
  return String(input || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

module.exports = {
  config: {
    name: "gojo",
    version: "13.0.0",
    author: "Gojo Bot",
    countDown: 3,
    role: 0,
    shortDescription: "Gojo command controls",
    longDescription: "Gojo bot command module",
    category: "utility",
    guide: {
      en:
        "{pn} help\n" +
        "{pn} quote\n" +
        "{pn} status\n" +
        "{pn} on | off\n" +
        "{pn} reacton | reactoff\n" +
        "{pn} delay <milliseconds>"
    }
  },

  // --------------------------------------------------
  // COMMAND HANDLER
  // --------------------------------------------------
  onStart: async function ({ message, args, event, api }) {
    const senderID = getSenderID(event);
    const threadID = getThreadID(event);
    const action = String(args?.[0] || "help").toLowerCase();

    try {
      if (action === "help") {
        return message.reply(
          "✨ GOJO COMMANDS\n\n" +
          "/gojo quote - Random quote\n" +
          "/gojo status - Bot status\n" +
          "/gojo on - Enable replies\n" +
          "/gojo off - Disable replies\n" +
          "/gojo reacton - Enable trigger reactions\n" +
          "/gojo reactoff - Disable trigger reactions\n" +
          "/gojo delay <ms> - Set reaction cooldown\n\n" +
          "Admin-only settings require the configured admin ID."
        );
      }

      if (action === "quote") {
        settings.totalReplies++;
        saveSettings();
        return message.reply(getRandomQuote());
      }

      if (action === "status") {
        return message.reply(
          "✨ GOJO STATUS\n\n" +
          `Active: ${settings.active ? "ON" : "OFF"}\n` +
          `Auto reaction: ${settings.autoReact ? "ON" : "OFF"}\n` +
          `Reaction cooldown: ${settings.cooldownMs}ms\n` +
          `Total quotes: ${settings.totalReplies}`
        );
      }

      if (!isAdmin(senderID)) {
        return message.reply("Admin-only command.");
      }

      if (action === "on") {
        settings.active = true;
        saveSettings();
        return message.reply("Gojo replies enabled.");
      }

      if (action === "off") {
        settings.active = false;
        saveSettings();
        return message.reply("Gojo replies disabled.");
      }

      if (action === "reacton") {
        settings.autoReact = true;
        saveSettings();
        return message.reply("Trigger reactions enabled.");
      }

      if (action === "reactoff") {
        settings.autoReact = false;
        saveSettings();
        return message.reply("Trigger reactions disabled.");
      }

      if (action === "delay") {
        const value = Number(args?.[1]);

        if (!Number.isFinite(value) || value < 1000 || value > 60000) {
          return message.reply(
            "Use a cooldown from 1000 to 60000 milliseconds."
          );
        }

        settings.cooldownMs = Math.floor(value);
        saveSettings();

        return message.reply(
          `Reaction cooldown set to ${settings.cooldownMs}ms.`
        );
      }

      return message.reply("Unknown command. Use /gojo help");
    } catch (error) {
      logError(error);
      return message.reply("May error sa Gojo command. Tingnan ang log file.");
    }
  },

  // --------------------------------------------------
  // EVENT HANDLER
  // Used ONLY for trigger-based reaction.
  // Replies are not automatically sent to every message.
  // --------------------------------------------------
  onChat: async function ({ event, api }) {
    try {
      if (!settings.active || !settings.autoReact) return;

      const text = getMessageText(event).toLowerCase();
      const trigger = String(settings.trigger || "gojo").toLowerCase();

      if (!text || !text.includes(trigger)) return;

      const messageID = getMessageID(event);
      if (!messageID) return;

      const threadID = getThreadID(event);
      const senderID = getSenderID(event);

      const key = `${threadID}:${senderID}`;

      if (isOnCooldown(key, settings.cooldownMs)) return;

      await reactToMessage(api, messageID, "✨");
    } catch (error) {
      logError(error);
    }
  },

  // Optional compatibility handler for frameworks
  // that dispatch message events through handleEvent.
  handleEvent: async function ({ event, api }) {
    return this.onChat({ event, api });
  }
};
 
