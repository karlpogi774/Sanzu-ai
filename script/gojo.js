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

module.exports = {
  config: {
    name: "gojo",
    version: "28.0.0",
    hasPermssion: 0,
    hasPermission: 0,
    credits: "Jehosh / Gojo Bot Suite",
    description: "Gojo Satoru Auto-Reply, Lock Engine & Anti-Restriction Tool",
    usePrefix: true,
    prefix: true,
    commandCategory: "admin",
    usages: "/gojo on — Start 24h Gojo Mode & Auto Theme\n" +
            "/gojo theme — Change Messenger Theme to Gojo Blue\n" +
            "/gojo onsetgname <pangalan> — Lock GC Name (Anti-Change)\n" +
            "/gojo offgname — Unlock GC Name\n" +
            "/gojo onsetnick <FB Name> | <Bagong Nickname> — Lock & change nickname ng tao\n" +
            "/gojo offnick <FB Name> — Unlock nickname ng tao\n" +
            "/gojo welcome <on/off> — Toggle Auto Welcome\n" +
            "/gojo target <FB Name> — Target specific user gamit ang FB name\n" +
            "/gojo untarget — Clear target\n" +
            "/gojo off — Turn OFF sa GC na 'to\n" +
            "/gojo status — Check settings sa GC",
    cooldowns: 2
  },

  onStart: async function ({ api, event, args }) {
    return this.run({ api, event, args });
  },

  handleEvent: async function ({ api, event }) {
    try {
      const { threadID, senderID, body, messageID, logMessageType, logMessageData, type, attachments } = event;
      if (!threadID) return;
      
      const botID = api.getCurrentUserID();
      const data = loadData();
      const threadData = data.threads ? data.threads[threadID] : null;

      // 🔒 1. ANTI-CHANGE GC NAME GUARD
      if (logMessageType === "log:thread-name") {
        const lockedName = threadData ? threadData.lockedTitle : null;
        const newName = logMessageData ? logMessageData.name : "";

        if (lockedName && newName !== lockedName) {
          api.setTitle(lockedName, threadID, (err) => {
            if (!err) {
              api.sendMessage(`🕶️ *Gojo Satoru:* Subukan mo pang palitan ang GC name. Naka-lock ito sa "${lockedName}". 🌌`, threadID);
            }
          });
        }
        return;
      }

      // 🔒 2. ANTI-CHANGE NICKNAME GUARD
      if (logMessageType === "log:user-nickname") {
        const targetUserID = logMessageData ? logMessageData.participant_id : null;
        const newNickname = logMessageData ? logMessageData.nickname : "";
        const lockedNicknames = threadData ? threadData.lockedNicknames || {} : {};

        if (targetUserID && lockedNicknames[targetUserID]) {
          const requiredNick = lockedNicknames[targetUserID];

          if (newNickname !== requiredNick) {
            api.changeNickname(requiredNick, threadID, targetUserID, (err) => {
              if (!err) {
                api.sendMessage(`🕶️ *Gojo Satoru:* Bawal palitan ang nickname niyan! Naka-lock sa "${requiredNick}". Yowai mo~ 😼`, threadID);
              }
            });
          }
        }
        return;
      }

      if (!senderID) return;

      // AUTO WELCOME SYSTEM
      if (logMessageType === "log:subscribe") {
        const addedParticipants = logMessageData ? logMessageData.addedParticipants || [] : [];
        if (threadData && threadData.welcome) {
          addedParticipants.forEach((participant) => {
            const newName = participant.fullName || "Bagong Student";
            sendSilentReplyWithMentions(
              api,
              threadID,
              `🕶️ /silent *Gojo Satoru:* Welcome sa GC, ${newName}! Protektado ka ng pinakamalakas rito. 🌌`,
              null
            );
          });
        }
        return;
      }

      if (!isThreadActive(threadID) || senderID === botID || !threadData) return;

      if (body && body.startsWith("/")) return;

      if (threadData.targetUser && senderID !== threadData.targetUser) return;

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
  },

  run: async function ({ api, event, args }) {
    try {
      const { threadID, messageID, senderID } = event;
      const sub = (args[0] || "").toLowerCase();

      let data = loadData();
      if (!data.threads) data.threads = {};
      if (!data.threads[threadID]) {
        data.threads[threadID] = { 
          expires: 0, 
          targetUser: null, 
          targetName: null,
          lockedTitle: null, 
          lockedNicknames: {},
          welcome: true 
        };
      }

      const currentThread = data.threads[threadID];
      if (!currentThread.lockedNicknames) currentThread.lockedNicknames = {};

      if (!ADMIN_IDS.includes(senderID)) {
        return api.sendMessage("🕶️ *Gojo Satoru:* Yowai mo~ Admin IDs lang ang pwedeng gumamit nito.", threadID, messageID);
      }

      if (sub === "theme") {
        applyGojoThemeSafely(api, threadID, () => {
          return api.sendMessage("🕶️ *Gojo Satoru:* Domain Expansion: Inilapat na ang Gojo Infinity Blue Theme sa GC na 'to! 🌌", threadID, messageID);
        });
        return;
      }

      if (sub === "onsetnick") {
        const inputStr = args.slice(1).join(" ");
        if (!inputStr.includes("|")) {
          return api.sendMessage("🕶️ *Gojo Satoru:* Mali ang format!\nFormat: /gojo onsetnick <Pangalan sa FB> | <Bagong Nickname>", threadID, messageID);
        }

        const [targetNameInput, newNicknameInput] = inputStr.split("|").map(s => s.trim());
        if (!targetNameInput || !newNicknameInput) {
          return api.sendMessage("🕶️ *Gojo Satoru:* Paki-kumpleto ang pangalan sa FB at ang bagong nickname.", threadID, messageID);
        }

        api.getThreadInfo(threadID, (err, info) => {
          if (err || !info || !info.userInfo) {
            return api.sendMessage("⚠️ Hindi makuha ang impormasyon ng mga members sa GC.", threadID, messageID);
          }

          const foundUser = info.userInfo.find(u => u.name.toLowerCase().includes(targetNameInput.toLowerCase()));
          if (!foundUser) {
            return api.sendMessage(`🕶️ *Gojo Satoru:* Hindi mahanap ang tao na may pangalang "${targetNameInput}" sa GC na 'to.`, threadID, messageID);
          }

          currentThread.lockedNicknames[foundUser.id] = newNicknameInput;
          saveData(data);

          api.changeNickname(newNicknameInput, threadID, foundUser.id, (changeErr) => {
            if (changeErr) {
              return api.sendMessage(`⚠️ Nagka-error sa pagpalit ng nickname ni ${foundUser.name}.`, threadID, messageID);
            }
            return api.sendMessage(`🕶️ *Gojo Satoru:* Napalitan at **NAKA-LOCK** na ang nickname ni **${foundUser.name}** sa "${newNicknameInput}"! 🔒😼`, threadID, messageID);
          });
        });
        return;
      }

      if (sub === "offnick") {
        const targetNameInput = args.slice(1).join(" ");
        if (!targetNameInput) {
          return api.sendMessage("🕶️ *Gojo Satoru:* Maglagay ng pangalan sa FB. Example: /gojo offnick Juan Dela Cruz", threadID, messageID);
        }

        api.getThreadInfo(threadID, (err, info) => {
          if (err || !info || !info.userInfo) return;
          const foundUser = info.userInfo.find(u => u.name.toLowerCase().includes(targetNameInput.toLowerCase()));
          
          if (foundUser && currentThread.lockedNicknames[foundUser.id]) {
            delete currentThread.lockedNicknames[foundUser.id];
            saveData(data);
            return api.sendMessage(`🕶️ *Gojo Satoru:* Inalis na ang Nickname Lock para kay **${foundUser.name}**.`, threadID, messageID);
          } else {
            return api.sendMessage(`🕶️ *Gojo Satoru:* Walang naka-lock na nickname para sa name na "${targetNameInput}".`, threadID, messageID);
          }
        });
        return;
      }

      if (sub === "onsetgname") {
        const customGCName = args.slice(1).join(" ");
        if (!customGCName) return api.sendMessage("🕶️ *Gojo Satoru:* Maglagay ng pangalan. Example: /gojo onsetgname Jujutsu Realm", threadID, messageID);

        currentThread.lockedTitle = customGCName;
        saveData(data);

        api.setTitle(customGCName, threadID, (err) => {
          if (err) return api.sendMessage("⚠️ Siguraduhing Admin ang bot sa GC para gumana ang Anti-Change GC name.", threadID, messageID);
          return api.sendMessage(`🕶️ *Gojo Satoru:* Naka-LOCK na ang GC Name sa "${customGCName}". 🔒`, threadID, messageID);
        });
        return;
      }

      if (sub === "offgname") {
        currentThread.lockedTitle = null;
        saveData(data);
        return api.sendMessage("🕶️ *Gojo Satoru:* Inalis na ang Lock sa GC Name.", threadID, messageID);
      }

      if (sub === "welcome") {
        const status = (args[1] || "").toLowerCase();
        if (status === "on") {
          currentThread.welcome = true;
          saveData(data);
          return api.sendMessage("🕶️ *Gojo Satoru:* Welcome system: ENABLED.", threadID, messageID);
        } else if (status === "off") {
          currentThread.welcome = false;
          saveData(data);
          return api.sendMessage("🕶️ *Gojo Satoru:* Welcome system: DISABLED.", threadID, messageID);
        }
        return api.sendMessage("🕶️ *Gojo Satoru:* Gamitin ang: /gojo welcome on O /gojo welcome off", threadID, messageID);
      }

      if (sub === "on") {
        currentThread.expires = Date.now() + 24 * 60 * 60 * 1000;
        currentThread.activatedBy = senderID;
        saveData(data);

        applyGojoThemeSafely(api, threadID);

        return api.sendMessage(
          `🕶️ GOJO SATORU MODE ACTIVATED 🌌\n\n` +
          `👑 Exclusive Admins:\n${ADMIN_IDS.join("\n")}\n\n` +
          `🤖 Engine: Strict Nickname Guard + Target System\n` +
          `💙 Messenger Theme: Gojo Blue Theme\n` +
          `💬 Reply Delay: 5.0s - 7.0s (Anti-Ban Protected)\n` +
          `⏳ Duration: 24 Hours Active`,
          threadID,
          messageID
        );
      }

      if (sub === "target") {
        const searchName = args.slice(1).join(" ");
        if (!searchName) {
          return api.sendMessage("🕶️ *Gojo Satoru:* Maglagay ka ng pangalan ng kakausapin. Example: /gojo target Juan Dela Cruz", threadID, messageID);
        }

        api.getThreadInfo(threadID, (err, info) => {
          if (err || !info || !info.userInfo) {
            return api.sendMessage("⚠️ Hindi makuha ang listahan ng members sa GC.", threadID, messageID);
          }

          const foundUser = info.userInfo.find(u => u.name.toLowerCase().includes(searchName.toLowerCase()));
          if (!foundUser) {
            return api.sendMessage(`🕶️ *Gojo Satoru:* Walang nahanap na tao na may pangalang "${searchName}" sa GC na 'to.`, threadID, messageID);
          }

          currentThread.targetUser = foundUser.id;
          currentThread.targetName = foundUser.name;
          saveData(data);

          return api.sendMessage(`🕶️ *Gojo Satoru:* Target locked kay **${foundUser.name}**! 🎯`, threadID, messageID);
        });
        return;
      }

      if (sub === "untarget") {
        currentThread.targetUser = null;
        currentThread.targetName = null;
        saveData(data);
        return api.sendMessage("🕶️ *Gojo Satoru:* Inalis ko na ang target.", threadID, messageID);
      }

      if (sub === "off") {
        currentThread.expires = 0;
        currentThread.targetUser = null;
        currentThread.targetName = null;
        saveData(data);
        return api.sendMessage("🕶️ *Gojo Satoru:* Naka-OFF na ang Auto-Reply sa GC na 'to.", threadID, messageID);
      }

      if (sub === "status") {
        const left = getRemaining(threadID);
        const hours = Math.floor(left / (1000 * 60 * 60));
        const mins = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));

        return api.sendMessage(
          `🕶️ GOJO BOT STATUS:\n` +
          `• Auto-Reply: ${left > 0 ? `ON (${hours}h ${mins}m left)` : "OFF"}\n` +
          `• GC Name Lock: ${currentThread.lockedTitle ? currentThread.lockedTitle : "OFF"}\n` +
          `• Target User: ${currentThread.targetName ? currentThread.targetName : "Lahat sa GC"}`,
          threadID,
          messageID
        );
      }

      return api.sendMessage(
        `🕶️ Gojo Commands:\n` +
        `/gojo on — Start 24h Gojo Mode\n` +
        `/gojo theme — Change Theme\n` +
        `/gojo onsetgname <name> — Lock GC Name\n` +
        `/gojo onsetnick <FB Name> | <Nickname> — Lock Nickname\n` +
        `/gojo target <FB Name> — Target User\n` +
        `/gojo off — Turn OFF`,
        threadID,
        messageID
      );
    } catch (err) {}
  }
};

