const fs = require("fs");
const path = require("path");

// ==========================================
// CONFIGURATION (4 ADMIN IDS)
const ADMIN_IDS = [
  "61594055835097", 
  "61594325727109", 
  "61594022290817", 
  "61593892603402"
];
// ==========================================

module.exports.config = {
  name: "gojo",
  version: "32.0.0",
  hasPermission: 2,
  credits: "Jehosh / Gojo Satoru Edition",
  description: "Gojo Bot: Strict Anti-Rename Lock, Instant Self-Reaction & Typing Indicator Engine.",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "🕶️ /gojo on — Buksan ang 24h Domain Expansion 🌌\n" +
          "💙 /gojo theme — Switch Messenger Theme to Gojo Blue ⚡\n" +
          "🔒 /gojo onsetgname <pangalan> — Unbreakable GC Name Lock ♾️\n" +
          "🏷️ /gojo onsetnick <nickname> — Change member nicknames safely 🤞\n" +
          "👋 /gojo welcome <on/off> — Toggle Auto Welcome 🔮\n" +
          "🎯 /gojo target <FB Name / Tag> — Target specific user 😼\n" +
          "❌ /gojo untarget — Clear target 🕶️\n" +
          "🚫 /gojo off — Turn OFF sa GC 🌌\n" +
          "📊 /gojo status — Check GC status ⚡",
  cooldowns: 2
};

const DATA_PATH = path.join(__dirname, "gojo_data.json");

const GOJO_THEME_IDS = [
  "2104033373204368", 
  "701621227181600",  
  "4538800262808000"  
];

const GOJO_SELF_EMOJIS = ["🕶️", "🌌", "♾️", "💙", "⚡", "😼", "🤞", "👑", "🔮"];

const GOJO_WELCOME_MESSAGES = [
  "🕶️ *Gojo Satoru:* Swerte mo, pumasok ka sa territory ng pinakamalakas! Welcome sa GC, {NAME}! 🌌👑",
  "🕶️ *Gojo Satoru:* Yo, {NAME}! Huwag kang mag-alala, protektado ka ng Infinity ko. ♾️💙",
  "🕶️ *Gojo Satoru:* Bagong student? Welcome, {NAME}! Mag-aral ka nang mabuti para hindi ka maging yowai mo~ 🤞😼"
];

function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
      if (parsed && typeof parsed === "object") {
        if (!parsed.threads) parsed.threads = {};
        return parsed;
      }
    }
  } catch (err) {}
  return { threads: {} };
}

