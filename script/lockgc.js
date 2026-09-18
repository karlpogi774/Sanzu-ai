const fs = require("fs");
const path = require("path");

// ==========================================
// CONFIG
// ==========================================
const ADMIN_ID = "61594055835097";
const LOCKED_TEXT = "RYUK JJK TOP 1 POGI";
const LOCK_DURATION = 24 * 60 * 60 * 1000;

const DATA_PATH = path.join(__dirname, "lockgc_data.json");

// ==========================================
// COMMAND CONFIG
// ==========================================
module.exports.config = {
  name: "lockgc",
  version: "4.0.0",
  hasPermission: 0,
  credits: "Gojo",
  description: "Protects the group title for 24 hours.",
  commandCategory: "Admin",
  usages: "/lockgc on | off | status",
  usePrefix: true,
  cooldowns: 3
};

// ==========================================
// DATA
// ==========================================
function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));

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
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("[LockGC] Save error:", err.message);
    return false;
  }
}

function getThread(threadID) {
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
  const { thread } = getThread(threadID);
  return Number(thread.expires) > Date.now();
}

function remainingTime(ms) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${minutes}m`;
}

// ==========================================
// EVENT HANDLER
// ==========================================
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, logMessageType, logMessageData } = event;

  if (!threadID || !logMessageData || !isActive(threadID)) return;

  // Detect group title changes
  if (logMessageType === "log:thread-name") {
    if (logMessageData.name === LOCKED_TEXT) return;

    api.setTitle(LOCKED_TEXT, threadID, err => {
      if (err) {
        console.error("[LockGC] Could not restore title:", err.message);
        return;
      }

      api.sendMessage(
        `🔒 GOJO LOCKGC\nNaibalik ang naka-lock na GC name:\n${LOCKED_TEXT}`,
        threadID
      );
    });
  }
};

// ==========================================
// COMMAND
// ==========================================
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const action = (args[0] || "").toLowerCase();

  // Admin verification
  if (String(senderID) !== ADMIN_ID) {
    return api.sendMessage(
      "⛔ Gojo LockGC\nAdmin lang ang puwedeng gumamit ng command na ito.",
      threadID,
      messageID
    );
  }

  const { data, thread } = getThread(threadID);

  // ON
  if (action === "on") {
    thread.expires = Date.now() + LOCK_DURATION;

    if (!saveData(data)) {
      return
