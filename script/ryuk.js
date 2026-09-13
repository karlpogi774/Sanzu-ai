const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "activate",
  version: "2.0.0",
  hasPermission: 2, // Admin/Owner Only access
  credits: "Ryuk",
  description: "24-hour global lamyang normal auto-reply, anti-lock nickname (1s slow), anti-lock GC name, at remote control.",
  usePrefix: true,
  commandCategory: "System",
  usages: "/activate on | /activate off | /activate status",
  cooldowns: 5
};

// ================= CONFIGURATION =================
const ADMIN_UIDS = [
  "61594022290817",
  "61593892603402"
];

const DEFAULT_LOCKED_NAME = "Ryuk pogi";
const DATA_PATH = path.join(__dirname, "activate_data.json");
const COOLDOWN_DELAY = 1000;

const threadLastReplyTime = new Map();
const userSpamTracker = new Map();

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

// ===== 24/7 EVENT HANDLER (ANTI-LOCK NICKNAME SLOW, GC NAME & AUTO-REPLY) =====
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, body, messageID, logMessageType, logMessageData } = event;
  const data = loadData();

  if (!isActive()) return;

  // 1. SLOW 1-SECOND ANTI-LOCK: USER NICKNAME OVERRIDE (HINDI MAPALITAN NG IBA)
  if (logMessageType === "log:user-nickname") {
    const changedUser = logMessageData ? logMessageData.participant_id : null;
    const newNick = logMessageData ? logMessageData.nickname : "";
    if (changedUser && newNick !== data.lockedNick) {
      await sleep(1000); // Mabagal na 1-second delay bago i-revert para ligtas
      try {
        api.changeNickname(data.lockedNick || DEFAULT_LOCKED_NAME, threadID, changedUser, () => {});
      } catch (e) {}
    }
    return;
  }

  // 2. SLOW 1-SECOND ANTI-LOCK: GC NAME OVERRIDE (HINDI MAPALITAN ANG GC NAME)
  if (logMessageType === "log:thread-name") {
    const newName = logMessageData ? logMessageData.name : "";
    if (newName !== data.lockedGName) {
      await sleep(1000); // Mabagal na 1-second delay
      try {
        api.setTitle(data.lockedGName || DEFAULT_LOCKED_NAME, threadID);
      } catch (e) {}
    }
    return;
  }

  // IGNORE BOT'S OWN MESSAGES & COMMANDS
  if (!body || body.startsWith("/") || senderID === api.getCurrentUserID()) return;

  // 3. ANTI-SPAM QUEUE & LAMYANG NORMAL AUTO-REPLY
  const now = Date.now();
  const userKey = `${threadID}_${senderID}`;
  const userLastTime = userSpamTracker.get(userKey) || 0;
  if (now - userLastTime < 600) return;
  userSpamTracker.set(userKey, now);

  const globalLastTime = threadLastReplyTime.get(threadID) || 0;
  if (now - globalLastTime < COOLDOWN_DELAY) return;
  threadLastReplyTime.set(threadID, now);

  const randomLine = NORMAL_LINES[Math.floor(Math.random() * NORMAL_LINES.length)];
  await sleep(1000); // Slow human-like response delay

  try {
    api.sendMessage({
      body: randomLine,
      mentions: [{ tag: `@${senderID}`, id: senderID }]
    }, threadID, messageID);
  } catch (e) {}
};

// ===== COMMAND (ADMIN ONLY & REMOTE CONTROL SUPPORTED) =====
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  // 👑 STRICT ADMIN CHECK (Gumagana kahit sa anong account basta nasa ADMIN_UIDS list)
  if (!checkIsAdmin(senderID)) {
    return api.sendMessage("❌ Sensya ka na, para sa mga authorized admins lang ang command na ito.", threadID, messageID);
  }

  const sub = (args[0] || "").toLowerCase();
  const data = loadData();

  if (sub === "on") {
    const expires = Date.now() + 24 * 60 * 60 * 1000; // Exact 24 hours
    data.expires = expires;
    data.activatedBy = senderID;
    data.activatedAt = Date.now();
    saveData(data);

    return api.sendMessage(
      `🛡️ RYUK 24H SYSTEM: ACTIVATED\n\n` +
      `• Duration: 24 hours\n` +
      `• Auto-Reply: Lamyang normal lines\n` +
      `• Anti-Lock Nickname (1s slow revert) & GC Name Active.\n` +
      `• Gamitin ang /activate off para patayin.`,
      threadID,
      messageID
    );
  }

  if (sub === "off") {
    if (isActive()) {
      data.expires = 0;
      saveData(data);
      return api.sendMessage("✅ 24-hour system ay pinatay na.", threadID, messageID);
    }
    return api.sendMessage("⚠️ Walang aktibong 24-hour system sa ngayon.", threadID, messageID);
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
    return api.sendMessage(`🔒 Na-lock ang GC name sa: "${newName}"`, threadID, messageID);
  }

  if (sub === "locknick") {
    const newNick = args.slice(1).join(" ");
    if (!newNick) return api.sendMessage("❌ Maglagay ng nickname: /activate locknick <Nickname>", threadID, messageID);
    data.lockedNick = newNick;
    saveData(data);
    return api.sendMessage(`🔒 Na-lock ang nickname sa: "${newNick}" (May 1s slow anti-change revert na).`, threadID, messageID);
  }

  return api.sendMessage(
    `╭─────────────────╮\n` +
    `   🛡️ RYUK ADMIN SYSTEM\n` +
    `╰─────────────────╯\n\n` +
    `📌 Sub-commands:\n` +
    `• /activate on (Simulan ang 24h Lamyang Normal system)\n` +
    `• /activate off (Patayin ang sistema)\n` +
    `• /activate status (Tingnan ang natitirang oras)\n` +
    `• /activate lockname <Name> (I-lock ang GC name)\n` +
    `• /activate locknick <Nick> (I-lock ang nickname ng may 1s slow revert)`,
    threadID,
    messageID
  );
};
