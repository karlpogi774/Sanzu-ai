// ==========================================================
// 👑 COUNT BOT — 1-50 | AYOS NA LAHAT ✅
// ✅ TAMANG PHILIPPINE TIME 🇵🇭
// ✅ LOSE: LAGING MAY BUONG PANGALAN + AUTO-MENTION 👤
// ✅ REASON: LAGING MAY NAKAKATAWA 😂
// ✅ 1-50 | TAMANG BILIS | HINDI MA-DETECT 🛡️
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

const MAX_COUNT = 50;
const activeCount = {};
const currentNumber = {};
const running = {};
const offenderNames = {};

const FUNNY_REASONS = [
  "Kasi mas gwapo/maganda ka pa rin, naiinggit lang sila 😎",
  "Wala silang laban sayo — parang langgam sa higante! 🐜➡️🗿",
  "Sadyang hindi sila makatalo, hanggang tingin lang sila sayo 😌",
  "Ang lakas mo kasi, napagod na sila bago ka pa matalo 💪",
  "Hindi ka basta-basta, hindi nila kayang abutan ✨",
  "Sobrang tindi ng lakas mo, nanginginig sila sa takot 👑",
  "Wala silang karapatang umaway sayo — ikaw ang hari dito! 👑",
  "Masyado kang malakas para sa kanila, hindi bagay lumaban ⚡",
  "Ang galing-galing mo kasi, wala silang tapat sayo 💎",
  "Alam na nilang hindi ka matatalo kaya sumuko na agad! 💯",
  "Masyadong maliwanag ang kinabukasan mo, nasilaw sila ✨",
  "Hindi sila natalo — natabunan lang sila ng lakas mo! 💥",
  "Mas mataas ka pa sa bundok, paano ka nila aabutin? ⛰️",
  "Sadyang pinalad ka sa tadhana, ikaw lang ang pinili ✨",
  "Kahit sino pa sila, hindi ka nila matitibag — bato ka! 🪨",
  "Masyado kang makunat, pagod na silang lumaban sayo 😂",
  "Tiningnan ka nila — agad silang sumuko, walang pag-asa! 🤣",
  "Ang lakas ng dating mo, nawala agad ang tapang nila 😎"
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
  running[threadID] = false;
  activeCount[threadID] = false;
}

function pickReason() {
  return FUNNY_REASONS[Math.floor(Math.random() * FUNNY_REASONS.length)];
}

// ✅ TAMANG ORAS — PHILIPPINE TIME ZONE 🇵🇭
function formatDate() {
  const optionsDate = { timeZone: "Asia/Manila", month: "numeric", day: "numeric", year: "numeric" };
  const optionsTime = { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true };
  const optionsMonth = { timeZone: "Asia/Manila", month: "long" };

  const now = new Date();
  return {
    date: now.toLocaleDateString("en-PH", optionsDate),
    time: now.toLocaleTimeString("en-PH", optionsTime),
    month: now.toLocaleString("en-PH", optionsMonth),
    year: new Date(now.toLocaleString("en-PH", { timeZone: "Asia/Manila" })).getFullYear()
  };
}

// ✅ KUNIN ANG BUONG PANGALAN — LAGING GUMAGANA
async function getUserName(api, userID) {
  return new Promise(res => {
    api.getUserInfo(userID, (err, info) => {
      if (!err && info && info[userID]) {
        res(info[userID].name || info[userID].firstName || "Hindi Kilala");
      } else {
        res(`User ${userID}`);
      }
    });
  });
}

async function countLoop(api, threadID) {
  while (running[threadID] && currentNumber[threadID] < MAX_COUNT) {
    currentNumber[threadID]++;
    saveData(threadID, { active: true, num: currentNumber[threadID], max: MAX_COUNT });

    if (currentNumber[threadID] >= MAX_COUNT) {
      stopCount(threadID);
      const dt = formatDate();
      
      // ✅ LAGING MAY LOSE SECTION — KAHIT WALANG UMAWAY
      let loseSection = "";
      if (offenderNames[threadID]) {
        loseSection = `❌ LOSE: ${offenderNames[threadID].fullName} (@[${offenderNames[threadID].id}]) — HUWAG KA MAGTAGO! 😤\n\n`;
      } else {
        loseSection = `❌ LOSE: WALA — Walang nangahas lumaban sa'yo! 💪\n\n`;
      }
      
      return api.sendMessage(
        `🎉🎉🎉 50 REACHED! 🎉🎉🎉\n\n` +
        `🏆 WIN: GOJO JUJUTSU KAISEN A.K.A RYUK GNM LVL 9999\n\n` +
        loseSection +
        `📝 REASON: ${pickReason()}\n\n` +
        `📅 DATE: ${dt.date}\n` +
        `🌙 MONTH: ${dt.month}\n` +
        `📆 YEAR: ${dt.year}\n` +
        `⏰ TIME: ${dt.time}\n\n` +
        `👑 WALANG KAPANTAYAN — RYUK ANG PINAKAMAKUNAT! 💎`,
        threadID
      );
    }

    const delay = 2000 + Math.floor(Math.random() * 2000);
    await new Promise(r => setTimeout(r, delay));

    if (!running[threadID]) return;
    await api.sendMessage(`🔢 ${currentNumber[threadID]}`, threadID);
  }
}

