const fs = require("fs");
const path = require("path");

// ==========================================
// CONFIGURATION (3 ADMIN IDS)
const ADMIN_IDS = ["61594325727109", "61594022290817", "61593892603402"];
// ==========================================

module.exports.config = {
  name: "ryuk",
  version: "16.4.0",
  hasPermission: 2,
  credits: "Jehosh / Ryuk Bot Suite",
  description: "Ryuk Bot: Triple Admin Only, /silent Mention, 5s Delay, Zero Error System.",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "/ryuk on — Start 24h Death Note Mode sa DITONG GC\n" +
          "/ryuk onsetgname <pangalan> — Set & lock GC name\n" +
          "/ryuk onsetnick <nickname> — Safely set nickname ng lahat\n" +
          "/ryuk welcome <on/off> — Toggle Auto Welcome\n" +
          "/ryuk target @mention — Target specific user\n" +
          "/ryuk untarget — Clear target\n" +
          "/ryuk off — Turn OFF sa GC na 'to\n" +
          "/ryuk status — Check settings sa GC",
  cooldowns: 3
};

const DATA_PATH = path.join(__dirname, "ryuk_data.json");

// FIXED 5-SECOND DELAY & SPAM CONTROL
const AUTO_REPLY_DELAY_MS = 5000;
const SPAM_WINDOW_MS = 8000;
const USER_SPAM_LIMIT = 3;

const lastReplyTime = {};
const userMessageTracker = {};

// RYUK SELF REACTION EMOJIS
const RYUK_SELF_EMOJIS = ["🍎", "📓", "💀", "✍️", "🖤", "👁️", "⚔️"];

// 📓🍎 RYUK TAUNTS & ROAST LINES
const FALLBACK_ROASTS = [
  "Masyadong nakakainip ang mundo ninyo. Isusulat ko na ba ang pangalan mo sa Death Note?",
  "Sige lang, magsalita ka pa. Titingnan natin kung hanggang kailan tatagal ang tibok ng puso mo.",
  "Gusto mo ba ng kasunduan para sa Shinigami Eyes? O gusto mo na lang mabura agad?",
  "Ang ingay mo. Isa ka lang pangkaraniwang tao na nakakairita sa paningin ng Shinigami.",
  "Akala mo ba nakakatakot ka? Para sa akin, laruan ka lang na madaling mawala.",
  "Puro ka dada. May mga apples ka ba riyan? Kung wala, manahimik ka na lang.",
  "Tigilan mo ang pagtahol. Mas mabilis pa sa 40 seconds ang pagbura ko sa'yo.",
  "Napakababaw ng iniisip mo. Nakakabagot ka kausap.",
  "Ang mga tao talaga, napakadaling manipulahin at laruin.",
  "Subukan mo pang magyabang, titingnan natin kung makakaligtas ka sa pahina ng notebook ko.",
  "Walang sinumang tao ang makakatakas sa tadhana kapag ako na ang humarap.",
  "Isang stroke lang ng ballpen, tapos ang kwento ng buhay mo.",
  "Tawa ka pa ngayon. Siguraduhin mong masaya ka pa kapag isinulat ko na ang pangalan mo.",
  "Wala kang kwentang kausap. Magdala ka ng mas magandang libangan para sa Shinigami.",
  "Matutong gumalang bago ko baguhin ang sanhi ng pagkawala mo ngayong araw.",
  "Tumahol ka pa diyan. Sanay naman akong makinig sa ingay ng mga taong malapit nang matapos."
];

// 🎨 STICKER ROASTS
const STICKER_ROASTS = [
  "Sticker lang ang kaya mo? Ganun ka na ba katamad mag-isip bago mabura?",
  "Walang kwenta ang sticker mo. Walang epekto 'yan sa isang Shinigami.",
  "Nag-send ka pa ng larawan. Mukha bang maaaliw ako sa basurang 'yan?",
  "Puro ka sticker. I-type mo nang maayos ang pangalan mo para madaling isulat."
];

