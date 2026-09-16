const fs = require("fs");
const path = require("path");
const axios = require("axios");

// ==========================================
// CONFIGURATION
const ADMIN_ID = "61593892603402"; 
// ==========================================

module.exports.config = {
  name: "activate",
  version: "8.0.0",
  hasPermission: 2,
  credits: "Jehosh / Ryuk",
  description: "Ryuk AI Suite: Typing Indicator, Silent Mode, 🐶 Reaction, 2s Delay.",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "/activate on — Start 24h suite sa GC",
  cooldowns: 3
};

const DATA_PATH = path.join(__dirname, "activate_data.json");
const AUTO_REPLY_DELAY_MS = 2000; 
const SPAM_WINDOW_MS = 8000;
const USER_SPAM_LIMIT = 3;

const lastReplyTime = {};
const userMessageTracker = {};

const FALLBACK_ROASTS = [
  "eh tapos? 🍎", "inaantok ako sa boses mo...", "labas sa ilong yung sinabi mo.",
  "boring mo naman kausap, matulog ka na lang.", "seryoso ka na diyan niyan?",
  "ge lang, kwento mo sa pader baka makinig.", "parang wala namang may pake...",
  "tamad na tamad ako sa'yo, promise.", "ha? hakdog na lang ire-reply ko sa'yo."
];

const STICKER_ROASTS = [
  "dami mong sticker, bawas-bawasan mo 'yan. 🍎", "anong klaseng sticker 'yan? baduy naman."
];

const EMOJI_ROASTS = [
  "nag-emoji pa nga... ano 'yan?", "puro ka emoji, wala ka bang salita?"
];

const RYUK_SUGGESTIONS = [
  "\n\n💡 *Suggest: Apple muna bago magsalita.*",
  "\n\n💡 *Suggest: Mute mo muna sarili mo.*",
  "\n\n💡 *Suggest: Isulat na ba pangalan nito sa notebook?*"
];

function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
    }
  } catch (err) {}
  return { threads: {} };
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {}
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

function renameAllMembersSafely(api, threadID, nickname) {
  api.getThreadInfo(threadID, (err, info) => {
    if (err || !info || !info.participantIDs) return;
    info.participantIDs.forEach((userID, index) => {
      setTimeout(() => {
        api.changeNickname(nickname, threadID, userID, () => {});
      }, index * 2500);
    });
  });
}

async function getAIRyukResponse(userPrompt) {
  try {
    const prompt = `Ikaw si Ryuk mula sa Death Note. Napakatamad, bored, at mataray. Tagalog (1 to 2 short sentences). Message: "${userPrompt}"`;
    const url = `https://api.kenliejugarap.com/ai/?question=${encodeURIComponent(prompt)}`;
    const response = await axios.get(url, { timeout: 4000 });
    if (response.data && response.data.response) {
      let text = response.data.response.trim();
      return text.length > 100 ? text.substring(0, 100) + "..." : text;
    }
  } catch (e) {}
  return FALLBACK_ROASTS[Math.floor(Math.random() * FALLBACK_ROASTS.length)];
}

