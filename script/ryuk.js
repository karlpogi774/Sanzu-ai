const fs = require("fs");
const path = require("path");

// ==========================================
// CONFIGURATION
const ADMIN_ID = "61593892603402"; 
const DEFAULT_GC_NAME = "Ryuk's Death Note 📓";
const DEFAULT_NICKNAME = "jehosh";
// ==========================================

module.exports.config = {
  name: "activate",
  version: "5.0.0",
  hasPermission: 2,
  credits: "Jehosh / Ryuk",
  description: "GC-focused Ryuk suite: Auto set GC Name lock, Auto rename members, Auto Welcome, Emoji/Sticker replies & Anti-Spam.",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "/activate on — Start 24h suite sa DITONG GC\n" +
          "/activate onsetgname <pangalan> — Set & lock GC name\n" +
          "/activate onsetnick <nickname> — Set nickname ng lahat\n" +
          "/activate welcome <on/off> — Toggle Auto Welcome\n" +
          "/activate target @mention — Target specific user\n" +
          "/activate untarget — Clear target\n" +
          "/activate off — Turn OFF sa GC na 'to\n" +
          "/activate status — Check settings sa GC",
  cooldowns: 3
};

const DATA_PATH = path.join(__dirname, "activate_data.json");

// Anti-Spam settings
const COOLDOWN_MS = 2500;
const USER_SPAM_LIMIT = 3;
const SPAM_WINDOW_MS = 8000;

const lastReplyTime = {};
const userMessageTracker = {};

// Lamyain & Maikling lines ni Ryuk (Pang-asar)
const RYUK_ROASTS = [
  "eh tapos? 🍎",
  "inaantok ako sa boses mo...",
  "labas sa ilong yung sinabi mo.",
  "weeh? ikaw may sabi niyan?",
  "boring mo naman kausap.",
  "🍎... abot mo nga apples ko.",
  "seryoso ka na diyan?",
  "ge lang, kwento mo sa pader.",
  "parang wala namang may pake...",
  "yoko na magbasa, panis.",
  "tamad na tamad ako sa'yo.",
  "ha? hakdog.",
  "tulog ka na lang kaya?",
  "paka-walang kwenta naman.",
  "pagod na utak ko sa'yo.",
  "isa pang salita, isusulat na kita...",
  "mema lang talaga no?",
  "paki natin?",
  "k.",
  "sino nagtanong sa'yo?",
  "corny mo bro.",
  "ge. ambon lang yan.",
  "wala man lang lasa sinabi mo.",
  "buhay ka pa pala?",
  "wala akong naintindihan, ayoko na intindihin.",
  "di ka ba napapagod maging ganyan?",
  "sabaw...",
  "hangin lang lumalabas sa'yo.",
  "mas exciting pa magbilang ng usok.",
  "oks.",
  "weh di nga?",
  "ano raw? ewan sa'yo.",
  "lipat ka ibang GC, ingay mo.",
  "papansin din no?",
  "walang dating.",
  "bwisit, istorbo.",
  "pikit ka na lang ulit.",
  "sayang load sa'yo.",
  "tinatanong ba kita?",
  "parang kasalanan ko pang nabasa ko 'to.",
  "hayy, panibagong katangahan na naman."
];

// Specific reactions para sa Sticker at Emoji
const STICKER_ROASTS = [
  "dami mong sticker, bawas-bawasan mo 'yan. 🍎",
  "anong klaseng sticker 'yan? baduy.",
  "pa-sticker sticker ka pa, wala namang kwenta.",
  "ingay ng sticker mo, tulog na lang tayo.",
  "pikit ka na lang kesa mag-send ng sticker."
];

const EMOJI_ROASTS = [
  "nag-emoji pa nga... ano 'yan?",
  "puro ka emoji, wala ka bang salita?",
  "sarap burahin nung emoji mo sa notebook. 🍎",
  "mema emoji lang talaga no?",
  "emoji mo, parang mukha mo, sabaw."
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

function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
    }
  } catch {}
  return { threads: {} };
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function isThreadActive(threadID) {
  const data = loadData();
  const threadData = data.threads[threadID];
  return threadData && threadData.expires && threadData.expires > Date.now();
}