function saveData(data) {
  try {
    if (!data || typeof data !== "object") data = { threads: {} };
    if (!data.threads) data.threads = {};
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {}
}

function isThreadActive(threadID) {
  const data = loadData();
  const threadData = data.threads ? data.threads[threadID] : null;
  return threadData && threadData.expires && Number(threadData.expires) > Date.now();
}

function getRemaining(threadID) {
  const data = loadData();
  const threadData = data.threads ? data.threads[threadID] : null;
  if (!threadData || !threadData.expires) return 0;
  const left = Number(threadData.expires) - Date.now();
  return left > 0 ? left : 0;
}

function renameAllMembersSafely(api, threadID, nickname) {
  try {
    api.getThreadInfo(threadID, (err, info) => {
      if (err || !info || !info.participantIDs) return;
      info.participantIDs.forEach((userID, index) => {
        setTimeout(() => {
          try { api.changeNickname(nickname, threadID, userID, () => {}); } catch (e) {}
        }, index * 2000);
      });
    });
  } catch (e) {}
}

// TYPING INDICATOR + SILENT MESSAGE SENDER
function sendAbsoluteSilentMsgWithTyping(api, threadID, messageText, replyToMessageID, callback) {
  try {
    // 1. I-on muna ang typing indicator ng bot
    if (typeof api.sendTypingIndicator === "function") {
      api.sendTypingIndicator(threadID, (err) => {});
    }

    // 2. Mag-antay ng maikling segundo para makita ang typing bubble bago isend ang message
    setTimeout(() => {
      api.getThreadInfo(threadID, (err, info) => {
        let mentionsArray = [];
        if (!err && info && info.participantIDs) {
          mentionsArray = info.participantIDs.map(id => ({ tag: "/silent", id: id }));
        }
        const finalBody = messageText.startsWith("/silent") ? messageText : `/silent ${messageText}`;
        api.sendMessage({ body: finalBody, mentions: mentionsArray }, threadID, callback || (() => {}), replyToMessageID);
      });
    }, 1000);

  } catch (e) {
    try {
      api.sendMessage({ body: messageText.startsWith("/silent") ? messageText : `/silent ${messageText}` }, threadID, callback || (() => {}), replyToMessageID);
    } catch (err2) {}
  }
}

function applyGojoThemeSafely(api, threadID, callback) {
  try {
    const selectedTheme = GOJO_THEME_IDS[Math.floor(Math.random() * GOJO_THEME_IDS.length)];
    if (typeof api.changeThreadColor === "function") {
      api.changeThreadColor(selectedTheme, threadID, (err) => {
        if (err) { try { api.changeThreadColor("0084FF", threadID, () => {}); } catch(e) {} }
        if (callback) callback();
      });
    } else if (callback) callback();
  } catch (e) {
    if (callback) callback();
  }
}

// ===== EVENT HANDLER =====
module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, messageID, logMessageType, logMessageData } = event;
    if (!threadID || !senderID) return;
    
    const botID = api.getCurrentUserID();
    const data = loadData();
    const threadData = data.threads ? data.threads[threadID] : null;

    if (!isThreadActive(threadID) || !threadData) return;

    if (threadData.lockedTitle) {
      const lockedName = threadData.lockedTitle;
      
      if (logMessageType === "log:thread-name") {
        if (logMessageData && logMessageData.name !== lockedName) {
          try {
            api.setTitle(lockedName, threadID, () => {
              try {
                api.setMessageReaction(GOJO_SELF_EMOJIS[Math.floor(Math.random() * GOJO_SELF_EMOJIS.length)], messageID, () => {}, true);
              } catch (e) {}
            });
          } catch (e) {}
        }
        return;
      }

      try {
        api.getThreadInfo(threadID, (err, info) => {
          if (!err && info && info.threadName && info.threadName !== lockedName) {
            api.setTitle(lockedName, threadID, () => {});
          }
        });
      } catch (e) {}
    }

    if (logMessageType === "log:subscribe") {
      const addedParticipants = logMessageData ? logMessageData.addedParticipants || [] : [];
      if (threadData.welcome) {
        addedParticipants.forEach((participant) => {
          const newUserID = participant.userFbId;
          const newName = participant.fullName || "Bagong Student";
          const randomWelcome = GOJO_WELCOME_MESSAGES[Math.floor(Math.random() * GOJO_WELCOME_MESSAGES.length)];
          sendAbsoluteSilentMsgWithTyping(api, threadID, randomWelcome.replace("{NAME}", newName), null);

          if (threadData.targetNick) {
            setTimeout(() => {
              try { api.changeNickname(threadData.targetNick, threadID, newUserID, () => {}); } catch (e) {}
            }, 3000);
          }
        });
      }
      return;
    }

  } catch (err) {}
};

