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
  version: "28.0.0",
  hasPermission: 2,
  credits: "Jehosh / Gojo Satoru Edition",
  description: "Gojo Bot: Fixed Reactions & Instant Anti-GC Rename Protection.",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "🕶️ /gojo on — Buksan ang 24h Domain Expansion 🌌\n" +
          "💙 /gojo theme — Switch Messenger Theme to Gojo Blue ⚡\n" +
          "🔒 /gojo onsetgname <pangalan> — Lock GC name (Auto Revert) ♾️\n" +
          "🏷️ /gojo onsetnick <nickname> — Change member nicknames safely 🤞\n" +
          "👋 /gojo welcome <on/off> — Toggle Auto Welcome 🔮\n" +
          "🎯 /gojo target <FB Name / Tag> — Target specific user 😼\n" +
          "❌ /gojo untarget — Clear target 🕶️\n" +
          "🚫 /gojo off — Turn OFF sa GC 🌌\n" +
          "📊 /gojo status — Check GC status ⚡",
  cooldowns: 5
};

const DATA_PATH = path.join(__dirname, "gojo_data.json");

const AUTO_REPLY_MIN_DELAY_MS = 4000;
const AUTO_REPLY_MAX_DELAY_MS = 6000;
const SPAM_WINDOW_MS = 10000;
const USER_SPAM_LIMIT = 2;

const GOJO_THEME_IDS = [
  "2104033373204368", 
  "701621227181600",  
  "4538800262808000"  
];

const lastReplyTime = {};
const userMessageTracker = {};

const GOJO_SELF_EMOJIS = ["🕶️", "🌌", "♾️", "💙", "⚡", "😼", "🤞", "👑", "🔮"];

const FALLBACK_ROASTS = [
  "🕶️ Nah, I'd win. Akala mo ba talaga may chance ka laban sa pinakamalakas? 🌌",
  "😼 Huwag kang mag-alala, mahina ka lang talaga. Yowai mo~ 🤞",
  "👑 Sa buong langit at lupa... ako lang ang natatanging Honored One. ⚡",
  "♾️ Limitless ang pagitan natin. Kahit anong gawin mo, hindi mo man lang ako madidikit! 💙",
  "🔮 Masyadong mababa ang level mo. Kailangan mo pa ng ilang daang taon para makahabol sa akin! 🌌",
  "😼 Ganyan ba talaga magsalita ang mga weaklings? Nakakaawa naman~ 🕶️",
  "🌌 Domain Expansion: Infinite Void! Sobrang daming impormasyon ba sa utak mo kaya ka napapahinto? ⚡",
  "🕶️ Titingnan mo ba ako nang ganyan dahil lang sa gwapo ako at malakas? 👑",
  "💙 Relax ka lang. Ako ang pinakamalakas, kaya sanay na akong makakita ng mga sumusuko! ♾️",
  "⚡ Puro ka dada, subukan mo kayang itaas ang Cursed Energy mo? Masyadong boring! 🔮",
  "🕶️ Six Eyes ko pa lang, kitang-kita ko na kung gaano kababaw ang iniisip mo! 🌌",
  "🤞 Akala mo ba nakakatakot ka? Maski sa panaginip mo, hindi mo ako matatalo! 😼",
  "👑 Isang snap ko lang, bura agad ang kayabangan mo. Magtino ka! ⚡",
  "😼 It's fine. After all, you're weak. 🤞♾️",
  "🔴 Subukan mong magyabang ulit, ipapadama ko sa'yo ang Blue at Red sa mukha mo! 🔵",
  "⚡ Mabilis ka nga ba talaga o sadyang mabagal lang ang reflexes mo sa harapan ko? 🕶️",
  "🍬 Gusto mo ba ng sweet treats muna bago kita padapanin sa pagsasanay? 😼",
  "🏆 Huwag ka nang umasa. Sa dulo ng laban na 'to, ako pa rin ang nakatayo! 🌌",
  "🔮 Ang lakas ng loob mo mag-chat, may Cursed Technique ka ba man lang? ♾️",
  "👑 Wala sa bokabularyo ko ang matalo. Subukan mo uli sa susunod mong buhay! ⚡"
];

