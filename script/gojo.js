
/*
==========================================================
 GOJO BOT V11.2 | INFINITY MAKUNAT COMMAND EDITION
 Sanzu-style command module
==========================================================

COMMANDS:
 /gojo
 /gojo help
 /gojo status
 /gojo quote
 /gojo on
 /gojo off
 /gojo delay 2000
 /gojo cooldown 3000
 /gojo reacton
 /gojo reactoff

IMPORTANT:
- Command-only module. Walang handleEvent.
- Hindi auto-reply sa lahat ng GC messages.
- Auto-react setting is stored, but needs an event handler
  to react to incoming messages.
- Hosting/framework controls uptime.
==========================================================
*/

"use strict";

const fs = require("fs");
const path = require("path");

// ======================================================
// CONFIG
// ======================================================

const ADMIN_ID = "61594055835097";

const DATA_FILE = path.join(__dirname, "gojo_command_data.json");
const TEMP_FILE = DATA_FILE + ".tmp";
const BACKUP_FILE = DATA_FILE + ".bak";
const LOG_FILE = path.join(__dirname, "gojo_error.log");

const DEFAULT_DATA = {
  active: true,
  autoReact: true,
  delay: 2000,
  cooldown: 3000,
  totalReplies: 0
};

const MIN_DELAY = 500;
const MAX_DELAY = 10000;
const MIN_COOLDOWN = 1000;
const MAX_COOLDOWN = 60000;

// ======================================================
// GOJO QUOTES
// ======================================================

const GOJO_QUOTES = [
  "Sa buong langit at lupa, ako lamang ang nag-iisang Honored One. ♾️",
  "Infinity ang pagitan natin. Hindi mo ako maaabot. 😎",
  "Domain Expansion: Infinite Void. 🌌",
  "Relax ka lang. Gojo Satoru ang bahala. 💙",
  "Six Eyes activated. Walang nakakalusot sa paningin ko. 👁️",
  "Masyado kang mabagal para sa Infinity ko. ⚡",
  "Hindi ako nagyayabang. Sinasabi ko lang ang totoo. 😏",
  "Kalmado lang. Hindi pa nagsisimula ang tunay na laban.",
  "Ang lakas mo naman... sa chat. 😂",
  "Gojo mode: ON. ♾️",
  "Walang duplicate sa bawat galaw.",
  "Sino'ng nagsabing kailangan kong mag-effort? 😏",
  "Infinity never sleeps. Pero ang server, minsan. 😂",
  "Message received. Infinity acknowledged. ♾️",
  "One command, one response. Simple lang.",
  "Six Eyes detected: may bagong command. 👁️",
  "Hindi ako late. Dramatic entrance lang. 😎",
  "Gojo Satoru reporting for duty. 🌌",
  "Ang tunay na lakas ay consistency, hindi ingay.",
  "Kalmado ang sistema kahit magulo ang group chat.",
  "Hindi kailangang mag-spam para maging legendary.",
  "Ang pinakamalakas, marunong ding maghintay.",
  "Infinity barrier: activated. ♾️",
  "Kung may problema, debug muna bago mag-drama.",
  "Gojo energy: 100%. Server energy: sana rin. 🔋",
  "Sagot na may style, hindi puro ingay. 💙",
  "Domain Expansion: Organized Commands. 🌌",
  "Gojo's got this. 😎",
  "Six Eyes online. System ready. 👁️",
  "One command at a time. Gojo style. ♾️",
  "Ang confidence ay libre. Gamitin nang maayos. 😎",
  "Hindi lahat ng malakas ay maingay.",
  "Gojo bot is ready kapag kailangan. 💙",
  "Infinity mode: stable and ready. ♾️",
  "Keep calm. Gojo is handling the command. 🌌",
  "Minsan, ang pinakamalakas na move ay maghintay. ⏳",
  "Walang shortcut sa pagiging Honored One. 💙",
  "Kung confidence ang labanan, alam mo na. 😏",
  "Walang panic. May error log naman. 🛠️",
  "Gojo's random wisdom has arrived. 🌌",
  "Ang reply ay darating sa tamang oras. ⏱️",
  "Hindi lahat ng message ay kailangang sagutin agad.",
  "Ang tunay na flex ay stable na bot. ⚡",
  "Walang magic sa settings, maayos na proseso lang.",
  "Six Eyes says: system ready. 👁️",
  "Gojo presence detected. 💙",
  "Relax lang. Naka-Infinity mode tayo. ♾️",
  "Sagot ko? Depende sa random quote generator. 😂",
  "Keep calm and carry on. 💙",
  "Gojo mode activated. Please stand by. ⚡"
];

