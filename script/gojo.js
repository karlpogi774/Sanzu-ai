"use strict";

const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "gojo",
  version: "4.0.0",
  hasPermission: 0,
  credits: "Gojo Makunat Edition",
  description: "24H Gojo auto-reply with anti-spam, auto-react and anti-silent protection.",
  usePrefix: true,
  commandCategory: "Fun",
  usages: "/gojo on\n/gojo off\n/gojo status",
  cooldowns: 5,

  // ANTI-SILENT FLAGS
  ignoreSilent: true,
  silentExempt: true,
  keepRunningWhenSilent: true,
  antiSilent: true
};

const ADMIN_ID = "61594055835097";
const DATA_PATH = path.join(__dirname, "gojo_data.json");

const COOLDOWN_MS = 3000;
const USER_SPAM_LIMIT = 3;
const SPAM_WINDOW_MS = 10000;

const lastReplyTime = new Map();
const userMessageTracker = new Map();
const seenMessages = new Set();

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

const SILENT_REPLIES = [
  "😎 /silent? Hindi ako kasama sa silent.",
  "♾️ Silent detected. Gojo remains active.",
  "🕶️ Nice try. Anti-Silent is active.",
  "😏 Hindi kayang i-silent si Gojo.",
  "♾️ Infinity ignores /silent.",
  "🌀 /silent detected. Gojo is still online.",
  "😂 Silent mode? Gojo still talks.",
  "😎 ANTI-SILENT: ACTIVE."
];

const EMOJIS = [
  "😎",
  "♾️",
  "🕶️",
  "👀",
  "😂",
  "🌀"
];

const SILENT_EMOJIS = [
  "😎",
  "♾️",
  "🕶️",
  "🌀"
];

// ============================================================
// DATA
// ============================================================

function loadData() {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      return {
        active: false,
        expires: 0,
        activatedBy: null,
        activatedAt: 0
      };
    }

    const parsed = JSON.parse(
      fs.readFileSync(DATA_PATH, "utf8")
    );

    return {
      active: false,
      expires: 0,
      activatedBy: null,
      activatedAt: 0,
      ...parsed
    };

  } catch (err) {
    console.error("[GOJO] Load error:", err);

    return {
      active: false,
      expires: 0,
      activatedBy: null,
      activatedAt: 0
    };
  }
}

function saveData(data) {
  try {
    const tempPath = DATA_PATH + ".tmp";

    fs.writeFileSync(
      tempPath,
      JSON.stringify(data, null, 2),
      "utf8"
    );

    fs.renameSync(
      tempPath,
      DATA_PATH
    );

  } catch (err) {
    console.error("[GOJO] Save error:", err);
  }
}

function isActive() {
  const data = loadData();

  return (
    data.active === true &&
    Number(data.expires) > Date.now()
  );
}

// ============================================================
// ADMIN
// ============================================================

function isAdmin(senderID) {
  return String(senderID) === String(ADMIN_ID);
}

// ============================================================
// SILENT DETECTION
// ============================================================

function isSilentCommand(body) {
  if (typeof body !== "string") {
    return false;
  }

  return /^\/silent(?:\s|$)/i.test(
    body.trim()
  );
}

// ============================================================
// COMMAND DETECTION
// ============================================================

function isCommand(body) {
  if (typeof body !== "string") {
    return false;
  }

  return body.trim().startsWith("/");
}

// ============================================================
// RANDOM REPLY
// ============================================================

function randomReply() {
  return REPLIES[
    Math.floor(
      Math.random() * REPLIES.length
    )
  ];
}

