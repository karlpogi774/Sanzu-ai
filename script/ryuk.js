const fs = require("fs");
const path = require("path");
const axios = require("axios");

// ==========================================
// CONFIGURATION
const ADMIN_ID = "61593892603402"; 
// ==========================================

module.exports.config = {
  name: "activate",
  version: "10.0.0",
  hasPermission: 2,
  credits: "Jehosh / Sukuna",
  description: "Sukuna Malevolent Shrine: 5s Delay, Self Emoji React, Dog User React, Expanded Preset Lines & Error-Free Code.",
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

// DELAY CONFIGURATION (5 SECONDS) & SPAM CONTROL
const AUTO_REPLY_DELAY_MS = 5000; 
const SPAM_WINDOW_MS = 10000;
const USER_SPAM_LIMIT = 3;

const lastReplyTime = {};
const userMessageTracker = {};

// SUKUNA SELF REACTION EMOJIS
const SUKUNA_SELF_EMOJIS = ["🔥", "💀", "👑", "🗡️", "🩸", "⚡"];

// 🗡️ MAS PINADAMING SUKUNA FALLBACK ROAST LINES
const FALLBACK_ROASTS = [
  "Lumuhod ka sa harap ko, alipin.",
  "Sino ang nagbigay sa'yo ng karapatang magsalita sa harap ko?",
  "Napakahina. Nakakabagot ka kausap.",
  "Ang ingay mo. Gusto mo bang hiwain kita sa kalahati?",
  "Walang kuwenta. Ang isang tulad mo ay hindi man lang makakaaliw sa akin.",
  "Masyadong mataas ang tingin mo sa sarili mo. Mahiya ka naman.",
  "Huwag kang mag-alala, hindi kita papatayin kaagad. Lalaruin muna kita.",
  "Ganyan ba magsalita ang mga uod na tulad mo?",
  "Matutong lumugar. Isa ka lang langaw na madaling tepukin.",
  "Tigilan mo ang pagtahol, mababawasan lang ang natitira mong buhay.",
  "Boring. Magdala ka ng mas malakas na argumento bago ka makipag-usap sa akin.",
  "Maliit na nilalang, ang lakas ng loob mong guluhin ang katahimikan ko.",
  "Akala mo ba may nakikinig sa'yo rito? Patawa ka.",
  "Isang galaw mo pa, gigiba ko 'yang kinaroroonan mo.",
  "Walang sinabi ang kakayahan mo. Lumayas ka sa paningin ko.",
  "Tumahol ka pa. Wala akong pakialam sa ingay ng tulad mo.",
  "Ang lakas ng loob mong sumagot. Alam mo ba kung kanino ka humaharap?",
  "Wala kang kwentang alipin. Huwag mong sukatin ang pasensya ko.",
  "Napakadaling sirain ng isang tulad mo.",
  "Subukan mo pang magsalita nang walang galang, buburahin ko ang existence mo.",
  "Ikaw ba ang pinakamalakas nila? Nakakadismaya.",
  "Manahimik ka. Ang boses mo ay nakakasira sa pandinig ko.",
  "Wala kang halaga sa mundo ko. Isa ka lang laruan na madaling mabasag.",
  "Titingnan ko kung hanggang saan tatagal ang yabang mo sa harap ng Malevolent Shrine.",
  "Akala mo ba kapantay mo ako? Tumingin ka sa ibaba, nandoon ang lugar mo.",
  "Ang lakas ng loob mong magtaktak ng dila. Hihiwain ko 'yan.",
  "Huwag mong isiping mahalaga ka. Kahit mamatay ka ngayon, walang makakapansin.",
  "Ano pa ang hinihintay mo? Subukan mo akong libangin.",
  "Walang sino man ang pwedeng mag-utos sa King of Curses.",
  "Magdusa ka sa sarili mong kahinaan."
];

// 🎨 MAS PINADAMING SUKUNA STICKER ROASTS
const STICKER_ROASTS = [
  "Magpapadala ka lang ng sticker? Ganun ka na ba kahina mag-isip?",
  "Basura ang sticker mo. Katulad mong walang pakinabang.",
  "Puro ka sticker. Magsalita ka nang maayos bago kita hiwain!",
  "Akala mo ba nakakatawa 'yang larawan na 'yan? Nakakaawa ka.",
  "Subukan mo pang mag-send ng sticker, hihiwain ko 'yang kamay mo.",
  "Wala ka na bang mai-type kaya sticker na lang ang nilalapag mo?",
  "Isang pangit na sticker mula sa isang walang kwentang nilalang.",
  "Nagpadala ka pa ng ganyan. Titingnan natin kung makakangiti ka pa mamaya.",
  "Akala mo ba maaaliw ako sa basurang sticker na 'yan?"
];

// 🤡 MAS PINADAMING SUKUNA EMOJI ROASTS
const EMOJI_ROASTS = [
  "Puro ka emoji. Naghihingalo na ba ang utak mo?",
  "Anong klaseng mukha 'yan? Papatayin kita sa titig.",
  "Wala kang salita kaya emoji na lang? Napakahina.",
  "Tigilan mo ang pag-send ng ganyan, mukha kang uto-uto.",
  "Emoji lang ba ang kaya ng maliit mong utak?",
  "Puro ka simbolo, wala namang laman ang sinasabi mo.",
  "Tawa ka pa sa emoji mo. Makikita natin kung tatawa ka pa kapag giniba ko 'yang GC.",
  "Walang kwenta ang mga simbolo mo. Magsalita ka tulad ng isang totoong nilalang."
];

// 💡 MAS PINADAMING SUKUNA DOMAIN SUGGESTIONS
const SUKUNA_SUGGESTIONS = [
  "\n\n🔥 *King of Curses: Lumuhod ka habang nagsasalita.*",
  "\n\n🔥 *King of Curses: Cleave or Dismantle? Mamili ka.*",
  "\n\n🔥 *King of Curses: Tumahol ka pa para maaliw ako.*",
  "\n\n🔥 *King of Curses: Manahimik ka bago ko buksan ang Domain Expansion.*",
  "\n\n🔥 *King of Curses: Wag mong sanayin ang sarili mong sumagot sa akin.*",
  "\n\n🔥 *King of Curses: Isa kang malaking kapansanan sa paningin ko.*",
  "\n\n🔥 *King of Curses: Magdasal ka na sa mga diyos mo.*",
  "\n\n🔥 *King of Curses: Masyado kang maingay para sa isang uod.*",
  "\n\n🔥 *King of Curses: Subukan mo pa ako, titingnan natin kung saan ka pupulutin.*"
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
  api.getThreadInfo(threadID, (err, info) => {
    if (err || !info || !info.participantIDs) return;
    info.participantIDs.forEach((userID, index) => {
      setTimeout(() => {
        api.changeNickname(nickname, threadID, userID, () => {});
      }, index * 2500);
    });
  });
}

// AI SUKUNA RESPONSE GENERATOR
async function getAISukunaResponse(userPrompt) {
  try {
    const prompt = `Ikaw si Ryomen Sukuna mula sa Jujutsu Kaisen (King of Curses). Ang personalidad mo ay napakayabang, kebal, walang pakialam, malupit, at itinuturing mong mabababang nilalang o uod ang kausap mo. Sumagot ka sa sinabi ng user gamit ang 1 to 2 short Tagalog sentences na nang-aasar, nang-a-alipin, o nagpapakita ng superiority. Message ng user: "${userPrompt}"`;
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
    // Fallback kapag offline ang API
  }
  return FALLBACK_ROASTS[Math.floor(Math.random() * FALLBACK_ROASTS.length)];
}

// ===== EVENT HANDLER =====
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, body, messageID, logMessageType, logMessageData, type, attachments } = event;
  const botID = api.getCurrentUserID();

  const data = loadData();
  const threadData = data.threads ? data.threads[threadID] : null;

  // 1. AUTO WELCOME NEW MEMBERS (SUKUNA STYLE)
  if (logMessageType === "log:subscribe") {
    const addedParticipants = logMessageData ? logMessageData.addedParticipants || [] : [];
    if (threadData && threadData.welcome) {
      addedParticipants.forEach((participant) => {
        const newUserID = participant.userFbId;
        const newName = participant.fullName || "Bagong Uod";
        
        api.sendMessage(
          `🔥 *Sukuna:* Panibagong alipin na naman? Welcome sa aking kaharian, ${newName}. Sumunod ka sa utos kundi hihiwain kita. 💀`,
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

  // 2. LOCKED GC NAME
  if (logMessageType === "log:thread-name") {
    const lockedName = threadData.lockedTitle;
    if (lockedName && logMessageData && logMessageData.name !== lockedName) {
      setTimeout(() => {
        api.setTitle(lockedName, threadID, (err) => {
          if (!err) {
            api.sendMessage(`🔥 *Sukuna:* Wag mong pakialaman ang pangalan ng GC! Naka-lock 'to sa "${lockedName}".`, threadID);
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

  // 5. CHECK COOLDOWN INTERVAL (1:1 Ratio System)
  const now = Date.now();
  if (lastReplyTime[threadID] && (now - lastReplyTime[threadID] < AUTO_REPLY_DELAY_MS)) {
    return;
  }

  let selectedRoast = "";
  const isSticker = type === "sticker" || (attachments && attachments.some(a => a.type === "sticker"));
  
  // FIXED EMOJI CHECK REGEX
  const isEmojiOnly = body && /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+$/u.test(body.trim());

  if (isSticker) {
    selectedRoast = STICKER_ROASTS[Math.floor(Math.random() * STICKER_ROASTS.length)];
  } else if (isEmojiOnly) {
    selectedRoast = EMOJI_ROASTS[Math.floor(Math.random() * EMOJI_ROASTS.length)];
  } else if (body && body.trim().length > 0) {
    selectedRoast = await getAISukunaResponse(body);
  }

  // STRICT VALIDATION: KAPAG WALANG CONTENT, WAG MAG-REPLY O MAG-REACT
  if (!selectedRoast || selectedRoast.trim().length === 0) {
    return;
  }

  lastReplyTime[threadID] = now;

  const randomSuggest = SUKUNA_SUGGESTIONS[Math.floor(Math.random() * SUKUNA_SUGGESTIONS.length)];
  const fullMessage = selectedRoast + randomSuggest;

  // 🐶 DOG REACTION SA CHAT NG USER
  setTimeout(() => {
    api.setMessageReaction("🐶", messageID, () => {}, true);
  }, 500);

  // EXACT 5 SECONDS DELAY BAGO ILAPAG ANG SAGOT + SELF REACTION
  setTimeout(() => {
    api.sendMessage(fullMessage, threadID, (err, info) => {
      // 👑 SELF REACT: Magre-react si Sukuna sa sarili niyang reply gamit ang Sukuna Emojis
      if (!err && info && info.messageID) {
        const randomSukunaEmoji = SUKUNA_SELF_EMOJIS[Math.floor(Math.random() * SUKUNA_SELF_EMOJIS.length)];
        setTimeout(() => {
          api.setMessageReaction(randomSukunaEmoji, info.messageID, () => {}, true);
        }, 600);
      }
    }, messageID);
  }, AUTO_REPLY_DELAY_MS);
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
      lockedTitle: null, 
      targetNick: null,
      welcome: true 
    };
  }

  const currentThread = data.threads[threadID];

  // STRICT ADMIN GUARD
  if (senderID !== ADMIN_ID) {
    return api.sendMessage("🔥 *Sukuna:* Sinong nagbigay sa'yo ng karapatang gamitin ang utos ko? Lumayas ka.", threadID, messageID);
  }

  // COMMAND: MANUAL SAFE SET NICKNAME
  if (sub === "onsetnick") {
    const customNick = args.slice(1).join(" ");
    if (!customNick) return api.sendMessage("🔥 *Sukuna:* Ilagay mo ang nickname ng mga alipin. Example: /activate onsetnick Alipin", threadID, messageID);
    
    currentThread.targetNick = customNick;
    saveData(data);

    renameAllMembersSafely(api, threadID, customNick);
    return api.sendMessage(`🔥 *Sukuna:* Pinalitan ko na ang nickname ng lahat sa "${customNick}".`, threadID, messageID);
  }

  // COMMAND: SET & LOCK GC NAME
  if (sub === "onsetgname") {
    const customGCName = args.slice(1).join(" ");
    if (!customGCName) return api.sendMessage("🔥 *Sukuna:* Ilagay mo ang pangalan ng Domain. Example: /activate onsetgname Malevolent Shrine", threadID, messageID);

    currentThread.lockedTitle = customGCName;
    saveData(data);

    api.setTitle(customGCName, threadID, (err) => {
      if (err) return api.sendMessage("⚠️ Hindi mapalitan ang GC Name. Siguraduhing admin ang bot sa GC na 'to.", threadID, messageID);
      return api.sendMessage(`🔥 *Sukuna:* Naka-lock na ang Domain Name sa "${customGCName}".`, threadID, messageID);
    });
    return;
  }

  // COMMAND: TOGGLE AUTO WELCOME
  if (sub === "welcome") {
    const status = (args[1] || "").toLowerCase();
    if (status === "on") {
      currentThread.welcome = true;
      saveData(data);
      return api.sendMessage("🔥 *Sukuna:* Welcome system for slaves: ENABLED.", threadID, messageID);
    } else if (status === "off") {
      currentThread.welcome = false;
      saveData(data);
      return api.sendMessage("🔥 *Sukuna:* Welcome system for slaves: DISABLED.", threadID, messageID);
    }
    return api.sendMessage("🔥 *Sukuna:* Gamitin ang: /activate welcome on O /activate welcome off", threadID, messageID);
  }

  // MAIN ACTIVATION COMMAND
  if (sub === "on") {
    const expires = Date.now() + 24 * 60 * 60 * 1000;
    currentThread.expires = expires;
    currentThread.activatedBy = senderID;
    saveData(data);

    return api.sendMessage(
      `🔥 MALEVOLENT SHRINE: ACTIVATED 💀\n\n` +
      `👑 King of Curses Admin: ${ADMIN_ID}\n` +
      `🤖 AI Engine: Sukuna Domain (Superiority & Roast Mode)\n` +
      `🐶 User Reaction: Dog (🐶) sa chat ng user\n` +
      `👑 Self Reaction: Sukuna Emojis (🔥💀👑🗡️🩸⚡) sa sariling chat\n` +
      `💬 Ratio & Delay: 1 Message = 1 Reply (Exact 5-Second Delay)\n` +
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
      return api.sendMessage("🔥 *Sukuna:* Mag-tag ka ng idadamay natin sa Domain. Example: /activate target @mention", threadID, messageID);
    }

    const targetID = mentionIDs[0] || args[1];
    currentThread.targetUser = targetID;
    saveData(data);

    return api.sendMessage(`🔥 *Sukuna:* Si <@${targetID}> na lang ang lalaruin at aasarin ko sa GC na 'to.`, threadID, messageID, {
      mentions: [{ tag: `<@${targetID}>`, id: targetID }]
    });
  }

  if (sub === "untarget") {
    currentThread.targetUser = null;
    saveData(data);
    return api.sendMessage("🔥 *Sukuna:* Inalis ko na ang target. Lahat kayo mawawalan ng silbi uli.", threadID, messageID);
  }

  if (sub === "off") {
    if (isThreadActive(threadID)) {
      currentThread.expires = 0;
      currentThread.targetUser = null;
      saveData(data);
      return api.sendMessage("🔥 *Sukuna:* Isinara ko na ang Domain Expansion sa GC na 'to.", threadID, messageID);
    }
    return api.sendMessage("🔥 *Sukuna:* Naka-close na ang Domain ko rito.", threadID, messageID);
  }

  if (sub === "status") {
    const left = getRemaining(threadID);
    if (left <= 0) return api.sendMessage("🔥 *Sukuna:* Naka-OFF ang Domain sa GC na 'to.", threadID, messageID);

    const hours = Math.floor(left / (1000 * 60 * 60));
    const mins = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
    return api.sendMessage(
      `🔥 SUKUNA DOMAIN STATUS:\n` +
      `• Time left: ${hours}h ${mins}m\n` +
      `• Persona: Sukuna (King of Curses)\n` +
      `• Reactions: 🐶 (User Chat) & 🔥💀👑🗡️ (Self Chat)\n` +
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
    `🔥 Sukuna Commands (Admin Only):\n` +
    `/activate on — Start 24h Sukuna Domain (1 Msg = 1 Reply, 5s Delay, Self React)\n` +
    `/activate onsetgname <pangalan> — Manual na palitan at i-lock ang GC name\n` +
    `/activate onsetnick <nickname> — Safely change member nicknames\n` +
    `/activate welcome <on/off> — Toggle auto-welcome\n` +
    `/activate target @mention — Target specific user\n` +
    `/activate untarget — Clear target\n` +
    `/activate off — Close Domain sa GC na 'to\n` +
    `/activate status — Check status sa GC`,
    threadID,
    messageID
  );
};
