const fs = require("fs");
const path = require("path");
const axios = require("axios");

// ==========================================
// CONFIGURATION
const ADMIN_ID = "61593892603402"; 
const DEFAULT_GC_NAME = "Ryuk's Death Note 📓";
// ==========================================

module.exports.config = {
  name: "activate",
  version: "7.1.0",
  hasPermission: 2,
  credits: "Jehosh / Ryuk",
  description: "AI-Powered Ryuk Suite with Dynamic Auto-Reply, Safe Anti-Ban Delay, GC Lock, Target System, and File Persistence.",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "/activate on — Start 24h suite sa DITONG GC\n" +
          "/activate onsetgname <pangalan> — Set & lock GC name\n" +
          "/activate onsetnick <nickname> — Safely set nickname ng lahat\n" +
          "/activate welcome <on/off> — Toggle Auto Welcome\n" +
          "/activate target @mention — Target specific user\n" +
          "/activate untarget — Clear target\n" +
          "/activate off — Turn OFF sa GC na 'to\n" +
          "/activate status — Check settings sa GC",
  cooldowns: 3
};

const DATA_PATH = path.join(__dirname, "activate_data.json");

// Safe Cooldown (5 to 8 seconds random delay para IWAS BAN/RESTRICT)
const MIN_COOLDOWN_MS = 5000;
const USER_SPAM_LIMIT = 3;
const SPAM_WINDOW_MS = 10000;

const lastReplyTime = {};
const userMessageTracker = {};

// Fallback Lamyain Lines (Kapag offline o nag-error ang AI API)
const FALLBACK_ROASTS = [
  "eh tapos? 🍎",
  "inaantok ako sa boses mo...",
  "labas sa ilong yung sinabi mo.",
  "boring mo naman kausap.",
  "seryoso ka na diyan?",
  "ge lang, kwento mo sa pader.",
  "parang wala namang may pake...",
  "tamad na tamad ako sa'yo.",
  "ha? hakdog.",
  "paka-walang kwenta naman.",
  "isa pang salita, isusulat na kita..."
];

const STICKER_ROASTS = [
  "dami mong sticker, bawas-bawasan mo 'yan. 🍎",
  "anong klaseng sticker 'yan? baduy.",
  "pa-sticker sticker ka pa, wala namang kwenta.",
  "ingay ng sticker mo, tulog na lang tayo."
];

const EMOJI_ROASTS = [
  "nag-emoji pa nga... ano 'yan?",
  "puro ka emoji, wala ka bang salita?",
  "sarap burahin nung emoji mo sa notebook. 🍎",
  "mema emoji lang talaga no?"
];

// Ryuk Suggestions
const RYUK_SUGGESTIONS = [
  "\n\n💡 *Suggest: Apple muna bago magsalita.*",
  "\n\n💡 *Suggest: Mute mo muna sarili mo.*",
  "\n\n💡 *Suggest: Isulat na ba pangalan nito sa notebook?*",
  "\n\n💡 *Suggest: Mag-off online ka muna.*",
  "\n\n💡 *Suggest: Pahinga ka muna, puro ka sabaw.*",
  "\n\n💡 *Suggest: Magdala ka muna ng mansanas sa akin.*"
];

const EMOJIS = ["🍎", "💀", "📓", "😴", "👁️", "🥀", "🖤"];

// PERMANENT FILE STORAGE FUNCTIONS
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

function getRemaining(threadID) {
  const data = loadData();
  const threadData = data.threads[threadID];
  if (!threadData || !threadData.expires) return 0;
  const left = Number(threadData.expires) - Date.now();
  return left > 0 ? left : 0;
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
      }, index * 2500); // 2.5s delay bawat member para iwas ban
    });
  });
}

// AI AUTO-REPLY GENERATOR FOR RYUK
async function getAIRyukResponse(userPrompt) {
  try {
    const prompt = `Ikaw si Ryuk mula sa Death Note. Ang personalidad mo ay napakatamad, lamyain, bored, mataray, at mahilig mang-asar gamit ang maiikling Tagalog lines (maximum 1 to 2 short sentences). Sumagot ka sa sinabi ng user nang walang pakialam o nang-aasar. Message ng user: "${userPrompt}"`;
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
    // Fallback kapag may error sa AI
  }
  return FALLBACK_ROASTS[Math.floor(Math.random() * FALLBACK_ROASTS.length)];
}

