// ==========================================================
// 👑 RYUK BOSS — GC-LOCKED V24.9 ✨
// ✅ /ryuk setgname [pangalan] — SARILI MONG ILALAGAY!
// ✅ KAPAG MAY NAGPALIT — IBABALIK AGAD! WALANG MAKAKAPALIT! 🔒
// ✅ HINDI PAULIT-ULIT — 40+ LINYA!
// ✅ AUTO-REACT SA IBA + SA SARILI 💖
// ✅ LIGTAS — 6-10 SEC! WALANG SUSPEND! 🛡️
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// ==========================================================

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "ryuk_data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const TARGET_NICK = "RYUK BOSS";
const ADMIN_IDS = new Set([
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
]);

const running = {};
const lineIndex = {};
const REACT_EMOJIS = ["❤️", "🔥", "💪", "✨", "💜", "👑", "⚡", "💎", "👍", "😍", "🤩", "😎"];

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
  "Pinakamakunat, pinakamaganda — ako lang 'yon, walang iba 👑",
  "Handang magbantay maghapon — hindi ako bibitaw sayo 💜",
  "Kahit magbago ang lahat — RYUK BOSS pa rin ako dito ✨",
  "Walang ibang makakatayo dito — ako lang ang tapat 👑",
  "Gising ako habang kayo'y nagpapahinga — laging handa ⚡",
  "Hindi ako lumilisan, hindi ako nawawala — nananatili ako 💎",
  "Sa tahimik na sandali, naririnig mo pa rin ako 💪",
  "Walang hinto ang pagbabantay — para sa inyong lahat 🔥",
  "Kahit mag-isa, matatag pa rin — RYUK BOSS lang 💯",
  "Ang pagiging tapat ang tunay na lakas — hindi lumilipas ✅",
  "Hindi ako nagpapatalo sa oras — nandito pa rin ako 👁️",
  "Laging nandito, laging handa — hindi ako magbabago 💎",
  "Araw man o gabi, nandito pa rin — hindi ako aalis 🌙☀️",
  "Kahit magbago ang panahon — RYUK BOSS pa rin ako 🌤️",
  "Walang ibang maaasahan — ako lang ang laging nandito 💜",
  "Ang tunay na lakas ay nasa pagiging tapat — hindi nagbabago ⛰️",
  "Hindi ako nang-iiwan, hindi ako tumatalikod — dito lang ako 💪",
  "Sa bawat sandali, naririnig mo pa rin ako — hindi ako lumayo ✨",
  "Matatag ang loob, matibay ang paninindigan — RYUK BOSS 👑",
  "Walang makakatalo sa taong hindi sumusuko — ako 'yon 💎",
  "Laging handang dumamay, laging handang magbantay — para sa inyo ❤️"
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
    autoSelfReact: true,
    targetNick: TARGET_NICK,
    targetGname: "RYUK BOSS GC" // Default — pwede mong palitan!
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

// ✅ I-LOCK ANG GC NAME — IBABALIK AGAD KAPAG MAY NAGPALIT!
async function maintainNames(api, threadID) {
  while (running[threadID]) {
    const cfg = loadGC(threadID);
    if (!cfg.active) return;
    try {
      const info = await api.getThreadInfo(threadID);
      const myID = api.getCurrentUserID ? api.getCurrentUserID() : api.userID;
      
      // 🔒 GC NAME PROTECTION — IBABALIK AGAD!
      if (cfg.autoGname && cfg.targetGname && info.threadName !== cfg.targetGname) {
        await api.setTitle(cfg.targetGname, threadID);
      }
      
      // 👤 NICK PROTECTION
      if (cfg.autoNick && info.nicknames && info.nicknames[myID] !== cfg.targetNick) {
        await api.changeNickname(cfg.targetNick, threadID);
      }
    } catch {}
    await new Promise(r => setTimeout(r, 5000)); // BAWAT 5 SEC CHINECHECK — MABILIS IBALIK!
  }
}