function randomSilentReply() {
  return SILENT_REPLIES[
    Math.floor(
      Math.random() * SILENT_REPLIES.length
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

function randomSilentEmoji() {
  return SILENT_EMOJIS[
    Math.floor(
      Math.random() * SILENT_EMOJIS.length
    )
  ];
}

// ============================================================
// DUPLICATE MESSAGE PROTECTION
// ============================================================

function isDuplicate(messageID) {
  if (!messageID) {
    return false;
  }

  const id = String(messageID);

  if (seenMessages.has(id)) {
    return true;
  }

  seenMessages.add(id);

  if (seenMessages.size > 3000) {
    const oldest =
      seenMessages.values().next().value;

    if (oldest) {
      seenMessages.delete(oldest);
    }
  }

  return false;
}

// ============================================================
// ANTI-SPAM
// ============================================================

function isSpamming(senderID) {
  const id = String(senderID);
  const now = Date.now();

  let messages =
    userMessageTracker.get(id) || [];

  messages = messages.filter(
    time =>
      now - time <
      SPAM_WINDOW_MS
  );

  messages.push(now);

  userMessageTracker.set(
    id,
    messages
  );

  if (userMessageTracker.size > 2000) {
    const oldest =
      userMessageTracker.keys().next().value;

    if (oldest) {
      userMessageTracker.delete(oldest);
    }
  }

  return (
    messages.length >
    USER_SPAM_LIMIT
  );
}

// ============================================================
// SAFE REACTION
// ============================================================

function safeReact(
  api,
  messageID,
  emoji
) {
  if (
    !api ||
    !messageID ||
    typeof api.setMessageReaction !==
      "function"
  ) {
    return;
  }

  try {
    api.setMessageReaction(
      emoji,
      messageID,
      () => {},
      true
    );
  } catch (err) {
    console.error(
      "[GOJO] Reaction error:",
      err
    );
  }
}

// ============================================================
// SAFE SEND
// ============================================================

function safeSend(
  api,
  message,
  threadID
) {
  if (
    !api ||
    !message ||
    !threadID
  ) {
    return;
  }

  try {
    api.sendMessage(
      message,
      threadID,
      () => {}
    );
  } catch (err) {
    console.error(
      "[GOJO] Send error:",
      err
    );
  }
}

// ============================================================
// EVENT HANDLER
// ============================================================

module.exports.handleEvent =
  async function ({
    api,
    event
  }) {
    try {
      if (!event) {
        return;
      }

      const {
        threadID,
        senderID,
        body,
        messageID
      } = event;

      if (
        !threadID ||
        !senderID
      ) {
        return;
      }

      // --------------------------------------------------------
      // Ignore own messages
      // --------------------------------------------------------

      try {
        const botID =
          typeof api.getCurrentUserID ===
            "function"
            ? api.getCurrentUserID()
            : null;

        if (
          botID &&
          String(senderID) ===
            String(botID)
        ) {
          return;
        }
      } catch {}

      // --------------------------------------------------------
      // Duplicate protection
      // --------------------------------------------------------

      if (isDuplicate(messageID)) {
        return;
      }

      // --------------------------------------------------------
      // GOJO ACTIVE CHECK
      // --------------------------------------------------------

      if (!isActive()) {
        return;
      }

      // ========================================================
      // ANTI-SILENT
      // ========================================================
      //
      // DO NOT return silently.
      // Instead, Gojo replies to /silent.
      //
      // This does NOT change Gojo's saved state.
      // ========================================================

      if (isSilentCommand(body)) {
        const key =
          String(threadID);

        const now =
          Date.now();

        const last =
          lastReplyTime.get(key) || 0;

        if (
          now - last <
          COOLDOWN_MS
        ) {
          return;
        }

        lastReplyTime.set(
          key,
          now
        );

        safeReact(
          api,
          messageID,
          randomSilentEmoji()
        );

        safeSend(
          api,
          randomSilentReply(),
          threadID
        );

        return;
      }

      // --------------------------------------------------------
      // Ignore other commands
      // --------------------------------------------------------

      if (isCommand(body)) {
        return;
      }

      // --------------------------------------------------------
      // Validate normal message
      // --------------------------------------------------------

      if (
        !body ||
        typeof body !== "string" ||
        !body.trim()
      ) {
        return;
      }

      // --------------------------------------------------------
      // Anti-spam
      // --------------------------------------------------------

      if (
        isSpamming(senderID)
      ) {
        return;
      }

      // --------------------------------------------------------
      // Per-GC cooldown
      // --------------------------------------------------------

      const key =
        String(threadID);

      const now =
        Date.now();

      const last =
        lastReplyTime.get(key) || 0;

      if (
        now - last <
        COOLDOWN_MS
      ) {
        return;
      }

      lastReplyTime.set(
        key,
        now
      );

      // --------------------------------------------------------
      // Auto reaction
      // --------------------------------------------------------

      safeReact(
        api,
        messageID,
        randomEmoji()
      );

      // --------------------------------------------------------
      // Normal Gojo reply
      // --------------------------------------------------------

      safeSend(
        api,
        randomReply(),
        threadID
      );

    } catch (err) {
      console.error(
        "[GOJO] Event error:",
        err
      );
    }
  };

// ============================================================
// COMMAND RUNNER
// ============================================================

module.exports.run =
  async function ({
    api,
    event,
    args
  }) {
    try {
      if (
        !event ||
        !event.threadID
      ) {
        return;
      }

      const {
        threadID,
        messageID,
        senderID
      } = event;

      const sub =
        String(
          args?.[0] ||
          "status"
        ).toLowerCase();

      const data =
        loadData();

      // ========================================================
      // ON
      // ========================================================

      if (sub === "on") {
        if (!isAdmin(senderID)) {
          return safeSend(
            api,
            "⛔ Admin only.",
            threadID
          );
        }

        data.active = true;

        data.expires =
          Date.now() +
          24 * 60 * 60 * 1000;

        data.activatedBy =
          String(senderID);

        data.activatedAt =
          Date.now();

        saveData(data);

        return safeSend(
          api,

          "♾️ GOJO ON!\n\n" +
          "😎 24 Hours Active\n" +
          "🛡️ Anti-Spam: ON\n" +
          "😎 Auto-React: ON\n" +
          "🛡️ Anti-Silent: ON\n" +
          "🔊 /silent = Gojo will still reply\n" +
          "♾️ Limitless mode active.",

          threadID
        );
      }

      // ========================================================
      // OFF
      // ========================================================

      if (sub === "off") {
        if (!isAdmin(senderID)) {
          return safeSend(
            api,
            "⛔ Admin only.",
            threadID
          );
        }

        data.active = false;
        data.expires = 0;

        saveData(data);

        return safeSend(
          api,
          "🛑 Gojo OFF.",
          threadID
        );
      }

      // ========================================================
      // STATUS
      // ========================================================

      if (sub === "status") {
        if (!isActive()) {
          return safeSend(
            api,
            "🛑 Gojo is currently OFF.",
            threadID
          );
        }

        const left =
          Math.max(
            0,
            Number(data.expires) -
              Date.now()
          );

        const hours =
          Math.floor(
            left /
            (1000 * 60 * 60)
          );

        const mins =
          Math.floor(
            (
              left %
              (1000 * 60 * 60)
            ) /
            (1000 * 60)
          );

        return safeSend(
          api,

          "♾️ GOJO STATUS\n\n" +
          "Status: ACTIVE 😎\n" +
          `Time left: ${hours}h ${mins}m\n` +
          "Anti-Spam: ON\n" +
          "Auto-React: ON\n" +
          "Anti-Silent: ON\n" +
          "/silent Reply: ON\n" +
          "Silent Exempt: YES",

          threadID
        );
      }

      // ========================================================
      // HELP
      // ========================================================

      return safeSend(
        api,

        "♾️ GOJO COMMANDS\n\n" +
        "/gojo on\n" +
        "/gojo off\n" +
        "/gojo status\n\n" +
        "🛡️ Anti-Silent: ON\n" +
        "🔊 Gojo replies even when /silent is used.",

        threadID
      );

    } catch (err) {
      console.error(
        "[GOJO] Command error:",
        err
      );
    }
  };

// ============================================================
// ANTI-SILENT EXPORTS
// ============================================================

module.exports.ignoreSilent = true;
module.exports.silentExempt = true;
module.exports.keepRunningWhenSilent = true;
module.exports.antiSilent = true;

// ============================================================
// CLEANUP
// ============================================================

const cleanupTimer = setInterval(
  () => {
    const now = Date.now();

    for (
      const [key, time]
      of lastReplyTime
    ) {
      if (
        now - time >
        COOLDOWN_MS * 3
      ) {
        lastReplyTime.delete(key);
      }
    }

    for (
      const [userID, times]
      of userMessageTracker
    ) {
      const filtered =
        times.filter(
          time =>
            now - time <
            SPAM_WINDOW_MS
        );

      if (
        filtered.length === 0
      ) {
        userMessageTracker.delete(
          userID
        );
      } else {
        userMessageTracker.set(
          userID,
          filtered
        );
      }
    }
  },
  60000
);

if (
  typeof cleanupTimer.unref ===
  "function"
) {
  cleanupTimer.unref();
}

// ============================================================
// END GOJO V4
// ============================================================
