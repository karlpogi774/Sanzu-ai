// ==========================================================
// 👑 RYUK BOSS — ULTIMATE MAKUNAT V21.0 ✨
// ✅ /silent = TAHIMIK LANG — HINDI TUMITIGIL! BANTAY PA RIN!
// ✅ KAHIT WALANG MAG-CHAT — LALAPAG PA RIN! MAKUNAT 24/7
// ✅ HINDI MA-DETECT — SLOW & NATURAL LANG ✅
// ✅ SA GC NA IN-ON KA LANG GAGANA — HINDI SA LAHAT!
// ✅ AUTO-NICK: RYUK BOSS | AUTO-WELCOME | GC PROTECTION
// ✅ 4 ADMIN LOCKED — WALANG MAKAKAGAMBALA!
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// ==========================================================

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "ryuk_data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const gcConfig = {};
const activeIntervals = {};
const lastSent = {};
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

const ADMIN_IDS = new Set([
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
]);

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
  } catch (e) {}
  return {
    active: false,
    silent: false,
    autoNick: true,
    targetNick: "RYUK BOSS",
    autoWelcome: true,
    savedGname: ""
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
      // Auto-set nickname
      if (cfg.autoNick && cfg.targetNick) {
        const info = await api.getThreadInfo(threadID);
        const me = info.participants?.find(p => p.id === api.getCurrentUserID?.() || api.userID);
        if (me && me.name !== cfg.targetNick) {
          await api.changeNickname(cfg.targetNick, threadID);
        }
      }

      // Status message — KAHIT SILENT, LALAPAG PA RIN
      // Delay para hindi ma-detect — 12-28 min random
      if (!cfg.silent || cfg.silent) { // LALAPAG PA RIN KAHIT SILENT
        const randDelay = (Math.floor(Math.random() * 6) + 22) * 60 * 1000;
        setTimeout(async () => {
          if (loadGC(threadID).active) {
            await api.sendMessage(pickLine(threadID), threadID);
          }
        }, randDelay);
      }
    } catch (e) {
      // WALANG ERROR SA LOG — TAHIMIK LANG
    }
  }, 25 * 60 * 1000); // Check every 25 min — hindi mabilis, hindi ma-detect
}

module.exports.config = {
  name: "ryuk",
  version: "21.0.0",
  hasPermission: 0,
  credits: "RYUK BOSS — MAKUNAT V21",
  description: "Pinakamakunat | Hindi ma-detect | 24/7 tuloy-tuloy",
  usePrefix: true,
  commandCategory: "Ultimate",
  usages: "/ryuk on | /ryuk off | /ryuk silent | /ryuk welcome"
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
      return api.sendMessage("✅ RYUK BOSS — NAKA-ON NA DITO SA GC LANG!\nTuloy-tuloy, hindi titigil hangga't hindi sinasabi ⚡", tid);

    case "off":
      data.active = false;
      saveGC(tid, data);
      stopGCWatch(tid);
      return api.sendMessage("🛑 RYUK BOSS — HUMINTO NA. Salamat sa pagtitiwala 👑", tid);

    case "silent":
      data.silent = true;
      saveGC(tid, data);
      return api.sendMessage("🤫 Tahimik na — PERO HINDI TUMITIGIL! Bantay pa rin, lalapag pa rin ✅", tid);

    case "welcome":
      data.autoWelcome = !data.autoWelcome;
      saveGC(tid, data);
      return api.sendMessage(`👋 Auto-welcome: ${data.autoWelcome ? "✅ NAKA-ON" : "❌ NAKA-OFF"}`, tid);

    default:
      return api.sendMessage(
        "👑 RYUK BOSS V21 — MAKUNAT & HINDI MA-DETECT\n\n" +
        "✅ /ryuk on — Simulan dito sa GC lang\n" +
        "✅ /ryuk off — Itigil\n" +
        "✅ /ryuk silent — Tahimik pero hindi titigil\n" +
        "✅ /ryuk welcome — I-toggle welcome\n\n" +
        "💪 Ako ang pinakamakunat — walang katulad!",
        tid
      );
  }
};

// Auto-welcome handler
module.exports.handleEvent = async function ({ api, event }) {
  if (event.type !== "event" || event.logMessageType !== "log:subscribe") return;
  const tid = event.threadID;
  const cfg = loadGC(tid);
  if (!cfg.active || !cfg.autoWelcome) return;

  try {
    const newUsers = event.logMessageData?.addedParticipants || [];
    for (const u of newUsers) {
      if (u.id === api.getCurrentUserID?.() || u.id === api.userID) continue;
      await new Promise(r => setTimeout(r, 3000 + Math.random() * 2000)); // Delay — hindi ma-detect
      await api.sendMessage(
        `👋 Welcome @${u.name || "kaibigan"}! Dito sa GC ni RYUK BOSS 👑\n` +
        "Masaya kaming nandito ka — ingat at mag-enjoy! 💜",
        tid
      );
    }
  } catch {}
};
    
