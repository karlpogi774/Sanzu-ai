// ==========================================================
// NOVA X ULTIMATE | FACEBOOK BOT MODULE
// Admin: 61594055835097
// ==========================================================

const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "nova",
  version: "6.0.0",
  hasPermission: 0,
  credits: "NOVA X",
  description: "NOVA X group utility and fun module",
  usePrefix: true,
  commandCategory: "System/Fun",
  usages: "/nova help",
  cooldowns: 3
};

const ADMIN_ID = "61594055835097";
const DATA_FILE = path.join(__dirname, "nova_x_data.json");

const DEFAULT_DATA = {
  active: false,
  roast: true,
  react: true,
  roastCount: 0,
  commandCount: 0,
  activatedBy: null,
  activatedAt: null
};

const ROAST_COOLDOWN = 8000;
const COMMAND_COOLDOWN = 2500;

const processing = new Set();
const roastCooldown = new Map();
const commandCooldown = new Map();

const ROASTS = [
  "Bro really pressed send with confidence 💀",
  "That message needed a second draft 🤣",
  "The confidence is impressive. The message is questionable.",
  "Interesting choice of words 💀",
  "The group chat was peaceful five seconds ago.",
  "Bro unlocked a new level of random.",
  "Respectfully... what was the plan here? 🤣",
  "That message arrived with confidence.",
  "Somewhere, a grammar teacher just felt a disturbance.",
  "I have questions. Many questions. 💀",
  "The audacity is loud today.",
  "NOVA has entered the chat ⚡"
];

const EMOJIS = ["🔥", "💀", "🤣", "😆", "🤡"];

// ==========================================================
// DATABASE
// ==========================================================

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      saveData(DEFAULT_DATA);
      return { ...DEFAULT_DATA };
    }

    const parsed = JSON.parse(
      fs.readFileSync(DATA_FILE, "utf8")
    );

    return { ...DEFAULT_DATA, ...parsed };
  } catch (error) {
    console.error("[NOVA X] Database error:", error);
    return { ...DEFAULT_DATA };
  }
}

function saveData(data) {
  try {
    const temp = DATA_FILE + ".tmp";

    fs.writeFileSync(
      temp,
      JSON.stringify(data, null, 2),
      "utf8"
    );

    fs.renameSync(temp, DATA_FILE);
    return true;
  } catch (error) {
    console.error("[NOVA X] Save error:", error);
    return false;
  }
}

// ==========================================================
// HELPERS
// ==========================================================

function isAdmin(id) {
  return String(id) === ADMIN_ID;
}

