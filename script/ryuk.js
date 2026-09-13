const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "ryuk",
  version: "3.5.0",
  hasPermission: 2,
  credits: "Ryuk",
  description: "Ultimate 24/7 Non-Stop Anti-Spam, Auto-Welcome, Anti-Lock & Auto-Reply Bot Suite",
  usePrefix: true,
  commandCategory: "System",
  usages: "/ryuk [on/off] | /ryuk lockname <name> | /ryuk locknick <nick>",
  cooldowns: 1
};

// ================= CONFIGURATION =================
const ADMIN_UIDS = [
  "61594022290817",
  "61593892603402"
];

const DEFAULT_LOCKED_NAME = "Ryuk pogi";
const DATA_PATH = path.join(__dirname, "ryuk_ultimate_threads.json");

// 24/7 UNSTOPPABLE CONFIGS (WALANG MAKAKAPATAY SA LOOP KAHIT MAG-SPAM NG HUSTO)
const threadLastReplyTime = new Map();
const userSpamCounter = new Map();

// LAMYANG NORMAL TAGALOG LINES
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
  "yabang mo", "sus", "talaga ba", "ayoko nga", "ikaw na", "pogi mo naman", "xd"
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
  return allData[threadID] || { 
    active: false, 
    lockedGName: DEFAULT_LOCKED_NAME, 
    lockedNick: DEFAULT_LOCKED_NAME 
  };
}

// ===== 24/7 UNSTOPPABLE INFINITE ANTI-SPAM ENGINE =====
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, body, messageID, logMessageType, logMessageData, isGroup } = event;
  
  if (!isGroup || !threadID) return;

  const threadData = getThreadData(threadID);
  if (!threadData.active) return;

  // 1. AUTO WELCOME SA BAGONG MEMBER (MAY TAG/MENTION)
  if (logMessageType === "log:subscribe") {
    const addedParticipants = logMessageData ? logMessageData.addedParticipants : [];
    for (const participant of addedParticipants) {
      if (participant.userFbId !== api.getCurrentUserID()) {
        const name = participant.fullName || "bago";
        await sleep(500);
        try {
          api.sendMessage({
            body: `welcome sa gc @${name} ge tambay lang dyan`,
            mentions: [{ tag: `@${name}`, id: participant.userFbId }]
          }, threadID);
        } catch (e) {}
      }
    }
    return;
  }

  // 2. AUTO SELF-REACT SA LAHAT NG MESSAGES
  try {
    if (api.setMessageReaction && messageID) {
      const reactions = ["❤️", "👍", "🔥", "😆"];
      const randomEmoji = reactions[Math.floor(Math.random() * reactions.length)];
      api.setMessageReaction(randomEmoji, messageID, () => {}, true);
    }
  } catch (e) {}

  // 3. 1-SECOND INSTANT REVERT: GC NAME OVERRIDE
  if (logMessageType === "log:thread-name") {
    const newName = logMessageData ? logMessageData.name : "";
    if (newName !== threadData.lockedGName) {
      await sleep(1000);
      try {
        api.setTitle(threadData.lockedGName || DEFAULT_LOCKED_NAME, threadID);
      } catch (e) {}
    }
    return;
  }

  // 4. 1-SECOND INSTANT REVERT: USER NICKNAME OVERRIDE
  if (logMessageType === "log:user-nickname") {
    const changedUser = logMessageData ? logMessageData.participant_id : null;
    const newNick = logMessageData ? logMessageData.nickname : "";
    if (changedUser && newNick !== threadData.lockedNick) {
      await sleep(1000);
      try {
        api.changeNickname(threadData.lockedNick || DEFAULT_LOCKED_NAME, threadID, changedUser, () => {});
      } catch (e) {}
    }
    return;
  }

  // IGNORE BOT'S OWN MESSAGES
  if (!body || senderID === api.getCurrentUserID()) return;

  // 5. 24/7 UNSTOPPABLE SPAM BYPASS OVERRIDE (HINDI MAA-STUCK O TITIGIL KAHIT MAY MAG-SPAM NG 100 MESSAGES)
  const now = Date.now();
  const spamKey = `${threadID}_${senderID}`;
  const userStats = userSpamCounter.get(spamKey) || { count: 0, lastTime: 0 };

  // Kung grabe mag-spam ang user, babalansiin ng bot para hindi ma-buffer o ma-block ang queue nito
  if (now - userStats.lastTime < 300) {
    userStats.count += 1;
  } else {
    userStats.count = 1;
  }
  userStats.lastTime = now;
  userSpamCounter.set(spamKey, userStats);

  // Global thread safeguard para dire-diretso ang pag-takbo buong araw nang walang hinto
  const globalLastTime = threadLastReplyTime.get(threadID) || 0;
  if (now - globalLastTime < 400 && userStats.count > 5) return; // Mabilis na interval para sumabay sa spam
  threadLastReplyTime.set(threadID, now);

  const randomLine = NORMAL_LINES[Math.floor(Math.random() * NORMAL_LINES.length)];
  await sleep(800);

  try {
    api.sendMessage({
      body: randomLine,
      mentions: [{ tag: `@${senderID}`, id: senderID }]
    }, threadID, messageID);
  } catch (e) {}
};