// ======================================================
// LOGGING
// ======================================================

function logInfo(message) {
  console.log(
    `[GOJO] ${new Date().toISOString()} ${message}`
  );
}

function logError(location, error) {
  const detail =
    error && error.stack
      ? error.stack
      : String(error || "Unknown error");

  const line =
    `[${new Date().toISOString()}] ${location}: ${detail}\n`;

  console.error("[GOJO ERROR]", line);

  try {
    fs.appendFileSync(LOG_FILE, line, "utf8");
  } catch (writeError) {
    console.error(
      "[GOJO] Could not write error log:",
      writeError.message
    );
  }
}

// ======================================================
// DATA NORMALIZATION
// ======================================================

function normalizeData(saved) {
  const data = {
    ...DEFAULT_DATA,
    ...(saved && typeof saved === "object" ? saved : {})
  };

  data.active = data.active !== false;
  data.autoReact = data.autoReact !== false;

  const delay = Number(data.delay);

  data.delay = Number.isFinite(delay)
    ? Math.max(MIN_DELAY, Math.min(MAX_DELAY, delay))
    : DEFAULT_DATA.delay;

  const cooldown = Number(data.cooldown);

  data.cooldown = Number.isFinite(cooldown)
    ? Math.max(
        MIN_COOLDOWN,
        Math.min(MAX_COOLDOWN, cooldown)
      )
    : DEFAULT_DATA.cooldown;

  const totalReplies = Number(data.totalReplies);

  data.totalReplies = Number.isFinite(totalReplies)
    ? Math.max(0, totalReplies)
    : 0;

  return data;
}

// ======================================================
// DATA READ / RECOVERY
// ======================================================

function readJSON(file) {
  try {
    if (!fs.existsSync(file)) {
      return null;
    }

    const content = fs.readFileSync(file, "utf8");
    return JSON.parse(content);
  } catch (error) {
    logError(`JSON read failed: ${path.basename(file)}`, error);
    return null;
  }
}

function loadData() {
  const mainData = readJSON(DATA_FILE);

  if (mainData) {
    return normalizeData(mainData);
  }

  const backupData = readJSON(BACKUP_FILE);

  if (backupData) {
    logInfo("Recovered data from backup.");
    return normalizeData(backupData);
  }

  logInfo("Using default settings.");
  return { ...DEFAULT_DATA };
}

let DATA = loadData();

// ======================================================
// DATA SAVE / BACKUP
// ======================================================

function saveData(nextData) {
  try {
    const normalized = normalizeData(nextData);
    const json = JSON.stringify(normalized, null, 2);

    fs.writeFileSync(TEMP_FILE, json, "utf8");

    if (fs.existsSync(DATA_FILE)) {
      try {
        fs.copyFileSync(DATA_FILE, BACKUP_FILE);
      } catch (error) {
        logError("Backup copy failed", error);
      }
    }

    fs.renameSync(TEMP_FILE, DATA_FILE);

    DATA = normalized;
    return true;
  } catch (error) {
    logError("Settings save failed", error);

    try {
      if (fs.existsSync(TEMP_FILE)) {
        fs.unlinkSync(TEMP_FILE);
      }
    } catch (_) {}

    return false;
  }
}

// ======================================================
// COMMON HELPERS
// ======================================================

function isAdmin(senderID) {
  return String(senderID) === ADMIN_ID;
}

function randomQuote() {
  const index = Math.floor(Math.random() * GOJO_QUOTES.length);
  return GOJO_QUOTES[index];
}

