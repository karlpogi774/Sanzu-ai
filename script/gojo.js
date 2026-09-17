const fs = require("fs");
const path = require("path");
const axios = require("axios");

// ==========================================
// CONFIGURATION
const ADMIN_ID = "61594055835097"; 
// ==========================================

module.exports.config = {
  name: "activate",
  version: "10.0.0",
  hasPermission: 2,
  credits: "Jehosh / Bot Suite",
  description: "Bot Suite: Admin Guard, Typing Indicator, Auto Self-React, 1:1 Ratio, 2s Delay.",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "/activate on — Start 24h suite sa GC\n" +
          "/activate off — Turn OFF sa GC na 'to\n" +
          "/activate status — Check settings sa GC",
  cooldowns: 3
};

const DATA_PATH = path.join(__dirname, "activate_data.json");

// FIXED 2-SECOND DELAY & SPAM CONTROL
const AUTO_REPLY_DELAY_MS = 2000; 
const SPAM_WINDOW_MS = 8000;
const USER_SPAM_LIMIT = 3;

const lastReplyTime = {};
const userMessageTracker = {};

// SELF REACTION EMOJIS
const BOT_SELF_EMOJIS = ["🔥", "💀", "👑", "⚡", "✨", "🎯"];

const FALLBACK_ROASTS = [
  "May sinasabi ka ba? Parang wala namang may pake.",
  "Ang ingay mo naman, pwede bang tumahol ka na lang sa iba?",
  "Napaka-boring mo namang kausap. Sunod!",
  "Akala mo ba may sense 'yang sinabi mo? Patawa ka.",
  "Sandali lang, inaantok ako sa mga pinagsasabi mo.",
  "Wala ka bang ibang masabi kundi 'yan? Nakakaumay."
];

function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const fileData = fs.readFileSync(DATA_PATH, "utf8");
      return JSON.parse(fileData);
    }
  } catch (err) {
    console.error("Error reading JSON:", err);
  }
  return { threads: {} };
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing JSON:", err);
  }
}

function isThreadActive(threadID) {
  const data = loadData();
  const threadData = data.threads[threadID];
  return threadData && threadData.expires && Number(threadData.expires) > Date.now();
}

function isSpamming(senderID) {
  const now = Date.now();
  if (!userMessageTracker[senderID]) userMessageTracker[senderID] = [];
  userMessageTracker[senderID] = userMessageTracker[senderID].filter(t => now - t < SPAM_WINDOW_MS);
  userMessageTracker[senderID].push(now);

  return userMessageTracker[senderID].length > USER_SPAM_LIMIT;
}

// AI RESPONSE GENERATOR
async function getAIResponse(userPrompt) {
  try {
    const prompt = `Sumagot ka sa sinabi ng user gamit ang 1 hanggang 2 maikling Tagalog sentences na may halong asar o pagiging pranka. Message ng user: "${userPrompt}"`;
    const url = `https://api.kenliejugarap.com/ai/?question=${encodeURIComponent(prompt)}`;
    const response = await axios.get(url, { timeout: 4000 });
    
    if (response.data && response.data.response) {
      let aiText = response.data.response.trim();
      if (aiText.length > 100) {
        aiText = aiText.substring(0, 100) + "...";
      }
      return aiText;
    }
  } catch (e) {
    // Fallback kapag may error sa API
  }
  return FALLBACK_ROASTS[Math.floor(Math.random() * FALLBACK_ROASTS.length)];
}

