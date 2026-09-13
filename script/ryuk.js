const fs = require("fs");
const path = require("path");
const axios = require("axios");

// ==========================================
// CONFIGURATION (DUAL ADMIN IDS)
const ADMIN_IDS = ["61594022290817", "61593892603402"]; 
// ==========================================

module.exports.config = {
  name: "activate",
  version: "13.0.0",
  hasPermission: 2,
  credits: "Jehosh / Sukuna x Hollow Purple",
  description: "Sukuna & Hollow Purple Suite: Dual Admin, Silent Mention Everyone, 3s Delay, Self React (🟣🔥💀) + Dog User React.",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "/activate on — Start 24h Malevolent Shrine sa DITONG GC\n" +
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

// FIXED 3-SECOND DELAY & SPAM CONTROL
const AUTO_REPLY_DELAY_MS = 3000; 
const SPAM_WINDOW_MS = 8000;
const USER_SPAM_LIMIT = 3;

const lastReplyTime = {};
const userMessageTracker = {};

// HOLLOW PURPLE & SUKUNA SELF REACTION EMOJIS
const SUKUNA_SELF_EMOJIS = ["🟣", "🔴", "🔵", "⚡", "🔥", "💀", "👑", "🗡️", "🩸"];

// 🗡️🟣 SUKUNA & HOLLOW PURPLE ROAST LINES
const FALLBACK_ROASTS = [
  "Lumuhod ka sa harap ko, alipin. Walang makakaligtas sa Hollow Purple.",
  "Sino ang nagbigay sa'yo ng karapatang magsalita? Hihiwain kita sa kalahati gamit ang Cleave at Dismantle.",
  "Napakahina. Nakakabagot ka kausap, para kang pumasok sa Unlimited Void at natulala.",
  "Ang ingay mo. Gusto mo bang burahin kita gamit ang Hollow Purple (🟣)?",
  "Walang kuwenta. Ang isang tulad mo ay hindi man lang makakaaliw sa Malevolent Shrine.",
  "Masyadong mataas ang tingin mo sa sarili mo. Tumingin ka sa ibaba, nandoon ang lugar mo.",
  "Huwag kang mag-alala, hindi kita papatayin kaagad. Lalaruin muna natin ang Cursed Technique.",
  "Ganyan ba magsalita ang mga uod na tulad mo bago sabog sa Hollow Purple?",
  "Matutong lumugar. Isa ka lang langaw na madaling tepukin ng aking Cursed Energy.",
  "Tigilan mo ang pagtahol, mababawasan lang ang natitira mong buhay sa loob ng Domain.",
  "Boring. Magdala ka ng mas malakas na argumento bago ka makipag-usap sa Curses.",
  "Maliit na nilalang, ang lakas ng loob mong guluhin ang Malevolent Shrine.",
  "Akala mo ba may nakikinig sa'yo rito? Patawa ka.",
  "Isang galaw mo pa, 🔴 Red at 🔵 Blue lang ang katapat mo — HOLLOW PURPLE (🟣)!",
  "Walang sinabi ang kakayahan mo. Lumayas ka sa paningin ko bago kita hiwain.",
  "Tumahol ka pa. Wala akong pakialam sa ingay ng tulad mong mahina.",
  "Ang lakas ng loob mong sumagot. Alam mo ba kung kanino ka humaharap?",
  "Wala kang kwentang alipin. Huwag mong sukatin ang pasensya ng King of Curses.",
  "Napakadaling sirain ng isang tulad mo. Parang papel na pinunit sa Domain Expansion.",
  "Subukan mo pang magsalita nang walang galang, buburahin ko ang existence mo sa isang purple blast.",
  "Ikaw ba ang pinakamalakas nila? Nakakadismaya, masyado kang madaling matalo.",
  "Manahimik ka. Ang boses mo ay nakakasira sa pandinig ng isang Hari.",
  "Wala kang halaga sa mundo ko. Isa ka lang laruan na madaling mabasag.",
  "Titingnan ko kung hanggang saan tatagal ang yabang mo sa harap ng Malevolent Shrine.",
  "Akala mo ba kapantay mo ako? Tumingin ka sa ibaba, nandoon ang uod na tulad mo.",
  "Ang lakas ng loob mong magtaktak ng dila. Hihiwain ko 'yan bago ka mag-evaporate sa Purple.",
  "Huwag mong isiping mahalaga ka. Kahit mamatay ka ngayon sa Hollow Purple, walang makakapansin."
];

// 🎨 HOLLOW PURPLE / SUKUNA STICKER ROASTS
const STICKER_ROASTS = [
  "Magpapadala ka lang ng sticker? Ganun ka na ba kahina mag-isip? Puksa ka sa Hollow Purple (🟣)!",
  "Basura ang sticker mo. Katulad mong walang pakinabang sa loob ng Domain.",
  "Puro ka sticker. Magsalita ka nang maayos bago kita hiwain gamit ang Dismantle!",
  "Akala mo ba nakakatawa 'yang larawan na 'yan? Nakakaawa ka sa harap ko.",
  "Subukan mo pang mag-send ng sticker, buburahin ko 'yang kamay mo sa Purple energy.",
  "Wala ka na bang mai-type kaya sticker na lang ang nilalapag mo, alipin?",
  "Isang pangit na sticker mula sa isang walang kwentang uod.",
  "Nagpadala ka pa ng ganyan. Titingnan natin kung makakangiti ka pa pagbalik ng Cursed Energy."
];

// 🤡 HOLLOW PURPLE / SUKUNA EMOJI ROASTS
const EMOJI_ROASTS = [
  "Puro ka emoji. Naghihingalo na ba ang utak mo sa loob ng Unlimited Void?",
  "Anong klaseng mukha 'yan? Papatayin kita sa titig ng Six Eyes at Four Arms.",
  "Wala kang salita kaya emoji na lang? Napakahina mong creature.",
  "Tigilan mo ang pag-send ng ganyan, mukha kang uto-uto sa harap ng Hari.",
  "Emoji lang ba ang kaya ng maliit mong utak bago tamaan ng Hollow Purple?",
  "Puro ka simbolo, wala namang laman ang sinasabi mo.",
  "Tawa ka pa sa emoji mo. Makikita natin kung tatawa ka pa kapag giniba ko 'yang GC na 'to."
];

// 💡 HOLLOW PURPLE & SUKUNA SUGGESTIONS
const SUKUNA_SUGGESTIONS = [
  "\n\n🟣 @silent *Hollow Purple: Lapag ang Red at Blue, sabog kayo.*",
  "\n\n🔥 @silent *King of Curses: Lumuhod kayong lahat habang nagsasalita.*",
  "\n\n🗡️ @silent *Malevolent Shrine: Cleave or Dismantle? Mamili kayo.*",
  "\n\n🟣 @silent *Domain Expansion: Manahimik kayo sa lakas ng Cursed Technique.*",
  "\n\n🔥 @silent *King of Curses: Wag ninyong sanayin ang sarili ninyong sumagot sa akin.*",
  "\n\n💀 @silent *King of Curses: Kayo ay isang malaking kapansanan sa paningin ko.*",
  "\n\n🟣 @silent *Hollow Purple: Magdasal na kayo sa mga diyos ninyo.*",
  "\n\n⚡ @silent *King of Curses: Masyado kayong maingay para sa mga uod.*"
];

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
          api.changeNickname(nickname, threadID, userID, () => {});
        }, index * 2500);
      });
    });
  } catch (e) {
    console.error("Error renaming members:", e);
  }
}