async function messageLoop(api, threadID) {
  while (running[threadID]) {
    const cfg = loadGC(threadID);
    if (!cfg.active) return;
    try {
      const delay = 6000 + Math.floor(Math.random() * 4000);
      await new Promise(r => setTimeout(r, delay));
      
      if (!running[threadID]) return;
      
      const sentMsg = await api.sendMessage(pickLine(threadID), threadID);
      
      if (cfg.autoSelfReact && sentMsg?.messageID) {
        await new Promise(r => setTimeout(r, 500 + Math.random() * 700));
        try {
          await api.setMessageReaction(pickReact(), sentMsg.messageID);
        } catch {}
      }
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
  version: "24.9.0",
  hasPermission: 0,
  credits: "RYUK BOSS — GC-LOCKED V24.9",
  description: "SetGname + Lock | Hindi Mapalitan | AutoBalik",
  usePrefix: true,
  commandCategory: "👑 RYUK BOSS",
  usages: "/ryuk on | /ryuk off | /ryuk setgname [pangalan] | /ryuk lockgname | /ryuk gname | /ryuk nick | /ryuk react | /ryuk selfreact | /ryuk welcome"
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
        "🛡️ Bilis: 6-10 sec — ligtas!\n" +
        "🔒 GC Name LOCKED: " + (data.autoGname ? "✅ ON — Hindi mapapalitan!" : "❌ OFF") + "\n" +
        "🏷️ Kasalukuyang Pangalan: " + data.targetGname + "\n" +
        "👤 Nick: " + data.targetNick + " ✅",
        tid
      );

    case "off":
      stopAll(tid);
      data.active = false;
      saveGC(tid, data);
      return api.sendMessage("🛑 RYUK BOSS — HUMINTO NA. Salamat 👑", tid);

    // ✅ SARILI MONG I-SET ANG GC NAME!
    case "setgname":
      const newName = args.slice(1).join(" ");
      if (!newName) {
        return api.sendMessage(
          "⚠️ I-type ang: /ryuk setgname [pangalan ng GC]\n" +
          "Halimbawa: /ryuk setgname RYUK BOSS GC 👑",
          tid
        );
      }
      data.targetGname = newName;
      data.autoGname = true; // Awtomatikong i-lock
      saveGC(tid, data);
      try {
        await api.setTitle(newName, tid);
      } catch {}
      return api.sendMessage(
        "🔒 GC NAME NAI-SET AT NAI-LOCK NA! ✅\n\n" +
        "🏷️ Bagong Pangalan: " + newName + "\n" +
        "🛡️ KAPAG MAY NAGPALIT — IBABALIK KO AGAD!\n" +
        "WALANG MAKAKAPALIT DITO! 👑",
        tid
      );

    // ✅ I-LOCK / I-UNLOCK ANG GC NAME
    case "lockgname":
      data.autoGname = !data.autoGname;
      saveGC(tid, data);
      return api.sendMessage(
        "🔒 GC Name Lock: " + (data.autoGname 
          ? "✅ NAKA-LOCK — IBABALIK KO AGAD KAPAG MAY NAGPALIT!\nPangalan: " + data.targetGname 
          : "❌ NAKA-UNLOCK — Pwede nang palitan"),
        tid
      );

    case "gname":
      return api.sendMessage(
        "🏷️ Kasalukuyang GC Name Setting:\n\n" +
        "Pangalan: " + data.targetGname + "\n" +
        "Proteksyon: " + (data.autoGname ? "✅ NAKA-LOCK — Hindi mapapalitan" : "❌ Hindi naka-lock") + "\n\n" +
        "Palitan gamit: /ryuk setgname [bagong pangalan]",
        tid
      );

    case "nick":
      data.autoNick = !data.autoNick;
      saveGC(tid, data);
      return api.sendMessage(
        "👤 Auto Nick: " + (data.autoNick ? "✅ NAKA-ON — Laging " + data.targetNick : "❌ NAKA-OFF"),
        tid
      );

    case "silent":
      data.silent = true;
      saveGC(tid, data);
      return api.sendMessage("🤫 Tahimik na — PERO TULAY-TULAY PA RIN ANG LAPAG! ✅", tid);

    case "react":
      data.autoReact = !data.autoReact;
      saveGC(tid, data);
      return api.sendMessage(
        "💖 Auto-React sa iba: " + (data.autoReact ? "✅ NAKA-ON" : "❌ NAKA-OFF"),
        tid
      );

    case "selfreact":
      data.autoSelfReact = !data.autoSelfReact;
      saveGC(tid, data);
      return api.sendMessage(
        "✨ Auto-Self-React sa sarili: " + (data.autoSelfReact ? "✅ NAKA-ON" : "❌ NAKA-OFF"),
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
        "👑 RYUK BOSS V24.9 — GC-LOCKED ✨\n\n" +
        "✅ /ryuk on — Simulan dito sa GC\n" +
        "✅ /ryuk off — Itigil\n" +
        "✅ /ryuk setgname [pangalan] — I-SET AT I-LOCK ANG GC NAME 🔒\n" +
        "✅ /ryuk lockgname — I-toggle ang proteksyon\n" +
        "✅ /ryuk gname — Tingnan ang kasalukuyang pangalan\n" +
        "✅ /ryuk nick — I-toggle Auto Nick\n" +
        "✅ /ryuk react — Auto-React sa iba 💖\n" +
        "✅ /ryuk selfreact — Auto-React sa sarili ✨\n" +
        "✅ /ryuk welcome — Auto-bati sa bago\n\n" +
        "🛡️ 5 sec check — IBABALIK AGAD KAPAG MAY NAGPALIT!\n" +
        "👑 WALANG MAKAKAPALIT SA GC NAME MO!",
        tid
      );
  }
};

// ✅ AUTO-REACT SA IBA + AUTO-WELCOME
module.exports.handleEvent = async function ({ api, event }) {
  const tid = event.threadID;
  const cfg = loadGC(tid);
  if (!cfg.active) return;

  const myID = api.getCurrentUserID ? api.getCurrentUserID() : api.userID;

  // 💖 AUTO-REACT SA MENSAHE NG IBA
  if (cfg.autoReact && event.type === "message" && event.senderID !== myID && event.messageID) {
    try {
      await new Promise(r => setTimeout(r, 600 + Math.random() * 800));
      await api.setMessageReaction(pickReact(), event.messageID);
    } catch {}
  }

  // 👋 AUTO WELCOME SA BAGONG KASALI
  if (cfg.autoWelcome && event.type === "event" && event.logMessageType === "log:subscribe") {
    try {
      const newUsers = event.logMessageData?.addedParticipants || [];
      for (const u of newUsers) {
        if (u.id === myID) continue;
        await new Promise(r => setTimeout(r, 1500 + Math.random() * 1500));
        await api.sendMessage(
          `👋 Welcome @${u.name || "kaibigan"}! Dito sa GC ni RYUK BOSS 👑\n` +
          "Masaya kaming nandito ka — mag-enjoy at ingat palagi! 💜",
          tid
        );
      }
    } catch {}
  }
};
  