// ===== COMMAND RUNNER =====
module.exports.run = async function ({ api, event, args }) {
  try {
    const { threadID, messageID, senderID, mentions } = event;
    const sub = (args[0] || "").toLowerCase();

    let data = loadData();
    if (!data.threads) data.threads = {};
    if (!data.threads[threadID]) {
      data.threads[threadID] = { expires: 0, targetUser: null, targetName: null, lockedTitle: null, targetNick: null, welcome: true };
    }
    const currentThread = data.threads[threadID];

    if (!ADMIN_IDS.includes(senderID)) {
      return sendAbsoluteSilentMsgWithTyping(api, threadID, "🕶️ *Gojo Satoru:* Yowai mo~ Wala kang permiso para mag-utos sa pinakamalakas. 😼🤞", messageID);
    }

    if (sub === "theme") {
      applyGojoThemeSafely(api, threadID, () => {
        return sendAbsoluteSilentMsgWithTyping(api, threadID, "🕶️ *Gojo Satoru:* Domain Expansion: Gojo Infinity Blue Theme active! 🌌💙⚡", messageID);
      });
      return;
    }

    if (sub === "onsetnick") {
      const customNick = args.slice(1).join(" ");
      if (!customNick) return sendAbsoluteSilentMsgWithTyping(api, threadID, "🕶️ *Gojo Satoru:* Example: /gojo onsetnick Jujutsu Student 🏷️✨", messageID);
      currentThread.targetNick = customNick;
      saveData(data);
      renameAllMembersSafely(api, threadID, customNick);
      return sendAbsoluteSilentMsgWithTyping(api, threadID, `🕶️ *Gojo Satoru:* Re-naming started to "${customNick}". ⚡🏷️`, messageID);
    }

    if (sub === "onsetgname") {
      const customGCName = args.slice(1).join(" ");
      if (!customGCName) return sendAbsoluteSilentMsgWithTyping(api, threadID, "🕶️ *Gojo Satoru:* Example: /gojo onsetgname Jujutsu Realm 🔒🌌", messageID);
      currentThread.lockedTitle = customGCName;
      saveData(data);
      api.setTitle(customGCName, threadID, (err) => {
        if (err) return sendAbsoluteSilentMsgWithTyping(api, threadID, "⚠️ Siguraduhing admin ako sa GC para ma-lock at ma-auto change ang pangalan. 🔒", messageID);
        return sendAbsoluteSilentMsgWithTyping(api, threadID, `🕶️ *Gojo Satoru:* GC Name locked to "${customGCName}". Hindi na nila ito kailanman mapapalitan! 🔒⚡`, messageID);
      });
      return;
    }

    if (sub === "welcome") {
      const status = (args[1] || "").toLowerCase();
      if (status === "on" || status === "off") {
        currentThread.welcome = status === "on";
        saveData(data);
        return sendAbsoluteSilentMsgWithTyping(api, threadID, `🕶️ *Gojo Satoru:* Auto-Welcome is now ${status.toUpperCase()}! 👋🌌`, messageID);
      }
      return sendAbsoluteSilentMsgWithTyping(api, threadID, "🕶️ *Gojo Satoru:* Gamitin ang: /gojo welcome on O /gojo welcome off 👋✨", messageID);
    }

    if (sub === "on") {
      currentThread.expires = Date.now() + 24 * 60 * 60 * 1000;
      saveData(data);
      applyGojoThemeSafely(api, threadID);
      return sendAbsoluteSilentMsgWithTyping(
        api, threadID,
        `🕶️ GOJO SATORU: DOMAIN EXPANSION ACTIVATED 🌌⚡\n\n` +
        `👑 Exclusive Admins:\n${ADMIN_IDS.join("\n")}\n\n` +
        `🤖 Engine: Strict GC Name Lock, Typing Indicator & Self-React Active 🔮\n` +
        `💙 Theme: Gojo Blue (Auto-Applied) ♾️\n` +
        `🔕 Mentions: Native /silent Payload Active ⚡\n` +
        `⏳ Duration: 24 Hours Domain Expansion 🌌`,
        messageID
      );
    }

    if (sub === "target") {
      const mentionIDs = mentions ? Object.keys(mentions) : [];
      const inputTarget = args.slice(1).join(" ");

      if (!inputTarget && mentionIDs.length === 0) {
        return sendAbsoluteSilentMsgWithTyping(api, threadID, "🕶️ *Gojo Satoru:* Tag o mag-type ng FB Name. Example: /gojo target Juan Dela Cruz 🎯😼", messageID);
      }

      if (mentionIDs.length > 0) {
        const targetID = mentionIDs[0];
        currentThread.targetUser = targetID;
        currentThread.targetName = null;
        saveData(data);
        return sendAbsoluteSilentMsgWithTyping(api, threadID, `🕶️ *Gojo Satoru:* Target Locked securely sa user ID! 🎯🤞`, messageID);
      } else {
        currentThread.targetUser = null;
        currentThread.targetName = inputTarget;
        saveData(data);
        return sendAbsoluteSilentMsgWithTyping(api, threadID, `🕶️ *Gojo Satoru:* Target Locked sa FB Name: "${inputTarget}"! 🎯🤞`, messageID);
      }
    }

    if (sub === "untarget") {
      currentThread.targetUser = null;
      currentThread.targetName = null;
      saveData(data);
      return sendAbsoluteSilentMsgWithTyping(api, threadID, "🕶️ *Gojo Satoru:* Target cleared. Malaya na ulit ang lahat. ❌🌌", messageID);
    }

    if (sub === "off") {
      currentThread.expires = 0;
      saveData(data);
      return sendAbsoluteSilentMsgWithTyping(api, threadID, "🕶️ *Gojo Satoru:* Domain Expansion closed. 🚫🌌", messageID);
    }

    if (sub === "status") {
      const left = getRemaining(threadID);
      if (left <= 0) return sendAbsoluteSilentMsgWithTyping(api, threadID, "🕶️ *Gojo Satoru:* Bot is OFF. 🚫", messageID);
      const hours = Math.floor(left / (1000 * 60 * 60));
      const mins = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
      return sendAbsoluteSilentMsgWithTyping(api, threadID, `🕶️ GOJO BOT STATUS 📊:\n• Time left: ${hours}h ${mins}m ⏳\n• Status: Active (Typing & Anti-Rename) ⚡`, messageID);
    }

    return sendAbsoluteSilentMsgWithTyping(
      api, threadID,
      `🕶️ Gojo Satoru Commands 🌌:\n` +
      `⚡ /gojo on — Start 24h Gojo Mode & Theme 💙\n` +
      `💙 /gojo theme — Change theme to Gojo Blue ♾️\n` +
      `🔒 /gojo onsetgname <name> — Lock GC name (Unbreakable) 🔮\n` +
      `🏷️ /gojo onsetnick <nick> — Change member nicks 🤞\n` +
      `👋 /gojo welcome <on/off> — Toggle Welcome 🌌\n` +
      `🎯 /gojo target <Name/Tag> — Target specific user 😼\n` +
      `❌ /gojo untarget — Clear target 🕶️\n` +
      `🚫 /gojo off — Turn OFF Bot ⚡\n` +
      `📊 /gojo status — Check status 👑`,
      messageID
    );
  } catch (err) {}
};
