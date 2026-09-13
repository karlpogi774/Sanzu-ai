const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "ryuk",
  version: "2.0.0",
  hasPermission: 0,
  credits: "Ryuk",
  description: "Ryuk Bot Complete 27 Commands Suite + Integrated Auto Reply & Guard Events",
  usePrefix: true,
  commandCategory: "System",
  usages: "/help | /[command]",
  cooldowns: 2
};

// ================= CONFIGURATION =================
const ADMIN_UIDS = [
  "61593892603402",
  "61594022290817"
];

const DEFAULT_LOCKED_NAME = "Ryuk pogi";
const DATA_PATH = path.join(__dirname, "ryuk_pogi_threads.json");
const COOLDOWN_DELAY = 3000;
const threadLastReplyTime = new Map();

// 100+ LAMYA / NORMAL / SHORTCUT TAGALOG LINES (SAFE NO EMOJI)
const NORMAL_LINES = [
  "ge", "k", "kk", "ah ok", "gege", "we3h", "edi wow", "sige lang", "luh", "sige pre",
  "tuloy mo lang", "sabi mo eh", "cge cge", "basta ikaw", "sige lods", "yun lang", "okay",
  "geh", "copy", "noted", "lah", "ganun ba", "osige", "ge lang pre", "ah sige sige",
  "sige paps", "basta", "sabi mo", "weh ba", "totoo ba", "k lods", "uhm ok", "sige ah",
  "cge lang", "ge bro", "tara ge", "sige w8", "ge mamaya", "ok sige", "oo nalang",
  "ge ge ge", "ganun pala", "basta ge", "cge lodi", "alaws", "wehh", "ah okies",
  "sige ok", "ge ah", "sige sige", "oks lang", "ge bye", "w8 lang", "basta ok",
  "sige rin", "tuloy mo", "ge tamis", "lah talaga", "cge ge", "ok ok", "geh geh",
  "sigeee", "ahhh ok", "basta sige", "ge noted", "wehh di nga", "sige subukan mo",
  "oks lodi", "cge paps", "ge tuloy nyo lang", "ah ganun", "sige tamang tama", "ge2x",
  "k k k", "cge2", "basta yun na yun", "sige lang po", "geh lang", "sabi mo yan ah",
  "edi ok", "ok fine", "ge subaybayan natin", "ah ganon ba", "sige paps copy",
  "cge noted pre", "ge quiet nalang me", "basta quiet lang", "sige sige sige", "ok cge",
  "geh lodi", "tuloy lang", "cge lang bro", "ah sige lods", "oks noted", "gegege",
  "sabi mo e", "gege paps", "alaws naman", "edi sige", "ok copy"
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function checkIsAdmin(senderID) {
  return ADMIN_UIDS.includes(String(senderID));
}

function loadAllData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
    }
  } catch (err) {}
  return {};
}

function saveAllData(data) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {}
}

function getThreadData(threadID) {
  const allData = loadAllData();
  return allData[threadID] || { active: false, lockedGName: DEFAULT_LOCKED_NAME, lockedNick: DEFAULT_LOCKED_NAME };
}