const STICKER_ROASTS = [
  "🖼️ Sticker lang? Ganyan na lang ba ang kakayahan ng isang mahinang tulad mo? 😼",
  "♾️ Walang epekto 'yang sticker mo sa Infinity barrier ko. Subukan mo pang mag-send! 🕶️",
  "🤞 Nag-send ka ng sticker dahil wala ka nang maipuntang magandang argumento? Yowai mo~ 🌌",
  "👑 Puro sticker. Hindi niyan matatapatan ang karisma at lakas ng Honored One! ⚡"
];

const EMOJI_ROASTS = [
  "🔮 Puro ka emoji. Naubusan ka na ba ng cursed energy para mag-type ng salita? 🕶️",
  "🌌 Tawa ka nang tawa. Nakakatawa rin ba kapag ginamit ko na ang Domain Expansion? ⚡",
  "😼 Emoji lang kaya mong ibato? Napakahina naman ng atake mo! ♾️",
  "👑 Isang simbolo lang ilalaban mo sa akin? Matuto kang gumalang sa pinakamalakas! 💙"
];

const GOJO_SUGGESTIONS = [
  "\n\n🕶️ *Gojo Bot: Don't worry, I'm the strongest.* 🌌",
  "\n\n🌌 *Gojo Bot: Domain Expansion: Infinite Void.* ⚡",
  "\n\n♾️ *Gojo Bot: You can't touch me, human.* 💙",
  "\n\n🤞 *Gojo Bot: Yowai mo~ So weak.* 😼",
  "\n\n⚡ *Gojo Bot: Sa buong langit at lupa, ako ang natatanging Honored One.* 👑"
];

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

function isSpamming(senderID) {
  const now = Date.now();
  if (!userMessageTracker[senderID]) userMessageTracker[senderID] = [];
  userMessageTracker[senderID] = userMessageTracker[senderID].filter(t => now - t < SPAM_WINDOW_MS);
  userMessageTracker[senderID].push(now);
  return userMessageTracker[senderID].length > USER_SPAM_LIMIT;
}

function renameAllMembersSafely(api, threadID, nickname) {
  try {
    api.getThreadInfo(threadID, (err, info) => {
      if (err || !info || !info.participantIDs) return;
      info.participantIDs.forEach((userID, index) => {
        setTimeout(() => {
          try { api.changeNickname(nickname, threadID, userID, () => {}); } catch (e) {}
        }, index * 3000);
      });
    });
  } catch (e) {}
}