// ===== EVENT HANDLER =====
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, body, messageID, logMessageType, logMessageData, type, attachments } = event;
  const botID = api.getCurrentUserID();

  const data = loadData();
  const threadData = data.threads ? data.threads[threadID] : null;

  // 1. AUTO WELCOME NEW MEMBERS
  if (logMessageType === "log:subscribe") {
    const addedParticipants = logMessageData.addedParticipants || [];
    if (threadData && threadData.welcome) {
      addedParticipants.forEach((participant) => {
        const newUserID = participant.userFbId;
        const newName = participant.fullName || "Bagong Salta";
        
        api.sendMessage(
          `🍎 *Ryuk:* Welcome sa GC, ${newName}. Huwag kang maingay rito, baka isulat ko pangalan mo sa notebook. 📓`,
          threadID
        );

        if (threadData.targetNick) {
          setTimeout(() => {
            api.changeNickname(threadData.targetNick, threadID, newUserID, () => {});
          }, 2000);
        }
      });
    }
    return;
  }

  // CHECK KUNG ACTIVATED PA RIN ANG GC
  if (!isThreadActive(threadID) || senderID === botID || !threadData) return;

  // 2. HARD LOCKED GC NAME
  if (logMessageType === "log:thread-name") {
    const lockedName = threadData.lockedTitle || DEFAULT_GC_NAME;
    if (logMessageData.name !== lockedName) {
      setTimeout(() => {
        api.setTitle(lockedName, threadID, (err) => {
          if (!err) {
            api.sendMessage(`🍎 *Ryuk:* Bawal palitan ang GC Name. Naka-lock 'to sa "${lockedName}".`, threadID);
          }
        });
      }, 1500);
    }
    return;
  }

  // Ignore commands
  if (body && body.startsWith("/")) return;

  // 3. TARGET USER CHECK
  if (threadData.targetUser && senderID !== threadData.targetUser) {
    return;
  }

  // 4. ANTI-SPAM & SAFE DELAY CHECK
  if (isSpamming(senderID)) return;

  const now = Date.now();
  const randomDelay = MIN_COOLDOWN_MS + Math.floor(Math.random() * 3000);
  if (lastReplyTime[threadID] && (now - lastReplyTime[threadID] < randomDelay)) {
    return;
  }
  lastReplyTime[threadID] = now;

  // 5. AI-POWERED AUTO-REPLY GENERATION
  let selectedRoast = "";
  const isSticker = type === "sticker" || (attachments && attachments.some(a => a.type === "sticker"));
  const isEmojiOnly = body && /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])+$$/g.test(body.trim());

  if (isSticker) {
    selectedRoast = STICKER_ROASTS[Math.floor(Math.random() * STICKER_ROASTS.length)];
  } else if (isEmojiOnly) {
    selectedRoast = EMOJI_ROASTS[Math.floor(Math.random() * EMOJI_ROASTS.length)];
  } else {
    // DITO GINAGAMIT ANG DYNAMIC AI ENGINE
    selectedRoast = await getAIRyukResponse(body || "hi");
  }

  const randomSuggest = RYUK_SUGGESTIONS[Math.floor(Math.random() * RYUK_SUGGESTIONS.length)];
  const fullMessage = selectedRoast + randomSuggest;

  // Send message safely with auto reaction
  api.sendMessage(fullMessage, threadID, (err, info) => {
    if (!err && info && info.messageID) {
      const randomEmoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      setTimeout(() => {
        api.setMessageReaction(randomEmoji, info.messageID, () => {}, true);
      }, 1000);
    }
  }, messageID);
};

