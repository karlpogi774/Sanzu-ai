const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "activate",
  version: "2.1.0",
  hasPermission: 2,
  credits: "Ryuk",
  description: "24-hour global lamyang normal auto-reply with foolproof auto-revert lock for GC name and nickname.",
  usePrefix: true,
  commandCategory: "System",
  usages: "/activate on | /activate off | /activate status | /activate lockname <name> | /activate locknick <nick>",
  cooldowns: 5
};

const ADMIN_UIDS = [
  "61594022290817",
  "61593892603402"
];

const DEFAULT_LOCKED_NAME = "Ryuk pogi";
const DATA_PATH = path.join(__dirname, "activate_data.json");
const COOLDOWN_DELAY = 1000;

const threadLastReplyTime = new Map();
const userSpamTracker = new Map();

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

function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
    }
  } catch {}
  return { 
    expires: 0, 
    activatedBy: null, 
    lockedGName: DEFAULT_LOCKED_NAME, 
    lockedNick: DEFAULT_LOCKED_NAME 
  };
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch {}
}

function isActive() {
  const data = loadData();
  return data.expires && data.expires > Date.now();
}

function getRemaining() {
  const data = loadData();
  if (!data.expires) return 0;
  const left = data.expires - Date.now();
  return left > 0 ? left : 0;
}

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, body, messageID, logMessageType, logMessageData } = event;
  const data = loadData();

  if (!threadID) return;

  // 1. FOOLPROOF AUTO REVERT PARA SA GC NAME (Kahit sino magpalit, babalik agad)
  if (logMessageType === "log:thread-name") {
    const newName = logMessageData ? logMessageData.name : "";
    const targetName = data.lockedGName || DEFAULT_LOCKED_NAME;
    if (newName !== targetName) {
      await sleep(1000);
      try {
        api.setTitle(targetName, threadID, (err) => {
          if (err) {
            // Fallback retries kung sakaling ma-rate limit ng Facebook
            setTimeout(() => api.setTitle(targetName, threadID, () => {}), 2000);
          }
        });
      } catch (e) {}
    }
    return;
  }

  // 2. FOOLPROOF AUTO REVERT PARA SA NICKNAME
  if (logMessageType === "log:user-nickname") {
    const changedUser = logMessageData ? logMessageData.participant_id : null;
    const newNick = logMessageData ? logMessageData.nickname : "";
    const targetNick = data.lockedNick || DEFAULT_LOCKED_NAME;
    if (changedUser && newNick !== targetNick) {
      await sleep(1000);
      try {
        api.changeNickname(targetNick, threadID, changedUser, () => {});
      } catch (e) {}
    }
    return;
  }

  // Kung patay ang 24h timer, hihinto na rito at hindi mag-a-auto reply
  if (!isActive()) return;

  // Huwag pansinin ang sariling mensahe ng bot o mga commands na nagsisimula sa /
  if (!body || body.startsWith("/") || senderID === api.getCurrentUserID()) return;

  // 3. AUTO REPLY SA MGA NAGMESSAGES
  const now = Date.now();
  const userKey = `${threadID}_${senderID}`;
  const userLastTime = userSpamTracker.get(userKey) || 0;
  if (now - userLastTime < 600) return;
  userSpamTracker.set(userKey, now);

  const globalLastTime = threadLastReplyTime.get(threadID) || 0;
  if (now - globalLastTime < COOLDOWN_DELAY) return;
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

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (!checkIsAdmin(senderID)) {
    return api.sendMessage("❌ Para sa mga authorized admins lang ang command na ito.", threadID, messageID);
  }

  const sub = (args[0] || "").toLowerCase();
  const data = loadData();

  if (sub === "on") {
    const expires = Date.now() + 24 * 60 * 60 * 1000;
    data.expires = expires;
    data.activatedBy = senderID;
    data.activatedAt = Date.now();
    saveData(data);

    return api.sendMessage(
      `🛡️ RYUK 24H SYSTEM: ACTIVATED\n\n` +
      `• Auto-Reply: Lamyang normal lines active\n` +
      `• Auto-Lock GC Name & Nickname: ON\n` +
      `• Status: Mag-a-auto reply at automatic ibabalik ang GC name kapag pinalitan.`,
      threadID,
      messageID
    );
  }

  if (sub === "off") {
    if (data.expires > 0) {
      data.expires = 0;
      saveData(data);
      return api.sendMessage("✅ 24-hour system ay pinatay na.", threadID, messageID);
    }
    return api.sendMessage("⚠️ Walang aktibong sistema na naka-on.", threadID, messageID);
  }

  if (sub === "status") {
    const left = getRemaining();
    if (left <= 0) {
      return api.sendMessage("🔴 24-hour system status: OFFLINE", threadID, messageID);
    }
    const hours = Math.floor(left / (1000 * 60 * 60));
    const mins = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
    return api.sendMessage(
      `🟢 24-hour system status: ACTIVE\nNatitirang oras: ${hours}h ${mins}m`,
      threadID,
      messageID
    );
  }

  if (sub === "lockname") {
    const newName = args.slice(1).join(" ");
    if (!newName) return api.sendMessage("❌ Maglagay ng pangalan: /activate lockname <GC Name>", threadID, messageID);
    data.lockedGName = newName;
    saveData(data);
    try { api.setTitle(newName, threadID); } catch(e){}
    return api.sendMessage(`🔒 Na-lock ang GC name sa: "${newName}". Automatic na itong ibabalik kapag pinalitan ng iba.`, threadID, messageID);
  }

  if (sub === "locknick") {
    const newNick = args.slice(1).join(" ");
    if (!newNick) return api.sendMessage("❌ Maglagay ng nickname: /activate locknick <Nickname>", threadID, messageID);
    data.lockedNick = newNick;
    saveData(data);
    return api.sendMessage(`🔒 Na-lock ang nickname sa: "${newNick}" (May slow auto-revert na).`, threadID, messageID);
  }

  return api.sendMessage(
    `╭─────────────────╮\n` +
    `   🛡️ RYUK ADMIN SYSTEM\n` +
    `╰─────────────────╯\n\n` +
    `📌 Sub-commands:\n` +
    `• /activate on (Paganahin ang 24h auto-reply at auto-lock)\n` +
    `• /activate off (Patayin ang sistema)\n` +
    `• /activate status (Tingnan ang oras)\n` +
    `• /activate lockname <Name> (I-lock ang GC name)\n` +
    `• /activate locknick <Nick> (I-lock ang nickname)`,
    threadID,
    messageID
  );
};
