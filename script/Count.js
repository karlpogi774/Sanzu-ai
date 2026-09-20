// ==========================================================
// NOVA X — RYUK EDITION 💪🔥
// COUNT 1-200 | WIN/LOSE SECTION | AUTO DATE & TIME
// ==========================================================

const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "count",
  version: "1.0.0",
  hasPermission: 1, // Ikaw lang ang makakagamit
  credits: "Ryuk | 61594055835097",
  description: "Count 1-200 + WIN/LOSE + Date & Time ✅",
  usePrefix: true,
  commandCategory: "Ryuk Only",
  usages: "/count start | /count reset",
  cooldowns: 2
};

const ADMIN_ID = "61594055835097";
const DATA_FILE = path.join(__dirname, "count_ryuk_data.json");

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return { count: 0, status: "idle" };
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return { count: 0, status: "idle" };
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch {
    return false;
  }
}

function getDateTime() {
  const now = new Date();
  return {
    date: now.getDate(),
    month: now.toLocaleString("en-US", { month: "long" }),
    year: now.getFullYear(),
    time: now.toLocaleTimeString("en-US", { hour12: true })
  };
}

async function sendCountSequence(api, threadID, start = 1) {
  const data = loadData();
  data.status = "counting";
  saveData(data);

  for (let i = start; i <= 200; i++) {
    const current = loadData();
    if (current.status === "stopped") {
      return api.sendMessage("⏹️ Pagbibilang itinigil.", threadID);
    }
    
    await new Promise(resolve => setTimeout(resolve, 300)); // Bilis ng pagbilang
    await api.sendMessage(`${i}`, threadID);
    data.count = i;
    saveData(data);
  }

  // ✅ TAPOS NA — WIN SECTION
  const dt = getDateTime();
  const winMessage = `
╔══════════════════════════╗
║       🏆 WIN 🏆          ║
╠══════════════════════════╣
║ GOJO JUJUTSU KAISEN      ║
║ A.K.A RYUK               ║
╠══════════════════════════╣
║       ❌ LOSE ❌         ║
╠══════════════════════════╣
║ REASON:                  ║
║ Walang sinumang makahinto║
║ kay Gojo — pinakamalakas ║
║ sa lahat, walang kalaban ║
║ na makapantay sa kapangyarihan. ║
║ Buong mundo ay sumuko na ║
║ sa di-natatalong kapangyarihan. ║
╠══════════════════════════╣
║ 📅 DATE: ${dt.date} ${dt.month} ${dt.year}        ║
║ ⏰ TIME: ${dt.time}           ║
╚══════════════════════════╝
`;;

  await new Promise(resolve => setTimeout(resolve, 500));
  await api.sendMessage(winMessage.trim(), threadID);
  
  data.status = "done";
  saveData(data);
}

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;

  if (String(senderID) !== ADMIN_ID) {
    return api.sendMessage("🔒 Ryuk lang ang pwedeng mag-utos!", threadID, messageID);
  }

  const cmd = (args[0] || "").toLowerCase();
  const data = loadData();

  if (cmd === "start") {
    if (data.status === "counting") {
      return api.sendMessage("⚠️ Nagbibilang pa — huwag magsimula ulit.", threadID, messageID);
    }
    const startFrom = data.count > 0 ? data.count + 1 : 1;
    await api.sendMessage(`⚡ Magsisimula mula ${startFrom} hanggang 200...`, threadID, messageID);
    await sendCountSequence(api, threadID, startFrom);
    return;
  }

  if (cmd === "stop") {
    data.status = "stopped";
    saveData(data);
    return api.sendMessage(`⏹️ Itinigil sa bilang: ${data.count}`, threadID, messageID);
  }

  if (cmd === "reset") {
    data.count = 0;
    data.status = "idle";
    saveData(data);
    return api.sendMessage("🔄 Nireset — Magsimula ulit: /count start", threadID, messageID);
  }

  // Default — Status
  return api.sendMessage(
    `📊 COUNT STATUS\n` +
    `Kasalukuyan: ${data.count}/200\n` +
    `Kalagayan: ${data.status}\n\n` +
    `/count start — Magsimula\n` +
    `/count stop — Itigil\n` +
    `/count reset — Simulan ulit`,
    threadID, messageID
  );
};
                            
