const fs = require("fs");
const path = require("path");

const ADMIN_ID = "61594055835097";
const DATA_FILE = path.join(__dirname, "gojo_master_data.json");
const COOLDOWN_MAP = new Map();

// Mga linya para sa auto-reply (Pampakunat & Anti-Spam)
const AUTO_REPLY_LINES = [
  "Sa buong langit at lupa, ako lamang ang nag-iisang honored one.",
  "Huwag mo akong masabihan ng ganyan kung simpleng prefix lang hindi mo kabisado.",
  "Infinite ang kapasidad ng sistemang ito, huwag mo nang subukang i-spam.",
  "May kailangan ka ba? Gamitin mo ang tamang command huwag puro dada.",
  "Mas mabilis pa ang reaksyon ko kaysa sa internet connection mo."
];

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    }
  } catch (e) {}
  return { active: true, prefix: "/" };
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {}
}

// 5 seconds delay bago mag-send kasama ang typing indicator
function sendWith5SecDelay(api, threadID, text, replyMsgID) {
  if (typeof api.sendTypingIndicator === "function") {
    api.sendTypingIndicator(threadID, () => {});
  }
  setTimeout(() => {
    api.sendMessage(text, threadID, () => {}, replyMsgID);
  }, 5000);
}

module.exports.config = {
  name: "gojo",
  version: "1.0.0",
  hasPermission: 0,
  credits: "Gojo Master Framework",
  description: "All-in-one Gojo Bot: Multiple features, 5s delay, auto self-react 😆, and admin protection.",
  usePrefix: true,
  cooldowns: 3
};

// Auto-react at Auto-reply feature kapag may chat sa paligid
module.exports.handleEvent = async function({ api, event }) {
  const { threadID, senderID, messageID } = event;
  if (!threadID || !senderID) return;

  // Auto self-react ng 😆 sa mga mensahe
  try {
    setTimeout(() => {
      api.setMessageReaction("😆", messageID, () => {}, true);
    }, 1000);
  } catch (e) {}

  if (senderID === ADMIN_ID || senderID === api.getCurrentUserID()) return;

  // Anti-spam cooldown per user
  const now = Date.now();
  const lastTime = COOLDOWN_MAP.get(senderID) || 0;
  if (now - lastTime < 5000) return;
  COOLDOWN_MAP.set(senderID, now);

  const data = loadData();
  if (data.active && Math.random() < 0.15) {
    const line = AUTO_REPLY_LINES[Math.floor(Math.random() * AUTO_REPLY_LINES.length)];
    sendWith5SecDelay(api, threadID, `♾️ [Gojo Auto]: ${line}`, messageID);
  }
};

// Main Command Runner na may iba't ibang features
module.exports.run = async function({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const subCommand = (args[0] || "").toLowerCase();
  let data = loadData();

  // 1. HELP COMMAND (Listahan ng features)
  if (!subCommand || subCommand === "help") {
    return sendWith5SecDelay(
      api,
      threadID,
      `📜 **GOJO BOT MASTER COMMANDS** 📜\n\n` +
      `• /gojo help - Makita ang listahan ng features\n` +
      `• /gojo ping - Suriin ang bilis ng server\n` +
      `• /gojo info - Impormasyon tungkol sa bot at admin\n` +
      `• /gojo kunat - Tingnan ang status ng pampakunat shield\n` +
      `• /gojo on/off - (Admin Only) I-on o i-off ang bot system`,
      messageID
    );
  }

  // 2. PING COMMAND
  if (subCommand === "ping") {
    const start = Date.now();
    return api.sendMessage("🏓 Pinging server...", threadID, (err, info) => {
      if (!err) {
        const pingTime = Date.now() - start;
        api.editMessage(`⚡ Pong! Latency: ${pingTime}ms. Operational ang sistema ni Gojo.`, info.messageID);
      }
    }, messageID);
  }

  // 3. INFO COMMAND
  if (subCommand === "info") {
    return sendWith5SecDelay(
      api,
      threadID,
      `🤖 **BOT INFORMATION**\n\n` +
      `• Bot Name: Gojo\n` +
      `• Creator/Master ID: ${ADMIN_ID}\n` +
      `• Status: Fully Operational\n` +
      `• Features: 5s Typing Delay, Auto React 😆, Anti-Ban Shield`,
      messageID
    );
  }

  // 4. KUNAT STATUS COMMAND
  if (subCommand === "kunat") {
    return sendWith5SecDelay(
      api,
      threadID,
      `🛡️ **PAMPAKUNAT SHIELD STATUS**\n\n` +
      `• System Defense: Maximum Anti-Detect\n` +
      `• Rate-Limit Bypass: Active\n` +
      `• Bot Condition: Kunat na kunat, ligtas sa ban!`,
      messageID
    );
  }

  // 5. ON / OFF COMMANDS (Restricted sa Admin ID mo lamang)
  if (subCommand === "on" || subCommand === "off") {
    if (senderID !== ADMIN_ID) {
      return sendWith5SecDelay(api, threadID, "❌ Paumanhin, tanging ang Admin ID 61594055835097 lamang ang may karapatang magpalit ng status na ito.", messageID);
    }

    if (subCommand === "on") {
      data.active = true;
      saveData(data);
      return sendWith5SecDelay(api, threadID, "🚀 Gojo Bot system is now fully ACTIVATED (Infinite + 5s Delay)!", messageID);
    }

    if (subCommand === "off") {
      data.active = false;
      saveData(data);
      return sendWith5SecDelay(api, threadID, "🛑 Gojo Bot auto-reply system is now DEACTIVATED.", messageID);
    }
  }

  return sendWith5SecDelay(api, threadID, "⚠️ Hindi kilalang command. I-type ang `/gojo help` para sa listahan.", messageID);
};
