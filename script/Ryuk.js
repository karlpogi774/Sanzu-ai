// ==========================================================
// 👑 RYUK BOSS — 2 SECOND LAPAG + MAKUNAT V24.4 ✨
// ✅ LUMAPAG BAWAT ~2 SECONDS! ⚡
// ✅ TULAY-TULAY KAHIT WALANG MAG-CHAT SA GC! 24/7
// ✅ SIGURADONG GUMAGANA AUTO GC NAME AT NICK!
// ✅ AUTO-REACT SA LAHAT NG MENSAHE 💖
// ✅ AUTO WELCOME — BATI SA BAGONG KASALI
// ✅ /silent = HINDI TUMITIGIL, LALAPAG PA RIN!
// ✅ MAKUNAT — HINDI MA-RESTRICT | MAY RANDOM PROTECTION
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// ==========================================================

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "ryuk_data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const TARGET_NICK = "RYUK BOSS";
const TARGET_GNAME = "RYUK BOSS GC";
const ADMIN_IDS = new Set([
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
]);

const running = {};
const lineIndex = {};
const REACT_EMOJIS = ["❤️", "🔥", "💪", "✨", "💜", "👑", "⚡", "💎"];

const statusLines = [
  "Nandito lang ako, hindi ako aalis basta-basta 💪",
  "Bantay ko ang GC na 'to, walang magagambala dito 👑",
  "Kahit tahimik, nagbabantay pa rin ako — RYUK BOSS 🔥",
  "Hindi ako titigil hanggat hindi sinabi — RYUK BOSS lang 💯",
  "Matibay, matatag, RYUK BOSS ang tanging nag-iisa ✨",
  "Walang makakatalo, walang makakatigil — dito lang ako 👁️",
  "Kahit walang nagsasalita, hindi ako iiwan sa inyo 💜",
  "Ako ang RYUK BOSS — pinakamakunat sa buong FB 👑",
  "Tuloy-tuloy, walang hinto, hanggang sa dulo ng lahat ⚡",
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

function isAdmin(senderID) {
  return ADMIN_IDS.has(String(senderID));
}

function getGCFile(threadID) {
  return path.join(DATA_DIR, `${threadID}.json`);
}

function loadGC(threadID) {
  try {
    const file = getGCFile(threadID);
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {}
  return {
    active: false,
    silent: false,
    autoNick: true,
    autoGname: true,
    autoWelcome: true,
    autoReact: true,
    targetNick: TARGET_NICK,
    targetGname: TARGET_GNAME
  };
}

function saveGC(threadID, data) {
  fs.writeFileSync(getGCFile(threadID), JSON.stringify(data, null, 2));
}

function pickLine(threadID) {
  lineIndex[threadID] = ((lineIndex[threadID] || -1) + 1) % statusLines.length;
  return statusLines[lineIndex[threadID]];
}

function pickReact() {
  return REACT_EMOJIS[Math.floor(Math.random() * REACT_EMOJIS.length)];
}

function stopAll(threadID) {
  running[threadID] = false;
}

async function maintainNames(api, threadID) {
  while (running[threadID]) {
    const cfg = loadGC(threadID);
    if (!cfg.active) return;
    try {
      const info = await api.getThreadInfo(threadID);
      const myID = api.getCurrentUserID ? api.getCurrentUserID() : api.userID;
      if (cfg.autoGname && info.threadName !== cfg.targetGname) {
        await api.setTitle(cfg.targetGname, threadID);
      }
      if (cfg.autoNick && info.nicknames && info.nicknames[myID] !== cfg.targetNick) {
        await api.changeNickname(cfg.targetNick, threadID);
      }
    } catch {}
    await new Promise(r => setTimeout(r, 3000)); // Check bawat 3 sec
  }
}

async function messageLoop(api, threadID) {
  while (running[threadID]) {
    const cfg = loadGC(threadID);
    if (!cfg.active) return;
    try {
      // ✅ ~2 SECONDS BAWAT LAPAG + KONTING RANDOM PARA MAKUNAT
      const baseDelay = 2000;
      const randomExtra = Math.floor(Math.random() * 300); // 0-0.3 sec extra — hindi masyadong parehas
      await new Promise(r => setTimeout(r, baseDelay + randomExtra));
      
      if (!running[threadID]) return;
      await api.sendMessage(pickLine(threadID), threadID);
    } catch {}
  }
}

function startGCWatch(api, threadID) {
  stopAll(threadID);
  running[threadID] = true;
  lineIndex[threadID] = -1;
  maintainNames(api, threadID);
  messageLoop(api, threadID);
}

module.exports.config = {
  name: "ryuk",
  version: "24.4.0",
  hasPermission: 0,
  credits: "RYUK BOSS — 2SEC LAPAG + MAKUNAT V24.4",
  description: "2sec Lapag | Tuloy-tuloy | AutoName | Makunat",
  usePrefix: true,
  commandCategory: "👑 RYUK BOSS",
  usages: "/ryuk on | /ryuk off | /ryuk silent | /ryuk react | /ryuk gname | /ryuk welcome"
};

module.exports.run = async function ({ api, event, args }) {
  const tid = event.threadID;
  const sid = event.senderID;
  if (!isAdmin(sid)) return;

  const cmd = args[0]?.toLowerCase();
  let data = loadGC(tid);

  switch (cmd) {
    case "on":
      data.active = true;
      data.silent = false;
      saveGC(tid, data);
      startGCWatch(api, tid);
      return api.sendMessage(
        "👑 RYUK BOSS — NAKA-ON NA!\n" +
        "⚡ Lapag: ~2 seconds! Tuloy-tuloy!\n" +
        "🏷️ GC Name: " + TARGET_GNAME + " ✅\n" +
        "👤 Nick: " + TARGET_NICK + " ✅\n" +
        "💖 Auto-React: " + (data.autoReact ? "✅ ON" : "❌ OFF") + "\n" +
        "🛡️ Makunat — hindi ma-restrict!",
        tid
      );

    case "off":
      stopAll(tid);
      data.active = false;
      saveGC(tid, data);
      return api.sendMessage("🛑 RYUK BOSS — HUMINTO NA. Salamat 👑", tid);

    case "silent":
      data.silent = true;
      saveGC(tid, data);
      return api.sendMessage("🤫 Tahimik na — PERO TULAY-TULAY PA RIN ANG LAPAG! ✅", tid);

    case "react":
      data.autoReact = !data.autoReact;
      saveGC(tid, data);
      return api.sendMessage(
        "💖 Auto-React: " + (data.autoReact ? "✅ NAKA-ON" : "❌ NAKA-OFF"),
        tid
      );

    case "gname":
      data.autoGname = !data.autoGname;
      saveGC(tid, data);
      return api.sendMessage(
        "🏷️ Auto GC Name: " + (data.autoGname ? "✅ NAKA-ON — Lagi " + TARGET_GNAME : "❌ NAKA-OFF"),
        tid
      );

    case "welcome":
      data.autoWelcome = !data.autoWelcome;
      saveGC(tid, data);
      return api.sendMessage(
        "👋 Auto Welcome: " + (data.autoWelcome ? "✅ NAKA-ON" : "❌ NAKA-OFF"),
        tid
      );

    default:
      return api.sendMessage(
        "👑 RYUK BOSS V24.4 — 2 SECOND LAPAG ⚡\n\n" +
        "✅ /ryuk on — Simulan dito sa GC\n" +
        "✅ /ryuk off — Itigil\n" +
        "✅ /ryuk silent — Tahimik pero tuloy pa rin\n" +
        "✅ /ryuk react — I-toggle Auto-React 💖\n" +
        "✅ /ryuk gname — I-lock GC Name\n" +
        "✅ /ryuk welcome — Auto-bati sa bago\n\n" +
        "⚡ ~2 sec bawat lapag! Tuloy-tuloy kahit walang mag-chat!\n" +
        "🛡️ Makunat — may random delay para hindi ma-restrict!",
        tid
      );
  }
};

// ✅ AUTO-REACT + AUTO-WELCOME — GUMAGANA!
module.exports.handleEvent = async function ({ api, event }) {
  const tid = event.threadID;
  const cfg = loadGC(tid);
  if (!cfg.active) return;

  const myID = api.getCurrentUserID ? api.getCurrentUserID() : api.userID;

  // 💖 AUTO-REACT SA LAHAT NG MENSAHE
  if (cfg.autoReact && event.type === "message" && event.senderID !== myID && event.messageID) {
    try {
      await new Promise(r => setTimeout(r, 300 + Math.random() * 500));
      await api.setMessageReaction(pickReact(), event.messageID);
    } catch {}
  }

  // 👋 AUTO WELCOME SA BAGONG KASALI
  if (cfg.autoWelcome && event.type === "event" && event.logMessageType === "log:subscribe") {
    try {
      const newUsers = event.logMessageData?.addedParticipants || [];
      for (const u of newUsers) {
        if (u.id === myID) continue;
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
        await api.sendMessage(
          `👋 Welcome @${u.name || "kaibigan"}! Dito sa GC ni RYUK BOSS 👑\n` +
          "Masaya kaming nandito ka — mag-enjoy at ingat palagi! 💜",
          tid
        );
      }
    } catch {}
  }
};
    