function random(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function cooldownReady(map, key, duration) {
  const now = Date.now();
  const last = map.get(key) || 0;

  if (now - last < duration) return false;

  map.set(key, now);
  return true;
}

function send(api, message, threadID, replyID) {
  return new Promise(resolve => {
    try {
      api.sendMessage(message, threadID, (err, info) => {
        if (err) {
          console.error("[NOVA X] Send error:", err);
          return resolve(null);
        }

        resolve(info || null);
      }, replyID);
    } catch (error) {
      console.error("[NOVA X] Send exception:", error);
      resolve(null);
    }
  });
}

/*
 * Reaction adapter:
 * Supports callback-style setMessageReaction APIs.
 * Exact compatibility depends on the installed Facebook
 * bot library. Does not bypass platform restrictions.
 */
function react(api, emoji, messageID) {
  if (!messageID) return Promise.resolve(false);

  return new Promise(resolve => {
    try {
      if (typeof api.setMessageReaction !== "function") {
        console.error(
          "[NOVA X] This API does not support setMessageReaction."
        );
        return resolve(false);
      }

      api.setMessageReaction(
        emoji,
        messageID,
        error => {
          if (error) {
            console.error("[NOVA X] Reaction failed:", error);
            return resolve(false);
          }

          resolve(true);
        },
        true
      );
    } catch (error) {
      console.error("[NOVA X] Reaction exception:", error);
      resolve(false);
    }
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==========================================================
// EVENT HANDLER
// ==========================================================

module.exports.handleEvent = async function ({ api, event }) {
  if (!event) return;

  const { threadID, senderID, body } = event;

  if (!threadID || !senderID || !body) return;

  try {
    const botID = api.getCurrentUserID();

    if (String(senderID) === String(botID)) return;
  } catch (_) {}

  const text = String(body).trim();

  if (!text || text.startsWith("/") || text.startsWith("!")) {
    return;
  }

  const data = loadData();

  if (!data.active || !data.roast) return;
  if (processing.has(threadID)) return;

  if (!cooldownReady(roastCooldown, threadID, ROAST_COOLDOWN)) {
    return;
  }

  processing.add(threadID);

  try {
    const info = await send(
      api,
      random(ROASTS),
      threadID
    );

    if (info && info.messageID && data.react) {
      await react(api, random(EMOJIS), info.messageID);
    }

    data.roastCount = Number(data.roastCount || 0) + 1;
    saveData(data);
  } catch (error) {
    console.error("[NOVA X] Event error:", error);
  } finally {
    processing.delete(threadID);
  }
};

// ==========================================================
// COMMAND HANDLER
// ==========================================================

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  try {
    const command = String(args?.[0] || "help").toLowerCase();

    const adminCommands = [
      "on", "off", "roast", "react", "setnick", "setgname"
    ];

    if (adminCommands.includes(command) && !isAdmin(senderID)) {
      return send(
        api,
        "🔒 This command is admin-only.",
        threadID,
        messageID
      );
    }

    if (!cooldownReady(commandCooldown, senderID, COMMAND_COOLDOWN)) {
      return;
    }

    const data = loadData();

    data.commandCount = Number(data.commandCount || 0) + 1;
    saveData(data);

    // ON
    if (command === "on") {
      data.active = true;
      data.activatedBy = senderID;
      data.activatedAt = Date.now();
      saveData(data);

      return send(
        api,
        "⚡ NOVA X ONLINE\n🔥 Auto-roast: ON\n⚡ Self-react: ON\n🛡️ Cooldown: ON",
        threadID,
        messageID
      );
    }

    // OFF
    if (command === "off") {
      data.active = false;
      saveData(data);

      return send(
        api,
        "🔴 NOVA X auto system OFF.",
        threadID,
        messageID
      );
    }

    // ROAST TOGGLE
    if (command === "roast") {
      const mode = String(args?.[1] || "").toLowerCase();

      if (!["on", "off"].includes(mode)) {
        return send(api, "Usage: /nova roast on | off", threadID, messageID);
      }

      data.roast = mode === "on";
      saveData(data);

      return send(api, `🔥 Auto-roast: ${mode.toUpperCase()}`, threadID, messageID);
    }

    // REACT TOGGLE
    if (command === "react") {
      const mode = String(args?.[1] || "").toLowerCase();

      if (!["on", "off"].includes(mode)) {
        return send(api, "Usage: /nova react on | off", threadID, messageID);
      }

      data.react = mode === "on";
      saveData(data);

      return send(api, `⚡ Self-react: ${mode.toUpperCase()}`, threadID, messageID);
    }

    // STATUS
    if (command === "status") {
      return send(
        api,
        [
          "⚡ NOVA X STATUS",
          `System: ${data.active ? "ON 🟢" : "OFF 🔴"}`,
          `Auto-roast: ${data.roast ? "ON" : "OFF"}`,
          `Self-react: ${data.react ? "ON" : "OFF"}`,
          `Roasts: ${data.roastCount || 0}`,
          `Commands: ${data.commandCount || 0}`,
          `Activated: ${data.activatedAt ? new Date(data.activatedAt).toLocaleString() : "Never"}`
        ].join("\n"),
        threadID,
        messageID
      );
    }

    // INFO
    if (command === "info") {
      return send(
        api,
        "⚡ NOVA X\nVersion: 6.0.0\nAdmin-only controls enabled.",
        threadID,
        messageID
      );
    }

    // SET GROUP NAME
    if (command === "setgname") {
      const name = args.slice(1).join(" ").trim();

      if (!name) {
        return send(api, "Usage: /nova setgname <name>", threadID, messageID);
      }

      try {
        api.setTitle(name, threadID, error => {
          if (error) {
            console.error("[NOVA X] setTitle error:", error);
            return send(api, "❌ Group name update failed.", threadID, messageID);
          }

          return send(api, `✅ Group name changed to:\n${name}`, threadID, messageID);
        });
      } catch (error) {
        console.error("[NOVA X] setgname exception:", error);
      }

      return;
    }

    // SET NICKNAME
    if (command === "setnick") {
      const nickname = args.slice(1).join(" ").trim() || "NOVA X";

      let info;

      try {
        info = await api.getThreadInfo(threadID);
      } catch (error) {
        console.error("[NOVA X] getThreadInfo:", error);
        return send(api, "❌ Cannot get group information.", threadID, messageID);
      }

      const members = info?.participantIDs || [];

      if (!members.length) {
        return send(api, "❌ No group members found.", threadID, messageID);
      }

      await send(api, `⏳ Updating ${members.length} nicknames...`, threadID);

      let success = 0;
      let failed = 0;

      for (const userID of members) {
        try {
          await new Promise(resolve => {
            api.changeNickname(nickname, threadID, userID, error => {
              if (error) failed++;
              else success++;
              resolve();
            });
          });

          await sleep(400);
        } catch (_) {
          failed++;
        }
      }

      return send(
        api,
        `✅ Nickname update finished.\nSuccess: ${success}\nFailed: ${failed}`,
        threadID,
        messageID
      );
    }

    // HELP
    return send(
      api,
      [
        "⚡ NOVA X COMMANDS",
        "/nova on",
        "/nova off",
        "/nova status",
        "/nova info",
        "/nova roast on | off",
        "/nova react on | off",
        "/nova setnick <name>",
        "/nova setgname <name>"
      ].join("\n"),
      threadID,
      messageID
    );

  } catch (error) {
    console.error("[NOVA X] Command error:", error);

    return send(
      api,
      "⚠️ NOVA X encountered an error.",
      threadID,
      messageID
    );
  }
};
