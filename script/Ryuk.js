// ==========================================================
// 👑 RYUK — MAKUNAT V1.1 ✨
// ✅ TULUY-TULOY KAHIT WALANG NAG-CHAT 🔁
// ✅ HINDI HIHINTO — /ryuk off LANG ANG MAKAPAGPATIGIL ❌
// ✅ WALANG AUTO-REPLY SA IBANG CHAT — SARILI LANG NAGLALAPAG
// ✅ AUTO-REACT SA SARILI — LIGTAS 🛡️
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

// ⚡ ORAS — HINDI MABILIS, HINDI MABAGAL | IWAS DETECT
const MIN_DELAY = 28000;  // 28 segundo
const MAX_DELAY = 45000;  // 45 segundo

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
const activeLoops = new Map(); // threadID → { timer: Object }

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

// ✅ SIMULANG LAPAG — SARILI LANG, TULUY-TULOY
function startLoop(api, threadID) {
  stopLoop(threadID); // siguradong walang dating tumatakbo

  async function sendNext() {
    if (!activeLoops.has(threadID)) return; // huminto na

    try {
      const text = nextLine();
      api.sendMessage(text, threadID, (err, info) => {
        if (!err && info?.messageID) {
          // ✅ AUTO-REACT SA SARILING MENSAHE
          setTimeout(() => {
            const emoji = SELF_REACTS[Math.floor(Math.random() * SELF_REACTS.length)];
            api.setMessageReaction(emoji, info.messageID, () => {}, true);
          }, 1000);
        }
      });
    } catch (e) {
      // ✅ KUNG MAY ERROR — HINDI HIHINTO! SUSUBOK ULIT
    }

    // ✅ SUSUNOD NA LAPAG — HINDI TUMITIGIL
    const nextDelay = getRandomDelay();
    const timer = setTimeout(sendNext, nextDelay);
    activeLoops.set(threadID, { timer });
  }

  activeLoops.set(threadID, { timer: null });
  sendNext(); // unang lapag agad
}

function stopLoop(threadID) {
  const existing = activeLoops.get(threadID);
  if (existing) {
    if (existing.timer) clearTimeout(existing.timer);
    activeLoops.delete(threadID);
  }
}

// ✅ WALANG AUTO-REPLY SA IBANG CHAT — TINANGGAL NA!
module.exports.handleEvent = async function ({ api, event }) {
  // WALA — HINDI TUTUGON SA IBANG MENSAHE
};

module.exports.config = {
  name: "ryuk",
  version: "1.1.0",
  hasPermission: 0,
  credits: "RYUK — MAKUNAT ✅",
  description: "Tuluy-tuloy kahit walang chat | Sarili lang naglalapag",
  usePrefix: true,
  commandCategory: "👑 RYUK",
  usages: "/ryuk on — Simula ✅\n/ryuk off — Hinto ✅"
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (!isAdmin(senderID)) {
    return api.sendMessage("👑 Hindi mo hawak ang kapangyarihan dito!", threadID, messageID);
  }

  const cmd = (args[0] || "").toLowerCase();

  if (cmd === "on") {
    startLoop(api, threadID);
    return api.sendMessage(
      "👑 RYUK — NAKA-ON NA! ✨\n\n" +
      "✅ Tuluy-tuloy kahit walang nag-chat 🔁\n" +
      "✅ Sarili lang naglalapag — walang sagot sa iba\n" +
      "✅ Auto-react sa sarili — hindi ma-detect 🛡️\n" +
      "✅ Hihinto lang kapag sinabi mong /ryuk off ❌\n" +
      "✅ Makunat — hindi titigil 24/7 ⚡\n\n" +
      "💎 I-type ang /ryuk off para huminto",
      threadID, messageID
    );
  }

  if (cmd === "off") {
    stopLoop(threadID);
    return api.sendMessage("🛑 RYUK — HUMINTO NA 👑", threadID, messageID);
  }

  return api.sendMessage(
    "👑 RYUK — MAKUNAT ✨\n\n" +
    "/ryuk on — Simulang maglapag ✅\n" +
    "/ryuk off — Huminto ✅\n\n" +
    "🔁 Tuluy-tuloy kahit tahimik ang GC\n" +
    "🛡️ Tamang bilis — hindi ma-restrict\n" +
    "💎 Sarili lang naglalapag — malinis at makunat",
    threadID, messageID
  );
};
                     