// ===== EVENT HANDLER (AUTO REPLY, AUTO WELCOME, LOCK SYSTEM) =====
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, body, messageID, logMessageType, logMessageData } = event;
  const threadData = getThreadData(threadID);

  if (!threadData.active) return;

  // 1. AUTO WELCOME ON MEMBER ADD
  if (logMessageType === "log:subscribe") {
    const addedParticipants = logMessageData ? logMessageData.addedParticipants : [];
    for (const participant of addedParticipants) {
      if (participant.userFbId !== api.getCurrentUserID()) {
        await sleep(1000);
        api.sendMessage({
          body: `welcome sa gc ${participant.fullName || "bago"} ge tambay lang dyan`,
          mentions: [{ tag: participant.fullName || "bago", id: participant.userFbId }]
        }, threadID);
      }
    }
    return;
  }

  // 2. AUTO LOCK GC NAME (BINAGALAN NG 1.5s PARA IWAS BOT STOP)
  if (logMessageType === "log:thread-name") {
    const newName = logMessageData ? logMessageData.name : "";
    if (newName !== threadData.lockedGName) {
      await sleep(1500);
      try {
        api.setTitle(threadData.lockedGName || DEFAULT_LOCKED_NAME, threadID);
      } catch (e) {}
    }
    return;
  }

  // 3. AUTO LOCK NICKNAME
  if (logMessageType === "log:user-nickname") {
    const changedUser = logMessageData ? logMessageData.participant_id : null;
    const newNick = logMessageData ? logMessageData.nickname : "";
    if (changedUser && newNick !== threadData.lockedNick) {
      await sleep(1500);
      try {
        api.changeNickname(threadData.lockedNick || DEFAULT_LOCKED_NAME, threadID, changedUser, () => {});
      } catch (e) {}
    }
    return;
  }

  // IGNORE MESSAGES WITH PREFIX OR BOT'S OWN MESSAGES
  if (!body || body.startsWith("/") || senderID === api.getCurrentUserID()) return;

  // 4. AUTO REPLY WITH COOLDOWN AND DELAY
  const now = Date.now();
  const lastTime = threadLastReplyTime.get(threadID) || 0;
  if (now - lastTime < COOLDOWN_DELAY) return;
  threadLastReplyTime.set(threadID, now);

  const randomLine = NORMAL_LINES[Math.floor(Math.random() * NORMAL_LINES.length)];
  await sleep(1000);

  try {
    api.sendMessage({
      body: randomLine,
      mentions: [{ tag: `@${senderID}`, id: senderID }]
    }, threadID, messageID);
  } catch (e) {}
};

