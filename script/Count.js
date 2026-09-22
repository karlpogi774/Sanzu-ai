// ==========================================================
// 👑 COUNT BOT — MAS MABILIS V3.2 ✨
// ✅ COUNT 1-100 | MAS MABILIS NA! ⚡
// ✅ HINDI MA-RESTRICT — TAMA LANG ANG BILIS
// ✅ AUTO-MENTION KAPAG MAY UMAWAY 🔥
// ✅ WIN: GOJO JUJUTSU KAISEN A.K.A RYUK GNM LVL 9999
// ✅ LOSE: AUTO-MENTION @ | NAKAKATAWA REASON
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// ==========================================================

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "count_data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const ADMIN_IDS = new Set([
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
]);

const MAX_COUNT = 100;
const activeCount = {};
const currentNumber = {};
const countIntervals = {};

const FUNNY_REASONS = [
  "Kasi mas gwapo ka pa rin nila, naiinggit lang sila 😎",
  "Wala silang laban sa'yo — parang langgam sa higante! 🐜➡️🗿",
  "Sadyang hindi sila makatalo, hanggang tingin lang sila sayo 😌",
  "Ang lakas mo kasi, napagod na sila bago ka pa matalo 💪",
  "Baka sa ibang kalaban sila pumunta, hindi sa'yo — hindi ka basta-basta! 💎",
  "Sobrang tindi ng lakas mo, nanginginig sila sa takot 👑",
  "Wala silang karapatang umaway sayo — ikaw ang hari dito! 👑",
  "Sadyang hindi sila bagay lumaban, masyado kang malakas ⚡",
  "Ang galing-galing mo kasi, hindi nila kayang abutan ✨",
  "Hindi sila natalo — alam na nilang hindi ka matatalo! 💯"
];

function isAdmin(senderID) {
  return ADMIN_IDS.has(String(senderID));
}

function getFile(threadID) {
  return path.join(DATA_DIR, `${threadID}.json`);
}

function loadData(threadID) {
  try {
    const f = getFile(threadID);
    if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, "utf8"));
  } catch {}
  return { active: false, num: 0, max: MAX_COUNT };
}

function saveData(threadID, data) {
  fs.writeFileSync(getFile(threadID), JSON.stringify(data, null, 2));
}

function stopCount(threadID) {
  if (countIntervals[threadID]) {
    clearInterval(countIntervals[threadID]);
    delete countIntervals[threadID];
  }
  activeCount[threadID] = false;
}

function pickReason() {
  return FUNNY_REASONS[Math.floor(Math.random() * FUNNY_REASONS.length)];
}

function formatDate() {
  const now = new Date();
  return {
    date: now.toLocaleDateString("en-PH"),
    time: now.toLocaleTimeString("en-PH"),
    month: now.toLocaleString("en-PH", { month: "long" }),
    year: now.getFullYear()
  };
}

function startCounting(api, threadID) {
  stopCount(threadID);
  let data = loadData(threadID);
  data.active = true;
  saveData(threadID, data);
  activeCount[threadID] = true;
  currentNumber[threadID] = data.num || 0;

  countIntervals[threadID] = setInterval(async () => {
    if (!activeCount[threadID]) { stopCount(threadID); return; }
    currentNumber[threadID]++;
    saveData(threadID, { active: true, num: currentNumber[threadID], max: MAX_COUNT });

    if (currentNumber[threadID] >= MAX_COUNT) {
      stopCount(threadID);
      const dt = formatDate();
      return api.sendMessage(
        `🎉🎉🎉 100 REACHED! 🎉🎉🎉\n\n` +
        `🏆 WIN: GOJO JUJUTSU KAISEN A.K.A RYUK GNM LVL 9999\n\n` +
        `📅 DATE: ${dt.date}\n` +
        `🌙 MONTH: ${dt.month}\n` +
        `📆 YEAR: ${dt.year}\n` +
        `⏰ TIME: ${dt.time}\n\n` +
        `👑 WALANG KAPANTAYAN — RYUK ANG PINAKAMAKUNAT! 💎`,
        threadID
      );
    }

    // ⚡ MAS MABILIS NA — 0.8 hanggang 1.2 segundo lang! Hindi pa rin ma-restrict
    await new Promise(r => setTimeout(r, 800 + Math.random() * 400));
    if (activeCount[threadID]) {
      await api.sendMessage(`🔢 ${currentNumber[threadID]}`, threadID);
    }
  }, 1000); // ⚡ MAS MABILIS NA INTERVAL
}