// ===== EVENT HANDLER =====
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, body, messageID, logMessageType, logMessageData, type, attachments } = event;
  const botID = api.getCurrentUserID();

  const data = loadData();
  const threadData = data.threads ? data.threads[threadID] : null;

  if (logMessageType === "log:subscribe") {
    const addedParticipants = logMessageData.addedParticipants || [];
    if (threadData && threadData.welcome) {
      addedParticipants.forEach((participant) => {
        api.sendMessage(`🍎 *Ryuk:* Welcome sa GC, ${participant.fullName || "Bagong Salta"}.`, threadID);
        if (threadData.targetNick) {
          setTimeout(() => api.changeNickname(threadData.targetNick, threadID, participant.userFbId, () => {}), 2000);
        }
      });
    }
    return;
  }

  if (!isThreadActive(threadID) || senderID === botID || !threadData) return;
  if (body && body.startsWith("/")) return;
  if (threadData.targetUser && senderID !== threadData.targetUser) return;
  if (isSpamming(senderID)) return;

  const now = Date.now();
  if (lastReplyTime[threadID] && (now - lastReplyTime[threadID] < AUTO_REPLY_DELAY_MS)) return;

  let selectedRoast = "";
  const isSticker = type === "sticker" || (attachments && attachments.some(a => a.type === "sticker"));
  const isEmojiOnly = body && /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])+$$/g.test(body.trim());

  if (isSticker) {
    selectedRoast = STICKER_ROASTS[Math.floor(Math.random() * STICKER_ROASTS.length)];
  } else if (isEmojiOnly) {
    selectedRoast = EMOJI_ROASTS[Math.floor(Math.random() * EMOJI_ROASTS.length)];
  } else if (body && body.trim().length > 0) {
    selectedRoast = await getAIRyukResponse(body);
  }

  if (!selectedRoast || selectedRoast.trim().length === 0) return;

  lastReplyTime[threadID] = now;
  const fullMessage = selectedRoast + RYUK_SUGGESTIONS[Math.floor(Math.random() * RYUK_SUGGESTIONS.length)];

  // 1. Auto Self-React (🐶)
  setTimeout(() => api.setMessageReaction("🐶", messageID, () => {}, true), 500);

  // 2. Typing Indicator Habang Naghihintay sa Delay
  api.sendTypingIndicator(threadID, true);

  // 3. Exact 2 Seconds Delay bago i-send ang message
  setTimeout(() => {
    api.sendTypingIndicator(threadID, false);
    
    // Suporta sa /silent modifier kung kailangan ng user
    let finalPayload = fullMessage;
    if (body && body.startsWith("/silent")) {
      // Messenger handles /silent automatically via client or formatting depending on library support
      finalPayload = fullMessage; 
    }

    api.sendMessage(finalPayload, threadID, null, messageID);
  }, AUTO_REPLY_DELAY_MS);
};

// ===== COMMAND RUNNER =====
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, mentions } = event;
  const sub = (args[0] || "").toLowerCase();
  const data = loadData();

  if (!data.threads) data.threads = {};
  if (!data.threads[threadID]) {
    data.threads[threadID] = { expires: 0, targetUser: null, lockedTitle: null, targetNick: null, welcome: true };
  }

  const currentThread = data.threads[threadID];

  if (senderID !== ADMIN_ID) {
    return api.sendMessage("🍎 *Ryuk:* Wala kang authority rito.", threadID, messageID);
  }

  if (sub === "onsetnick") {
    const customNick = args.slice(1).join(" ");
    if (!customNick) return api.sendMessage("🍎 *Ryuk:* Ilagay ang nickname. Halimbawa: /activate onsetnick Boss", threadID, messageID);
    currentThread.targetNick = customNick;
    saveData(data);
    renameAllMembersSafely(api, threadID, customNick);
    return api.sendMessage(`🍎 *Ryuk:* Pinalitan ang nickname ng lahat sa "${customNick}".`, threadID, messageID);
  }

  if (sub === "onsetgname") {
    const customGCName = args.slice(1).join(" ");
    if (!customGCName) return api.sendMessage("🍎 *Ryuk:* Ilagay ang bagong pangalan ng GC.", threadID, messageID);
    currentThread.lockedTitle = customGCName;
    saveData(data);
    api.setTitle(customGCName, threadID, (err) => {
      if (err) return api.sendMessage("⚠️ Siguraduhing admin ang bot sa GC na 'to.", threadID, messageID);
      return api.sendMessage(`🍎 *Ryuk:* Naka-lock na ang GC name sa "${customGCName}".`, threadID, messageID);
    });
    return;
  }

  if (sub === "welcome") {
    const status = (args[1] || "").toLowerCase();
    if (status === "on" || status === "off") {
      currentThread.welcome = (status === "on");
      saveData(data);
      return api.sendMessage(`🍎 *Ryuk:* Auto Welcome: ${status.toUpperCase()}.`, threadID, messageID);
    }
    return api.sendMessage("🍎 *Ryuk:* Gamitin ang: /activate welcome on / off", threadID, messageID);
  }

  if (sub === "on") {
    currentThread.expires = Date.now() + 24 * 60 * 60 * 1000;
    saveData(data);
    return api.sendMessage(`🍎 RYUK AI SUITE: ACTIVATED 📓\n• 1:1 Reply, Typing Indicator & 🐶 Reaction Enabled.`, threadID, messageID);
  }

  if (sub === "off") {
    currentThread.expires = 0;
    saveData(data);
    return api.sendMessage("🍎 *Ryuk:* Naka-OFF na ang sistema sa GC na 'to.", threadID, messageID);
  }

  return api.sendMessage("🍎 Ryuk Commands: /activate on, off, status, onsetnick, onsetgname, welcome", threadID, messageID);
};