function sendMessage(api, message, threadID, messageID) {
  try {
    if (!api || typeof api.sendMessage !== "function") {
      logError("sendMessage", "api.sendMessage is unavailable");
      return;
    }

    api.sendMessage(
      message,
      threadID,
      error => {
        if (error) {
          logError("sendMessage callback", error);
        }
      },
      messageID
    );
  } catch (error) {
    logError("sendMessage exception", error);
  }
}

function getCommandArgs(args) {
  if (!Array.isArray(args)) {
    return [];
  }

  return args.map(value => String(value ?? ""));
}

function getStatusText() {
  return [
    "🌌 GOJO SYSTEM STATUS",
    "",
    "╭──「 SYSTEM 」",
    `├ Auto Reply Setting: ${DATA.active ? "🟢 ON" : "🔴 OFF"}`,
    `├ Auto React Setting: ${DATA.autoReact ? "🟢 ON" : "🔴 OFF"}`,
    `├ Delay: ${DATA.delay} ms`,
    `├ Cooldown: ${DATA.cooldown} ms`,
    `├ Total Replies: ${DATA.totalReplies}`,
    `├ Loaded Quotes: ${GOJO_QUOTES.length}`,
    "╰────────────────────",
    "",
    "♾️ GOJO MAKUNAT COMMAND EDITION"
  ].join("\n");
}

function getHelpText() {
  return [
    "🌌 GOJO BOT V11.2",
    "",
    "╭──「 COMMAND PANEL 」",
    "├ /gojo",
    "├ /gojo help",
    "├ /gojo status",
    "├ /gojo quote",
    "├ /gojo on",
    "├ /gojo off",
    "├ /gojo reacton",
    "├ /gojo reactoff",
    "├ /gojo delay 2000",
    "├ /gojo cooldown 3000",
    "╰────────────────────",
    "",
    "🔐 Admin-only settings:",
    "on, off, reacton, reactoff, delay, cooldown",
    "",
    "♾️ Gojo command module ready."
  ].join("\n");
}

// ======================================================
// COMMAND CONFIG
// ======================================================

module.exports.config = {
  name: "gojo",
  version: "11.2.0",
  hasPermission: 0,
  credits: "Gojo Infinity Framework",
  description:
    "Gojo command module with admin settings, backup, and error logging.",
  usePrefix: true,
  commandCategory: "AI",
  usages:
    "/gojo help\n" +
    "/gojo status\n" +
    "/gojo quote\n" +
    "/gojo on\n" +
    "/gojo off\n" +
    "/gojo delay 2000\n" +
    "/gojo cooldown 3000\n" +
    "/gojo reacton\n" +
    "/gojo reactoff",
  cooldowns: 2
};

// ======================================================
// COMMAND RUNNER
// ======================================================

