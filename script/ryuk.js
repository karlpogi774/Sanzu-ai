const fs = require("fs");
const path = require("path");

// ==========================================
// CONFIGURATION
const ADMIN_ID = "61593892603402"; 
const DEFAULT_GC_NAME = "Ryuk's Death Note 📓";
// ==========================================

module.exports.config = {
  name: "activate",
  version: "3.0.0",
  hasPermission: 2,
  credits: "Jehosh / Ryuk",
  description: "Ryuk-themed auto-roast with target lock, auto rename GC/members, anti-spam & auto suggest.",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "/activate on — Start Ryuk suite\n/activate off — Stop\n/activate target @mention — Target specific user\n/activate untarget — Clear target\n/activate status — Check status",
  cooldowns: 3
};

const DATA_PATH = path.join(__dirname, "activate_data.json");

// Anti-Spam settings
const COOLDOWN_MS = 2500;
const USER_SPAM_LIMIT = 3;
const SPAM_WINDOW_MS = 8000;

const lastReplyTime = {};
const userMessageTracker = {};

// Lamyain & Maikling lines ni Ryuk (Pang-asar)
const RYUK_ROASTS = [
  "eh tapos? 🍎",
  "inaantok ako sa boses mo...",
  "labas sa ilong yung sinabi mo.",
  "weeh? ikaw may sabi niyan?",
  "boring mo naman kausap.",
  "🍎... abot mo nga apples ko.",
  "seryoso ka na diyan?",
  "ge lang, kwento mo sa pader.",
  "parang wala namang may pake...",
  "yoko na magbasa, panis.",
  "tamad na tamad ako sa'yo.",
  "ha? hakdog.",
  "tulog ka na lang kaya?",
  "paka-walang kwenta naman.",
  "pagod na utak ko sa'yo.",
  "isa pang salita, isusulat na kita...",
  "mema lang talaga no?",
  "paki natin?",
  "k.",
  "sino nagtanong sa'yo?",
  "corny mo bro.",
  "ge. ambon lang yan.",
  "wala man lang lasa sinabi mo.",
  "buhay ka pa pala?",
  "wala akong naintindihan, ayoko na intindihin.",
  "di ka ba napapagod maging ganyan?",
  "sabaw...",
  "hangin lang lumalabas sa'yo.",
  "mas exciting pa magbilang ng usok.",
  "oks.",
  "weh di nga?",
  "ano raw? ewan sa'yo.",
  "lipat ka ibang GC, ingay mo.",
  "papansin din no?",
  "walang dating.",
  "bwisit, istorbo.",
  "pikit ka na lang ulit.",
  "sayang load sa'yo.",
  "tinatanong ba kita?",
  "parang kasalanan ko pang nabasa ko 'to.",
  "hayy, panibagong katangahan na naman."
];

// Ryuk Suggestions (Dagdag pambwisit sa dulo ng reply)
const RYUK_SUGGESTIONS = [
  "\n\n💡 *Suggest: Apple muna bago magsalita.*",
  "\n\n💡 *Suggest: Mute mo muna sarili mo.*",
  "\n\n💡 *Suggest: Isulat na ba pangalan nito sa notebook?*",
  "\n\n💡 *Suggest: Mag-off online ka muna.*",
  "\n\n💡 *Suggest: Pahinga ka muna, puro ka sabaw.*",
  "\n\n💡 *Suggest: Magdala ka muna ng mansanas sa akin.*"
];

const EMOJIS = ["🍎", "💀", "📓", "😴", "👁️", "🥀", "🖤"];

function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
    }
  } catch {}
  return { expires: 0, activatedBy: null, lockedTitle: DEFAULT_GC_NAME, targetUser: null };
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
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

function isSpamming(senderID) {
  const now = Date.now();
  if (!userMessageTracker[senderID]) userMessageTracker[senderID] = [];
  userMessageTracker[senderID] = userMessageTracker[senderID].filter(t => now - t < SPAM_WINDOW_MS);
  userMessageTracker[senderID].push(now);

  return userMessageTracker[senderID].length > USER_SPAM_LIMIT;
}

function renameAllMembers(api, threadID, nickname) {
  api.getThreadInfo(threadID, (err, info) => {
    if (err || !info || !info.participantIDs) return;
    info.participantIDs.forEach((userID, index) => {
      setTimeout(() => {
        api.changeNickname(nickname, threadID, userID, () => {});
      }, index * 1200);
    });
  });
}