function sendAbsoluteSilentMsg(api, threadID, messageText, replyToMessageID, callback) {
  try {
    api.getThreadInfo(threadID, (err, info) => {
      let mentionsArray = [];
      if (!err && info && info.participantIDs) {
        mentionsArray = info.participantIDs.map(id => ({ tag: "/silent", id: id }));
      }
      const finalBody = messageText.startsWith("/silent") ? messageText : `/silent ${messageText}`;
      api.sendMessage({ body: finalBody, mentions: mentionsArray }, threadID, callback || (() => {}), replyToMessageID);
    });
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
    const { threadID, senderID, body, messageID, logMessageType, logMessageData, type, attachments } = event;
    if (!threadID || !senderID) return;
    
    const botID = api.getCurrentUserID();
    const data = loadData();
    const threadData = data.threads ? data.threads[threadID] : null;

    // 1. INSTANT AUTO REVERT GC NAME KAPAG PINALITAN
    if (logMessageType === "log:thread-name") {
      if (threadData && threadData.lockedTitle) {
        const lockedName = threadData.lockedTitle;
        if (logMessageData && logMessageData.name !== lockedName) {
          try {
            api.setTitle(lockedName, threadID, () => {});
          } catch (e) {}
        }
      }
      return;
    }

    if (logMessageType === "log:subscribe") {
      const addedParticipants = logMessageData ? logMessageData.addedParticipants || [] : [];
      if (threadData && threadData.welcome) {
        addedParticipants.forEach((participant) => {
          const newUserID = participant.userFbId;
          const newName = participant.fullName || "Bagong Student";
          const randomWelcome = GOJO_WELCOME_MESSAGES[Math.floor(Math.random() * GOJO_WELCOME_MESSAGES.length)];
          sendAbsoluteSilentMsg(api, threadID, randomWelcome.replace("{NAME}", newName), null);

          if (threadData.targetNick) {
            setTimeout(() => {
              try { api.changeNickname(threadData.targetNick, threadID, newUserID, () => {}); } catch (e) {}
            }, 3000);
          }
        });
      }
      return;
    }

    if (!isThreadActive(threadID) || senderID === botID || !threadData) return;

    if (body && body.startsWith("/")) return;

    // 2. TARGET CHECKER
    if (threadData.targetUser || threadData.targetName) {
      let isTargetMatch = false;
      
      if (threadData.targetUser && senderID === String(threadData.targetUser)) {
        isTargetMatch = true;
      } else if (threadData.targetName) {
        try {
          const userInfo = await new Promise(res => api.getUserInfo(senderID, (e, i) => res(i)));
          if (userInfo && userInfo[senderID]) {
            const realName = (userInfo[senderID].name || "").toLowerCase();
            const targetQuery = threadData.targetName.toLowerCase();
            if (realName.includes(targetQuery)) {
              isTargetMatch = true;
            }
          }
        } catch (e) {}
      }

      if (!isTargetMatch) return;
    }

    if (isSpamming(senderID)) return;

    const now = Date.now();
    const randomDelay = Math.floor(Math.random() * (AUTO_REPLY_MAX_DELAY_MS - AUTO_REPLY_MIN_DELAY_MS + 1)) + AUTO_REPLY_MIN_DELAY_MS;
    if (lastReplyTime[threadID] && (now - lastReplyTime[threadID] < AUTO_REPLY_MIN_DELAY_MS)) return;

    let selectedRoast = "";
    const isSticker = type === "sticker" || (attachments && Array.isArray(attachments) && attachments.some(a => a.type === "sticker"));
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F7FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const isEmojiOnly = body && body.trim().replace(emojiRegex, '').length === 0;

    if (isSticker) selectedRoast = STICKER_ROASTS[Math.floor(Math.random() * STICKER_ROASTS.length)];
    else if (isEmojiOnly) selectedRoast = EMOJI_ROASTS[Math.floor(Math.random() * EMOJI_ROASTS.length)];
    else selectedRoast = FALLBACK_ROASTS[Math.floor(Math.random() * FALLBACK_ROASTS.length)];

    if (!selectedRoast) return;
    lastReplyTime[threadID] = now;

    const fullMessage = selectedRoast + GOJO_SUGGESTIONS[Math.floor(Math.random() * GOJO_SUGGESTIONS.length)];

    // 3. FIX: MABILIS AT SIGURADONG TARGET/USER MESSAGE REACTION
    try {
      api.setMessageReaction("🐶", messageID, () => {}, true);
    } catch (e) {}

    setTimeout(() => {
      sendAbsoluteSilentMsg(api, threadID, fullMessage, messageID, (err, info) => {
        if (!err && info && info.messageID) {
          try {
            api.setMessageReaction(GOJO_SELF_EMOJIS[Math.floor(Math.random() * GOJO_SELF_EMOJIS.length)], info.messageID, () => {}, true);
          } catch (e) {}
        }
      });
    }, randomDelay);

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
      return sendAbsoluteSilentMsg(api, threadID, "🕶️ *Gojo Satoru:* Yowai mo~ Wala kang permiso para mag-utos sa pinakamalakas. 😼🤞", messageID);
    }

    if (sub === "theme") {
      applyGojoThemeSafely(api, threadID, () => {
        return sendAbsoluteSilentMsg(api, threadID, "🕶️ *Gojo Satoru:* Domain Expansion: Gojo Infinity Blue Theme active! 🌌💙⚡", messageID);
      });
      return;
    }

    if (sub === "onsetnick") {
      const customNick = args.slice(1).join(" ");
      if (!customNick) return sendAbsoluteSilentMsg(api, threadID, "🕶️ *Gojo Satoru:* Example: /gojo onsetnick Jujutsu Student 🏷️✨", messageID);
      currentThread.targetNick = customNick;
      saveData(data);
      renameAllMembersSafely(api, threadID, customNick);
      return sendAbsoluteSilentMsg(api, threadID, `🕶️ *Gojo Satoru:* Re-naming started to "${customNick}". ⚡🏷️`, messageID);
    }

    if (sub === "onsetgname") {
      const customGCName = args.slice(1).join(" ");
      if (!customGCName) return sendAbsoluteSilentMsg(api, threadID, "🕶️ *Gojo Satoru:* Example: /gojo onsetgname Jujutsu Realm 🔒🌌", messageID);
      currentThread.lockedTitle = customGCName;
      saveData(data);
      api.setTitle(customGCName, threadID, (err) => {
        if (err) return sendAbsoluteSilentMsg(api, threadID, "⚠️ Siguraduhing admin ako sa GC para ma-lock at ma-auto change ang pangalan. 🔒", messageID);
        return sendAbsoluteSilentMsg(api, threadID, `🕶️ *Gojo Satoru:* GC Name locked to "${customGCName}". Automatic ko itong ibabalik kapag may nagbago! 🔒⚡`, messageID);
      });
      return;
    }

    if (sub === "welcome") {
      const status = (args[1] || "").toLowerCase();
      if (status === "on" || status === "off") {
        currentThread.welcome = status === "on";
        saveData(data);
        return sendAbsoluteSilentMsg(api, threadID, `🕶️ *Gojo Satoru:* Auto-Welcome is now ${status.toUpperCase()}! 👋🌌`, messageID);
      }
      return sendAbsoluteSilentMsg(api, threadID, "🕶️ *Gojo Satoru:* Gamitin ang: /gojo welcome on O /gojo welcome off 👋✨", messageID);
    }

    if (sub === "on") {
      currentThread.expires = Date.now() + 24 * 60 * 60 * 1000;
      saveData(data);
      applyGojoThemeSafely(api, threadID);
      return sendAbsoluteSilentMsg(
        api, threadID,
        `🕶️ GOJO SATORU: DOMAIN EXPANSION ACTIVATED 🌌⚡\n\n` +
        `👑 Exclusive Admins:\n${ADMIN_IDS.join("\n")}\n\n` +
        `🤖 Engine: Fixed Reactions & Auto-Revert GC Name 🔮\n` +
        `💙 Theme: Gojo Blue (Auto-Applied) ♾️\n` +
        `🔕 Mentions: Native /silent Payload Active ⚡\n` +
        `🐶 Reactions: Active (🐶 & Gojo Emojis 🕶️)\n` +
        `⏳ Duration: 24 Hours Domain Expansion 🌌`,
        messageID
      );
    }

    if (sub === "target") {
      const mentionIDs = mentions ? Object.keys(mentions) : [];
      const inputTarget = args.slice(1).join(" ");

      if (!inputTarget && mentionIDs.length === 0) {
        return sendAbsoluteSilentMsg(api, threadID, "🕶️ *Gojo Satoru:* Tag o mag-type ng FB Name. Example: /gojo target Juan Dela Cruz 🎯😼", messageID);
      }

      if (mentionIDs.length > 0) {
        const targetID = mentionIDs[0];
        currentThread.targetUser = targetID;
        currentThread.targetName = null;
        saveData(data);
        return sendAbsoluteSilentMsg(api, threadID, `🕶️ *Gojo Satoru:* Target Locked securely sa user ID! 🎯🤞`, messageID);
      } else {
        currentThread.targetUser = null;
        currentThread.targetName = inputTarget;
        saveData(data);
        return sendAbsoluteSilentMsg(api, threadID, `🕶️ *Gojo Satoru:* Target Locked sa FB Name: "${inputTarget}"! 🎯🤞`, messageID);
      }
    }

    if (sub === "untarget") {
      currentThread.targetUser = null;
      currentThread.targetName = null;
      saveData(data);
      return sendAbsoluteSilentMsg(api, threadID, "🕶️ *Gojo Satoru:* Target cleared. Malaya na ulit ang lahat. ❌🌌", messageID);
    }

    if (sub === "off") {
      currentThread.expires = 0;
      saveData(data);
      return sendAbsoluteSilentMsg(api, threadID, "🕶️ *Gojo Satoru:* Domain Expansion closed. 🚫🌌", messageID);
    }

    if (sub === "status") {
      const left = getRemaining(threadID);
      if (left <= 0) return sendAbsoluteSilentMsg(api, threadID, "🕶️ *Gojo Satoru:* Bot is OFF. 🚫", messageID);
      const hours = Math.floor(left / (1000 * 60 * 60));
      const mins = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
      return sendAbsoluteSilentMsg(api, threadID, `🕶️ GOJO BOT STATUS 📊:\n• Time left: ${hours}h ${mins}m ⏳\n• Status: Active ⚡`, messageID);
    }

    return sendAbsoluteSilentMsg(
      api, threadID,
      `🕶️ Gojo Satoru Commands 🌌:\n` +
      `⚡ /gojo on — Start 24h Gojo Mode & Theme 💙\n` +
      `💙 /gojo theme — Change theme to Gojo Blue ♾️\n` +
      `🔒 /gojo onsetgname <name> — Lock GC name (Auto Revert) 🔮\n` +
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
