
// ======================================================
// COMMENT BOT V1 | RANDOM FB COMMENT GENERATOR
// Sanzu-style command module
// ======================================================

const fs = require("fs");
const path = require("path");

const ADMIN_ID = "61594055835097";
const DATA_FILE = path.join(__dirname, "comment_data.json");
const LOG_FILE = path.join(__dirname, "comment_error.log");

const DEFAULT_DATA = {
  active: true,
  totalGenerated: 0
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

// ==================== COMMENT BANK ====================

const COMMENTS = [
  "Solid nito! 🔥",
  "Angas naman! 😎",
  "Ganda ng post! ✨",
  "Ayos na ayos! 💯",
  "Keep it up! 🙌",
  "Grabe, solid! 🔥",
  "Legit na astig! 😎",
  "Nice one! 👏",
  "Support! 💙",
  "Lakas maka-good vibes! 😂",
  "Simple pero solid. ✨",
  "Panalo 'to! 🏆",
  "Ang saya naman nito! 😁",
  "Good vibes lang! 🌈",
  "Galing naman! 👏",
  "Sana all! 😂",
  "Very nice! 💯",
  "Sheesh! 🔥",
  "Deserve ang support! 🙌",
  "Keep shining! ✨",
  "Astig ng dating! 😎",
  "W post! 💯",
  "Nakaka-good vibes! 😁",
  "Ganda ng vibes dito. 💙",
  "Solid content! 🔥",
  "More posts like this! 🙌",
  "Ayos 'yan ah! 😂",
  "Respect! 🤝",
  "Ang saya tingnan! ✨",
  "Legit, nice post! 💯"
];

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

function randomComment() {
  return COMMENTS[
    Math.floor(Math.random() * COMMENTS.length)
  ];
}

// ==================== CONFIG ==========================

module.exports.config = {
  name: "comment",
  version: "1.0.0",
  hasPermission: 0,
  credits: "Random Comment Edition",
  description: "Generate a random Facebook comment",
  usePrefix: true,
  commandCategory: "Social",
  usages: "/comment",
  cooldowns: 3
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

    if (action === "help") {
      return send(
        api,
        `💬 RANDOM COMMENT COMMANDS 💬

/comment
Generate ng random comment.

/comment status
Tingnan ang status.

/comment on
I-enable ang generator. Admin only.

/comment off
I-disable ang generator. Admin only.

ℹ️ Kopyahin ang comment at ikaw ang mag-post nito.`,
        threadID,
        messageID
      );
    }

    // ==================== STATUS ======================

    if (action === "status") {
      return send(
        api,
        `💬 COMMENT BOT STATUS 💬

Generator: ${data.active ? "ON 🟢" : "OFF 🔴"}
Total generated: ${data.totalGenerated}`,
        threadID,
        messageID
      );
    }

    // ==================== ADMIN CHECK =================

    if (
      ["on", "off"].includes(action) &&
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
        "💬 Comment generator is ON! 🟢",
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
        "🔕 Comment generator is OFF.",
        threadID,
        messageID
      );
    }

    // ==================== GENERATE ====================

    if (!data.active) {
      return send(
        api,
        "🔕 Naka-off muna ang comment generator.",
        threadID,
        messageID
      );
    }

    const customText = args.join(" ").trim();
    const comment = customText || randomComment();

    data.totalGenerated += 1;
    saveData();

    return send(
      api,
      `💬 RANDOM COMMENT 💬

${comment}

📌 Generated: ${data.totalGenerated}
👉 Kopyahin at i-post kung angkop sa post.`,
      threadID,
      messageID
    );

  } catch (error) {
    logError("Command error", error);
  }
};
       