// ===== EVENT HANDLER =====
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, body, messageID, type, attachments } = event;
  const botID = api.getCurrentUserID();

  const data = loadData();
  const threadData = data.threads ? data.threads[threadID] : null;

  // CHECK KUNG ACTIVATED PA RIN ANG GC
  if (!isThreadActive(threadID) || senderID === botID || !threadData) return;

  // Ignore commands
  if (body && body.startsWith("/")) return;

  // ANTI-SPAM CHECK
  if (isSpamming(senderID)) return;

  // CHECK COOLDOWN INTERVAL (1:1 Ratio System)
  const now = Date.now();
  if (lastReplyTime[threadID] && (now - lastReplyTime[threadID] < AUTO_REPLY_DELAY_MS)) {
    return;
  }

  let selectedReply = "";
  const isSticker = type === "sticker" || (attachments && attachments.some(a => a.type === "sticker"));

  if (isSticker) {
    selectedReply = "Puro ka na lang sticker, wala ka bang masabi gamit ang bibig mo?";
  } else if (body && body.trim().length > 0) {
    selectedReply = await getAIResponse(body);
  }

  if (!selectedReply || selectedReply.trim().length === 0) {
    return;
  }

  lastReplyTime[threadID] = now;

  // 1. TYPING INDICATOR: I-on ang typing habang nag-iisip ang bot
  try {
    api.sendTypingIndicator(threadID, true);
  } catch (e) {}

  // EXACT 2 SECONDS DELAY BAGO ILAPAG ANG SAGOT + SELF REACTION
  setTimeout(() => {
    // Patayin ang typing indicator bago mag-send
    try {
      api.sendTypingIndicator(threadID, false);
    } catch (e) {}

    api.sendMessage(selectedReply, threadID, (err, info) => {
      // 2. AUTO SELF-REACT: Mag-re-react ang bot sa SARILI NIYANG message gamit ang random emoji
      if (!err && info && info.messageID) {
        const randomEmoji = BOT_SELF_EMOJIS[Math.floor(Math.random() * BOT_SELF_EMOJIS.length)];
        setTimeout(() => {
          try {
            api.setMessageReaction(randomEmoji, info.messageID, () => {}, true);
          } catch (e) {}
        }, 500);
      }
    }, messageID);
  }, AUTO_REPLY_DELAY_MS);
};

// ===== COMMAND RUNNER =====
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const sub = (args[0] || "").toLowerCase();
  const data = loadData();

  if (!data.threads) data.threads = {};
  if (!data.threads[threadID]) {
    data.threads[threadID] = { expires: 0 };
  }

  const currentThread = data.threads[threadID];

  // STRICT ADMIN GUARD (Gamit ang UID na ibinigay mo)
  if (senderID !== ADMIN_ID) {
    return api.sendMessage("❌ Sinong nagbigay sa'yo ng karapatang gamitin ang utos na ito? Admin lang ang pwede.", threadID, messageID);
  }

  // MAIN ACTIVATION COMMAND
  if (sub === "on") {
    const expires = Date.now() + 24 * 60 * 60 * 1000;
    currentThread.expires = expires;
    saveData(data);

    return api.sendMessage(
      `⚡ BOT SUITE: ACTIVATED 🚀\n\n` +
      `👑 Admin UID: ${ADMIN_ID}\n` +
      `⌨️ Typing Indicator: ENABLED\n` +
      `✨ Auto Self-React: ENABLED\n` +
      `⏳ Duration: 24 Hours`,
      threadID,
      messageID
    );
  }

  if (sub === "off") {
    if (isThreadActive(threadID)) {
      currentThread.expires = 0;
      saveData(data);
      return api.sendMessage("🛑 Isinara na ang sistema sa GC na 'to.", threadID, messageID);
    }
    return api.sendMessage("⚠️ Naka-OFF na ang sistema rito.", threadID, messageID);
  }

  if (sub === "status") {
    const left = Number(currentThread.expires) - Date.now();
    if (left <= 0) return api.sendMessage("📊 Status: Naka-OFF ang bot sa GC na 'to.", threadID, messageID);

    const hours = Math.floor(left / (1000 * 60 * 60));
    const mins = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
    return api.sendMessage(
      `📊 BOT STATUS:\n` +
      `• Time left: ${hours}h ${mins}m\n` +
      `• Typing Indicator: Active\n` +
      `• Self-Reaction: Active`,
      threadID,
      messageID
    );
  }

  return api.sendMessage(
    `⚙️ Commands (Admin Only):\n` +
    `/activate on — Buksan ang bot (24 hours)\n` +
    `/activate off — Patayin ang bot\n` +
    `/activate status — Tingnan ang status`,
    threadID,
    messageID
  );
};
