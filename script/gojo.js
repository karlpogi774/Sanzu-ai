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
  name: "ryuk",
  version: "23.0.0",
  hasPermission: 2,
  credits: "Jehosh / Ryuk Bot Suite (Name-Target Edition)",
  description: "Ryuk Bot: Name Search Target, Individual Nickname Setting & Expanded Gojo Lines.",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "/ryuk on — Start 24h Gojo Mode & Auto Theme\n" +
          "/ryuk theme — Change Messenger Theme to Gojo Blue\n" +
          "/ryuk onsetgname <pangalan> — Lock GC Name (Anti-Change)\n" +
          "/ryuk offgname — Unlock GC Name\n" +
          "/ryuk onsetnick <FB Name> | <Bagong Nickname> — Palitan nickname ng isang tao lang\n" +
          "/ryuk welcome <on/off> — Toggle Auto Welcome\n" +
          "/ryuk target <FB Name> — Target specific user gamit ang FB name\n" +
          "/ryuk untarget — Clear target\n" +
          "/ryuk off — Turn OFF sa GC na 'to\n" +
          "/ryuk status — Check settings sa GC",
  cooldowns: 3
};

const DATA_PATH = path.join(__dirname, "ryuk_data.json");

// SAFE ANTI-RESTRICTION TIMINGS
const AUTO_REPLY_MIN_DELAY_MS = 5000;
const AUTO_REPLY_MAX_DELAY_MS = 7000;
const SPAM_WINDOW_MS = 10000;
const USER_SPAM_LIMIT = 2;

const GOJO_THEME_IDS = [
  "2104033373204368", // Ocean / Infinity Blue
  "701621227181600",  // Jujutsu Dark Blue
  "4538800262808000"  // Cyber Blue
];

const lastReplyTime = {};
const userMessageTracker = {};

// GOJO REACTION EMOJIS
const GOJO_SELF_EMOJIS = ["🕶️", "🌌", "♾️", "💙", "⚡", "😼", "🤞", "👑", "🔮", "✨"];

// 🌌 EXPANDED GOJO SATORU TAUNTS & ROASTS
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
  "Wala sa bokabularyo ko ang matalo. Subukan mo uli sa susunod mong buhay.",
  "Baka kailangan mo muna ng blindfold para hindi ka ma-overwhelm sa aura ko.",
  "Napakadali mong basahin. Para kang libro na bukas ang bawat pahina.",
  "Gojo Satoru lang naman ang kausap mo, matuto kang gumalang sa tuktok.",
  "Kahit magsama pa kayo ng buong tropa mo, balewala pa rin 'yan sa Infinity ko.",
  "Ganyan ba talaga ang ginagawa mo kapag alam mong wala ka nang maipapanalo?",
  "Anong pakiramdam ng tumingal sa pinakamalakas? Nakakalula ba?",
  "Wala ka man lang maipakitang maganda, pura ka lang salita.",
  "Gusto mo bang turuan kita kung paano maging malakas? Charot, hindi mo kaya.",
  "I'm the honored one for a reason. Manahimik ka na lang diyan.",
  "Kahit gumamit ka pa ng mga cursed tool, balewala pa rin sa akin.",
  "Ang hina mo naman mag-isip, kailangan mo ba ng karagdagang utak?",
  "Pinagbibigyan lang kita kasi mabait akong guro. Wag mong abusuhin.",
  "Hollow Technique: Purple! Bura ka agad kapag sineryoso kita.",
  "Baka gusto mong subukan ang Infinity barrier ko ngayon din?",
  "Masyado kang maingay para sa isang hamak na cursed spirit level."
];

// 🎨 STICKER ROASTS
const STICKER_ROASTS = [
  "Sticker lang? Ganyan na lang ba ang kakayahan ng isang mahinang tulad mo?",
  "Walang epekto 'yang sticker mo sa Infinity barrier ko. Subukan mo pang mag-send.",
  "Nag-send ka ng sticker dahil wala ka nang maipuntang magandang argumento? Yowai mo~",
  "Puro sticker. Hindi niyan matatapatan ang karisma at lakas ng Honored One.",
  "Kahit sangkaterbang sticker pa ang i-send mo, hindi 'yan tatagos sa Limitless.",
  "Isang sticker para itago ang takot mo? Bawi ka na lang sa susunod!",
  "Nauwi ka na lang sa sticker? Naubusan ka na ba ng sasabihin?",
  "Sticker spam? Yan na ba ang ultimate technique mo?"
];