// ===== COMMAND RUNNER =====
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, mentions } = event;
  const sub = (args[0] || "").toLowerCase();
  const data = loadData();

  if (!data.threads) data.threads = {};
  if (!data.threads[threadID]) {
    data.threads[threadID] = { 
      expires: 0, 
      targetUser: null, 
      lockedTitle: DEFAULT_GC_NAME, 
      targetNick: null,
      welcome: true 
    };
  }

  const currentThread = data.threads[threadID];

  // STRICT ADMIN GUARD
  if (senderID !== ADMIN_ID) {
    return api.sendMessage("🍎 *Ryuk:* Wala kang authority rito. Umalis ka sa harap ko.", threadID, messageID);
  }

  // COMMAND: MANUAL SAFE SET NICKNAME
  if (sub === "onsetnick") {
    const customNick = args.slice(1).join(" ");
    if (!customNick) return api.sendMessage("🍎 *Ryuk:* Ilagay mo yung nickname. Example: /activate onsetnick jehosh", threadID, messageID);
    
    currentThread.targetNick = customNick;
    saveData(data);

    renameAllMembersSafely(api, threadID, customNick);
    return api.sendMessage(`🍎 *Ryuk:* Pinalitan ko na ang nickname ng lahat sa "${customNick}" nang paunti-unti para safe sa restriction.`, threadID, messageID);
  }

  // COMMAND: SET & LOCK GC NAME
  if (sub === "onsetgname") {
    const customGCName = args.slice(1).join(" ");
    if (!customGCName) return api.sendMessage("🍎 *Ryuk:* Ilagay mo yung bagong pangalan ng GC. Example: /activate onsetgname Ryuk GC", threadID, messageID);

    currentThread.lockedTitle = customGCName;
    saveData(data);

    api.setTitle(customGCName, threadID, (err) => {
      if (err) return api.sendMessage("⚠️ Hindi mapalitan ang GC Name. Siguraduhing admin ang bot sa GC na 'to.", threadID, messageID);
      return api.sendMessage(`🍎 *Ryuk:* Naka-lock na ang pangalan ng GC sa "${customGCName}". Bawal na nilang palitan.`, threadID, messageID);
    });
    return;
  }

  // COMMAND: TOGGLE AUTO WELCOME
  if (sub === "welcome") {
    const status = (args[1] || "").toLowerCase();
    if (status === "on") {
      currentThread.welcome = true;
      saveData(data);
      return api.sendMessage("🍎 *Ryuk:* Auto Welcome system: ENABLED.", threadID, messageID);
    } else if (status === "off") {
      currentThread.welcome = false;
      saveData(data);
      return api.sendMessage("🍎 *Ryuk:* Auto Welcome system: DISABLED.", threadID, messageID);
    }
    return api.sendMessage("🍎 *Ryuk:* Gamitin ang: /activate welcome on O /activate welcome off", threadID, messageID);
  }

  // MAIN ACTIVATION COMMAND
  if (sub === "on") {
    const expires = Date.now() + 24 * 60 * 60 * 1000;
    currentThread.expires = expires;
    currentThread.activatedBy = senderID;
    saveData(data);

    const gcName = currentThread.lockedTitle || DEFAULT_GC_NAME;

    api.setTitle(gcName, threadID, () => {});

    return api.sendMessage(
      `🍎 RYUK AI AUTO-REPLY SUITE: ACTIVATED 📓\n\n` +
      `👑 Admin: ${ADMIN_ID}\n` +
      `🤖 AI Engine: Active (Ryuk Personality)\n` +
      `📌 GC Name Locked: "${gcName}"\n` +
      `👋 Welcome New Members: ${currentThread.welcome ? "ON" : "OFF"}\n` +
      `💬 Auto Reply: Text (AI-generated), Stickers, & Emojis\n` +
      `🎯 Target System: ${currentThread.targetUser ? "Active" : "None (Lahat sa GC)"}\n` +
      `⏳ Duration: 24 Hours Persistent Storage`,
      threadID,
      messageID
    );
  }

  if (sub === "target") {
    const mentionIDs = Object.keys(mentions);
    if (mentionIDs.length === 0 && !args[1]) {
      return api.sendMessage("🍎 *Ryuk:* Mag-tag ka ng idadamay natin sa notebook. Example: /activate target @mention", threadID, messageID);
    }

    const targetID = mentionIDs[0] || args[1];
    currentThread.targetUser = targetID;
    saveData(data);

    return api.sendMessage(`🍎 *Ryuk:* Sige, si <@${targetID}> na lang ang aasarin ko sa GC na 'to.`, threadID, messageID, {
      mentions: [{ tag: `<@${targetID}>`, id: targetID }]
    });
  }

  if (sub === "untarget") {
    currentThread.targetUser = null;
    saveData(data);
    return api.sendMessage("🍎 *Ryuk:* Inalis ko na yung target sa GC na 'to.", threadID, messageID);
  }

  if (sub === "off") {
    if (isThreadActive(threadID)) {
      currentThread.expires = 0;
      currentThread.targetUser = null;
      saveData(data);
      return api.sendMessage("🍎 *Ryuk:* Naka-OFF na ang sistema sa GC na 'to.", threadID, messageID);
    }
    return api.sendMessage("🍎 *Ryuk:* Hindi naman ako gising sa GC na 'to.", threadID, messageID);
  }

  if (sub === "status") {
    const left = getRemaining(threadID);
    if (left <= 0) return api.sendMessage("🍎 *Ryuk:* Naka-OFF ang sistema sa GC na 'to.", threadID, messageID);

    const hours = Math.floor(left / (1000 * 60 * 60));
    const mins = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
    return api.sendMessage(
      `🍎 RYUK STATUS (THIS GC):\n` +
      `• Time left: ${hours}h ${mins}m\n` +
      `• Locked GC Name: ${currentThread.lockedTitle}\n` +
      `• Target Nickname: ${currentThread.targetNick ? currentThread.targetNick : "None"}\n` +
      `• Auto Welcome: ${currentThread.welcome ? "ON" : "OFF"}\n` +
      `• Target User: ${currentThread.targetUser ? currentThread.targetUser : "Lahat sa GC"}`,
      threadID,
      messageID
    );
  }

  return api.sendMessage(
    `🍎 Ryuk AI Commands (Admin Only):\n` +
    `/activate on — Start 24h AI auto-reply suite\n` +
    `/activate onsetnick <nickname> — Safely change member nicknames\n` +
    `/activate onsetgname <pangalan> — Lock GC name\n` +
    `/activate welcome <on/off> — Toggle auto-welcome\n` +
    `/activate target @mention — Target specific user\n` +
    `/activate untarget — Clear target\n` +
    `/activate off — Turn OFF sa GC na 'to\n` +
    `/activate status — Check status sa GC`,
    threadID,
    messageID
  );
};