// HELPERS & STORAGE
const DATA_PATH = path.join(__dirname, "gojo_data.json");
const AUTO_REPLY_MIN_DELAY_MS = 5000;
const AUTO_REPLY_MAX_DELAY_MS = 7000;
const SPAM_WINDOW_MS = 10000;
const USER_SPAM_LIMIT = 2;

const GOJO_THEME_IDS = ["2104033373204368", "701621227181600", "4538800262808000"];
const lastReplyTime = {};
const userMessageTracker = {};

const GOJO_SELF_EMOJIS = ["🕶️", "🌌", "♾️", "💙", "⚡", "😼", "🤞", "👑", "🔮", "✨"];

const FALLBACK_ROASTS = [
  "Nah, I'd win. Akala mo ba talaga may chance ka laban sa pinakamalakas?",
  "Huwag kang mag-alala, mahina ka lang talaga. Yowai mo~ 😼",
  "Sa buong langit at lupa... ako lang ang natatanging Honored One.",
  "Limitless ang pagitan natin. Kahit anong gawin mo, hindi mo man lang ako madidikit.",
  "Masyadong mababa ang level mo. Kailangan mo pa ng ilang daang taon para makahabol sa akin.",
  "Domain Expansion: Infinite Void! Sobrang daming impormasyon ba sa utak mo kaya ka napapahinto?",
  "It's fine. After all, you're weak. 🤞"
];

const STICKER_ROASTS = [
  "Sticker lang? Ganyan na lang ba ang kakayahan ng isang mahinang tulad mo?",
  "Walang epekto 'yang sticker mo sa Infinity barrier ko. Subukan mo pang mag-send."
];

const EMOJI_ROASTS = [
  "Puro ka emoji. Naubusan ka na ba ng cursed energy para mag-type ng salita?",
  "Emoji spam won't save you from Infinite Void. Mag-isip ka naman ng magandang sasabihin!"
];

const GOJO_SUGGESTIONS = [
  "\n\n🕶️ /silent *Gojo Satoru: Don't worry, I'm the strongest.*",
  "\n\n🌌 /silent *Gojo Satoru: Domain Expansion: Infinite Void.*"
];

function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const fileData = fs.readFileSync(DATA_PATH, "utf8");
      if (fileData) {
        const parsed = JSON.parse(fileData);
        if (parsed && typeof parsed === "object") {
          if (!parsed.threads) parsed.threads = {};
          return parsed;
        }
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
      api.changeThreadColor(selectedTheme, threadID, () => {
        if (callback) callback();
      });
    } else {
      if (callback) callback();
    }
  } catch (e) {
    if (callback) callback();
  }
                }