// 🤡 EMOJI ROASTS
const EMOJI_ROASTS = [
  "Puro ka emoji. Naubusan ka na ba ng cursed energy para mag-type ng salita?",
  "Tawa ka nang tawa. Nakakatawa rin ba kapag ginamit ko na ang Domain Expansion?",
  "Emoji lang kaya mong ibato? Napakahina naman ng atake mo.",
  "Isang simbolo lang ilalaban mo sa akin? Matuto kang gumalang sa pinakamalakas.",
  "Wala na bang ibang naiisip 'yang utak mo kundi mag-reply ng emoji?",
  "Emoji spam won't save you from Infinite Void. Mag-isip ka naman ng magandang sasabihin!",
  "Isang emoji lang? Parang reflexes mo, napakababaw.",
  "Sinesend mo 'yang emoji para takpan ang kahinaan mo no?"
];

// 💡 GOJO MENTIONS WITH /silent TAG
const GOJO_SUGGESTIONS = [
  "\n\n🕶️ /silent *Ryuk Bot: Don't worry, I'm the strongest.*",
  "\n\n🌌 /silent *Ryuk Bot: Domain Expansion: Infinite Void.*",
  "\n\n♾️ /silent *Ryuk Bot: You can't touch me, human.*",
  "\n\n🤞 /silent *Ryuk Bot: Yowai mo~ So weak.*",
  "\n\n⚡ /silent *Ryuk Bot: Sa buong langit at lupa, ako ang natatanging Honored One.*",
  "\n\n🔮 /silent *Ryuk Bot: Hollow Technique: Purple!*",
  "\n\n💙 /silent *Ryuk Bot: Infinity is everywhere around us.*"
];

// SAFE JSON DATA LOADER
function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const fileData = fs.readFileSync(DATA_PATH, "utf8");
      const parsed = JSON.parse(fileData);
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

function applyGojoThemeSafely(api, threadID, callback) {
  try {
    const selectedTheme = GOJO_THEME_IDS[Math.floor(Math.random() * GOJO_THEME_IDS.length)];
    if (typeof api.changeThreadColor === "function") {
      api.changeThreadColor(selectedTheme, threadID, (err) => {
        if (err) {
          try { api.changeThreadColor("0084FF", threadID, () => {}); } catch(e) {}
        }
        if (callback) callback();
      });
    } else {
      if (callback) callback();
    }
  } catch (e) {
    if (callback) callback();
  }
}

