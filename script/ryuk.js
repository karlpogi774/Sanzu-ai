const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "activate",
  version: "1.4.0",
  hasPermission: 0,
  credits: "sinzu",
  description: "24-hour global auto-lamon/asar + Anti-Change Nickname at Anti-Change GC Name (Admin restricted).",
  usePrefix: true,
  commandCategory: "Fun",
  usages: "/activate on — start 24h global auto-lamon at lock features\n/activate off — stop\n/activate status — check remaining time",
  cooldowns: 5
};

const DATA_PATH = path.join(__dirname, "activate_data.json");
const ADMIN_IDS = ["61594022290817", "61593892603402"];

// Pang-lamon / casual na pangaasar na normal ang datingan
const ROASTS = [
  "Ano na namang pinagsasabi mo diyan, lods?",
  "Hinga muna malalim bago mag-type, dami mong sinabi eh.",
  "Parang ewan naman 'to mag-isip.",
  "Sige lang, ikaw na ang bida.",
  "Anyare sa trip mo ngayon? Ang layo na naman.",
  "Hindi ko kaya 'tong pinagsasabi mo, grabe.",
  "Wala ka bang ibang masabi kundi 'yan?",
  "Ayan na naman po siya sa mga hirit niya.",
  "Kumain ka muna kaya bago mag-chat?",
  "Haba ng sinabi mo, wala namang kwenta.",
  "Ayos ka lang ba diyan, paps?",
  "Bakit parang kasalanan ko pa na nabasa ko 'to?",
  "Patingin nga ng resibo niyan.",
  "Tulog na, gabi na oh.",
  "Ibang klase ka rin talaga mang-trip sa sarili mo."
];

function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
    }
  } catch {}
  return { expires: 0, activatedBy: null, lockedNicknames: {}, lockedThreadName: null };
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function isActive() {
  const data = loadData();
  return data.expires && data.expires > Date.now();
}

function getRemaining() {
  const data = loadData();
  if (!data.expires) return 0;
  const left = data.expires - Date.now();
  return left > 0 ? left : 0;
}

// ===== EVENT HANDLER (Lamon, Anti-Change Nickname, Anti-Change GC Name) =====
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, body, type, logMessageData } = event;
  const data = loadData();

  if (!isActive()) return;

  // 1. Anti-Change Nickname Handler
  if (type === "log:user-nickname") {
    const targetID = logMessageData.participant_id;
    const originalNick = data.lockedNicknames?.[threadID]?.[targetID];
    
    if (originalNick !== undefined) {
      api.changeNickname(originalNick, threadID, targetID, (err) => {
        if (!err) api.sendMessage("Bawal palitan ang nickname dito habang aktibo ito.", threadID);
      });
    }
    return;
  }

  // 2. Anti-Change GC Name Handler
  if (type === "log:thread-name") {
    const originalName = data.lockedThreadName?.[threadID];
    const newName = logMessageData.name;

    if (originalName && newName !== originalName) {
      api.setTitle(originalName, threadID, (err) => {
        if (!err) api.sendMessage("Protected ang pangalan ng GC na 'to, bawal palitan.", threadID);
      });
    }
    return;
  }

  // 3. Normal Auto-Lamon Handler
  if (!body || body.startsWith("/") || senderID === api.getCurrentUserID()) return;

  const count = Math.floor(Math.random() * 2) + 1; // 1-2 messages lang para hindi spammy
  const shuffled = [...ROASTS].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);

  for (let i = 0; i < selected.length; i++) {
    setTimeout(() => {
      api.sendMessage(selected[i], threadID);
    }, i * 1000);
  }
};

// ===== COMMAND =====
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  // I-check kung ang nag-command ay kasama sa Admin IDs
  if (!ADMIN_IDS.includes(senderID)) {
    return api.sendMessage("❌ Pasensya na, para lang sa authorized admin ang utos na ito.", threadID, messageID);
  }

  const sub = (args[0] || "").toLowerCase();
  const data = loadData();

  if (sub === "on") {
    const expires = Date.now() + 24 * 60 * 60 * 1000;
    data.expires = expires;
    data.activatedBy = senderID;
    data.activatedAt = Date.now();

    // Kunin at i-lock ang current thread name at mga nicknames ng members
    api.getThreadInfo(threadID, (err, info) => {
      if (!err && info) {
        if (!data.lockedThreadName) data.lockedThreadName = {};
        data.lockedThreadName[threadID] = info.threadName;

        if (!data.lockedNicknames) data.lockedNicknames = {};
        data.lockedNicknames[threadID] = info.nicknames || {};
      }
      saveData(data);
    });

    return api.sendMessage(
      `🔥 24H AUTO-LAMON & PROTECT: ON\n\n` +
      `- Normal/Lamyang pangaasar active\n` +
      `- Naka-lock na ang GC name at mga nicknames\n` +
      `- Use /activate off to stop`,
      threadID,
      messageID
    );
  }

  if (sub === "off") {
    if (isActive()) {
      data.expires = 0;
      saveData(data);
      return api.sendMessage("✅ Tumigil na ang auto-lamon at naka-unlock na ang mga pangalan.", threadID, messageID);
    }
    return api.sendMessage("Hindi naman active ang auto-lamon ngayon.", threadID, messageID);
  }

  if (sub === "status") {
    const left = getRemaining();
    if (left <= 0) {
      return api.sendMessage("Off ang auto-lamon sa ngayon.", threadID, messageID);
    }
    const hours = Math.floor(left / (1000 * 60 * 60));
    const mins = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
    return api.sendMessage(
      `🔥 Active pa ang Auto-Lamon & Protect\nTime left: ${hours}h ${mins}m`,
      threadID,
      messageID
    );
  }

  return api.sendMessage(
    `Usage:\n` +
    `/activate on — start auto-lamon & lock GC/nicknames\n` +
    `/activate off — stop\n` +
    `/activate status — check remaining time`,
    threadID,
    messageID
  );
};
