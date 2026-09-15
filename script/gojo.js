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
  version: "23.0.0",
  hasPermission: 2,
  credits: "Jehosh / Gojo Satoru Edition",
  description: "Gojo Bot: Persistent Engine, FB Name Target, Extended Gojo Lines.",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "/gojo on — Buksan ang 24h Domain Expansion\n" +
          "/gojo theme — Switch Messenger Theme to Gojo Blue\n" +
          "/gojo onsetgname <pangalan> — Lock GC name\n" +
          "/gojo onsetnick <nickname> — Change member nicknames safely\n" +
          "/gojo welcome <on/off> — Toggle Auto Welcome\n" +
          "/gojo target <FB Name / Tag> — Target specific user\n" +
          "/gojo untarget — Clear target\n" +
          "/gojo off — Turn OFF sa GC\n" +
          "/gojo status — Check GC status",
  cooldowns: 5
};

const DATA_PATH = path.join(__dirname, "gojo_data.json");

const AUTO_REPLY_MIN_DELAY_MS = 5500;
const AUTO_REPLY_MAX_DELAY_MS = 7500;
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
  "Mabilis ka nga ba talaga o sadyang mabagal lang ang reflexes mo sa harapan ko?",
  "Gusto mo ba ng sweet treats muna bago kita padapanin sa pagsasanay?",
  "Huwag ka nang umasa. Sa dulo ng laban na 'to, ako pa rin ang nakatayo.",
  "Ang lakas ng loob mo mag-chat, may Cursed Technique ka ba man lang?",
  "Wala sa bokabularyo ko ang matalo. Subukan mo uli sa susunod mong buhay."
];

const STICKER_ROASTS = [
  "Sticker lang? Ganyan na lang ba ang kakayahan ng isang mahinang tulad mo?",
  "Walang epekto 'yang sticker mo sa Infinity barrier ko. Subukan mo pang mag-send.",
  "Nag-send ka ng sticker dahil wala ka nang maipuntang magandang argumento? Yowai mo~",
  "Puro sticker. Hindi niyan matatapatan ang karisma at lakas ng Honored One."
];

const EMOJI_ROASTS = [
  "Puro ka emoji. Naubusan ka na ba ng cursed energy para mag-type ng salita?",
  "Tawa ka nang tawa. Nakakatawa rin ba kapag ginamit ko na ang Domain Expansion?",
  "Emoji lang kaya mong ibato? Napakahina naman ng atake mo.",
  "Isang simbolo lang ilalaban mo sa akin? Matuto kang gumalang sa pinakamalakas."
];

const GOJO_SUGGESTIONS = [
  "\n\n🕶️ /silent *Gojo Bot: Don't worry, I'm the strongest.*",
  "\n\n🌌 /silent *Gojo Bot: Domain Expansion: Infinite Void.*",
  "\n\n♾️ /silent *Gojo Bot: You can't touch me, human.*",
  "\n\n🤞 /silent *Gojo Bot: Yowai mo~ So weak.*",
  "\n\n⚡ /silent *Gojo Bot: Sa buong langit at lupa, ako ang natatanging Honored One.*"
];

const GOJO_WELCOME_MESSAGES = [
  "🕶️ /silent *Gojo Satoru:* Swerte mo, pumasok ka sa territory ng pinakamalakas! Welcome sa GC, {NAME}! 🌌",
  "🕶️ /silent *Gojo Satoru:* Yo, {NAME}! Huwag kang mag-alala, protektado ka ng Infinity ko. ♾️",
  "🕶️ /silent *Gojo Satoru:* Bagong student? Welcome, {NAME}! Mag-aral ka nang mabuti para hindi ka maging yowai mo~ 🤞"
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
        }, index * 4000);
      });
    });
  } catch (e) {}
}