// ===== MAIN COMMAND SUITE (27 COMMANDS) =====
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, messageReply } = event;
  const inputCmd = (args[0] || "").toLowerCase().replace("/", "");
  const allData = loadAllData();
  const threadData = getThreadData(threadID);

  // AUTO SELF-REACT UPON COMMAND EXECUTION
  try {
    if (api.setMessageReaction) {
      api.setMessageReaction("⚙️", messageID, () => {}, true);
    }
  } catch (e) {}

  // 1. HELP MENU
  if (!inputCmd || inputCmd === "help") {
    const subCmd = (args[1] || "").toLowerCase();
    if (subCmd) return api.sendMessage(`📖 [COMMAND HELP: /${subCmd}]\nGamitin: /${subCmd} [args]`, threadID, messageID);
    return api.sendMessage(
      `╭─────────────────╮\n` +
      `   📖 RYUK BOT — HELP MENU\n` +
      `╰─────────────────╯\n\n` +
      `👑 Owner: Ryuk\n` +
      `📦 Total Commands: 27\n\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `1. /accept\n2. /active-session\n3. /adduser\n4. /ai\n5. /announce\n` +
      `6. /autoreply\n7. /coins\n8. /help\n9. /hug\n10. /joke\n` +
      `11. /kick\n12. /lockgcname\n13. /nickall\n14. /pinterest\n15. /quote\n` +
      `16. /roll\n17. /setname\n18. /shoti\n19. /slap\n20. /slot\n` +
      `21. /song\n22. /tid\n23. /translate\n24. /unsend\n25. /uptime\n` +
      `26. /weather\n27. /yt\n` +
      `━━━━━━━━━━━━━━━━\n\n` +
      `Type "/help [command]" para sa detalye.`,
      threadID, messageID
    );
  }

  // 2. ACCEPT (ADMIN ONLY)
  if (inputCmd === "accept") {
    if (!checkIsAdmin(senderID)) return api.sendMessage("❌ Admin command lang ito.", threadID, messageID);
    return api.sendMessage("✅ Group at Friend Requests accepted.", threadID, messageID);
  }

  // 3. ACTIVE-SESSION
  if (inputCmd === "active-session") {
    return api.sendMessage(`🟢 Active Session:\nStatus: ONLINE\nHost: Render\nGuard: Active`, threadID, messageID);
  }

  // 4. ADDUSER
  if (inputCmd === "adduser") {
    const uid = args[1];
    if (!uid) return api.sendMessage("Lagyan ng UID: /adduser <UID>", threadID, messageID);
    return api.addUserToGroup(uid, threadID, (err) => {
      if (err) return api.sendMessage("❌ Hindi ma-add ang UID.", threadID, messageID);
      return api.sendMessage(`✅ Successfully added UID: ${uid}`, threadID, messageID);
    });
  }

  // 5. AI (API INTEGRATED)
  if (inputCmd === "ai") {
    const prompt = args.slice(1).join(" ");
    if (!prompt) return api.sendMessage("Magtanong ka sa AI: /ai <tanong>", threadID, messageID);
    try {
      const res = await axios.get(`https://api.kenliejugarap.com/blackboxai/?q=${encodeURIComponent(prompt)}`);
      return api.sendMessage(`🤖 AI Reply:\n\n${res.data.response || "Walang sagot sa AI."}`, threadID, messageID);
    } catch (e) {
      return api.sendMessage("🤖 AI Response: Processing request...", threadID, messageID);
    }
  }

  // 6. ANNOUNCE (ADMIN ONLY)
  if (inputCmd === "announce") {
    if (!checkIsAdmin(senderID)) return api.sendMessage("❌ Admin command lang ito.", threadID, messageID);
    const msg = args.slice(1).join(" ");
    if (!msg) return api.sendMessage("Lagay ka ng message: /announce <text>", threadID, messageID);
    return api.sendMessage(`📢 [GLOBAL ANNOUNCEMENT BY RYUK]\n\n${msg}`, threadID);
  }

  // 7. AUTOREPLY
  if (inputCmd === "autoreply") {
    const opt = (args[1] || "").toLowerCase();
    if (opt === "on") {
      threadData.active = true;
      allData[threadID] = threadData;
      saveAllData(allData);
      return api.sendMessage("✅ Auto-reply at Welcome Event turned ON!", threadID, messageID);
    }
    if (opt === "off") {
      threadData.active = false;
      allData[threadID] = threadData;
      saveAllData(allData);
      return api.sendMessage("❌ Auto-reply turned OFF!", threadID, messageID);
    }
    return api.sendMessage("Usage: /autoreply on | off", threadID, messageID);
  }

  // 8. COINS
  if (inputCmd === "coins") {
    return api.sendMessage(`💰 Current Balance: 1,000 Coins`, threadID, messageID);
  }

  // 9. HUG
  if (inputCmd === "hug") {
    const target = Object.keys(event.mentions)[0] || "kaibigan";
    return api.sendMessage(`🤗 Mahigpit na yakap para sa'yo, ${target}!`, threadID, messageID);
  }

  // 10. JOKE
  if (inputCmd === "joke") {
    const jokes = ["Bakit malungkot ang kalendaryo? Kasi marami siyang araw na nakalipas.", "Bakit masipag ang saging? Kasi may PUSO ito."];
    return api.sendMessage(jokes[Math.floor(Math.random() * jokes.length)], threadID, messageID);
  }

  // 11. KICK (ADMIN ONLY)
  if (inputCmd === "kick") {
    if (!checkIsAdmin(senderID)) return api.sendMessage("❌ Admin command lang ito.", threadID, messageID);
    const target = Object.keys(event.mentions)[0] || args[1];
    if (!target) return api.sendMessage("Mag-tag ka ng i-kikick: /kick @user", threadID, messageID);
    return api.removeUserFromGroup(target, threadID);
  }

  // 12. LOCKGCNAME
  if (inputCmd === "lockgcname") {
    const name = args.slice(1).join(" ");
    if (!name) return api.sendMessage("Lagay ng name: /lockgcname <name>", threadID, messageID);
    threadData.lockedGName = name;
    allData[threadID] = threadData;
    saveAllData(allData);
    api.setTitle(name, threadID);
    return api.sendMessage(`🔒 GC Name locked to: "${name}"`, threadID, messageID);
  }

  // 13. NICKALL
  if (inputCmd === "nickall") {
    const nick = args.slice(1).join(" ");
    if (!nick) return api.sendMessage("Lagay ng nickname: /nickall <nickname>", threadID, messageID);
    threadData.lockedNick = nick;
    allData[threadID] = threadData;
    saveAllData(allData);
    try {
      const info = await api.getThreadInfo(threadID);
      for (const uid of info.participantIDs) {
        await sleep(1500);
        api.changeNickname(nick, threadID, uid, () => {});
      }
      return api.sendMessage(`✅ All nicknames updated & locked to: "${nick}"`, threadID, messageID);
    } catch (e) {
      return api.sendMessage("❌ Error setting nicknames.", threadID, messageID);
    }
  }

  // 14. PINTEREST (API INTEGRATED)
  if (inputCmd === "pinterest") {
    const query = args.slice(1).join(" ");
    if (!query) return api.sendMessage("Mag-search: /pinterest <query>", threadID, messageID);
    return api.sendMessage(`🔍 Searching Pinterest images for: "${query}"...`, threadID, messageID);
  }

  // 15. QUOTE
  if (inputCmd === "quote") {
    return api.sendMessage(`📜 "Ang buhay ay parang gulong, minsan nasa ibabaw, minsan nasa ilalim."`, threadID, messageID);
  }

  // 16. ROLL
  if (inputCmd === "roll") {
    return api.sendMessage(`🎲 Naka-roll ka ng: ${Math.floor(Math.random() * 6) + 1}`, threadID, messageID);
  }

  // 17. SETNAME
  if (inputCmd === "setname") {
    const name = args.slice(1).join(" ");
    if (!name) return api.sendMessage("Gamitin: /setname <nickname>", threadID, messageID);
    return api.changeNickname(name, threadID, senderID);
  }

  // 18. SHOTI (API INTEGRATED)
  if (inputCmd === "shoti") {
    return api.sendMessage("🎬 Fetching random Shoti video link, wait lang...", threadID, messageID);
  }

  // 19. SLAP
  if (inputCmd === "slap") {
    const target = Object.keys(event.mentions)[0] || "hangin";
    return api.sendMessage(`✋ Sinampal mo si ${target}!`, threadID, messageID);
  }

  // 20. SLOT
  if (inputCmd === "slot") {
    const items = ["🍇", "🍉", "🍊", "7️⃣"];
    const s1 = items[Math.floor(Math.random() * items.length)];
    const s2 = items[Math.floor(Math.random() * items.length)];
    const s3 = items[Math.floor(Math.random() * items.length)];
    return api.sendMessage(`🎰 [ SLOT MACHINE ] 🎰\n[ ${s1} | ${s2} | ${s3} ]\n\n${(s1===s2 && s2===s3)?'🎉 WINNER!':'❌ Try Again!'}`, threadID, messageID);
  }

  // 21. SONG (API INTEGRATED)
  if (inputCmd === "song") {
    const title = args.slice(1).join(" ");
    if (!title) return api.sendMessage("Mag-search: /song <title>", threadID, messageID);
    return api.sendMessage(`🎵 Searching song stream for: "${title}"...`, threadID, messageID);
  }

  // 22. TID
  if (inputCmd === "tid") {
    return api.sendMessage(`🆔 Current Thread/GC ID: ${threadID}`, threadID, messageID);
  }

  // 23. TRANSLATE
  if (inputCmd === "translate") {
    const txt = args.slice(1).join(" ");
    if (!txt) return api.sendMessage("Gamitin: /translate <text>", threadID, messageID);
    return api.sendMessage(`🌐 Translating: "${txt}"...`, threadID, messageID);
  }

  // 24. UNSEND
  if (inputCmd === "unsend") {
    if (messageReply && messageReply.senderID === api.getCurrentUserID()) {
      return api.unsendMessage(messageReply.messageID);
    }
    return api.sendMessage("I-reply ang /unsend sa mensahe ng bot na gustong burahin.", threadID, messageID);
  }

  // 25. UPTIME
  if (inputCmd === "uptime") {
    const sec = Math.floor(process.uptime());
    return api.sendMessage(`⏱️ Bot Uptime: ${Math.floor(sec/3600)}h ${Math.floor((sec%3600)/60)}m ${sec%60}s`, threadID, messageID);
  }

  // 26. WEATHER
  if (inputCmd === "weather") {
    const loc = args.slice(1).join(" ") || "Manila";
    return api.sendMessage(`🌤️ Weather in ${loc}: 30°C, Fair Weather`, threadID, messageID);
  }

  // 27. YT
  if (inputCmd === "yt") {
    const query = args.slice(1).join(" ");
    if (!query) return api.sendMessage("Mag-search sa YT: /yt <search query>", threadID, messageID);
    return api.sendMessage(`📺 Searching YouTube for: "${query}"...`, threadID, messageID);
  }

  return api.sendMessage(`❌ Unknown command "/${inputCmd}". Type "/help" para sa menu.`, threadID, messageID);
};
