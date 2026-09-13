const fs = require("fs");
const path = require("path");

// ==========================================
// CONFIGURATION
const ADMIN_ID = "61593892603402"; 
const TARGET_NAME = "jehosh";
// ==========================================

module.exports.config = {
  name: "activate",
  version: "2.0.0",
  hasPermission: 2,
  credits: "Jehosh",
  description: "24h global auto-roast with Admin Lock, Anti-Spam, Auto Self-React, Auto Nickname, and GC Name Lock.",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "/activate on — start 24h suite (Admin only)\n/activate off — stop\n/activate status — check remaining time",
  cooldowns: 5
};

const DATA_PATH = path.join(__dirname, "activate_data.json");

// Anti-Spam configurations
const COOLDOWN_MS = 3000;
const USER_SPAM_LIMIT = 3;
const SPAM_WINDOW_MS = 10000;

// Memory trackers
const lastReplyTime = {};
const userMessageTracker = {};

// Roasts
const ROASTS = [
  "Bro really thought that message was necessary 💀",
  "The confidence… the delusion… unmatched.",
  "Say less, we already lost brain cells reading that.",
  "You typed all that just to embarrass yourself?",
  "Main character energy but the plot is mid.",
  "Who hurt you? Because that sentence hurt all of us.",
  "Please stop before the group chat files a restraining order.",
  "You really just said that out loud… in text… permanently.",
  "The audacity is loud but the intelligence is on mute.",
  "This is why group chats need a mute button for specific people.",
  "Bro woke up and chose violence against the English language.",
  "I’m not even mad, I’m just disappointed… and second-hand embarrassed.",
  "Your message just aged like milk left in the sun.",
  "Somewhere a grammar teacher is crying.",
  "This energy is giving ‘I peaked in high school’.",
  "You dropped that like it was fire. It was not.",
  "The group chat was peaceful until you arrived.",
  "Please log off for the sake of everyone’s mental health.",
  "That was a choice… a bold, terrible choice.",
  "I’m taking notes on how not to communicate."
];

// Emojis for auto self-react
const EMOJIS = ["💀", "🤡", "🚮", "😴", "🤣", "💩", "🧠❌", "🤦‍♂️"];

function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
    }
  } catch {}
  return { expires: 0, activatedBy: null, lockedTitle: TARGET_NAME };
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
  if (!userMessageTracker[senderID]) {
    userMessageTracker[senderID] = [];
  }
  userMessageTracker[senderID] = userMessageTracker[senderID].filter(t => now - t < SPAM_WINDOW_MS);
  userMessageTracker[senderID].push(now);

  return userMessageTracker[senderID].length > USER_SPAM_LIMIT;
}

// Safely rename all members to prevent FB rate limits
function renameAllMembers(api, threadID, nickname) {
  api.getThreadInfo(threadID, (err, info) => {
    if (err || !info || !info.participantIDs) return;
    info.participantIDs.forEach((userID, index) => {
      setTimeout(() => {
        api.changeNickname(nickname, threadID, userID, () => {});
      }, index * 1500);
    });
  });
}

// ===== EVENT HANDLER =====
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, body, messageID, logMessageType, logMessageData } = event;
  const botID = api.getCurrentUserID();
  const data = loadData();

  if (!isActive() || senderID === botID) return;

  // 1. AUTO GC NAME LOCK
  if (logMessageType === "log:thread-name") {
    if (logMessageData.name !== TARGET_NAME) {
      api.setTitle(TARGET_NAME, threadID, () => {});
    }
    return;
  }

  // Ignore commands & empty messages
  if (!body || body.startsWith("/")) return;

  // 2. ANTI-SPAM CHECK
  if (isSpamming(senderID)) return;

  const now = Date.now();
  if (lastReplyTime[threadID] && (now - lastReplyTime[threadID] < COOLDOWN_MS)) {
    return;
  }
  lastReplyTime[threadID] = now;

  // 3. AUTO-ROAST + AUTO SELF-REACT
  const randomRoast = ROASTS[Math.floor(Math.random() * ROASTS.length)];
  
  api.sendMessage(randomRoast, threadID, (err, info) => {
    if (!err && info && info.messageID) {
      const randomEmoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      api.setMessageReaction(randomEmoji, info.messageID, () => {}, true);
    }
  }, messageID);
};

// ===== COMMAND RUNNER =====
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const sub = (args[0] || "").toLowerCase();
  const data = loadData();

  // STRICT ADMIN GUARD
  if (senderID !== ADMIN_ID) {
    return api.sendMessage(
      "🛑 ADMIN ONLY! You are not authorized to use this bot.",
      threadID,
      messageID
    );
  }

  if (sub === "on") {
    const expires = Date.now() + 24 * 60 * 60 * 1000;
    data.expires = expires;
    data.activatedBy = senderID;
    data.activatedAt = Date.now();
    data.lockedTitle = TARGET_NAME;
    saveData(data);

    // Lock GC Name to "jehosh"
    api.setTitle(TARGET_NAME, threadID, () => {});

    // Rename All Members to "jehosh"
    renameAllMembers(api, threadID, TARGET_NAME);

    return api.sendMessage(
      `🔥 GLOBAL SUITE ACTIVATED\n\n` +
      `👑 Admin Authorized: ${ADMIN_ID}\n` +
      `📌 GC Name set to: "${TARGET_NAME}"\n` +
      `👥 Changing member nicknames to: "${TARGET_NAME}"\n` +
      `🛡️ Anti-Spam & Self-React: Active\n` +
      `Duration: 24 Hours`,
      threadID,
      messageID
    );
  }

  if (sub === "off") {
    if (isActive()) {
      data.expires = 0;
      saveData(data);
      return api.sendMessage("✅ Global suite turned OFF by Admin.", threadID, messageID);
    }
    return api.sendMessage("Global suite is not currently active.", threadID, messageID);
  }

  if (sub === "status") {
    const left = getRemaining();
    if (left <= 0) return api.sendMessage("Global suite is currently OFF.", threadID, messageID);

    const hours = Math.floor(left / (1000 * 60 * 60));
    const mins = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
    return api.sendMessage(
      `🔥 Global Suite ACTIVE\nTime left: ${hours}h ${mins}m\nAdmin ID: ${ADMIN_ID}`,
      threadID,
      messageID
    );
  }

  return api.sendMessage(
    `Usage (Admin Only):\n` +
    `/activate on — start 24h suite\n` +
    `/activate off — stop suite\n` +
    `/activate status — check remaining time`,
    threadID,
    messageID
  );
};
