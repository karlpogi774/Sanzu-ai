// ==========================================================
// 👑 RYUK BOSS — ULTIMATE MAKUNAT V24.1 ✨
// ✅ LALAPAG KAHIT WALANG MAG-CHAT SA GC! 24/7
// ✅ AUTO-REACT SA LAHAT NG MENSAHE 💖
// ✅ AUTO GC NAME: RYUK BOSS GC — HINDI MAPAPALITAN NG IBA!
// ✅ AUTO NICKNAME: RYUK BOSS — LAGI
// ✅ AUTO WELCOME — BATI SA BAGONG KASALI
// ✅ KAHIT /SILENT — HINDI TUMITIGIL, LALAPAG PA RIN!
// ✅ HINDI MA-DETECT — MABAGAL, NATURAL, RANDOM DELAY
// ✅ GC-SPECIFIC — DOON LANG SA GC NA IN-ON MO
// ✅ 4 ADMIN PROTECTED — WALANG IBANG MAKAKAGALAW
// ✅ WALANG ERROR — PROTECTED SA LAHAT NG SIDE
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

const activeIntervals = {};
const lastSent = {};
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
  const idx = (lastSent[threadID] || -1) + 1;
  lastSent[threadID] = idx >= statusLines.length ? 0 : idx;
  return statusLines[lastSent[threadID]];
}

function pickReact() {
  return REACT_EMOJIS[Math.floor(Math.random() * REACT_EMOJIS.length)];
}

function stopGCWatch(threadID) {
  if (activeIntervals[threadID]) {
    clearInterval(activeIntervals[threadID]);
    delete activeIntervals[threadID];
  }
}

function startGCWatch(api, threadID) {
  stopGCWatch(threadID);
  const data = loadGC(threadID);
  if (!data.active) return;

  activeIntervals[threadID] = setInterval(async () => {
    const cfg = loadGC(threadID);
    if (!cfg.active) { stopGCWatch(threadID); return; }

    try {
      const info = await api.getThreadInfo(threadID);
      const myID = api.getCurrentUserID ? api.getCurrentUserID() : api.userID;

      // ✅ AUTO GC NAME — IBABALIK AGAD KAPAG PALITAN NG IBA
      if (cfg.autoGname && info.threadName !== cfg.targetGname) {
        await api.setTitle(cfg.targetGname, threadID);
      }

      // ✅ AUTO NICK — LAGI RYUK BOSS
      if (cfg.autoNick && info.participants) {
        const me = info.participants.find(p => p.id === myID);
        if (me && me.name !== cfg.targetNick) {
          await api.changeNickname(cfg.targetNick, threadID);
        }
      }

      // ✅ LALAPAG KAHIT WALANG MAG-CHAT — SARILING ORAS
      const sendDelay = (Math.floor(Math.random() * 10) + 15) * 60 * 1000;
      setTimeout(async () => {
        if (loadGC(threadID).active) {
          await api.sendMessage(pickLine(threadID), threadID);
        }
      }, sendDelay);

    } catch {}
  }, 18 * 60 * 1000);
}

module.exports.config = {
  name: "ryuk",
  version: "24.1.0",
  hasPermission: 0,
  credits: "RYUK BOSS — AUTO-REACT + MAKUNAT V24.1",
  description: "Lalapag kahit walang mag-chat + AutoReact + Kumpleto",
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
        "🏷️ GC Name: " + TARGET_GNAME + "\n" +
        "👤 Nick: " + TARGET_NICK + "\n" +
        "💖 Auto-React: " + (data.autoReact ? "✅ ON" : "❌ OFF") + "\n" +
        "⚡ Lalapag pa rin kahit walang mag-chat!",
        tid
      );

    case "off":
      data.active = false;
      saveGC(tid, data);
      stopGCWatch(tid);
      return api.sendMessage("🛑 RYUK BOSS — HUMINTO NA. Salamat 👑", tid);

    case "silent":
      data.silent = true;
      saveGC(tid, data);
      return api.sendMessage("🤫 Tahimik na — PERO LALAPAG PA RIN! ✅", tid);

    case "react":
      data.autoReact = !data.autoReact;
      saveGC(tid, data);
      return api.sendMessage(
        "💖 Auto-React: " + (data.autoReact ? "✅ NAKA-ON — Magre-react sa lahat ng mensahe!" : "❌ NAKA-OFF"),
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
        "👑 RYUK BOSS V24.1 — KUMPLETO NA ✨\n\n" +
        "✅ /ryuk on — Simulan dito sa GC\n" +
        "✅ /ryuk off — Itigil\n" +
        "✅ /ryuk silent — Tahimik pero tuloy pa rin\n" +
        "✅ /ryuk react — I-toggle Auto-React 💖\n" +
        "✅ /ryuk gname — I-lock GC Name\n" +
        "✅ /ryuk welcome — Auto-bati sa bago\n\n" +
        "💎 Lalapag kahit walang mag-chat! Auto-react sa lahat!",
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
      await new Promise(r => setTimeout(r, 600 + Math.random() * 900));
      await api.setMessageReaction(pickReact(), event.messageID);
    } catch {}
  }

  // 👋 AUTO WELCOME SA BAGONG KASALI
  if (cfg.autoWelcome && event.type === "event" && event.logMessageType === "log:subscribe") {
    try {
      const newUsers = event.logMessageData?.addedParticipants || [];
      for (const u of newUsers) {
        if (u.id === myID) continue;
        await new Promise(r => setTimeout(r, 2500 + Math.random() * 2500));
        await api.sendMessage(
          `👋 Welcome @${u.name || "kaibigan"}! Dito sa GC ni RYUK BOSS 👑\n` +
          "Masaya kaming nandito ka — mag-enjoy at ingat palagi! 💜",
          tid
        );
      }
    } catch {}
  }
};
    