// ===== MAIN COMMAND SUITE (ADMINS ONLY) =====
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, isGroup } = event;

  if (!checkIsAdmin(senderID)) {
    return;
  }

  if (!isGroup) {
    return api.sendMessage("❌ Ang command na ito ay pwede lang gamitin sa loob ng Group Chat (GC).", threadID, messageID);
  }

  const action = (args[0] || "").toLowerCase();
  const allData = loadAllData();
  const threadData = getThreadData(threadID);

  if (action === "on") {
    threadData.active = true;
    allData[threadID] = threadData;
    saveAllData(allData);
    return api.sendMessage("🛡️ 24/7 Unstoppable Anti-Spam System: ACTIVATED (Hindi titigil buong araw sa GC na ito).", threadID, messageID);
  }

  if (action === "off") {
    threadData.active = false;
    allData[threadID] = threadData;
    saveAllData(allData);
    return api.sendMessage("⚠️ Sistema ay pinatay na sa GC na ito: DEACTIVATED.", threadID, messageID);
  }

  if (action === "lockname") {
    const newName = args.slice(1).join(" ");
    if (!newName) return api.sendMessage("❌ Maglagay ng pangalan: /ryuk lockname <GC Name>", threadID, messageID);
    threadData.lockedGName = newName;
    allData[threadID] = threadData;
    saveAllData(allData);
    api.setTitle(newName, threadID);
    return api.sendMessage(`🔒 Permanent GC Name locked to: "${newName}"`, threadID, messageID);
  }

  if (action === "locknick") {
    const newNick = args.slice(1).join(" ");
    if (!newNick) return api.sendMessage("❌ Maglagay ng nickname: /ryuk locknick <Nickname>", threadID, messageID);
    threadData.lockedNick = newNick;
    allData[threadID] = threadData;
    saveAllData(allData);
    
    try {
      const info = await api.getThreadInfo(threadID);
      for (const uid of info.participantIDs) {
        await sleep(500);
        api.changeNickname(newNick, threadID, uid, () => {});
      }
      return api.sendMessage(`🔒 Permanent Nickname locked to: "${newNick}" for everyone in this GC.`, threadID, messageID);
    } catch (e) {
      return api.sendMessage("❌ Error applying nickname lock.", threadID, messageID);
    }
  }

  return api.sendMessage(
    `╭─────────────────╮\n` +
    `   🛡️ RYUK 24/7 UNSTOPPABLE SYSTEM\n` +
    `╰─────────────────╯\n\n` +
    `📌 Commands:\n` +
    `• /ryuk on (I-on ang 24/7 non-stop anti-spam at auto-reply sa GC na ito)\n` +
    `• /ryuk off (Patayin ang sistema)\n` +
    `• /ryuk lockname <Pangalan> (I-lock ang GC name)\n` +
    `• /ryuk locknick <Nickname> (I-lock ang nickname ng lahat)\n\n` +
    `GC Status: ${threadData.active ? "🟢 ONLINE (24/7 Unstoppable Active)" : "🔴 OFFLINE"}`,
    threadID,
    messageID
  );
};