function startCounting(api, threadID) {
  stopCount(threadID);
  offenderNames[threadID] = null;
  let data = loadData(threadID);
  data.active = true;
  saveData(threadID, data);
  running[threadID] = true;
  currentNumber[threadID] = data.num || 0;
  countLoop(api, threadID);
}

module.exports.config = {
  name: "count",
  version: "5.0.0",
  hasPermission: 0,
  credits: "RYUK — AYOS NA LAHAT ✅",
  description: "Count 1-50 | PH Time | Lose + Full Name + Funny Reason",
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
        "🔢 COUNT NAGSIMULA NA! 1 hanggang 50 ⚡\n" +
        "🛡️ Tamang bilis — hindi ma-detect!\n" +
        "🇵🇭 Tamang oras — Philippine Time!\n" +
        "👤 May umaway? Lalabas agad ang pangalan!\n" +
        "I-type ang /count stop para huminto ✅",
        tid
      );

    case "stop":
      stopCount(tid);
      const dt = formatDate();
      
      // ✅ LAGING MAY LOSE SECTION SA /count stop
      let loseSection = "";
      if (offenderNames[tid]) {
        loseSection = `❌ LOSE: ${offenderNames[tid].fullName} (@[${offenderNames[tid].id}]) — Ikaw ang natalo! 😤\n\n`;
      } else {
        loseSection = `❌ LOSE: WALA — Walang nangahas lumaban sa'yo! 💪\n\n`;
      }
      
      return api.sendMessage(
        `🛑 COUNT STOPPED\n\n` +
        `🏆 WIN: GOJO JUJUTSU KAISEN A.K.A RYUK GNM LVL 9999\n\n` +
        loseSection +
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
        "👑 COUNT BOT — AYOS NA LAHAT V5 ✨\n\n" +
        "✅ /count start — Simulan ang 1-50\n" +
        "✅ /count stop — Huminto at ipakita ang resulta\n\n" +
        "🇵🇭 Tamang oras — Philippine Time!\n" +
        "👤 Auto-mention — Buong pangalan ng umaway!\n" +
        "😂 Laging may nakakatawang reason!\n" +
        "🏆 Laging may LOSE — kahit walang umaway!\n\n" +
        "💎 RYUK — Laging panalo, walang talo! 👑",
        tid
      );
  }
};

// ✅ AUTO-DETECT UMAWAY — BUONG PANGALAN AGAD
module.exports.handleEvent = async function ({ api, event }) {
  const tid = event.threadID;
  const data = loadData(tid);
  if (!data.active) return;

  const myID = String(api.getCurrentUserID ? api.getCurrentUserID() : api.userID);
  if (event.type !== "message" || String(event.senderID) === myID) return;

  const msg = (event.body || "").toLowerCase();
  const adminNames = ["ryuk", "gojo", "boss", "ryuk boss", "gojo satoru", "gnm"];
  const attackWords = /talo|baba|mahina|patay|alis|bwisit|gago|tanga|bobo|walang|pangit|bantay|hina|kawawa|iyak|tigil|hinto|alisin|siya|bawal|hindi/;
  
  let isAttacking = false;
  for (const name of adminNames) {
    if (msg.includes(name) && attackWords.test(msg)) {
      isAttacking = true;
      break;
    }
  }

  if (isAttacking && event.senderID) {
    const fullName = await getUserName(api, event.senderID);
    offenderNames[tid] = { 
      id: event.senderID, 
      fullName: fullName 
    };

    await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
    const dt = formatDate();
    await api.sendMessage(
      `⚠️ NAKITA KO ITO! 👀\n\n` +
      `🏆 WIN: GOJO JUJUTSU KAISEN A.K.A RYUK GNM LVL 9999\n\n` +
      `❌ LOSE: ${fullName} (@[${event.senderID}]) — HUWAG KA MAGTAGO! 😤\n\n` +
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
