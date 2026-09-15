const fs = require("fs");
const path = require("path");

// ==========================================
// CONFIGURATION (3 ADMIN IDS)
const ADMIN_IDS = ["61594325727109", "61594022290817", "61593892603402"];
// ==========================================

module.exports.config = {
  name: "ryuk",
  version: "18.0.0",
  hasPermission: 2,
  credits: "Jehosh / Ryuk Bot Suite (Gojo Edition - Safe Mode)",
  description: "Ryuk Bot: Safe Gojo Persona, Anti-Suspension Delays, Auto Messenger Theme, Triple Admin.",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "/ryuk on — Start 24h Gojo Mode & Auto Theme (Safe Mode)\n" +
          "/ryuk onsetgname <pangalan> — Set & lock GC name\n" +
          "/ryuk onsetnick <nickname> — Safely set nickname ng lahat\n" +
          "/ryuk welcome <on/off> — Toggle Auto Welcome\n" +
          "/ryuk target @mention — Target specific user\n" +
          "/ryuk untarget — Clear target\n" +
          "/ryuk off — Turn OFF sa GC na 'to\n" +
          "/ryuk status — Check settings sa GC",
  cooldowns: 5
};

const DATA_PATH = path.join(__dirname, "ryuk_data.json");

// SAFE ANTI-RESTRICTION DELAYS & COOLDOWNS
const AUTO_REPLY_DELAY_MS = 6000; // Increased to 6s to avoid rate limits
const SPAM_WINDOW_MS = 10000;
const USER_SPAM_LIMIT = 2;

// GOJO / OCEAN BLUE THEME ID (Standard Messenger Theme ID for Safe Execution)
const SAFE_GOJO_THEME_ID = "2104033373204368"; 

const lastReplyTime = {};
const userMessageTracker = {};

// GOJO SELF REACTION EMOJIS
const GOJO_SELF_EMOJIS = ["🕶️", "🌌", "♾️", "💙", "⚡", "😼", "🤞"];

// 🌌 GOJO SATORU TAUNTS & ROAST LINES
const FALLBACK_ROASTS = [
  "Nah, I'd win. Akala mo ba talaga may chance ka laban sa pinakamalakas?",
  "Huwag kang mag-alala, mahina ka lang talaga. Yowai mo~ 😼",
  "Sa buong langit at lupa... ako lang ang natatanging Honored One.",
  "Limitless ang pagitan natin. Kahit anong gawin mo, hindi mo man lang ako madidikit.",
  "Masyadong mababa ang level mo. Kailangan mo pa ng ilang daang taon para makahabol sa akin.",
  "Ganyan ba talaga magsalita ang mga weaklings? Nakakaawa naman.",
  "Domain Expansion: Infinite Void! Sobrang daming impormasyon ba sa utak mo kaya ka napapahinto?",
  "Titingnan mo ba ako nang ganyan dahil lang sa gwapo ako at malakas?",
  "Relax ka lang. Ako ang pinakamalakas, kaya sanay na akong makakita ng mga taong sumusuko.",
  "Puro ka dada, subukan mo kayang itaas ang Cursed Energy mo? Masyadong boring.",
  "Six Eyes ko pa lang, kitang-kita ko na kung gaano kababaw ang iniisip mo.",
  "Akala mo ba nakakatakot ka? Maski sa panaginip mo, hindi mo ako matatalo.",
  "Isang snap ko lang, bura agad ang kayabangan mo. Magtino ka.",
  "It's fine. After all, you're weak. 🤞",
  "Subukan mong magyabang ulit, ipapadama ko sa'yo ang Blue at Red sa mukha mo.",
  "Mabilis ka nga ba talaga o sadyang mabagal lang ang reflexes mo sa harapan ko?"
];

// 🎨 STICKER ROASTS (GOJO STYLE)
const STICKER_ROASTS = [
  "Sticker lang? Ganyan na lang ba ang kakayahan ng isang mahinang tulad mo?",
  "Walang epekto 'yang sticker mo sa Infinity barrier ko. Subukan mo pang mag-send.",
  "Nag-send ka ng sticker dahil wala ka nang maipuntang magandang argumento? Yowai mo~",
  "Puro sticker. Hindi niyan matatapatan ang karisma at lakas ng Honored One."
];

// 🤡 EMOJI ROASTS (GOJO STYLE)
const EMOJI_ROASTS = [
  "Puro ka emoji. Naubusan ka na ba ng cursed energy para mag-type ng salita?",
  "Tawa ka nang tawa. Nakakatawa rin ba kapag ginamit ko na ang Domain Expansion?",
  "Emoji lang kaya mong ibato? Napakahina naman ng atake mo.",
  "Isang simbolo lang ilalaban mo sa akin? Matuto kang gumalang sa pinakamalakas."
];