// ===== EVENT HANDLER =====
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, body, messageID, logMessageType, logMessageData } = event;
  const botID = api.getCurrentUserID();
  const data = loadData();

  if (!isActive() || senderID === botID) return;

  // 1. HARD LOCKED GC NAME (HINDI MAPALITAN NG IBA)
  if (logMessageType === "log:thread-name") {
    const lockedName = data.lockedTitle || DEFAULT_GC_NAME;
    if (logMessageData.name !== lockedName) {
      api.setTitle(lockedName, threadID, (err) => {
        if (!err) {
          api.sendMessage(`🍎 *Ryuk:* Huwag niyo baguhin. Naka-lock 'to sa "${lockedName}".`, threadID);
        }
      });
    }
    return;
  }

  // Ignore commands and empty messages
  if (!body || body.startsWith("/")) return;

  // 2. TARGET USER CHECK (Pag may target user, siya lang ang aasarin)
  if (data.targetUser && senderID !== data.targetUser) {
    return;
  }

  // 3. ANTI-SPAM CHECK
  if (isSpamming(senderID)) return;

  const now = Date.now();
  if (lastReplyTime[threadID] && (now - lastReplyTime[threadID] < COOLDOWN_MS)) {
    return;
  }
  lastReplyTime[threadID] = now;

  // 4. RYUK RESPONSE GENERATOR (Roast + Auto Suggest + Reaction)
  const randomRoast = RYUK_ROASTS[Math.floor(Math.random() * RYUK_ROASTS.length)];
  const randomSuggest = RYUK_SUGGESTIONS[Math.floor(Math.random() * RYUK_SUGGESTIONS.length)];
  const fullMessage = randomRoast + randomSuggest;

  api.sendMessage(fullMessage, threadID, (err, info) => {
    if (!err && info && info.messageID) {
      const randomEmoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      api.setMessageReaction(randomEmoji, info.messageID, () => {}, true);
    }
  }, messageID);
};

// ===== COMMAND RUNNER =====
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, mentions } = event;
  const sub = (args[0] || "").toLowerCase();
  const data = loadData();

  // STRICT ADMIN GUARD
  if (senderID !== ADMIN_ID) {
    return api.sendMessage("🍎 *Ryuk:* Wala kang authority rito. Umalis ka sa harap ko.", threadID, messageID);
  }

  if (sub === "on") {
    const expires = Date.now() + 24 * 60 * 60 * 1000;
    data.expires = expires;
    data.activatedBy = senderID;
    data.lockedTitle = DEFAULT_GC_NAME;
    saveData(data);

    // Auto lock GC Name
    api.setTitle(DEFAULT_GC_NAME, threadID, () => {});

    // Auto change all members nickname to "jehosh"
    renameAllMembers(api, threadID, "jehosh");

    return api.sendMessage(
      `🍎 RYUK'S DEATH NOTE MODE: ON 📓\n\n` +
      `👑 Admin Access: Granted (${ADMIN_ID})\n` +
      `📌 GC Name Locked to: "${DEFAULT_GC_NAME}"\n` +
      `👥 Member Nicknames: Changing to "jehosh"\n` +
      `🎯 Target System: ${data.targetUser ? "Active" : "None (Global)"}\n` +
      `⏳ Duration: 24 Hours`,
      threadID,
      messageID
    );
  }

  // TARGET USER PANG-TRIP COMMAND
  if (sub === "target") {
    const mentionIDs = Object.keys(mentions);
    if (mentionIDs.length === 0 && !args[1]) {
      return api.sendMessage("🍎 *Ryuk:* Mag-tag ka ng idadamay natin sa notebook. Example: /activate target @mention", threadID, messageID);
    }

    const targetID = mentionIDs[0] || args[1];
    data.targetUser = targetID;
    saveData(data);

    return api.sendMessage(`🍎 *Ryuk:* Sige, si <@${targetID}> na lang ang aasarin ko sa GC na 'to.`, threadID, messageID, {
      mentions: [{ tag: `<@${targetID}>`, id: targetID }]
    });
  }

  if (sub === "untarget") {
    data.targetUser = null;
    saveData(data);
    return api.sendMessage("🍎 *Ryuk:* Inalis ko na yung target. Lahat na ulit aasarin ko.", threadID, messageID);
  }

  if (sub === "off") {
    if (isActive()) {
      data.expires = 0;
      data.targetUser = null;
      saveData(data);
      return api.sendMessage("🍎 *Ryuk:* Isinara ko na muna yung notebook. Tulog muna ako.", threadID, messageID);
    }
    return api.sendMessage("🍎 *Ryuk:* Hindi naman ako gising.", threadID, messageID);
  }

  if (sub === "status") {
    const left = getRemaining();
    if (left <= 0) return api.sendMessage("🍎 *Ryuk:* Naka-OFF ang sistema.", threadID, messageID);

    const hours = Math.floor(left / (1000 * 60 * 60));
    const mins = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
    return api.sendMessage(
      `🍎 RYUK STATUS:\n` +
      `• Time left: ${hours}h ${mins}m\n` +
      `• Locked GC Name: ${data.lockedTitle}\n` +
      `• Target User: ${data.targetUser ? data.targetUser : "Lahat (Global)"}`,
      threadID,
      messageID
    );
  }

  return api.sendMessage(
    `🍎 Ryuk Commands (Admin Only):\n` +
    `/activate on — Start 24h Ryuk suite\n` +
    `/activate target @mention — I-target lang ang isang tao\n` +
    `/activate untarget — Alisin ang target\n` +
    `/activate off — Stop Ryuk suite\n` +
    `/activate status — Check status`,
    threadID,
    messageID
  );
};
