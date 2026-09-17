const fs = require("fs");
const path = require("path");

// ==========================================
// CONFIGURATION
const ADMIN_ID = "61594055835097"; 
const LOCKED_TEXT = "RYUK JJK TOP 1 POGI";
// ==========================================

module.exports.config = {
  name: "lockgc",
  version: "2.0.0",
  hasPermission: 2,
  credits: "Jehosh",
  description: "Auto-Lock GC Name and Nicknames protection script with fast detection.",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "/lockgc on — I-on ang auto-lock sa GC\n" +
          "/lockgc off — I-off ang auto-lock\n" +
          "/lockgc status — Tingnan ang status",
  cooldowns: 3
};

const DATA_PATH = path.join(__dirname, "lockgc_data.json");

function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
    }
  } catch (err) {}
  return { threads: {} };
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {}
}

function isThreadActive(threadID) {
  const data = loadData();
  const threadData = data.threads[threadID];
  return threadData && threadData.expires && Number(threadData.expires) > Date.now();
}

// Mas mabilis at sabay-sabay na pag-apply ng nicknames para hindi matagalan
function applyLockedNicknames(api, threadID) {
  api.getThreadInfo(threadID, (err, info) => {
    if (err || !info || !info.participantIDs) return;
    info.participantIDs.forEach((userID, index) => {
      setTimeout(() => {
        try {
          api.changeNickname(LOCKED_TEXT, threadID, userID, () => {});
        } catch (e) {}
      }, index * 800); // Binilis ko ang interval sa 800ms para mas mabilis matapos
    });
  });
}

// ===== EVENT HANDLER: MABILIS NA DETECTION SA PAGPAPALIT =====
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, logMessageType, logMessageData } = event;
  
  if (!threadID || !isThreadActive(threadID)) return;

  // 1. Mabilis na pagbabalik kapag pinalitan ang GC Name
  if (logMessageType === "log:thread-name") {
    if (logMessageData && logMessageData.name !== LOCKED_TEXT) {
      setTimeout(() => {
        try {
          api.setTitle(LOCKED_TEXT, threadID, (err) => {
            if (!err) {
              api.sendMessage(`🍎 *Ryuk Security:* Bawal palitan ang pangalan ng GC! Ibinalik ko sa: "${LOCKED_TEXT}".`, threadID);
            }
          });
        } catch (e) {}
      }, 300); // Mas mabilis na detection (300ms)
    }
    return;
  }

  // 2. Mabilis na pagbabalik kapag pinalitan ang Nickname ng kahit sino
  if (logMessageType === "log:user-nickname") {
    const targetUserID = logMessageData.participant_id;
    if (logMessageData.nickname !== LOCKED_TEXT) {
      setTimeout(() => {
        try {
          api.changeNickname(LOCKED_TEXT, threadID, targetUserID, (err) => {
            if (!err) {
              api.sendMessage(`🍎 *Ryuk Security:* Naka-lock ang nickname sa "${LOCKED_TEXT}". Huwag pasaway!`, threadID);
            }
          });
        } catch (e) {}
      }, 300); // Mas mabilis na detection (300ms)
    }
    return;
  }
};

// ===== COMMAND RUNNER =====
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const sub = (args[0] || "").toLowerCase();
  const data = loadData();

  if (!data.threads) data.threads = {};
  if (!data.threads[threadID]) {
    data.threads[threadID] = { expires: 0 };
  }

  const currentThread = data.threads[threadID];

  // Admin Guard
  if (senderID !== ADMIN_ID) {
    return api.sendMessage("❌ *Ryuk:* Admin lang ang pwedeng mag-activate ng proteksyong ito.", threadID, messageID);
  }

  if (sub === "on") {
    currentThread.expires = Date.now() + 24 * 60 * 60 * 1000;
    saveData(data);

    // I-lock agad ang GC Name at mga Nicknames
    api.setTitle(LOCKED_TEXT, threadID, () => {});
    applyLockedNicknames(api, threadID);

    return api.sendMessage(
      `🍎 LOCKGC PROTECTION: ACTIVATED 🔒\n\n` +
      `📌 GC Name & Nicknames are now locked to:\n"${LOCKED_TEXT}"\n` +
      `⚡ Mabilis nang idedetect at ibabalik kapag may nagbago!\n` +
      `⏳ Duration: 24 Oras`,
      threadID,
      messageID
    );
  }

  if (sub === "off") {
    currentThread.expires = 0;
    saveData(data);
    return api.sendMessage("🍎 *Ryuk:* Naka-off na ang lockgc protection sa GC na ito.", threadID, messageID);
  }

  if (sub === "status") {
    const left = Number(currentThread.expires) - Date.now();
    if (left <= 0) return api.sendMessage("📊 Status: Naka-OFF ang lockgc protection sa GC na 'to.", threadID, messageID);

    const hours = Math.floor(left / (1000 * 60 * 60));
    const mins = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
    return api.sendMessage(
      `📊 LOCKGC STATUS:\n` +
      `• Time left: ${hours}h ${mins}m\n` +
      `• Target Text: ${LOCKED_TEXT} (Protected)`,
      threadID,
      messageID
    );
  }

  return api.sendMessage(
    `🍎 LockGC Commands:\n` +
    `/lockgc on — I-on ang auto lock ng GC name at nicknames\n` +
    `/lockgc off — Patayin ang proteksyon\n` +
    `/lockgc status — Tingnan ang status`,
    threadID,
    messageID
  );
};