// 💡 GOJO MENTIONS WITH /silent TAG
const GOJO_SUGGESTIONS = [
  "\n\n🕶️ /silent *Ryuk Bot: Don't worry, I'm the strongest.*",
  "\n\n🌌 /silent *Ryuk Bot: Domain Expansion: Infinite Void.*",
  "\n\n♾️ /silent *Ryuk Bot: You can't touch me, human.*",
  "\n\n🤞 /silent *Ryuk Bot: Yowai mo~ So weak.*",
  "\n\n⚡ /silent *Ryuk Bot: Sa buong langit at lupa, ako ang natatanging Honored One.*"
];

function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const fileData = fs.readFileSync(DATA_PATH, "utf8");
      return JSON.parse(fileData);
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

// SAFE NICKNAME RENAME WITH LONG DELAYS TO PREVENT SPAM RESTRICTIONS
function renameAllMembersSafely(api, threadID, nickname) {
  try {
    api.getThreadInfo(threadID, (err, info) => {
      if (err || !info || !info.participantIDs) return;
      info.participantIDs.forEach((userID, index) => {
        setTimeout(() => {
          try {
            api.changeNickname(nickname, threadID, userID, () => {});
          } catch (e) {}
        }, index * 4000); // 4-second gap per member
      });
    });
  } catch (e) {}
}

// SAFE MENTIONS SENDER
function sendSilentReplyWithMentions(api, threadID, messageText, replyToMessageID, callback) {
  try {
    api.getThreadInfo(threadID, (err, info) => {
      let mentionsArray = [];
      if (!err && info && info.participantIDs) {
        mentionsArray = info.participantIDs.map(id => ({
          tag: "/silent",
          id: id
        }));
      }

      const messagePayload = {
        body: messageText,
        mentions: mentionsArray
      };

      api.sendMessage(messagePayload, threadID, callback || (() => {}), replyToMessageID);
    });
  } catch (e) {}
}

// SAFE THEME CHANGING METHOD
function setSafeGojoTheme(api, threadID) {
  try {
    if (typeof api.changeThreadColor === "function") {
      api.changeThreadColor(SAFE_GOJO_THEME_ID, threadID, (err) => {
        if (err) {
          // Fallback to blue hex color if theme ID fails
          try { api.changeThreadColor("0084FF", threadID, () => {}); } catch(e) {}
        }
      });
    }
  } catch (e) {}
}

