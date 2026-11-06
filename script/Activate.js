const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "activate",
  version: "2.2.0",
  hasPermission: 0,
  credits: "sinzu • updated by RYUK",
  description: "🔥 DUMMYLANDIA EDITION — Auto-rant, nickname/group manager, anti-spam & self-react.",
  usePrefix: true,
  commandCategory: "Fun",
  cooldowns: 5
};

// 🔒 ADMIN UIDS — ONLY THESE CAN USE COMMANDS
const ADMIN_UIDS = [
  "61595507156493",
  "61595398037273",
  "61595932841761"   // ✅ NEW ADMIN ADDED
];

const DATA_PATH = path.join(__dirname, "activate_data.json");

// 😂 RANTER EMOJIS — DUMMYLANDIA VIBES
const REACT_EMOJIS = ["🤡", "💩", "😹", "🤌", "🙄", "💀", "🗑️", "🤦"];

// 🗣️ PINOY RANTER LINES — DUMMYLANDIA EDITION
const ROASTS = [
  "🤡 Luh? Akala mo naman may sense sinabi mo",
  "💀 Utak mo parang basura, tapos ikaw pa may ganang magsalita",
  "🗑️ Pwede ba mag log out ka muna? Nasasaktan mata ko sa tipa mo",
  "😹 Grabe confidence pero yung laman ng utak hanggang tuhod lang",
  "🤌 Wag ka magpanggap matalino, halata naman wala kang maisip",
  "🙄 Ang daming sinabi pero wala namang kwenta parang ikaw",
  "💩 Sayang lang data mo dyan, wala naman papuntang utak yan",
  "🤦 Tumahimik ka na lang mas okay pa, di ka mapapahiya",
  "🔥 Ikaw yung patunay na hindi lahat nabigyan ng utak",
  "💀 Tapos ka na ba? Pwede ka na umalis, umiikot mundo ko sa kalokohan mo",
  "🤡 Wag kang magaling, alam nating ikaw ang pinaka-dito sa atin",
  "🗑️ Salita mo parang basura — itatapon ko lang agad",
  "😹 Sa dinami dami ng pwedeng sabihin, yan pa ang napili mo?",
  "🤌 Isipin mo muna bago mo pindutin send, please lang",
  "🙄 Ang gulo ng isip mo parang hindi nagalit na chat",
  "💀 Pag nagsasalita ka parang nawawalan ng pag asa ang mundo",
  "🤡 Dummy detected 🚨 wag ka na magtago, halata ka na",
  "🗑️ Quality zero pero confidence unlimited — ikaw talaga 'to",
  "😹 Nagbasa ka ba o galing lang yan sa hangin?",
  "🤦 Sana next life may utak ka na, para hindi ganito kalaman ang chat mo"
];

// 🔒 CHECK IF USER IS ADMIN
function isAdmin(uid) {
  return ADMIN_UIDS.includes(uid);
}

function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
    }
  } catch {}
  return { active: false, activatedBy: null };
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function isActive() {
  const data = loadData();
  return data.active === true;
}

const isProcessing = new Set();

// ===== EVENT HANDLER =====
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, body } = event;

  if (!body || body.startsWith("/") || senderID === api.getCurrentUserID()) return;
  if (!isActive()) return;
  if (isProcessing.has(threadID)) return;
  
  isProcessing.add(threadID);

  try {
    const randomRoast = ROASTS[Math.floor(Math.random() * ROASTS.length)];
    const randomEmoji = REACT_EMOJIS[Math.floor(Math.random() * REACT_EMOJIS.length)];

    api.sendMessage(randomRoast, threadID, (err, info) => {
      if (!err && info?.messageID) {
        api.setMessageReaction(randomEmoji, info.messageID, (reactErr) => {
          if (reactErr) console.error("React error:", reactErr);
        }, true);
      }
      isProcessing.delete(threadID);
    });
  } catch (error) {
    console.error("Error:", error);
    isProcessing.delete(threadID);
  }
};

// ===== COMMAND HANDLER =====
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const sub = (args[0] || "").toLowerCase();
  const data = loadData();

  // ❌ BLOCK NON-ADMINS
  if (!isAdmin(senderID)) {
    return api.sendMessage("❌ Wala kang permission gamitin 'to, admin lang pwede!", threadID, messageID);
  }

  if (sub === "on") {
    data.active = true;
    data.activatedBy = senderID;
    data.activatedAt = Date.now();
    saveData(data);
    return api.sendMessage(
      "🔥 DUMMYLANDIA AUTO-RANT: ON ✅\n\n" +
      "Mode: INFINITE ♾️ | Ranter: ACTIVE\n" +
      "Anti-spam & Auto-react: ENABLED\n" +
      "/activate off — to stop",
      threadID, messageID
    );
  }

  if (sub === "off") {
    data.active = false;
    saveData(data);
    return api.sendMessage("✅ DUMMYLANDIA Auto-rant turned OFF.", threadID, messageID);
  }

  if (sub === "status") {
    return api.sendMessage(
      data.active
        ? "🔥 DUMMYLANDIA Auto-rant is ACTIVE — RANTING MODE ON 💯"
        : "😴 DUMMYLANDIA Auto-rant is currently OFF.",
      threadID, messageID
    );
  }

  if (sub === "setnick") {
    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const total = threadInfo.participantIDs.length;
      api.sendMessage(`⏳ Binabago nickname ng ${total} members...`, threadID);
      
      for (const uid of threadInfo.participantIDs) {
        api.changeNickname("DUMMY • LANDIA", threadID, uid, (err) => {
          if (err) console.error(`Fail ${uid}:`, err);
        });
      }
      return api.sendMessage("✅ Lahat ng nickname naging: DUMMY • LANDIA", threadID, messageID);
    } catch (e) {
      return api.sendMessage("❌ Error — siguraduhin admin ang bot!", threadID, messageID);
    }
  }

  if (sub === "setgname") {
    api.setTitle("🏠 DUMMYLANDIA 🏠", threadID, (err) => {
      if (err) return api.sendMessage("❌ Error — admin permission needed!", threadID, messageID);
      return api.sendMessage("✅ Group name changed to: 🏠 DUMMYLANDIA 🏠", threadID, messageID);
    });
    return;
  }

  return api.sendMessage(
    "📖 Commands:\n" +
    "/activate on — Start ranting 🔥\n" +
    "/activate off — Stop 😴\n" +
    "/activate status — Check status 📊\n" +
    "/activate setnick — All nick → DUMMY • LANDIA 🏷️\n" +
    "/activate setgname — Group → 🏠 DUMMYLANDIA 🏠",
    threadID, messageID
  );
};
  