// 🤡 EMOJI ROASTS
const EMOJI_ROASTS = [
  "Puro ka emoji. Wala ka na bang natitirang salita sa utak mo?",
  "Tawa ka nang tawa sa emoji. Nakakatawa rin ba kapag hawak ko na ang panulat?",
  "Anong ibig sabihin ng simbolo na 'yan? Napakahina ng kapasidad ng utak mo.",
  "Emoji na lang ba ang kayang ilabas ng mga daliri mo?"
];

// 💡 RYUK TAUNTS / MENTIONS WITH /silent TAG
const RYUK_SUGGESTIONS = [
  "\n\n🍎 /silent *Ryuk Bot: Human, give me apples or face the Death Note.*",
  "\n\n📓 /silent *Ryuk Bot: 40 seconds left before your chat disappears.*",
  "\n\n💀 /silent *Ryuk Bot: Humans are so interesting... yet so fragile.*",
  "\n\n✍️ /silent *Ryuk Bot: Writing your name slowly in the notebook...*",
  "\n\n🍎 /silent *Ryuk Bot: Boring... make this thread more enjoyable.*"
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

function renameAllMembersSafely(api, threadID, nickname) {
  try {
    api.getThreadInfo(threadID, (err, info) => {
      if (err || !info || !info.participantIDs) return;
      info.participantIDs.forEach((userID, index) => {
        setTimeout(() => {
          try {
            api.changeNickname(nickname, threadID, userID, () => {});
          } catch (e) {}
        }, index * 2500);
      });
    });
  } catch (e) {}
}

// HELPER FOR SILENT MESSENGER MENTIONS WITH /silent TAG
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
          const newName = participant.fullName || "Bagong Tao";
          
          sendSilentReplyWithMentions(
            api,
            threadID,
            `🍎 /silent *Ryuk Bot:* Panibagong pangalan para sa aking notebook? Welcome sa GC, ${newName}. Magdala ka ng mansanas kung ayaw mong mabura agad. 📓`,
            null
          );

          if (threadData.targetNick) {
            setTimeout(() => {
              try {
                api.changeNickname(threadData.targetNick, threadID, newUserID, () => {});
              } catch (e) {}
            }, 2000);
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
            api.setTitle(lockedName, threadID, (err) => {
              if (!err) {
                sendSilentReplyWithMentions(api, threadID, `🍎 /silent *Ryuk Bot:* Huwag mong palitan ang pangalan ng realm na 'to! Naka-lock ito sa "${lockedName}".`, null);
              }
            });
          } catch (e) {}
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

    // 4. ANTI-SPAM CHECK
    if (isSpamming(senderID)) return;

    // 5. CHECK COOLDOWN INTERVAL (EXACT 5 SECONDS DELAY)
    const now = Date.now();
    if (lastReplyTime[threadID] && (now - lastReplyTime[threadID] < AUTO_REPLY_DELAY_MS)) {
      return;
    }

    let selectedRoast = "";
    const isSticker = type === "sticker" || (attachments && Array.isArray(attachments) && attachments.some(a => a.type === "sticker"));
    
    // SAFE EMOJI REGEX CHECK
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F7FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const isEmojiOnly = body && body.trim().replace(emojiRegex, '').length === 0;

    if (isSticker) {
      selectedRoast = STICKER_ROASTS[Math.floor(Math.random() * STICKER_ROASTS.length)];
    } else if (isEmojiOnly) {
      selectedRoast = EMOJI_ROASTS[Math.floor(Math.random() * EMOJI_ROASTS.length)];
    } else {
      selectedRoast = FALLBACK_ROASTS[Math.floor(Math.random() * FALLBACK_ROASTS.length)];
    }

    // STRICT VALIDATION
    if (!selectedRoast || selectedRoast.trim().length === 0) {
      return;
    }

    lastReplyTime[threadID] = now;

    const randomSuggest = RYUK_SUGGESTIONS[Math.floor(Math.random() * RYUK_SUGGESTIONS.length)];
    const fullMessage = selectedRoast + randomSuggest;

    // 🐶 DOG REACTION SA CHAT NG USER
    setTimeout(() => {
      try {
        api.setMessageReaction("🐶", messageID, () => {}, true);
      } catch (e) {}
    }, 400);

    // EXACT 5 SECONDS DELAY BAGO ILAPAG ANG SAGOT + /silent MENTION + SELF REACTION
    setTimeout(() => {
      sendSilentReplyWithMentions(api, threadID, fullMessage, messageID, (err, info) => {
        if (!err && info && info.messageID) {
          const randomRyukEmoji = RYUK_SELF_EMOJIS[Math.floor(Math.random() * RYUK_SELF_EMOJIS.length)];
          setTimeout(() => {
            try {
              api.setMessageReaction(randomRyukEmoji, info.messageID, () => {}, true);
            } catch (e) {}
          }, 800);
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

    // STRICT TRIPLE ADMIN GUARD (IDs: 61594325727109, 61594022290817, 61593892603402 ONLY)
    if (!ADMIN_IDS.includes(senderID)) {
      return api.sendMessage("🍎 *Ryuk Bot:* Sinong nagbigay sa'yo ng karapatang gamitin ang utos ko? Hindi mo hawak ang notebook.", threadID, messageID);
    }

    // COMMAND: MANUAL SAFE SET NICKNAME
    if (sub === "onsetnick") {
      const customNick = args.slice(1).join(" ");
      if (!customNick) return api.sendMessage("🍎 *Ryuk Bot:* Ilagay mo ang nickname ng mga tao. Example: /ryuk onsetnick Target", threadID, messageID);
      
      currentThread.targetNick = customNick;
      saveData(data);

      renameAllMembersSafely(api, threadID, customNick);
      return api.sendMessage(`🍎 *Ryuk Bot:* Pinalitan ko na ang nickname ng lahat sa "${customNick}".`, threadID, messageID);
    }

    // COMMAND: SET & LOCK GC NAME
    if (sub === "onsetgname") {
      const customGCName = args.slice(1).join(" ");
      if (!customGCName) return api.sendMessage("🍎 *Ryuk Bot:* Ilagay mo ang pangalan ng Realm. Example: /ryuk onsetgname Death Note Realm", threadID, messageID);

      currentThread.lockedTitle = customGCName;
      saveData(data);

      api.setTitle(customGCName, threadID, (err) => {
        if (err) return api.sendMessage("⚠️ Hindi mapalitan ang GC Name. Siguraduhing admin ang bot sa GC na 'to.", threadID, messageID);
        return api.sendMessage(`🍎 *Ryuk Bot:* Naka-lock na ang Realm Name sa "${customGCName}".`, threadID, messageID);
      });
      return;
    }

    // COMMAND: TOGGLE AUTO WELCOME
    if (sub === "welcome") {
      const status = (args[1] || "").toLowerCase();
      if (status === "on") {
        currentThread.welcome = true;
        saveData(data);
        return api.sendMessage("🍎 *Ryuk Bot:* Welcome system for humans: ENABLED.", threadID, messageID);
      } else if (status === "off") {
        currentThread.welcome = false;
        saveData(data);
        return api.sendMessage("🍎 *Ryuk Bot:* Welcome system for humans: DISABLED.", threadID, messageID);
      }
      return api.sendMessage("🍎 *Ryuk Bot:* Gamitin ang: /ryuk welcome on O /ryuk welcome off", threadID, messageID);
    }

    // MAIN ACTIVATION COMMAND
    if (sub === "on") {
      const expires = Date.now() + 24 * 60 * 60 * 1000;
      currentThread.expires = expires;
      currentThread.activatedBy = senderID;
      saveData(data);

      return api.sendMessage(
        `🍎 RYUK BOT: DEATH NOTE MODE ACTIVATED 💀\n\n` +
        `👑 Exclusive Admins: ${ADMIN_IDS.join(", ")}\n` +
        `🤖 Engine: Ryuk Shinigami Superiority Mode\n` +
        `🔕 Silent Mention: Activated (/silent notify tag)\n` +
        `🐶 User Reaction: Dog (🐶) sa chat ng user\n` +
        `🍎 Self Reaction: Shinigami Emojis (🍎📓💀✍️🖤) sa sariling chat\n` +
        `💬 Delay: 1 Message = 1 Reply (Exact 5-Second Delay)\n` +
        `📌 GC Name Lock: ${currentThread.lockedTitle ? currentThread.lockedTitle : "Disabled"}\n` +
        `👋 Welcome New Humans: ${currentThread.welcome ? "ON" : "OFF"}\n` +
        `🎯 Target System: ${currentThread.targetUser ? "Active" : "None (Lahat ng tao)"}\n` +
        `⏳ Duration: 24 Hours Death Note Realm`,
        threadID,
        messageID
      );
    }

    if (sub === "target") {
      const mentionIDs = mentions ? Object.keys(mentions) : [];
      if (mentionIDs.length === 0 && !args[1]) {
        return api.sendMessage("🍎 *Ryuk Bot:* Mag-tag ka ng idadamay natin sa notebook. Example: /ryuk target @mention", threadID, messageID);
      }

      const targetID = mentionIDs[0] || args[1];
      currentThread.targetUser = targetID;
      saveData(data);

      return api.sendMessage(`🍎 *Ryuk Bot:* Si <@${targetID}> na lang ang kakausapin at aasarin ko gamit ang Death Note.`, threadID, messageID, {
        mentions: [{ tag: `<@${targetID}>`, id: targetID }]
      });
    }

    if (sub === "untarget") {
      currentThread.targetUser = null;
      saveData(data);
      return api.sendMessage("🍎 *Ryuk Bot:* Inalis ko na ang target. Lahat kayo nakasulat uli sa mga pagpipilian.", threadID, messageID);
    }

    if (sub === "off") {
      if (isThreadActive(threadID)) {
        currentThread.expires = 0;
        currentThread.targetUser = null;
        saveData(data);
        return api.sendMessage("🍎 *Ryuk Bot:* Isinara ko na ang Death Note Mode sa GC na 'to.", threadID, messageID);
      }
      return api.sendMessage("🍎 *Ryuk Bot:* Naka-close na ang bot rito.", threadID, messageID);
    }

    if (sub === "status") {
      const left = getRemaining(threadID);
      if (left <= 0) return api.sendMessage("🍎 *Ryuk Bot:* Naka-OFF ang bot sa GC na 'to.", threadID, messageID);

      const hours = Math.floor(left / (1000 * 60 * 60));
      const mins = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
      return api.sendMessage(
        `🍎 RYUK BOT STATUS:\n` +
        `• Time left: ${hours}h ${mins}m\n` +
        `• Exclusive Admins: ${ADMIN_IDS.join(", ")}\n` +
        `• Persona: Ryuk Shinigami Mode\n` +
        `• Silent Mentions: Active (/silent)\n` +
        `• Reactions: 🐶 (User Chat) & 🍎📓💀✍️🖤 (Self Chat)\n` +
        `• Reply Delay: 5 Seconds (1:1 Ratio)\n` +
        `• Locked GC Name: ${currentThread.lockedTitle ? currentThread.lockedTitle : "Not Locked"}\n` +
        `• Target Nickname: ${currentThread.targetNick ? currentThread.targetNick : "None"}\n` +
        `• Auto Welcome: ${currentThread.welcome ? "ON" : "OFF"}\n` +
        `• Target User: ${currentThread.targetUser ? currentThread.targetUser : "Lahat sa GC"}`,
        threadID,
        messageID
      );
    }

    return api.sendMessage(
      `🍎 Ryuk Bot Commands (Admins: ${ADMIN_IDS.join(", ")}):\n` +
      `/ryuk on — Start 24h Ryuk Bot (1 Msg = 1 Reply, 5s Delay, /silent Mention, Self React)\n` +
      `/ryuk onsetgname <pangalan> — Manual na palitan at i-lock ang GC name\n` +
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