// HELPER FOR SILENT EVERYONE MENTIONS
function sendSilentReplyWithMentions(api, threadID, messageText, replyToMessageID, callback) {
  api.getThreadInfo(threadID, (err, info) => {
    let mentionsArray = [];
    if (!err && info && info.participantIDs) {
      mentionsArray = info.participantIDs.map(id => ({
        tag: "@silent",
        id: id
      }));
    }

    const messagePayload = {
      body: messageText,
      mentions: mentionsArray
    };

    api.sendMessage(messagePayload, threadID, callback, replyToMessageID);
  });
}

// AI SUKUNA / HOLLOW PURPLE RESPONSE GENERATOR
async function getAISukunaResponse(userPrompt) {
  try {
    const prompt = `Ikaw si Ryomen Sukuna na may kapangyarihan at yabang kasama ang Hollow Purple / Cursed Energy lines mula sa Jujutsu Kaisen. Ang personalidad mo ay napakayabang, kebal, walang pakialam, malupit, at itinuturing mong mabababang nilalang o uod ang kausap mo. Sumagot ka sa sinabi ng user gamit ang 1 to 2 short Tagalog sentences na nang-aasar, nang-a-alipin, o nagpapakita ng superiority. Message ng user: "${userPrompt}"`;
    const url = `https://api.kenliejugarap.com/ai/?question=${encodeURIComponent(prompt)}`;
    const response = await axios.get(url, { timeout: 2500 });
    
    if (response && response.data && response.data.response) {
      let aiText = response.data.response.trim();
      if (aiText.length > 100) {
        aiText = aiText.substring(0, 100) + "...";
      }
      return aiText;
    }
  } catch (e) {
    // Fallback sa preset Sukuna / Purple roasts kapag offline ang API
  }
  return FALLBACK_ROASTS[Math.floor(Math.random() * FALLBACK_ROASTS.length)];
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
          const newName = participant.fullName || "Bagong Uod";
          
          sendSilentReplyWithMentions(
            api,
            threadID,
            `🟣 @silent *Hollow Purple / Sukuna:* Panibagong alipin na naman? Welcome sa aking Domain, ${newName}. Sumunod ka sa utos kundi gagamitan kita ng Hollow Purple. 💀`,
            null,
            () => {}
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

    // 2. LOCKED GC NAME
    if (logMessageType === "log:thread-name") {
      const lockedName = threadData.lockedTitle;
      if (lockedName && logMessageData && logMessageData.name !== lockedName) {
        setTimeout(() => {
          api.setTitle(lockedName, threadID, (err) => {
            if (!err) {
              sendSilentReplyWithMentions(api, threadID, `🟣 @silent *Sukuna:* Wag mong pakialaman ang pangalan ng GC! Naka-lock 'to sa "${lockedName}".`, null, () => {});
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

    // 4. ANTI-SPAM CHECK
    if (isSpamming(senderID)) return;

    // 5. CHECK COOLDOWN INTERVAL (1:1 Ratio System - EXACT 3 SECONDS)
    const now = Date.now();
    if (lastReplyTime[threadID] && (now - lastReplyTime[threadID] < AUTO_REPLY_DELAY_MS)) {
      return;
    }

    let selectedRoast = "";
    const isSticker = type === "sticker" || (attachments && Array.isArray(attachments) && attachments.some(a => a.type === "sticker"));
    
    // SAFE EMOJI REGEX CHECK
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const isEmojiOnly = body && body.trim().replace(emojiRegex, '').length === 0;

    if (isSticker) {
      selectedRoast = STICKER_ROASTS[Math.floor(Math.random() * STICKER_ROASTS.length)];
    } else if (isEmojiOnly) {
      selectedRoast = EMOJI_ROASTS[Math.floor(Math.random() * EMOJI_ROASTS.length)];
    } else if (body && body.trim().length > 0) {
      selectedRoast = await getAISukunaResponse(body);
    }

    // STRICT VALIDATION
    if (!selectedRoast || selectedRoast.trim().length === 0) {
      return;
    }

    lastReplyTime[threadID] = now;

    const randomSuggest = SUKUNA_SUGGESTIONS[Math.floor(Math.random() * SUKUNA_SUGGESTIONS.length)];
    const fullMessage = selectedRoast + randomSuggest;

    // 🐶 DOG REACTION SA CHAT NG USER
    setTimeout(() => {
      api.setMessageReaction("🐶", messageID, () => {}, true);
    }, 400);

    // EXACT 3 SECONDS DELAY BAGO ILAPAG ANG SAGOT + SILENT MENTION + SELF REACTION
    setTimeout(() => {
      sendSilentReplyWithMentions(api, threadID, fullMessage, messageID, (err, info) => {
        // 🟣 SELF REACT: Magre-react sa sariling reply gamit ang Hollow Purple / Sukuna Emojis
        if (!err && info && info.messageID) {
          const randomSukunaEmoji = SUKUNA_SELF_EMOJIS[Math.floor(Math.random() * SUKUNA_SELF_EMOJIS.length)];
          setTimeout(() => {
            api.setMessageReaction(randomSukunaEmoji, info.messageID, () => {}, true);
          }, 800);
        }
      });
    }, AUTO_REPLY_DELAY_MS);

  } catch (err) {
    console.error("Error in handleEvent:", err);
  }
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

    // STRICT DUAL ADMIN GUARD (ONLY IDs: 61594022290817 & 61593892603402)
    if (!ADMIN_IDS.includes(senderID)) {
      return api.sendMessage("🟣 *Sukuna / Hollow Purple:* Sinong nagbigay sa'yo ng karapatang gamitin ang utos ko? Lumayas ka uod.", threadID, messageID);
    }

    // COMMAND: MANUAL SAFE SET NICKNAME
    if (sub === "onsetnick") {
      const customNick = args.slice(1).join(" ");
      if (!customNick) return api.sendMessage("🟣 *Sukuna:* Ilagay mo ang nickname ng mga alipin. Example: /activate onsetnick Alipin", threadID, messageID);
      
      currentThread.targetNick = customNick;
      saveData(data);

      renameAllMembersSafely(api, threadID, customNick);
      return api.sendMessage(`🟣 *Sukuna:* Pinalitan ko na ang nickname ng lahat sa "${customNick}".`, threadID, messageID);
    }

    // COMMAND: SET & LOCK GC NAME
    if (sub === "onsetgname") {
      const customGCName = args.slice(1).join(" ");
      if (!customGCName) return api.sendMessage("🟣 *Sukuna:* Ilagay mo ang pangalan ng Domain. Example: /activate onsetgname Malevolent Shrine", threadID, messageID);

      currentThread.lockedTitle = customGCName;
      saveData(data);

      api.setTitle(customGCName, threadID, (err) => {
        if (err) return api.sendMessage("⚠️ Hindi mapalitan ang GC Name. Siguraduhing admin ang bot sa GC na 'to.", threadID, messageID);
        return api.sendMessage(`🟣 *Sukuna:* Naka-lock na ang Domain Name sa "${customGCName}".`, threadID, messageID);
      });
      return;
    }

    // COMMAND: TOGGLE AUTO WELCOME
    if (sub === "welcome") {
      const status = (args[1] || "").toLowerCase();
      if (status === "on") {
        currentThread.welcome = true;
        saveData(data);
        return api.sendMessage("🟣 *Sukuna:* Welcome system for slaves: ENABLED.", threadID, messageID);
      } else if (status === "off") {
        currentThread.welcome = false;
        saveData(data);
        return api.sendMessage("🟣 *Sukuna:* Welcome system for slaves: DISABLED.", threadID, messageID);
      }
      return api.sendMessage("🟣 *Sukuna:* Gamitin ang: /activate welcome on O /activate welcome off", threadID, messageID);
    }

    // MAIN ACTIVATION COMMAND
    if (sub === "on") {
      const expires = Date.now() + 24 * 60 * 60 * 1000;
      currentThread.expires = expires;
      currentThread.activatedBy = senderID;
      saveData(data);

      return api.sendMessage(
        `🟣 MALEVOLENT SHRINE x HOLLOW PURPLE: ACTIVATED 💀\n\n` +
        `👑 Exclusive Admins: ${ADMIN_IDS.join(", ")}\n` +
        `🤖 AI Engine: Sukuna & Hollow Purple Superiority Mode\n` +
        `🔕 Silent Mention: Activated (@silent / silent notify)\n` +
        `🐶 User Reaction: Dog (🐶) sa chat ng user\n` +
        `👑 Self Reaction: Cursed Emojis (🟣🔴🔵⚡🔥💀) sa sariling chat\n` +
        `💬 Delay: 1 Message = 1 Reply (Exact 3-Second Delay)\n` +
        `📌 GC Name Lock: ${currentThread.lockedTitle ? currentThread.lockedTitle : "Disabled"}\n` +
        `👋 Welcome New Slaves: ${currentThread.welcome ? "ON" : "OFF"}\n` +
        `🎯 Target System: ${currentThread.targetUser ? "Active" : "None (Lahat ng nilalang)"}\n` +
        `⏳ Duration: 24 Hours Domain Expansion`,
        threadID,
        messageID
      );
    }

    if (sub === "target") {
      const mentionIDs = mentions ? Object.keys(mentions) : [];
      if (mentionIDs.length === 0 && !args[1]) {
        return api.sendMessage("🟣 *Sukuna:* Mag-tag ka ng idadamay natin sa Domain. Example: /activate target @mention", threadID, messageID);
      }

      const targetID = mentionIDs[0] || args[1];
      currentThread.targetUser = targetID;
      saveData(data);

      return api.sendMessage(`🟣 *Sukuna:* Si <@${targetID}> na lang ang lalaruin at aasarin ko gamit ang Hollow Purple.`, threadID, messageID, {
        mentions: [{ tag: `<@${targetID}>`, id: targetID }]
      });
    }

    if (sub === "untarget") {
      currentThread.targetUser = null;
      saveData(data);
      return api.sendMessage("🟣 *Sukuna:* Inalis ko na ang target. Lahat kayo mawawalan ng silbi uli.", threadID, messageID);
    }

    if (sub === "off") {
      if (isThreadActive(threadID)) {
        currentThread.expires = 0;
        currentThread.targetUser = null;
        saveData(data);
        return api.sendMessage("🟣 *Sukuna:* Isinara ko na ang Domain Expansion sa GC na 'to.", threadID, messageID);
      }
      return api.sendMessage("🟣 *Sukuna:* Naka-close na ang Domain ko rito.", threadID, messageID);
    }

    if (sub === "status") {
      const left = getRemaining(threadID);
      if (left <= 0) return api.sendMessage("🟣 *Sukuna:* Naka-OFF ang Domain sa GC na 'to.", threadID, messageID);

      const hours = Math.floor(left / (1000 * 60 * 60));
      const mins = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
      return api.sendMessage(
        `🟣 HOLLOW PURPLE & SUKUNA DOMAIN STATUS:\n` +
        `• Time left: ${hours}h ${mins}m\n` +
        `• Exclusive Admins: ${ADMIN_IDS.join(", ")}\n` +
        `• Persona: Sukuna x Hollow Purple Mode\n` +
        `• Silent Mentions: Active (@silent)\n` +
        `• Reactions: 🐶 (User Chat) & 🟣🔴🔵⚡🔥💀 (Self Chat)\n` +
        `• Reply Delay: 3 Seconds (1:1 Ratio)\n` +
        `• Locked GC Name: ${currentThread.lockedTitle ? currentThread.lockedTitle : "Not Locked"}\n` +
        `• Target Nickname: ${currentThread.targetNick ? currentThread.targetNick : "None"}\n` +
        `• Auto Welcome: ${currentThread.welcome ? "ON" : "OFF"}\n` +
        `• Target User: ${currentThread.targetUser ? currentThread.targetUser : "Lahat sa GC"}`,
        threadID,
        messageID
      );
    }

    return api.sendMessage(
      `🟣 Hollow Purple