module.exports.run = async function ({ api, event, args }) {
  try {
    if (!event) {
      logError("Command runner", "Missing event object");
      return;
    }

    const threadID = event.threadID;
    const senderID = event.senderID;
    const messageID = event.messageID;

    if (!threadID || !senderID) {
      logError("Command runner", "Missing threadID or senderID");
      return;
    }

    const commandArgs = getCommandArgs(args);
    const action = String(commandArgs[0] || "help").toLowerCase();
    const value = commandArgs[1];

    const adminActions = [
      "on",
      "off",
      "reacton",
      "reactoff",
      "delay",
      "cooldown"
    ];

    // ---------------- HELP ----------------------------

    if (action === "help") {
      return sendMessage(
        api,
        getHelpText(),
        threadID,
        messageID
      );
    }

    // ---------------- STATUS --------------------------

    if (action === "status") {
      return sendMessage(
        api,
        getStatusText(),
        threadID,
        messageID
      );
    }

    // ---------------- RANDOM QUOTE --------------------

    if (action === "quote") {
      DATA.totalReplies += 1;
      saveData(DATA);

      return sendMessage(
        api,
        `♾️ [GOJO SATORU]\n\n${randomQuote()}`,
        threadID,
        messageID
      );
    }

    // ---------------- ADMIN CHECK ---------------------

    if (
      adminActions.includes(action) &&
      !isAdmin(senderID)
    ) {
      return sendMessage(
        api,
        "⛔ Access denied. Admin lamang ang puwedeng gumamit ng setting commands.",
        threadID,
        messageID
      );
    }

    // ---------------- TURN ON ------------------------

    if (action === "on") {
      DATA.active = true;
      const saved = saveData(DATA);

      return sendMessage(
        api,
        saved
          ? "🚀 GOJO SYSTEM ACTIVATED!\nAuto-reply setting: ON"
          : "⚠️ Na-on ang setting sa memory pero hindi na-save sa file.",
        threadID,
        messageID
      );
    }

    // ---------------- TURN OFF -----------------------

    if (action === "off") {
      DATA.active = false;
      const saved = saveData(DATA);

      return sendMessage(
        api,
        saved
          ? "🛑 GOJO SYSTEM PAUSED!\nAuto-reply setting: OFF"
          : "⚠️ Na-off ang setting sa memory pero hindi na-save sa file.",
        threadID,
        messageID
      );
    }

    // ---------------- REACTION ON --------------------

    if (action === "reacton") {
      DATA.autoReact = true;
      const saved = saveData(DATA);

      return sendMessage(
        api,
        saved
          ? "😆 Auto-reaction setting enabled."
          : "⚠️ Na-update ang setting pero hindi na-save sa file.",
        threadID,
        messageID
      );
    }

    // ---------------- REACTION OFF -------------------

    if (action === "reactoff") {
      DATA.autoReact = false;
      const saved = saveData(DATA);

      return sendMessage(
        api,
        saved
          ? "🔕 Auto-reaction setting disabled."
          : "⚠️ Na-update ang setting pero hindi na-save sa file.",
        threadID,
        messageID
      );
    }

    // ---------------- SET DELAY ----------------------

    if (action === "delay") {
      const ms = Number(value);

      if (
        value === undefined ||
        !Number.isFinite(ms) ||
        ms < MIN_DELAY ||
        ms > MAX_DELAY
      ) {
        return sendMessage(
          api,
          `⚠️ Delay must be ${MIN_DELAY}–${MAX_DELAY} ms.\nExample: /gojo delay 2000`,
          threadID,
          messageID
        );
      }

      DATA.delay = ms;
      const saved = saveData(DATA);

      return sendMessage(
        api,
        saved
          ? `⏱️ Reply delay updated to ${ms} ms.`
          : "⚠️ Na-update ang delay pero hindi na-save sa file.",
        threadID,
        messageID
      );
    }

    // ---------------- SET COOLDOWN -------------------

    if (action === "cooldown") {
      const ms = Number(value);

      if (
        value === undefined ||
        !Number.isFinite(ms) ||
        ms < MIN_COOLDOWN ||
        ms > MAX_COOLDOWN
      ) {
        return sendMessage(
          api,
          `⚠️ Cooldown must be ${MIN_COOLDOWN}–${MAX_COOLDOWN} ms.\nExample: /gojo cooldown 3000`,
          threadID,
          messageID
        );
      }

      DATA.cooldown = ms;
      const saved = saveData(DATA);

      return sendMessage(
        api,
        saved
          ? `🕒 Cooldown updated to ${ms} ms.`
          : "⚠️ Na-update ang cooldown pero hindi na-save sa file.",
        threadID,
        messageID
      );
    }

    // ---------------- UNKNOWN COMMAND ---------------

    return sendMessage(
      api,
      "⚠️ Unknown command.\nI-type ang /gojo help para makita ang commands.",
      threadID,
      messageID
    );

  } catch (error) {
    logError("Command runner failed", error);

    try {
      if (event && event.threadID) {
        sendMessage(
          api,
          "⚠️ May error sa Gojo command. Tingnan ang gojo_error.log.",
          event.threadID,
          event.messageID
        );
      }
    } catch (sendError) {
      logError("Error notification failed", sendError);
    }
  }
};

// ======================================================
// END OF GOJO BOT V11.2
// ======================================================
    