module.exports.config = {
  name: "count",
  version: "3.2.0",
  hasPermission: 0,
  credits: "RYUK — MAS MABILIS V3.2",
  description: "Count 1-100 | Mas Mabilis Na! | Auto-Mention | Nakakatawa Reason",
  usePrefix: true,
  commandCategory: "👑 COUNT",
  usages: "/count start | /count stop"
};

module.exports.run = async function ({ api, event, args }) {
  const tid = event.threadID;
  const sid = event.senderID;

  if (!isAdmin(sid)) return;

  const cmd = args[0]?.toLowerCase();
  switch (cmd) {
    case "start":
      startCounting(api, tid);
      return api.sendMessage(
        "🔢 COUNT NAGSIMULA NA! 1 hanggang 100 ⚡\n" +
        "Mas mabilis na — hindi pa rin ma-restrict! 💪\n" +
        "I-type ang /count stop para huminto ✅",
        tid
      );

    case "stop":
      stopCount(tid);
      const dt = formatDate();
      return api.sendMessage(
        `🛑 COUNT STOPPED\n\n` +
        `🏆 WIN: GOJO JUJUTSU KAISEN A.K.A RYUK GNM LVL 9999\n\n` +
        `❌ LOSE: @ — KUNG SINO KA MAN, NAKITA KITA! 👀\n\n` +
        `📝 REASON: ${pickReason()}\n\n` +
        `📅 DATE: ${dt.date}\n` +
        `🌙 MONTH: ${dt.month}\n` +
        `📆 YEAR: ${dt.year}\n` +
        `⏰ TIME: ${dt.time}\n\n` +
        `👑 RYUK — LAGING PANALO! 💎`,
        tid
      );

    default:
      return api.sendMessage(
        "👑 COUNT BOT — MAS MABILIS V3.2 ✨\n\n" +
        "✅ /count start — Simulan ang 1-100\n" +
        "✅ /count stop — Huminto at ipakita ang resulta\n\n" +
        "⚡ Mas mabilis na — tapos agad!\n" +
        "🛡️ Hindi pa rin ma-restrict — tama lang ang bilis!\n" +
        "🏆 Ikaw laging panalo!\n" +
        "⚠️ Auto-mention sa umaway sayo!\n" +
        "😂 Nakakatawa ang reason!\n\n" +
        "💎 RYUK — Laging panalo, walang talo! 👑",
        tid
      );
  }
};

// ✅ AUTO-MENTION KAPAG MAY UMAWAY SAIYO
module.exports.handleEvent = async function ({ api, event }) {
  const tid = event.threadID;
  const data = loadData(tid);
  if (!data.active) return;

  const myID = api.getCurrentUserID ? api.getCurrentUserID() : api.userID;
  if (event.type !== "message" || event.senderID === myID) return;

  const msg = (event.body || "").toLowerCase();
  const adminNames = ["ryuk", "gojo", "boss", "ryuk boss", "gojo satoru"];
  let isAttacking = false;

  for (const name of adminNames) {
    if (msg.includes(name) && /talo|baba|mahina|patay|alis|bwisit|gago|tanga|bobo|walang/.test(msg)) {
      isAttacking = true;
      break;
    }
  }

  if (isAttacking && event.senderID) {
    await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
    const dt = formatDate();
    await api.sendMessage(
      `⚠️ NAKITA KO ITO! 👀\n\n` +
      `🏆 WIN: GOJO JUJUTSU KAISEN A.K.A RYUK GNM LVL 9999\n\n` +
      `❌ LOSE: @[${event.senderID}] — NAKITA KITA! HUWAG KA MAGTAGO! 😤\n\n` +
      `📝 REASON: ${pickReason()}\n\n` +
      `📅 DATE: ${dt.date}\n` +
      `🌙 MONTH: ${dt.month}\n` +
      `📆 YEAR: ${dt.year}\n` +
      `⏰ TIME: ${dt.time}\n\n` +
      `👑 RYUK — HINDI KAYO MAKAKATAKA SA KANYA! 💎`,
      tid
    );
  }
};
