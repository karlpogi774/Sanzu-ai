const fs = require("fs");
const path = require("path");

// ==========================================
// CONFIGURATION
// ==========================================
const ADMIN_ID = "61594055835097";
const LOCKED_TEXT = "RYUK JJK TOP 1 POGI";
const LOCK_DURATION = 24 * 60 * 60 * 1000;
const DATA_PATH = path.join(__dirname, "lockgc_data.json");
const LOCK_NICKNAMES = true;

// ==========================================
// COMMAND CONFIG
// ==========================================
module.exports.config = {
  name: "lockgc",
  version: "3.0.0",
  hasPermission: 0,
  credits: "Gojo",
  description: "Group title and nickname protection.",
  usePrefix: true,
  commandCategory: "Admin",
  usages:
    "/lockgc on - Activate protection\n" +
    "/lockgc off - Disable protection\n" +
    "/lockgc status - Check status",
  cooldowns: 3
};

// ==========================================
// DATA MANAGEMENT
// ==========================================
function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const data = JSON.parse(
        fs.readFileSync(DATA_PATH, "utf8")
      );

      if (data && typeof data === "object") {
        if (!data.threads) data.threads = {};
        return data;
      }
    }
  } catch (err) {
    console.error("[LockGC] Load error:", err.message);
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
    console.error("[LockGC] Save error:", err.message);
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
// APPLY NICKNAMES
// ==========================================
function applyLockedNicknames(api, threadID) {
  if (!LOCK_NICKNAMES) return;

  api.getThreadInfo(threadID, (err, info) => {
    if (err || !info || !Array.isArray(info.participantIDs)) {
      return;
    }

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
                "[LockGC] Nickname error:",
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

  // Restore group title
  if (logMessageType === "log:thread-name") {
    if (logMessageData.name === LOCKED_TEXT) return;

    api.setTitle(LOCKED_TEXT, threadID, err => {
      if (err) {
        console.error("[LockGC] Title error:", err.message);
        return;
      }

      api.sendMessage(
        `🔒 Gojo LockGC\nGroup name restored:\n${LOCKED_TEXT}`,
        threadID
      );
    });

    return;
  }

  // Restore nickname
  if (
    LOCK_NICKNAMES &&
    logMessageType === "log:user-nickname"
  ) {
    const targetUserID = logMessageData.participant_id;
    const nickname = logMessageData.nickname;

    if (!targetUserID || nickname === LOCKED_TEXT) return;

    api.changeNickname(
      LOCKED_TEXT,
      threadID,
      targetUserID,
      err => {
        if (err) {
          console.error("[LockGC] Nickname error:", err.message);
          return;
        }

        api.sendMessage(
          `🔒 Gojo LockGC\nNickname restored:\n${LOCKED_TEXT}`,
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

  // Admin verification
  if (String(senderID) !== ADMIN_ID) {
    return api.sendMessage(
      "⛔ Gojo LockGC\nAdmin lang ang puwedeng gumamit nito.",
      threadID,
      messageID
    );
  }

  const { data, threadData } = getThreadData(threadID);

  // ON
  if (sub === "on") {
    threadData.expires = Date.now() + LOCK_DURATION;

    if (!saveData(data)) {
      return api.sendMessage(
        "❌ Hindi ma-save ang LockGC settings.",
        threadID,
        messageID
      );
    }

    api.setTitle(LOCKED_TEXT, threadID, () => {});
    applyLockedNicknames(api, threadID);

    return api.sendMessage(
      `🔒 GOJO LOCKGC: ACTIVATED\n\n` +
      `📌 Locked text: ${LOCKED_TEXT}\n` +
      `👤 Nickname lock: ${LOCK_NICKNAMES ? "ON" : "OFF"}\n` +
      `⏳ Duration: 24 hours`,
      threadID,
      messageID
    );
  }

  // OFF
  if (sub === "off") {
    threadData.expires = 0;

    if (!saveData(data)) {
      return api.sendMessage(
        "❌ Hindi ma-save ang LockGC settings.",
        threadID,
        messageID
      );
    }

    return api.sendMessage(
      "🔓 GOJO LOCKGC\nProtection is now OFF.",
      threadID,
      messageID
    );
  }

  // STATUS
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
      `⏳ Time left: ${formatTime(remaining)}`,
      threadID,
      messageID
    );
  }

  // HELP
  return api.sendMessage(
    `🔒 GOJO LOCKGC COMMANDS\n\n` +
    `/lockgc on - Activate protection\n` +
    `/lockgc off - Disable protection\n` +
    `/lockgc status - Check status`,
    threadID,
    messageID
  );
};