// ===== EVENT HANDLER =====
module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, body, messageID, logMessageType, logMessageData, type, attachments } = event;
    if (!threadID || !senderID) return;
    
    const botID = api.getCurrentUserID();
    const data = loadData();
    const threadData = data.threads ? data.threads[threadID] : null;

    // 1. AUTO WELCOME NEW MEMBERS
    if (logMessageType === "log:subscribe") {
      const addedParticipants = logMessageData ? logMessageData.addedParticipants || [] : [];
      if (threadData && threadData.welcome) {
        addedParticipants.forEach((participant) => {
          const newUserID = participant.userFbId;
          const newName = participant.fullName || "Bagong Student";
          
          sendSilentReplyWithMentions(
            api,
            threadID,
            `🕶️ /silent *Ryuk Bot (Gojo Persona):* Welcome sa GC, ${newName}! Protektado ka ng pinakamalakas rito. 🌌`,
            null
          );

          if (threadData.targetNick) {
            setTimeout(() => {
              try {
                api.changeNickname(threadData.targetNick, threadID, newUserID, () => {});
              } catch (e) {}
            }, 3000);
          }
        });
      }
      return;
    }

    // CHECK KUNG ACTIVATED PA RIN ANG GC
    if (!isThreadActive(threadID) || senderID === botID || !threadData) return;

    // 2. LOCKED GC NAME
    if (logMessageType === "log:thread-name") {
      const lockedName = threadData.lockedTitle;
      if (lockedName && logMessageData && logMessageData.name !== lockedName) {
        setTimeout(() => {
          try {
            api.setTitle(lockedName, threadID, () => {});
          } catch (e) {}
        }, 2000);
      }
      return;
    }

    // Ignore commands
    if (body && body.startsWith("/")) return;

    // 3. TARGET USER CHECK
    if (threadData.targetUser && senderID !== threadData.targetUser) {
      return;
    }

    // 4. ANTI-SPAM & ANTI-RESTRICTION CHECK
    if (isSpamming(senderID)) return;

    // 5. CHECK COOLDOWN INTERVAL
    const now = Date.now();
    if (lastReplyTime[threadID] && (now - lastReplyTime[threadID] < AUTO_REPLY_DELAY_MS)) {
      return;
    }

    let selectedRoast = "";
    const isSticker = type === "sticker" || (attachments && Array.isArray(attachments) && attachments.some(a => a.type === "sticker"));
    
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F7FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const isEmojiOnly = body && body.trim().replace(emojiRegex, '').length === 0;

    if (isSticker) {
      selectedRoast = STICKER_ROASTS[Math.floor(Math.random() * STICKER_ROASTS.length)];
    } else if (isEmojiOnly) {
      selectedRoast = EMOJI_ROASTS[Math.floor(Math.random() * EMOJI_ROASTS.length)];
    } else {
      selectedRoast = FALLBACK_ROASTS[Math.floor(Math.random() * FALLBACK_ROASTS.length)];
    }

    if (!selectedRoast || selectedRoast.trim().length === 0) return;

    lastReplyTime[threadID] = now;

    const randomSuggest = GOJO_SUGGESTIONS[Math.floor(Math.random() * GOJO_SUGGESTIONS.length)];
    const fullMessage = selectedRoast + randomSuggest;

    // DOG REACTION WITH RANDOMIZED DELAY TO PREVENT BOT DETECTION
    const randomReactionDelay = Math.floor(Math.random() * 800) + 500;
    setTimeout(() => {
      try {
        api.setMessageReaction("🐶", messageID, () => {}, true);
      } catch (e) {}
    }, randomReactionDelay);

    // EXACT SAFE DELAY BEFORE REPLY
    setTimeout(() => {
      sendSilentReplyWithMentions(api, threadID, fullMessage, messageID, (err, info) => {
        if (!err && info && info.messageID) {
          const randomGojoEmoji = GOJO_SELF_EMOJIS[Math.floor(Math.random() * GOJO_SELF_EMOJIS.length)];
          setTimeout(() => {
            try {
              api.setMessageReaction(randomGojoEmoji, info.messageID, () => {}, true);
            } catch (e) {}
          }, 1000);
        }
      });
    }, AUTO_REPLY_DELAY_MS);

  } catch (err) {}
};