function sendSilentReplyWithMentions(api, threadID, messageText, replyToMessageID, callback) {
  try {
    api.getThreadInfo(threadID, (err, info) => {
      let mentionsArray = [];
      if (!err && info && info.participantIDs) {
        mentionsArray = info.participantIDs.map(id => ({ tag: "/silent", id: id }));
      }
      api.sendMessage({ body: messageText, mentions: mentionsArray }, threadID, callback || (() => {}), replyToMessageID);
    });
  } catch (e) {}
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

    if (logMessageType === "log:subscribe") {
      const addedParticipants = logMessageData ? logMessageData.addedParticipants || [] : [];
      if (threadData && threadData.welcome) {
        addedParticipants.forEach((participant) => {
          const newUserID = participant.userFbId;
          const newName = participant.fullName || "Bagong Student";
          const randomWelcome = GOJO_WELCOME_MESSAGES[Math.floor(Math.random() * GOJO_WELCOME_MESSAGES.length)];
          sendSilentReplyWithMentions(api, threadID, randomWelcome.replace("{NAME}", newName), null);

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

    if (logMessageType === "log:thread-name") {
      const lockedName = threadData.lockedTitle;
      if (lockedName && logMessageData && logMessageData.name !== lockedName) {
        setTimeout(() => {
          try { api.setTitle(lockedName, threadID, () => {}); } catch (e) {}
        }, 2000);
      }
      return;
    }

    if (body && body.startsWith("/")) return;

    if (threadData.targetUser) {
      const targetVal = String(threadData.targetUser).toLowerCase();
      if (senderID !== targetVal) {
        let matchFound = false;
        if (threadData.targetName) {
          try {
            const info = await new Promise(res => api.getUserInfo(senderID, (e, i) => res(i)));
            const senderName = info && info[senderID] ? info[senderID].name.toLowerCase() : "";
            if (senderName.includes(threadData.targetName.toLowerCase())) matchFound = true;
          } catch(e) {}
        }
        if (!matchFound) return;
      }
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

    setTimeout(() => {
      try { api.setMessageReaction("🐶", messageID, () => {}, true); } catch (e) {}
    }, 700);

    setTimeout(() => {
      sendSilentReplyWithMentions(api, threadID, fullMessage, messageID, (err, info) => {
        if (!err && info && info.messageID) {
          setTimeout(() => {
            try { api.setMessageReaction(GOJO_SELF_EMOJIS[Math.floor(Math.random() * GOJO_SELF_EMOJIS.length)], info.messageID, () => {}, true); } catch (e) {}
          }, 1200);
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
      return api.sendMessage("🕶️ *Gojo Satoru:* Yowai mo~ Wala kang permiso para mag-utos sa pinakamalakas.", threadID, messageID);
    }

    if (sub === "theme") {
      applyGojoThemeSafely(api, threadID, () => {
        return api.sendMessage("🕶️ *Gojo Satoru:* Domain Expansion: Gojo Infinity Blue Theme active! 🌌", threadID, messageID);
      });
      return;
    }

    if (sub === "onsetnick") {
      const customNick = args.slice(1).join(" ");
      if (!customNick) return api.sendMessage("🕶️ *Gojo Satoru:* Example: /gojo onsetnick Jujutsu Student", threadID, messageID);
      currentThread.targetNick = customNick;
      saveData(data);
      renameAllMembersSafely(api, threadID, customNick);
      return api.sendMessage(`🕶️ *Gojo Satoru:* Re-naming started to "${customNick}". ⚡`, threadID, messageID);
    }

    if (sub === "onsetgname") {
      const customGCName = args.slice(1).join(" ");
      if (!customGCName) return api.sendMessage("🕶️ *Gojo Satoru:* Example: /gojo onsetgname Jujutsu Realm", threadID, messageID);
      currentThread.lockedTitle = customGCName;
      saveData(data);
      api.setTitle(customGCName, threadID, (err) => {
        if (err) return api.sendMessage("⚠️ Siguraduhing admin ako sa GC.", threadID, messageID);
        return api.sendMessage(`🕶️ *Gojo Satoru:* GC Name locked to "${customGCName}". 🔒`, threadID, messageID);
      });
      return;
    }

    if (sub === "welcome") {
      const status = (args[1] || "").toLowerCase();
      if (status === "on" || status === "off") {
        currentThread.welcome = status === "on";
        saveData(data);
        return api.sendMessage(`🕶️ *Gojo Satoru:* Auto-Welcome is now ${status.toUpperCase()}.`, threadID, messageID);
      }
      return api.sendMessage("🕶️ *Gojo Satoru:* Gamitin ang: /gojo welcome on O /gojo welcome off", threadID, messageID);
    }

    if (sub === "on") {
      currentThread.expires = Date.now() + 24 * 60 * 60 * 1000;
      saveData(data);
      applyGojoThemeSafely(api, threadID);
      return api.sendMessage(
        `🕶️ GOJO SATORU: DOMAIN EXPANSION ACTIVATED 🌌\n\n` +
        `👑 Exclusive Admins:\n${ADMIN_IDS.join("\n")}\n\n` +
        `🤖 Engine: Gojo Satoru Persistent Engine\n` +
        `💙 Theme: Gojo Blue (Auto-Applied)\n` +
        `🔕 Mentions: /silent Tag Active\n` +
        `🐶 Reactions: Active (🐶 & Gojo Emojis)\n` +
        `⏳ Duration: 24 Hours Domain Expansion`,
        threadID, messageID
      );
    }

    if (sub === "target") {
      const mentionIDs = mentions ? Object.keys(mentions) : [];
      const inputTarget = args.slice(1).join(" ");

      if (!inputTarget && mentionIDs.length === 0) {
        return api.sendMessage("🕶️ *Gojo Satoru:* Tag o mag-type ng FB Name. Example: /gojo target Juan Dela Cruz", threadID, messageID);
      }

      if (mentionIDs.length > 0) {
        const targetID = mentionIDs[0];
        currentThread.targetUser = targetID;
        currentThread.targetName = mentions[targetID].replace("@", "");
        saveData(data);
        return api.sendMessage(`🕶️ *Gojo Satoru:* Target Locked sa <@${targetID}>! 🤞`, threadID, messageID, { mentions: [{ tag: `<@${targetID}>`, id: targetID }] });
      } else {
        api.getThreadInfo(threadID, (err, info) => {
          let foundID = null;
          let foundName = inputTarget;
          if (!err && info && info.userInfo) {
            const matchedUser = info.userInfo.find(u => u.name && u.name.toLowerCase().includes(inputTarget.toLowerCase()));
            if (matchedUser) {
              foundID = matchedUser.id;
              foundName = matchedUser.name;
            }
          }
          currentThread.targetUser = foundID || inputTarget;
          currentThread.targetName = foundName;
          saveData(data);
          return api.sendMessage(`🕶️ *Gojo Satoru:* Target Locked sa FB Name: "${foundName}"! 🤞`, threadID, messageID);
        });
        return;
      }
    }

    if (sub === "untarget") {
      currentThread.targetUser = null;
      currentThread.targetName = null;
      saveData(data);
      return api.sendMessage("🕶️ *Gojo Satoru:* Target cleared.", threadID, messageID);
    }

    if (sub === "off") {
      currentThread.expires = 0;
      saveData(data);
      return api.sendMessage("🕶️ *Gojo Satoru:* Domain Expansion closed.", threadID, messageID);
    }

    if (sub === "status") {
      const left = getRemaining(threadID);
      if (left <= 0) return api.sendMessage("🕶️ *Gojo Satoru:* Bot is OFF.", threadID, messageID);
      const hours = Math.floor(left / (1000 * 60 * 60));
      const mins = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
      return api.sendMessage(`🕶️ GOJO BOT STATUS:\n• Time left: ${hours}h ${mins}m\n• Status: Active`, threadID, messageID);
    }

    return api.sendMessage(
      `🕶️ Gojo Satoru Commands:\n` +
      `/gojo on — Start 24h Gojo Mode & Theme\n` +
      `/gojo theme — Change theme to Gojo Blue\n` +
      `/gojo onsetgname <name> — Lock GC name\n` +
      `/gojo onsetnick <nick> — Change member nicks\n` +
      `/gojo welcome <on/off> — Toggle Welcome\n` +
      `/gojo target <Name/Tag> — Target specific user\n` +
      `/gojo untarget — Clear target\n` +
      `/gojo off — Turn OFF Bot\n` +
      `/gojo status — Check status`,
      threadID, messageID
    );
  } catch (err) {}
};
