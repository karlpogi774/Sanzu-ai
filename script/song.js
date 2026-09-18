
 // ======================================================
 // SONG BOT V1 | MUSIC REQUEST EDITION
 // Sanzu-style command module
 // ======================================================

const fs = require("fs");
const path = require("path");

const ADMIN_ID = "61594055835097";
const DATA_FILE = path.join(__dirname, "song_data.json");
const LOG_FILE = path.join(__dirname, "song_error.log");

const DEFAULT_DATA = {
  active: true,
  totalRequests: 0
};

let data = { ...DEFAULT_DATA };

// ==================== LOAD / SAVE =====================

function logError(where, error) {
  const message =
    `[${new Date().toISOString()}] ${where}: ` +
    `${error?.stack || error}\n`;

  console.error(message);

  try {
    fs.appendFileSync(LOG_FILE, message);
  } catch (_) {}
}

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const saved = JSON.parse(
        fs.readFileSync(DATA_FILE, "utf8")
      );

      data = {
        ...DEFAULT_DATA,
        ...saved
      };
    }
  } catch (error) {
    logError("Load data failed", error);
    data = { ...DEFAULT_DATA };
  }
}

function saveData() {
  try {
    const tempFile = DATA_FILE + ".tmp";

    fs.writeFileSync(
      tempFile,
      JSON.stringify(data, null, 2)
    );

    fs.renameSync(tempFile, DATA_FILE);
  } catch (error) {
    logError("Save data failed", error);
  }
}

loadData();

// ==================== HELPERS =========================

function isAdmin(id) {
  return String(id) === ADMIN_ID;
}

function send(api, message, threadID, messageID) {
  try {
    api.sendMessage(
      message,
      threadID,
      error => {
        if (error) logError("Send message failed", error);
      },
      messageID
    );
  } catch (error) {
    logError("Send exception", error);
  }
}

// ==================== CONFIG ==========================

module.exports.config = {
  name: "song",
  version: "1.0.0",
  hasPermission: 0,
  credits: "Song Request Edition",
  description: "Song request command with admin controls",
  usePrefix: true,
  commandCategory: "Music",
  usages: "/song <song name or link>",
  cooldowns: 5
};

// ==================== COMMANDS ========================

module.exports.run = async function ({ api, event, args }) {
  try {
    if (!api || !event) return;

    const threadID = event.threadID;
    const messageID = event.messageID;
    const senderID = String(event.senderID || "");

    const action = String(args?.[0] || "").toLowerCase();

    // ==================== HELP ========================

    if (!action || action === "help") {
      return send(
        api,
        `🎵 SONG COMMANDS 🎵

/song <song name>
Mag-request ng kanta.

/song help
Ipakita ang commands.

/song status
Tingnan ang status ng song request.

/song on
I-enable ang song requests. (Admin only)

/song off
I-disable ang song requests. (Admin only)

🔐 Admin ID: ${ADMIN_ID}

ℹ️ Song request only. Hindi pa ito audio player.`,
        threadID,
        messageID
      );
    }

    // ==================== STATUS ======================

    if (action === "status") {
      return send(
        api,
        `🎵 SONG BOT STATUS 🎵

Song requests: ${data.active ? "ON 🟢" : "OFF 🔴"}
Total requests: ${data.totalRequests}`,
        threadID,
        messageID
      );
    }

    // ==================== ADMIN CHECK =================

    const adminActions = ["on", "off"];

    if (
      adminActions.includes(action) &&
      !isAdmin(senderID)
    ) {
      return send(
        api,
        "⛔ Admin lamang ang puwedeng gumamit nito.",
        threadID,
        messageID
      );
    }

    // ==================== TURN ON =====================

    if (action === "on") {
      data.active = true;
      saveData();

      return send(
        api,
        "🎵 Song requests are now ON! 🟢",
        threadID,
        messageID
      );
    }

    // ==================== TURN OFF ====================

    if (action === "off") {
      data.active = false;
      saveData();

      return send(
        api,
        "🔕 Song requests are now OFF.",
        threadID,
        messageID
      );
    }

    // ==================== SONG REQUEST ================

    if (!data.active) {
      return send(
        api,
        "🔕 Pasensya, naka-off muna ang song requests.",
        threadID,
        messageID
      );
    }

    const songName = args.join(" ").trim();

    if (!songName) {
      return send(
        api,
        "🎵 Gamitin: /song <song name or link>\n\nHalimbawa: /song Blue Bird",
        threadID,
        messageID
      );
    }

    data.totalRequests += 1;
    saveData();

    return send(
      api,
      `🎶 SONG REQUEST RECEIVED 🎶

🎧 Song: ${songName}

✅ Na-record ang iyong song request!
📌 Request #: ${data.totalRequests}

ℹ️ Paalala: Request confirmation lang ito. Hindi pa nagpapatugtog o nagda-download ng audio ang bot.`,
      threadID,
      messageID
    );

  } catch (error) {
    logError("Command error", error);
  }
};
  