// ===== COMMAND RUNNER =====
module.exports.run = async function ({ api, event, args }) {
  try {
    const { threadID, messageID, senderID, mentions } = event;
    const sub = (args[0] || "").toLowerCase();
    const data = loadData();

    if (!data.threads) data.threads = {};
    if (!data.threads[threadID]) {
      data.threads[threadID] = { 
        expires: 0, 
        targetUser: null, 
        lockedTitle: null, 
        targetNick: null,
        welcome: true 
      };
    }

    const currentThread = data.threads[threadID];

    // TRIPLE ADMIN GUARD
    if (!ADMIN_IDS.includes(senderID)) {
      return api.sendMessage("🕶️ *Ryuk Bot:* Yowai mo~ Wala kang permiso para mag-utos sa akin.", threadID, messageID);
    }

    if (sub === "onsetnick") {
      const customNick = args.slice(1).join(" ");
      if (!customNick) return api.sendMessage("🕶️ *Ryuk Bot:* Ilagay mo ang nickname. Example: /ryuk onsetnick Student", threadID, messageID);
      
      currentThread.targetNick = customNick;
      saveData(data);

      renameAllMembersSafely(api, threadID, customNick);
      return api.sendMessage(`🕶️ *Ryuk Bot:* Safe re-naming process started to "${customNick}".`, threadID, messageID);
    }

    if (sub === "onsetgname") {
      const customGCName = args.slice(1).join(" ");
      if (!customGCName) return api.sendMessage("🕶️ *Ryuk Bot:* Example: /ryuk onsetgname Jujutsu Realm", threadID, messageID);

      currentThread.lockedTitle = customGCName;
      saveData(data);

      api.setTitle(customGCName, threadID, (err) => {
        if (err) return api.sendMessage("⚠️ Siguraduhing admin ang bot sa GC.", threadID, messageID);
        return api.sendMessage(`🕶️ *Ryuk Bot:* Naka-lock na ang GC Name sa "${customGCName}".`, threadID, messageID);
      });
      return;
    }

    if (sub === "welcome") {
      const status = (args[1] || "").toLowerCase();
      if (status === "on") {
        currentThread.welcome = true;
        saveData(data);
        return api.sendMessage("🕶️ *Ryuk Bot:* Welcome system: ENABLED.", threadID, messageID);
      } else if (status === "off") {
        currentThread.welcome = false;
        saveData(data);
        return api.sendMessage("🕶️ *Ryuk Bot:* Welcome system: DISABLED.", threadID, messageID);
      }
      return api.sendMessage("🕶️ *Ryuk Bot:* Gamitin ang: /ryuk welcome on O /ryuk welcome off", threadID, messageID);
    }

    // MAIN ACTIVATION COMMAND (/ryuk on)
    if (sub === "on") {
      const expires = Date.now() + 24 * 60 * 60 * 1000;
      currentThread.expires = expires;
      currentThread.activatedBy = senderID;
      saveData(data);

      // SAFE AUTO MESSENGER THEME CHANGE
      setSafeGojoTheme(api, threadID);

      return api.sendMessage(
        `🕶️ RYUK BOT: GOJO SATORU MODE ACTIVATED (SAFE ENGINE) 🌌\n\n` +
        `👑 Exclusive Admins: ${ADMIN_IDS.join(", ")}\n` +
        `🤖 Engine: Gojo Limitless (Anti-Ban Guard Active)\n` +
        `💙 Messenger Theme: Safe Gojo Blue Applied\n` +
        `🔕 Silent Mention: Activated (/silent tag)\n` +
        `🐶 User Reaction: Dog (🐶) sa user chat\n` +
        `🕶️ Self Reaction: Gojo Emojis (🕶️🌌♾️💙⚡)\n` +
        `💬 Reply Delay: 6 Seconds (Rate-Limit Protection)\n` +
        `📌 GC Name Lock: ${currentThread.lockedTitle ? currentThread.lockedTitle : "Disabled"}\n` +
        `👋 Welcome New Humans: ${currentThread.welcome ? "ON" : "OFF"}\n` +
        `🎯 Target System: ${currentThread.targetUser ? "Active" : "None"}\n` +
        `⏳ Duration: 24 Hours Domain Expansion`,
        threadID,
        messageID
      );
    }

    if (sub === "target") {
      const mentionIDs = mentions ? Object.keys(mentions) : [];
      if (mentionIDs.length === 0 && !args[1]) {
        return api.sendMessage("🕶️ *Ryuk Bot:* Mag-tag ka ng target. Example: /ryuk target @mention", threadID, messageID);
      }

      const targetID = mentionIDs[0] || args[1];
      currentThread.targetUser = targetID;
      saveData(data);

      return api.sendMessage(`🕶️ *Ryuk Bot:* Si <@${targetID}> na lang ang kakausapin ko.`, threadID, messageID, {
        mentions: [{ tag: `<@${targetID}>`, id: targetID }]
      });
    }

    if (sub === "untarget") {
      currentThread.targetUser = null;
      saveData(data);
      return api.sendMessage("🕶️ *Ryuk Bot:* Inalis ko na ang target.", threadID, messageID);
    }

    if (sub === "off") {
      if (isThreadActive(threadID)) {
        currentThread.expires = 0;
        currentThread.targetUser = null;
        saveData(data);
        return api.sendMessage("🕶️ *Ryuk Bot:* Isinara ko na ang Domain Expansion sa GC na 'to.", threadID, messageID);
      }
      return api.sendMessage("🕶️ *Ryuk Bot:* Naka-close na ang bot rito.", threadID, messageID);
    }

    if (sub === "status") {
      const left = getRemaining(threadID);
      if (left <= 0) return api.sendMessage("🕶️ *Ryuk Bot:* Naka-OFF ang bot sa GC na 'to.", threadID, messageID);

      const hours = Math.floor(left / (1000 * 60 * 60));
      const mins = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
      return api.sendMessage(
        `🕶️ RYUK BOT STATUS:\n` +
        `• Time left: ${hours}h ${mins}m\n` +
        `• Admins: ${ADMIN_IDS.join(", ")}\n` +
        `• Engine Status: Anti-Ban Protection Active\n` +
        `• Target User: ${currentThread.targetUser ? currentThread.targetUser : "Lahat sa GC"}`,
        threadID,
        messageID
      );
    }

    return api.sendMessage(
      `🕶️ Ryuk Bot Commands (Admins: ${ADMIN_IDS.join(", ")}):\n` +
      `/ryuk on — Start 24h Gojo Mode & Auto Theme (Safe Mode)\n` +
      `/ryuk onsetgname <pangalan> — Lock GC name\n` +
      `/ryuk onsetnick <nickname> — Safely change member nicknames\n` +
      `/ryuk welcome <on/off> — Toggle auto-welcome\n` +
      `/ryuk target @mention — Target specific user\n` +
      `/ryuk untarget — Clear target\n` +
      `/ryuk off — Close Bot sa GC na 'to\n` +
      `/ryuk status — Check status sa GC`,
      threadID,
      messageID
    );
  } catch (err) {}
};
