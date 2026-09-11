const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "activate",
  version: "2.0.0",
  hasPermission: 0,
  credits: "sinzu",
  description: "Infinite global auto-roast with nickname/group manager, anti-spam, and self-react.",
  usePrefix: true,
  commandCategory: "Fun",
  usages: "/activate on | off | status | setnick | setgname",
  cooldowns: 5
};

const DATA_PATH = path.join(__dirname, "activate_data.json");

// Emojis for auto self-react
const REACT_EMOJIS = ["🔥", "💀", "🤣", "😆", "🤡", "👎"];

// English roasts
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

function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
    }
  } catch {}
  return { active: false, activatedBy: null };
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function isActive() {
  const data = loadData();
  return data.active === true;
}

// Anti-spam tracker (preventing simultaneous execution overlapping)
const isProcessing = new Set();

// ===== EVENT HANDLER =====
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, body } = event;

  // Anti-Spam & Validation: Ignore bot's messages, commands, and empty body
  if (!body || body.startsWith("/") || senderID === api.getCurrentUserID()) return;

  if (!isActive()) return;

  // Anti-Spam: Block if thread is currently receiving a roast batch
  if (isProcessing.has(threadID)) return;
  isProcessing.add(threadID);

  try {
    // Select 1 random roast (Anti-Spam 1-reply design)
    const randomRoast = ROASTS[Math.floor(Math.random() * ROASTS.length)];
    const randomEmoji = REACT_EMOJIS[Math.floor(Math.random() * REACT_EMOJIS.length)];

    api.sendMessage(randomRoast, threadID, (err, info) => {
      if (!err && info && info.messageID) {
        // Auto self-react to the sent message
        api.setMessageReaction(randomEmoji, info.messageID, (reactErr) => {
          if (reactErr) console.error("Self-react error:", reactErr);
        }, true);
      }
      // Release lock after message delivery
      isProcessing.delete(threadID);
    });
  } catch (error) {
    console.error("Auto-roast error:", error);
    isProcessing.delete(threadID);
  }
};

// ===== COMMAND HANDLER =====
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const sub = (args[0] || "").toLowerCase();
  const data = loadData();

  // Turn ON Infinite Duration
  if (sub === "on") {
    data.active = true;
    data.activatedBy = senderID;
    data.activatedAt = Date.now();
    saveData(data);

    return api.sendMessage(
      `🔥 GLOBAL AUTO-ROAST: ON\n\n` +
      `Duration: INFINITE ♾️\n` +
      `Features: Anti-spam enabled & Auto self-react active.\n` +
      `Use /activate off to stop.`,
      threadID,
      messageID
    );
  }

  // Turn OFF
  if (sub === "off") {
    data.active = false;
    saveData(data);
    return api.sendMessage("✅ Global auto-roast turned OFF.", threadID, messageID);
  }

  // Check Status
  if (sub === "status") {
    if (!data.active) {
      return api.sendMessage("Global auto-roast is currently OFF.", threadID, messageID);
    }
    return api.sendMessage(
      `🔥 Global Auto-roast is ACTIVE (INFINITE ♾️)\nAnti-Spam & Auto Self-React: ENABLED`,
      threadID,
      messageID
    );
  }

  // Auto Add & Change All Members' Nicknames
  if (sub === "setnick") {
    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const participantIDs = threadInfo.participantIDs;

      api.sendMessage(`⏳ Changing nicknames of all ${participantIDs.length} members to "Jehosh Pogi"...`, threadID);

      for (const userID of participantIDs) {
        api.changeNickname("Jehosh Pogi", threadID, userID, (err) => {
          if (err) console.error(`Failed to change nickname for ${userID}:`, err);
        });
      }
      return api.sendMessage("✅ Successfully updated all members' nicknames to 'Jehosh Pogi'.", threadID, messageID);
    } catch (e) {
      return api.sendMessage("❌ Failed to update nicknames. Make sure the bot has admin permissions.", threadID, messageID);
    }
  }

  // Auto Add & Change Group Name
  if (sub === "setgname") {
    api.setTitle("Jehosh Pogi", threadID, (err) => {
      if (err) {
        return api.sendMessage("❌ Failed to change group name. Check bot permissions.", threadID, messageID);
      }
      return api.sendMessage("✅ Group name successfully changed to 'Jehosh Pogi'.", threadID, messageID);
    });
    return;
  }

  return api.sendMessage(
    `Usage:\n` +
    `/activate on — Start infinite global auto-roast\n` +
    `/activate off — Stop auto-roast\n` +
    `/activate status — Check status\n` +
    `/activate setnick — Change all members' nicknames to 'Jehosh Pogi'\n` +
    `/activate setgname — Change group name to 'Jehosh Pogi'`,
    threadID,
    messageID
  );
};