// ===== EVENT HANDLER =====
module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, body, messageID, logMessageType, logMessageData, type, attachments } = event;
    if (!threadID) return;
    
    const botID = api.getCurrentUserID();
    const data = loadData();
    const threadData = data.threads ? data.threads[threadID] : null;

    // STRICT ANTI-CHANGE GC NAME ENGINE
    if (logMessageType === "log:thread-name") {
      const lockedName = threadData ? threadData.lockedTitle : null;
      const newName = logMessageData ? logMessageData.name : "";

      if (lockedName && newName !== lockedName) {
        api.setTitle(lockedName, threadID, (err) => {
          if (!err) {
            api.sendMessage(`🕶️ *Ryuk Bot:* Subukan mo pang palitan ang GC name. Naka-lock ito sa "${lockedName}". 🌌`, threadID);
          }
        });
      }
      return;
    }

    if (!senderID) return;

    // AUTO WELCOME
    if (logMessageType === "log:subscribe") {
      const addedParticipants = logMessageData ? logMessageData.addedParticipants || [] : [];
      if (threadData && threadData.welcome) {
        addedParticipants.forEach((participant) => {
          const newName = participant.fullName || "Bagong Student";
          sendSilentReplyWithMentions(
            api,
            threadID,
            `🕶️ /silent *Ryuk Bot (Gojo Persona):* Welcome sa GC, ${newName}! Protektado ka ng pinakamalakas rito. 🌌`,
            null
          );
        });
      }
      return;
    }

    if (!isThreadActive(threadID) || senderID === botID || !threadData) return;

    if (body && body.startsWith("/")) return;

    // TARGET USER CHECK
    if (threadData.targetUser && senderID !== threadData.targetUser) return;

    // ANTI-SPAM & COOLDOWN
    if (isSpamming(senderID)) return;

    const now = Date.now();
    const randomDelay = Math.floor(Math.random() * (AUTO_REPLY_MAX_DELAY_MS - AUTO_REPLY_MIN_DELAY_MS + 1)) + AUTO_REPLY_MIN_DELAY_MS;
    
    if (lastReplyTime[threadID] && (now - lastReplyTime[threadID] < AUTO_REPLY_MIN_DELAY_MS)) return;

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

    setTimeout(() => {
      try {
        api.setMessageReaction("🐶", messageID, () => {}, true);
      } catch (e) {}
    }, 600);

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
      data.threads[threadID] = { 
        expires: 0, 
        targetUser: null, 
        lockedTitle: null, 
        targetNick: null,
        welcome: true 
      };
    }

    const currentThread = data.threads[threadID];

    // QUAD ADMIN GUARD
    if (!ADMIN_IDS.includes(senderID)) {
      return api.sendMessage("🕶️ *Ryuk Bot:* Yowai mo~ Wala kang permiso para mag-utos sa akin.", threadID, messageID);
    }

    if (sub === "theme") {
      applyGojoThemeSafely(api, threadID, () => {
        return api.sendMessage("🕶️ *Ryuk Bot:* Domain Expansion: Inilapat na ang Gojo Infinity Blue Theme sa GC na 'to! 🌌", threadID, messageID);
      });
      return;
    }

    // NEW: SET NICKNAME SA ISANG TAO LANG GAMIT ANG FB NAME
    // FORMAT: /ryuk onsetnick <Name sa FB> | <Bagong Nickname>
    if (sub === "onsetnick") {
      const inputStr = args.slice(1).join(" ");
      if (!inputStr.includes("|")) {
        return api.sendMessage("🕶️ *Ryuk Bot:* Mali ang format!\nFormat: /ryuk onsetnick <Pangalan sa FB> | <Bagong Nickname>\nHalimbawa: /ryuk onsetnick Juan Dela Cruz | Yowai mo", threadID, messageID);
      }

      const [targetNameInput, newNicknameInput] = inputStr.split("|").map(s => s.trim());
      if (!targetNameInput || !newNicknameInput) {
        return api.sendMessage("🕶️ *Ryuk Bot:* Paki-kumpleto ang pangalan sa FB at ang bagong nickname.", threadID, messageID);
      }

      api.getThreadInfo(threadID, (err, info) => {
        if (err || !info || !info.userInfo) {
          return api.sendMessage("⚠️ Hindi makuha ang impormasyon ng mga members sa GC.", threadID, messageID);
        }

        const foundUser = info.userInfo.find(u => u.name.toLowerCase().includes(targetNameInput.toLowerCase()));
        if (!foundUser) {
          return api.sendMessage(`🕶️ *Ryuk Bot:* Hindi mahanap ang tao na may pangalang "${targetNameInput}" sa GC na 'to.`, threadID, messageID);
        }

        api.changeNickname(newNicknameInput, threadID, foundUser.id, (changeErr) => {
          if (changeErr) {
            return api.sendMessage(`⚠️ Nagka-error sa pagpalit ng nickname ni ${foundUser.name}.`, threadID, messageID);
          }
          return api.sendMessage(`🕶️ *Ryuk Bot:* Napalitan na ang nickname ni **${foundUser.name}** sa "${newNicknameInput}"! 😼`, threadID, messageID);
        });
      });
      return;
    }

    if (sub === "onsetgname") {
      const customGCName = args.slice(1).join(" ");
      if (!customGCName) return api.sendMessage("🕶️ *Ryuk Bot:* Maglagay ng pangalan. Example: /ryuk onsetgname Jujutsu Realm", threadID, messageID);

      currentThread.lockedTitle = customGCName;
      saveData(data);

      api.setTitle(customGCName, threadID, (err) => {
        if (err) return api.sendMessage("⚠️ Siguraduhing Admin ang bot sa GC para gumana ang Anti-Change GC name.", threadID, messageID);
        return api.sendMessage(`🕶️ *Ryuk Bot:* Naka-LOCK na ang GC Name sa "${customGCName}". Hindi na nila ito mapapalitan! 🔒`, threadID, messageID);
      });
      return;
    }

    if (sub === "offgname") {
      currentThread.lockedTitle = null;
      saveData(data);
      return api.sendMessage("🕶️ *Ryuk Bot:* Inalis na ang Lock sa GC Name.", threadID, messageID);
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

    if (sub === "on") {
      currentThread.expires = Date.now() + 24 * 60 * 60 * 1000;
      currentThread.activatedBy = senderID;
      saveData(data);

      applyGojoThemeSafely(api, threadID);

      return api.sendMessage(
        `🕶️ RYUK BOT: GOJO SATORU MODE ACTIVATED 🌌\n\n` +
        `👑 Exclusive Admins:\n${ADMIN_IDS.join("\n")}\n\n` +
        `🤖 Engine: Gojo Extended Lines + FB Name Targeting\n` +
        `💙 Messenger Theme: Gojo Blue Theme (Auto-Applied)\n` +
        `🔕 Silent Mention: Activated (/silent tag)\n` +
        `🐶 User Reaction: Dog (🐶) sa user chat\n` +
        `🕶️ Self Reaction: Gojo Emojis (🕶️🌌♾️💙⚡)\n` +
        `💬 Reply Delay: 5.0s - 7.0s (Anti-Ban Protected)\n` +
        `🔒 GC Name Lock: ${currentThread.lockedTitle ? currentThread.lockedTitle : "Disabled"}\n` +
        `👋 Welcome New Humans: ${currentThread.welcome ? "ON" : "OFF"}\n` +
        `🎯 Target System: ${currentThread.targetName ? currentThread.targetName : "Lahat sa GC"}\n` +
        `⏳ Duration: 24 Hours Active`,
        threadID,
        messageID
      );
    }

    // NEW: TARGET GAMIT ANG FB NAME O NICKNAME
    // FORMAT: /ryuk target <Pangalan sa FB>
    if (sub === "target") {
      const searchName = args.slice(1).join(" ");
      if (!searchName) {
        return api.sendMessage("🕶️ *Ryuk Bot:* Maglagay ka ng pangalan ng kakausapin. Example: /ryuk target Juan Dela Cruz", threadID, messageID);
      }

      api.getThreadInfo(threadID, (err, info) => {
        if (err || !info || !info.userInfo) {
          return api.sendMessage("⚠️ Hindi makuha ang listahan ng members sa GC.", threadID, messageID);
        }

        const foundUser = info.userInfo.find(u => u.name.toLowerCase().includes(searchName.toLowerCase()));
        if (!foundUser) {
          return api.sendMessage(`🕶️ *Ryuk Bot:* Walang nahanap na tao na may pangalang "${searchName}" sa GC na 'to.`, threadID, messageID);
        }

        currentThread.targetUser = foundUser.id;
        currentThread.targetName = foundUser.name;
        saveData(data);

        return api.sendMessage(`🕶️ *Ryuk Bot:* Target locked kay **${foundUser.name}**! Siya lang ang aasarin at kakausapin ko simula ngayon. 🎯`, threadID, messageID);
      });
      return;
    }

    if (sub === "untarget") {
      currentThread.targetUser = null;
      currentThread.targetName = null;
      saveData(data);
      return api.sendMessage("🕶️ *Ryuk Bot:* Inalis ko na ang target. Kakausapin ko na uli ang lahat.", threadID, messageID);
    }

    if (sub === "off") {
      currentThread.expires = 0;
      currentThread.targetUser = null;
      currentThread.targetName = null;
      saveData(data);
      return api.sendMessage("🕶️ *Ryuk Bot:* Naka-OFF na ang Auto-Reply at Domain Expansion sa GC na 'to.", threadID, messageID);
    }

    if (sub === "status") {
      const left = getRemaining(threadID);
      const hours = Math.floor(left / (1000 * 60 * 60));
      const mins = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));

      return api.sendMessage(
        `🕶️ RYUK BOT STATUS:\n` +
        `• Auto-Reply: ${left > 0 ? `ON (${hours}h ${mins}m left)` : "OFF"}\n` +
        `• GC Name Lock: ${