function getRemaining(threadID) {
  const data = loadData();
  const threadData = data.threads[threadID];
  if (!threadData || !threadData.expires) return 0;
  const left = threadData.expires - Date.now();
  return left > 0 ? left : 0;
}

function isSpamming(senderID) {
  const now = Date.now();
  if (!userMessageTracker[senderID]) userMessageTracker[senderID] = [];
  userMessageTracker[senderID] = userMessageTracker[senderID].filter(t => now - t < SPAM_WINDOW_MS);
  userMessageTracker[senderID].push(now);

  return userMessageTracker[senderID].length > USER_SPAM_LIMIT;
}

function renameAllMembers(api, threadID, nickname) {
  api.getThreadInfo(threadID, (err, info) => {
    if (err || !info || !info.participantIDs) return;
    info.participantIDs.forEach((userID, index) => {
      setTimeout(() => {
        api.changeNickname(nickname, threadID, userID, () => {});
      }, index * 1200);
    });
  });
}

// ===== EVENT HANDLER =====
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, body, messageID, logMessageType, logMessageData, type, attachments } = event;
  const botID = api.getCurrentUserID();
  const data = loadData();
  const threadData = data.threads[threadID];

  // 1. AUTO WELCOME NEW MEMBERS (Kahit hindi active ang roast system, gagana kapag naka-ON ang welcome)
  if (logMessageType === "log:subscribe") {
    const addedParticipants = logMessageData.addedParticipants || [];
    if (threadData && threadData.welcome) {
      addedParticipants.forEach((participant) => {
        const newUserID = participant.userFbId;
        const newName = participant.fullName || "Bagong Salta";
        
        // Mag-welcome message si Ryuk
        api.sendMessage(
          `🍎 *Ryuk:* Welcome sa GC, ${newName}. Huwag kang maingay rito, baka isulat ko pangalan mo sa notebook. 📓`,
          threadID
        );

        // Auto change nickname din sa bagong pasok
        const targetNick = threadData.targetNick || DEFAULT_NICKNAME;
        setTimeout(() => {
          api.changeNickname(targetNick, threadID, newUserID, () => {});
        }, 1500);
      });
    }
    return;
  }

  // DAPAT NAKA-ACTIVATE MUNA BAGO GUMANA ANG MGA SUMUSUNOD
  if (!isThreadActive(threadID) || senderID === botID) return;

  // 2. HARD LOCKED GC NAME (HINDI MAPALITAN NG MGA MEMBER)
  if (logMessageType === "log:thread-name") {
    const lockedName = threadData.lockedTitle || DEFAULT_GC_NAME;
    if (logMessageData.name !== lockedName) {
      api.setTitle(lockedName, threadID, (err) => {
        if (!err) {
          api.sendMessage(`🍎 *Ryuk:* Bawal palitan ang GC Name. Naka-lock 'to sa "${lockedName}".`, threadID);
        }
      });
    }
    return;
  }

  // Ignore commands
  if (body && body.startsWith("/")) return;

  // 3. TARGET USER CHECK
  if (threadData.targetUser && senderID !== threadData.targetUser) {
    return;
  }

  // 4. ANTI-SPAM CHECK
  if (isSpamming(senderID)) return;

  const now = Date.now();
  if (lastReplyTime[threadID] && (now - lastReplyTime[threadID] < COOLDOWN_MS)) {
    return;
  }
  lastReplyTime[threadID] = now;

  // 5. DETECT STICKER, EMOJI, OR TEXT (1 Message = 1 Reply)
  let selectedRoast = "";
  const isSticker = type === "sticker" || (attachments && attachments.some(a => a.type === "sticker"));
  const isEmojiOnly = body && /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])+$$/g.test(body.trim());

  if (isSticker) {
    selectedRoast = STICKER_ROASTS[Math.floor(Math.random() * STICKER_ROASTS.length)];
  } else if (isEmojiOnly) {
    selectedRoast = EMOJI_ROASTS[Math.floor(Math.random() * EMOJI_ROASTS.length)];
  } else {
    selectedRoast = RYUK_ROASTS[Math.floor(Math.random() * RYUK_ROASTS.length)];
  }

  const randomSuggest = RYUK_SUGGESTIONS[Math.floor(Math.random() * RYUK_SUGGESTIONS.length)];
  const fullMessage = selectedRoast + randomSuggest;

  // Reply directly with auto self-reaction
  api.sendMessage(fullMessage, threadID, (err, info) => {
    if (!err && info && info.messageID) {
      const randomEmoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      api.setMessageReaction(randomEmoji, info.messageID, () => {}, true);
    }
  }, messageID);
};

