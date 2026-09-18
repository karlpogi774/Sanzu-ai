const fs = require("fs");
const path = require("path");

// ==========================================
// CONFIGURATION
// ==========================================
const ADMIN_ID = "61594055835097";
const LOCKED_TEXT = "RYUK JJK TOP 1 POGI";
const LOCK_DURATION = 24 * 60 * 60 * 1000;
const DATA_PATH = path.join(__dirname, "lockgc_data.json");

// Nickname locking can be disabled by setting this to false.
const LOCK_NICKNAMES = true;

// ==========================================
// COMMAND CONFIG
// ==========================================
module.exports.config = {
  name: "lockgc",
  version: "3.0.0",
  hasPermission: 0,
  credits: "Gojo",
  description: "Protects the group title and nicknames for a limited time.",
  usePrefix: true,
  commandCategory: "Admin",
  usages:
    "/lockgc on - Activate protection for 24 hours\n" +
    "/lockgc off - Disable protection\n" +
    "/lockgc status - Check protection status",
  cooldowns: 3
};

// ==========================================
// DATA MANAGEMENT
// ==========================================
function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));

      if (parsed && typeof parsed === "object") {
        if (!parsed.threads || typeof parsed.threads !== "object") {
          parsed.threads = {};
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error("[LockGC] Failed to load data:", err.message);
  }

  return { threads: {} };
}

function saveData(data) {
  try {
    fs.writeFileSync(
      DATA_PATH,
      JSON.stringify(data, null, 2),
      "utf8"
    );
    return true;
  } catch (err) {
    console.error("[LockGC] Failed to save data:", err.message);
    return false;
  }
}

function getThreadData(threadID) {
  const data = loadData();

  if (!data.threads[threadID]) {
    data.threads[threadID] = { expires: 0 };
  }

  return {
    data,
    threadData: data.threads[threadID]
  };
}

function isThreadActive(threadID) {
  const { threadData } = getThreadData(threadID);
  return Number(threadData.expires) > Date.now();
}

function formatTime(ms) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${minutes}m`;
}

// ==========================================
// APPLY LOCKED NICKNAMES
// ==========================================
function applyLockedNicknames(api, threadID) {
  if (!LOCK_NICKNAMES) return;

  api.getThreadInfo(threadID, (err, info) => {
    if (err) {
      console.error("[LockGC] Failed to get thread info:", err.message);
      return;
    }

    if (!info || !Array.isArray(info.participantIDs)) return;

    info.participantIDs.forEach((userID, index) => {
      setTimeout(() => {
        if (!isThreadActive(threadID)) return;

        api.changeNickname(
          LOCKED_TEXT,
          threadID,
          userID,
          err => {
            if (err) {
              console.error(
                `[LockGC] Failed to change nickname for ${userID}:`,
                err.message
              );
            }
          }
        );
      }, index * 1000);
    });
  });
}

// ==========================================
// EVENT HANDLER
// ==========================================
module.exports.handleEvent = async function ({ api, event }) {
  const {
    threadID,
    logMessageType,
    logMessageData
  } = event;

  if (!threadID || !isThreadActive(threadID)) return;
  if (!logMessageData) return;

  // Group title changed
  if (logMessageType === "log:thread-name") {
    const newName = logMessageData.name;

    if (newName === LOCKED_TEXT) return;

    api.setTitle(LOCKED_TEXT, threadID, err => {
      if (err) {
        console.error("[LockGC] Failed to restore group title:", err.message);
        return;
      }

      api.sendMessage(
        `🔒 Gojo LockGC\nGroup name protection is active.\nRestored title: ${LOCKED_TEXT}`,
        threadID
      );
    });

    return;
  }

  // Member nickname changed
  if (
    LOCK_NICKNAMES &&
    logMessageType === "log:user-nickname"
  ) {
    const targetUserID = logMessageData.participant_id;
    const newNickname = logMessageData.nickname;

    if (!targetUserID || newNickname === LOCKED_TEXT) return;

    api.changeNickname(
      LOCKED_TEXT,
      threadID,
      targetUserID,
      err => {
        if (err) {
          console.error(
            "[LockGC] Failed to restore nickname:",
            err.message
          );
          return;
        }

        api.sendMessage(
          `🔒 Gojo LockGC\nNickname protection is active.\nRestored nickname: ${LOCKED_TEXT}`,
          threadID
        );
      }
    );
  }
};

// ==========================================
// COMMAND RUNNER
// ==========================================
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const sub = (args[0] || "").toLowerCase();

  // Admin check
  if (String(senderID) !== ADMIN_ID) {
    return api.sendMessage(
      "⛔ Gojo LockGC\nAdmin lang ang puwedeng gumamit ng command na ito.",
      threadID,
      messageID
    );
  }

  const { data, threadData } = getThreadData(threadID);

  // ========================================
  // ON
  // ========================================
  if (sub === "on") {
    threadData.expires = Date.now() + LOCK_DURATION;

    if (!saveData(data)) {
      return api.sendMessage(
        "❌ Hindi na-save ang LockGC settings. Pakisuri ang file permissions.",
        threadID,
        messageID
      );
    }

    api.setTitle(LOCKED_TEXT, threadID, err => {
      if (err) {
        console.error("[LockGC] Failed to set group title:", err.message);
      }
    });

    applyLockedNicknames(api, threadID);

    return api.sendMessage(
      `🔒 GOJO LOCKGC: ACTIVATED\n\n` +
      `📌 Protected title:\n${LOCKED_TEXT}\n\n` +
      `👤 Nickname lock: ${LOCK_NICKNAMES ? "ON" : "OFF"}\n` +
      `⏳ Duration: 24 hours\n` +
      `⚡ Protection is now active.`,
      threadID,
      messageID
    );
  }

  // ========================================
  // OFF
  // ========================================
  if (sub === "off") {
    threadData.expires = 0;

    if (!saveData(data)) {
      return api.sendMessage(
        "❌ Hindi na-save ang LockGC settings.",
        threadID,
        messageID
      );
    }

    return api.sendMessage(
      "🔓 GOJO LOCKGC\nNaka-off na ang protection sa GC na ito.",
      threadID,
      messageID
    );
  }

  // ========================================
  // STATUS
  // ========================================
  if (sub === "status") {
    const remaining = Number(threadData.expires) - Date.now();

    if (remaining <= 0) {
      return api.sendMessage(
        "📊 GOJO LOCKGC STATUS\nStatus: OFF",
        threadID,
        messageID
      );
    }

    return api.sendMessage(
      `📊 GOJO LOCKGC STATUS\n\n` +
      `🔒 Status: ACTIVE\n` +
      `📌 Locked text: ${LOCKED_TEXT}\n` +
      `👤 Nickname lock: ${LOCK_NICKNAMES ? "ON" : "OFF"}\n` +
      `⏳ Time remaining: ${formatTime(remaining)}`,
      threadID,
      messageID
    );
  }

  // ========================================
  // HELP
  // ========================================
  return api.sendMessage(
    `🔒 GOJO LOCKGC COMMANDS\n\n` +
    `/lockgc on - Activate protection for 24 hours\n` +
    `/lockgc off - Disable protection\n` +
    `/lockgc status - Check status`,
    threadID,
    messageID
  );
};
