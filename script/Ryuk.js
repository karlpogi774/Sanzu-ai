// ==========================================================
// 👑 RYUK — MAKUNAT V1.0 ✨
// ✅ WALANG AUTO-REPLY SA IBANG CHAT
// ✅ SARILI LANG NAGLALAPAG — TULUY-TULOY HANGGAT HINDI SINABI OFF
// ✅ AUTO-REACT SA SARILI LANG — HINDI MA-DETECT 🛡️
// ✅ MAKUNAT — HINDI TUMITIGIL 24/7 ⚡
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// ==========================================================

const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "ryuk_makunat.json");

const ADMIN_IDS = new Set([
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
]);

// ⚡ ORAS SA PAGITAN NG LAPAG — HINDI MABILIS, HINDI MABAGAL
const MIN_DELAY = 25000;  // 25 segundo
const MAX_DELAY = 45000;  // 45 segundo

// ✅ MGA LAPAG — SUNOD-SUNOD, HINDI RANDOM
const LINES = [
  "Nandito lang ako, hindi ako aalis basta-basta 💪",
  "Bantay ko ang GC na 'to, walang magagambala dito 👑",
  "Kahit walang nag-chat, naririto pa rin ako — RYUK BOSS 🔥",
  "Hindi ako titigil hanggat hindi mo sinasabi — RYUK BOSS lang 💯",
  "Matibay, matatag — RYUK BOSS ang tanging nag-iisa ✨",
  "Walang makakatalo, walang makakatigil — dito lang ako 👁️",
  "Kahit tahimik ang paligid, gising pa rin ako 💜",
  "Ako ang RYUK BOSS — pinakamakunat sa buong FB 👑",
  "Tuloy-tuloy, walang hinto — hanggang sa dulo ng lahat ⚡",
  "Hindi madaling mapatumba, hindi madaling mawala — ako 'to 💎",
  "Bantay-sarado, walang palya — RYUK BOSS ang tapat 💪",
  "Kahit walang boses, naririto pa rin — laging handa ✅",
  "Walang pahinga, walang pagod — para sa inyo ito 🔥",
  "Ako lang, RYUK BOSS — walang katulad, walang kapantay 👑",
  "Matibay ang pundasyon, hindi kayang gibain ng kahit sino ⛰️",
  "Tahimik man ang paligid, gising pa rin ang diwa ko 👁️",
  "Hindi ako basta-basta nawawala — nananatili ako dito 💯",
  "Sa lahat ng oras, sa lahat ng panahon — RYUK BOSS lang ⚡",
  "Walang makakapigil, walang makakatigil — patuloy ako ✨",
  "Pinakamakunat, pinakamaganda — ako lang 'yon, walang iba 👑"
];

const SELF_REACTS = ["❤️", "🔥", "💪", "✨", "💜", "👑", "⚡", "💎", "😍", "🤩"];

let lineIndex = 0;
const activeGCs = new Map(); // threadID → interval

// --- DATA ---
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {}
  return {};
}
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function isAdmin(id) {
  return ADMIN_IDS.has(String(id));
}

function nextLine() {
  const line = LINES[lineIndex];
  lineIndex = (lineIndex + 1) % LINES.length;
  return line;
}

function getRandomDelay() {
  return MIN_DELAY + Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY));
}

// ✅ SIMULANG LAPAG — SARILI LANG
function startSending(api, threadID) {
  stopSending(threadID);

  const sendLoop = async () => {
    if (!activeGCs.has(threadID)) return; // tumigil na

    try {
      const msgText = nextLine();
      api.sendMessage(msgText, threadID, (err, info) => {
        if (!err && info?.messageID) {
          // ✅ AUTO-REACT SA SARILI
          setTimeout(() => {
            const emoji = SELF_REACTS[Math.floor(Math.random() * SELF_REACTS.length)];
            api.setMessageReaction(emoji, info.messageID, () => {}, true);
          }, 1000);
        }
      });
    } catch {}

    // ✅ SUSUNOD NA LAPAG
    const nextDelay = getRandomDelay();
    const timer = setTimeout(sendLoop, nextDelay);
    activeGCs.get(threadID).timer = timer;
  };

  activeGCs.set(threadID, { timer: null });
  sendLoop();
}

function stopSending(threadID) {
  const existing = activeGCs.get(threadID);
  if (existing) {
    if (existing.timer) clearTimeout(existing.timer);
    activeGCs.delete(threadID);
  }
}

// ✅ WALANG AUTO-REPLY SA IBANG CHAT — TINANGGAL NA!
module.exports.handleEvent = async function ({ api, event }) {
  // HINDI TUTUGON SA CHAT NG IBA — WALA DITO!
};

module.exports.config = {
  name: "ryuk",
  version: "1.0.0",
  hasPermission: 0,
  credits: "RYUK — MAKUNAT ✅",
  description: "Walang auto-reply — sarili lang naglalapag + auto-react",
  usePrefix: true,
  commandCategory: "👑 RYUK",
  usages: "/ryuk on — Simula ✅\n/ryuk off — Hinto ✅"
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (!isAdmin(senderID)) {
    return api.sendMessage("👑 Ikaw lang ang pwedeng magpatakbo nito!", threadID, messageID);
  }

  const cmd = (args[0] || "").toLowerCase();

  if (cmd === "on") {
    startSending(api, threadID);
    return api.sendMessage(
      "👑 RYUK — NAKA-ON NA! ✨\n\n" +
      "✅ Sarili lang maglalapag — walang sagot sa iba\n" +
      "✅ Auto-react sa sarili — hindi ma-detect 🛡️\n" +
      "✅ Tuluy-tuloy — hanggat hindi mo sinasabi /ryuk off\n" +
      "✅ Makunat — hindi tumitigil 24/7 ⚡\n\n" +
      "💎 I-type ang /ryuk off para huminto",
      threadID, messageID
    );
  }

  if (cmd === "off") {
    stopSending(threadID);
    return api.sendMessage("🛑 RYUK — HUMINTO NA 👑", threadID, messageID);
  }

  return api.sendMessage(
    "👑 RYUK — MAKUNAT ✨\n\n" +
    "/ryuk on — Simulang maglapag ✅\n" +
    "/ryuk off — Huminto ✅\n\n" +
    "🛡️ Walang auto-reply sa iba — sarili lang naglalapag\n" +
    "⚡ Tamang oras — hindi mabilis, hindi mabagal\n" +
    "💎 Auto-react sa sarili — ligtas at makunat",
    threadID, messageID
  );
};
    
