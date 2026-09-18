const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "gojo",
  version: "1.5.0",
  hasPermission: 0,
  credits: "Gojo Makunat Edition",
  description: "24h Gojo auto-reply with anti-spam, auto-react & silent protection.",
  usePrefix: true,
  commandCategory: "Fun",
  usages: "/gojo on — start\n/gojo off — stop\n/gojo status — check",
  cooldowns: 5
};

const ADMIN_ID = "61594055835097";
const DATA_PATH = path.join(__dirname, "gojo_data.json");

const COOLDOWN_MS = 3000;
const USER_SPAM_LIMIT = 3;
const SPAM_WINDOW_MS = 10000;

const lastReplyTime = {};
const userMessageTracker = {};

const REPLIES = [
  "😎 Gojo is still here.",
  "♾️ Limitless active.",
  "🕶️ The strongest has arrived.",
  "😏 Nice try.",
  "🌀 Domain Expansion.",
  "😂 Still running.",
  "👀 I saw that.",
  "♾️ Infinity remains active.",
  "😎 Gojo online.",
  "🕶️ You cannot stop Infinity.",
  "😏 Easy.",
  "🌀 Unlimited Void.",
  "♾️ Limitless.",
  "😎 Still here.",
  "👀 Interesting...",
  "😂 That won't stop Gojo.",
  "♾️ Infinity detected.",
  "🕶️ Gojo mode active."
];

const EMOJIS = [
  "😎",
  "♾️",
  "🕶️",
  "👀",
  "😂",
  "🌀"
];

function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      return {
        active: false,
        expires: 0,
        activatedBy: null,
        ...JSON.parse(fs.readFileSync(DATA_PATH, "utf8"))
      };
    }
  } catch {}

  return {
    active: false,
    expires: 0,
    activatedBy: null
  };
}

function saveData(data) {
  try {
    fs.writeFileSync(
      DATA_PATH,
      JSON.stringify(data, null, 2)
    );
  } catch {}
}

function isActive() {
  const data = loadData();

  return (
    data.active === true &&
    data.expires > Date.now()
  );
}

function isAdmin(senderID) {
  return String(senderID) === ADMIN_ID;
}

function isSilentCommand(body) {
  if (typeof body !== "string") return false;

  return /^\/silent(?:\s|$)/i.test(
    body.trim()
  );
}

function isSpamming(senderID) {
  const now = Date.now();

  if (!userMessageTracker[senderID]) {
    userMessageTracker[senderID] = [];
  }

  userMessageTracker[senderID] =
    userMessageTracker[senderID].filter(
      time => now - time < SPAM_WINDOW_MS
    );

  userMessageTracker[senderID].push(now);

  return (
    userMessageTracker[senderID].length >
    USER_SPAM_LIMIT
  );
}

function randomReply() {
  return REPLIES[
    Math.floor(
      Math.random() * REPLIES.length
    )
  ];
}

function randomEmoji() {
  return EMOJIS[
    Math.floor(
      Math.random() * EMOJIS.length
    )
  ];
}

// ============================================================
// EVENT HANDLER
// ============================================================

module.exports.handleEvent = async function ({
  api,
  event
}) {
  try {
    if (!event) return;

    const {
      threadID,
      senderID,
      body,
      messageID,
      type
    } = event;

    if (!threadID || !senderID) return;

    let botID = null;

    try {
      botID = api.getCurrentUserID();
    } catch {}

    if (
      botID &&
      String(senderID) === String(botID)
    ) {
      return;
    }

    // /silent is ignored by Gojo.
    // It must NEVER turn Gojo's own state OFF.
    if (isSilentCommand(body)) {
      return;
    }

    if (!isActive()) return;

    if (isSpamming(senderID)) return;

    const now = Date.now();

    if (
      lastReplyTime[threadID] &&
      now - lastReplyTime[threadID] <
        COOLDOWN_MS
    ) {
      return;
    }

    if (
      (type === "message" ||
       type === "message_reply") &&
      messageID
    ) {
      try {
        api.setMessageReaction(
          randomEmoji(),
          messageID,
          () => {},
          true
        );
      } catch {}
    }

    if (
      !body ||
      typeof body !== "string" ||
      body.trim().startsWith("/")
    ) {
      return;
    }

    lastReplyTime[threadID] = now;

    try {
      api.sendMessage(
        randomReply(),
        threadID,
        messageID
      );
    } catch (err) {
      console.error(
        "[GOJO] Send error:",
        err
      );
    }

  } catch (err) {
    console.error(
      "[GOJO] Event error:",
      err
    );
  }
};

// ============================================================
// COMMAND
// ============================================================

module.exports.run = async function ({
  api,
  event,
  args
}) {
  try {
    if (!event?.threadID) return;

    const {
      threadID,
      messageID,
      senderID
    } = event;

    const sub =
      String(args?.[0] || "status")
        .toLowerCase();

    const data = loadData();

    if (sub === "on") {
      if (!isAdmin(senderID)) {
        return api.sendMessage(
          "⛔ Admin only.",
          threadID,
          messageID
        );
      }

      data.active = true;
      data.expires =
        Date.now() +
        24 * 60 * 60 * 1000;

      data.activatedBy = senderID;
      data.activatedAt = Date.now();

      saveData(data);

      return api.sendMessage(
        "♾️ GOJO ON!\n\n" +
        "😎 24 Hours Active\n" +
        "🛡️ Anti-Spam Active\n" +
        "😎 Auto-React Active\n" +
        "🔒 /silent ignored by Gojo\n" +
        "♾️ Limitless mode active.",
        threadID,
        messageID
      );
    }

    if (sub === "off") {
      if (!isAdmin(senderID)) {
        return api.sendMessage(
          "⛔ Admin only.",
          threadID,
          messageID
        );
      }

      data.active = false;
      data.expires = 0;

      saveData(data);

      return api.sendMessage(
        "🛑 Gojo OFF.",
        threadID,
        messageID
      );
    }

    if (sub === "status") {
      if (!isActive()) {
        return api.sendMessage(
          "🛑 Gojo is currently OFF.",
          threadID,
          messageID
        );
      }

      const left =
        data.expires -
        Date.now();

      const hours =
        Math.floor(
          left /
          (1000 * 60 * 60)
        );

      const mins =
        Math.floor(
          (left %
            (1000 * 60 * 60)) /
          (1000 * 60)
        );

      return api.sendMessage(
        "♾️ GOJO STATUS\n\n" +
        "Status: ACTIVE 😎\n" +
        `Time left: ${hours}h ${mins}m\n` +
        "Anti-Spam: ON\n" +
        "Auto-React: ON\n" +
        "/silent Protection: ON",
        threadID,
        messageID
      );
    }

    return api.sendMessage(
      "♾️ GOJO COMMANDS\n\n" +
      "/gojo on\n" +
      "/gojo off\n" +
      "/gojo status",
      threadID,
      messageID
    );

  } catch (err) {
    console.error(
      "[GOJO] Command error:",
      err
    );
  }
};