// ===== COMMAND RUNNER =====
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, mentions } = event;
  const sub = (args[0] || "").toLowerCase();
  const data = loadData();

  if (!data.threads[threadID]) {
    data.threads[threadID] = { 
      expires: 0, 
      targetUser: null, 
      lockedTitle: DEFAULT_GC_NAME, 
      targetNick: DEFAULT_NICKNAME,
      welcome: true 
    };
  }

  const currentThread = data.threads[threadID];

  // STRICT ADMIN GUARD
  if (senderID !== ADMIN_ID) {
    return api.sendMessage("🍎 *Ryuk:* Wala kang authority rito. Umalis ka sa harap ko.", threadID, messageID);
  }

  // COMMAND: SET NICKNAME NG LAHAT
  if (sub === "onsetnick") {
    const customNick = args.slice(1).join(" ");
    if (!customNick) return api.sendMessage("🍎 *Ryuk:* Ilagay mo yung nickname. Example: /activate onsetnick jehosh", threadID, messageID);
    
    currentThread.targetNick = customNick;
    saveData(data);

    renameAllMembers(api, threadID, customNick);
    return api.sendMessage(`🍎 *Ryuk:* Iniiyakan na nila... pinalitan ko na ang nickname ng lahat sa "${customNick}".`, threadID, messageID);
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
    const nickName = currentThread.targetNick || DEFAULT_NICKNAME;

    // 1. Awtomatikong baguhin at i-lock ang GC Name
    api.setTitle(gcName, threadID, () => {});

    // 2. Awtomatikong palitan ang nicknames ng lahat agad-agad
    renameAllMembers(api, threadID, nickName);

    return api.sendMessage(
      `🍎 RYUK SUITE: ACTIVATED IN THIS GC 📓\n\n` +
      `👑 Admin: ${ADMIN_ID}\n` +
      `📌 GC Name Locked: "${gcName}"\n` +
      `👥 Member Nicknames: Auto set to "${nickName}"\n` +
      `👋 Welcome New Members: ${currentThread.welcome ? "ON" : "OFF"}\n` +
      `💬 Auto Reply: Text, Stickers, & Emojis (1 Message = 1 Reply)\n` +
      `🎯 Target System: ${currentThread.targetUser ? "Active" : "None (Lahat sa GC)"}\n` +
      `⏳ Duration: 24 Hours`,
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
      `• Target Nickname: ${currentThread.targetNick}\n` +
      `• Auto Welcome: ${currentThread.welcome ? "ON" : "OFF"}\n` +
      `• Target User: ${currentThread.targetUser ? currentThread.targetUser : "Lahat sa GC"}`,
      threadID,
      messageID
    );
  }

  return api.sendMessage(
    `🍎 Ryuk Commands (Admin Only):\n` +
    `/activate on — Start 24h suite (Auto-set GC Name & Nicknames agad)\n` +
    `/activate onsetgname <pangalan> — Baguhin at i-lock ang pangalan ng GC\n` +
    `/activate onsetnick <nickname> — Baguhin ang nickname ng lahat sa GC\n` +
    `/activate welcome <on/off> — Toggle auto-welcome sa bagong pasok\n` +
    `/activate target @mention — I-target lang ang isang tao\n` +
    `/activate untarget — Alisin ang target\n` +
    `/activate off — Turn OFF sa GC na 'to\n` +
    `/activate status — Check settings sa GC`,
    threadID,
    messageID
  );
};
