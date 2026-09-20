// ==========================================================
// BOT NAME: count | 1-1000 | AUTO PROTECT | NAKAKATAWA REASON
// WIN GOJO JUJUTSU KAISEN A.K.A RYUK GNM LVL 9999
// ==========================================================

const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "count", // ✅ MALIIT NA LAHAT — count
  version: "2.1.0",
  hasPermission: 0,
  credits: "RYUK",
  description: "count 1-1000 | auto mention | protect",
  usePrefix: true,
  commandCategory: "count",
  usages: "/count start",
  cooldowns: 1
};

const RYUK_ID = "61594055835097"; // ✅ PALITAN KUNG MALI
const DATA_FILE = path.join(__dirname, "count_data.json");

// ✅ MGA NAKAKATAWANG REASON 😂
const REASONS = [
  "kasi mas makinis pa ako sa pader 😎✨",
  "kasi lvl 9999 ako — ikaw lvl 0 pa naghahanap pa ng buhay 😂",
  "kasi may 6 na mata ako — ikaw dalawang mata hindi mo pa magamit nang tama 🕶️",
  "kasi ang tangkad ko sayo — kailangan mo pa umakyat sa hagdan para abutin ako 🏔️",
  "kasi ako ang hari — ikaw taga-linis lang ng sahig dito 👑🧹",
  "kasi hindi ka mananalo — kahit buhayin mo pa ang lolo mo para tulungan ka 💀",
  "kasi mas mabango pa ako kaysa sa pabango mo 🥴🌸",
  "kasi ang utak ko infinite — sayo wala eh, walang laman 🧠💨",
  "kasi ako gojo — ikaw go-jo-walang 😂",
  "kasi tinabihan mo ako — mali ka agad, walang tanong-tanong 😤",
  "kasi kahit anong gawin mo — hanggang tingin ka lang sa akin 😌",
  "kasi ako pinili ng tadhana — ikaw pinili ng kawalan 😭",
  "kasi mas malakas ako sayo PERIOD 🔥",
  "kasi hindi mo ako kayang talo — tanggapin mo na, hindi masakit 😂",
  "kasi ako paborito — ikaw yung nakalimutan isama sa imbitasyon 💌",
  "kasi kahit anong subok mo — bagsak ka pa rin sa akin 📉",
  "kasi ang ganda ko naman kasi — hindi mo matatalo ang kagandahan ✨",
  "kasi ryuk ako — hindi ako natatalo, PERIOD, TULDOK 📍",
  "kasi sinubukan mo — tapos natalo ka na bago ka pa magsimula 😏",
  "kasi bawal saktan ang hari dito 👑"
];

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ counting: false, current: 0 }, null, 2));
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch { return { counting: false, current: 0 }; }
}

function saveData(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }
function getReason() { return REASONS[Math.floor(Math.random() * REASONS.length)]; }
function sendMsg(api, msg, tid, mid = null) {
  return new Promise(r => api.sendMessage(msg, tid, (e,i)=>r(i), mid));
}

// ✅ AUTO PROTECT
module.exports.handleEvent = async ({ api, event }) => {
  const { threadID, senderID, body, mentions } = event;
  if (!threadID || !body || String(senderID) === String(api.getCurrentUserID())) return;

  const text = String(body).toLowerCase();
  const bad = ["bwisit","tanga","bobo","ulol","gago","alis","umalis","pangit","ayoko","bastos","sira ulo","hayop","walang hiya","yawa","tangina","peste"];
  const isBad = bad.some(w => text.includes(w));
  const mentionYou = (mentions || []).some(m => String(m.id) === String(RYUK_ID));
  const calledYou = text.includes("ryuk") || text.includes("gojo") || text.includes("satoru");

  if (isBad && (mentionYou || calledYou)) {
    await new Promise(r => setTimeout(r, 400));
    await sendMsg(api,
      `WIN GOJO JUJUTSU KAISEN A.K.A RYUK GNM LVL 9999\n` +
      `LOSE @${senderID}\n` +
      `REASON: ${getReason()}`,
      threadID
    );
  }
};

// ✅ COUNT 1-1000 — BOT "count" ANG MAGBIBILANG
module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  const cmd = String(args?.[0] || "").toLowerCase();
  const data = loadData();

  if (cmd === "start") {
    if (data.counting) return sendMsg(api, "nagbibilang pa! huwag magmadali 😤", threadID, messageID);
    data.counting = true; data.current = 0; saveData(data);
    await sendMsg(api, "nagsisimula na — 1 hanggang 1000! 💪", threadID);

    for (let num = 1; num <= 1000; num++) {
      if (!data.counting) break;
      data.current = num; saveData(data);
      
      let msg = `${num}`;
      if (num === 100) msg = "100 — tuloy lang! 💪";
      if (num === 500) msg = "500 — kalahati na! ⚡";
      if (num === 777) msg = "777 — swerte ng ryuk! 🍀";
      if (num === 999) msg = "999 — malapit na! 🔥";
      if (num === 1000) msg = `1000 — tapos na!\n\nWIN GOJO JUJUTSU KAISEN A.K.A RYUK GNM LVL 9999`;
      
      await sendMsg(api, msg, threadID);
      await new Promise(r => setTimeout(r, 350));
    }
    data.counting = false; saveData(data);
    return;
  }

  if (cmd === "stop") {
    data.counting = false; saveData(data);
    return sendMsg(api, `tumigil sa ${data.current} — babalik ako! 💪`, threadID, messageID);
  }

  return sendMsg(api,
    `👑 count — mga utos\n` +
    `/count start — simulan ang 1-1000\n` +
    `/count stop — itigil muna\n\n` +
    `⚡ ipagtatanggol ka kapag may bastos!`,
    threadID, messageID
  );
};
    
