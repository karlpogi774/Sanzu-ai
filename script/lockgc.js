
const fs = require("fs");
const path = require("path");

// ======================================================
// GOJO LOCKGC | SANZU AI
// ======================================================

const ADMIN_ID = "61594055835097";
const LOCKED_TEXT = "RYUK JJK TOP 1 POGI";
const LOCK_DURATION = 24 * 60 * 60 * 1000;

const DATA_FILE = path.join(__dirname, "lockgc_data.json");

// ======================================================
// CONFIG
// ======================================================

module.exports.config = {
  name: "lockgc",
  version: "1.0.0",
  hasPermission: 0,
  credits: "Gojo",
  description: "Group name protection with admin controls.",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "/lockgc on | off | status",
  cooldowns: 3
};

// ======================================================
// DATA
// ======================================================

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

      if (data && typeof data === "object") {
        if (!data.threads || typeof data.threads !== "object") {
          data.threads = {};
        }
        return data;
      }
    }
  } catch (err) {
    console.error("[LOCKGC] Load error:", err.message);
  }

  return { threads: {} };
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("[LOCKGC] Save error:", err.message);
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
    thread: data.threads[threadID]
  };
}

function isActive(threadID) {
  const { thread } = getThreadData(threadID);
  return Number(thread.expires) > Date.now();
}

function isAdmin(senderID) {
  return String(senderID) === ADMIN_ID;
}

function send(api, message, threadID, messageID) {
  return api.sendMessage(
    message,
    threadID,
    error => {
      if (error) {
        console.error("[LOCKGC] Send error:", error);
      }
    },
    messageID
  );
}

function formatTime(ms) {
  const minutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

// ======================================================
// EVENT HANDLER
// ======================================================

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, logMessageType, logMessageData } = event;

    if (!threadID || !logMessageData) return;
    if (!isActive(threadID)) return;

    // Detect group name change
    if (logMessageType !== "log:thread-name") return;

    if (logMessageData.name === LOCKED_TEXT) return;

    api.setTitle(LOCKED_TEXT, threadID, error => {
      if (error) {
        console.error("[LOCKGC] Restore title error:", error);
        return;
      }

      send(
        api,
        `🔒 GOJO LOCKGC\n\nNaibalik ang naka-lock na GC name:\n${LOCKED_TEXT}`,
        threadID
      );
    });
  } catch (error) {
    console.error("[LOCKGC] Event error:", error);
  }
};

// ======================================================
// COMMAND RUNNER
// ======================================================

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const action = String(args[0] || "help").toLowerCase();

  // Admin check
  if (!isAdmin(senderID)) {
    return send(
      api,
      "⛔ GOJO LOCKGC\nAdmin lang ang puwedeng gumamit ng command na ito.",
      threadID,
      messageID
    );
  }

  const { data, thread } = getThreadData(threadID);

  // ON
  if (action === "on") {
    thread.expires = Date.now() + LOCK_DURATION;

    if (!saveData(data)) {
      return send(
        api,
        "❌ Hindi na-save ang LockGC settings. Tingnan ang Render logs.",
        threadID,
        messageID
      );
    }

    api.setTitle(LOCKED_TEXT, threadID, error => {
      if (error) {
        console.error("[LOCKGC] setTitle error:", error);

        send(
          api,
          "⚠️ Na-activate ang protection, pero hindi mapalitan ang GC name. Suriin ang bot permissions.",
          threadID,
          messageID
        );
      }
    });

    return send(
      api,
      `🔒 GOJO LOCKGC: ACTIVATED\n\n` +
      `📌 Locked GC name:\n${LOCKED_TEXT}\n\n` +
      `⏳ Duration: 24 hours\n` +
      `🛡️ Automatic title restoration: ON`,
      threadID,
      messageID
    );
  }

  // OFF
  if (action === "off") {
    thread.expires = 0;

    if (!saveData(data)) {
      return send(
        api,
        "❌ Hindi na-save ang LockGC settings.",
        threadID,
        messageID
      );
    }

    return send(
      api,
      "🔓 GOJO LOCKGC\nProtection is now OFF sa GC na ito.",
      threadID,
      messageID
    );
  }

  // STATUS
  if (action === "status") {
    const remaining = Number(thread.expires) - Date.now();

    if (remaining <= 0) {
      return send(
        api,
        "📊 GOJO LOCKGC STATUS\n\n🔴 Status: OFF",
        threadID,
        messageID
      );
    }

    return send(
      api,
      `📊 GOJO LOCKGC STATUS\n\n` +
      `🟢 Status: ACTIVE\n` +
      `📌 Locked name: ${LOCKED_TEXT}\n` +
      `⏳ Time left: ${formatTime(remaining)}`,
      threadID,
      messageID
    );
  }

  // HELP
  return send(
    api,
    `🔒 GOJO LOCKGC COMMANDS\n\n` +
    `/lockgc on - Activate for 24 hours\n` +
    `/lockgc off - Disable protection\n` +
    `/lockgc status - Check status`,
    threadID,
    messageID
  );
};
