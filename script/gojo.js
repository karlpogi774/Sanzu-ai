// ============================================================
// GOJO BOT V2 | MAKUNAT SILENT-SAFE EDITION
// 24H Auto-Reply | Anti-Spam | Auto-React
// /silent does NOT disable Gojo
// ============================================================

"use strict";

const fs = require("fs");
const path = require("path");

// ============================================================
// CONFIG
// ============================================================

module.exports.config = {
  name: "gojo",
  version: "2.0.0",
  hasPermission: 0,
  credits: "Gojo Makunat Edition",
  description:
    "24h Gojo auto-reply with anti-spam, auto-react and silent-safe protection.",
  usePrefix: true,
  commandCategory: "Fun",
  usages:
    "/gojo on — start\n/gojo off — stop\n/gojo status — check",
  cooldowns: 5,

  // For Sanzu loaders that support module-level silent exemptions.
  ignoreSilent: true,
  silentExempt: true
};

// ============================================================
// ADMIN
// ============================================================

const ADMIN_ID = "61594055835097";

// ============================================================
// DATA
// ============================================================

const DATA_PATH = path.join(__dirname, "gojo_data.json");

const DEFAULT_DATA = {
  active: false,
  expires: 0,
  activatedBy: null,
  activatedAt: 0
};

// ============================================================
// ANTI-SPAM
// ============================================================

const COOLDOWN_MS = 3000;
const USER_SPAM_LIMIT = 3;
const SPAM_WINDOW_MS = 10000;

// Prevent unlimited memory growth.
const MAX_TRACKED_USERS = 2000;
const MAX_REPLY_TRACKERS = 2000;

// ============================================================
// RUNTIME STATE
// ============================================================

const lastReplyTime = new Map();
const userMessageTracker = new Map();
const seenMessages = new Set();

const MAX_SEEN_MESSAGES = 3000;

// ============================================================
// REPLIES
// ============================================================

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

// ============================================================
// REACTION EMOJIS
// ============================================================

const EMOJIS = [
  "😎",
  "♾️",
  "🕶️",
  "👀",
  "😂",
  "🌀"
];

// ============================================================
// LOAD DATA
// ============================================================

function loadData() {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      return {
        ...DEFAULT_DATA
      };
    }

    const raw = fs.readFileSync(
      DATA_PATH,
      "utf8"
    );

    const parsed = JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed !== "object"
    ) {
      return {
        ...DEFAULT_DATA
      };
    }

    return {
      ...DEFAULT_DATA,
      ...parsed
    };

  } catch (err) {
    console.error(
      "[GOJO] Data load error:",
      err
    );

    return {
      ...DEFAULT_DATA
    };
  }
}

// ============================================================
// SAVE DATA
// ============================================================

function saveData(data) {
  try {
    const tempPath =
      DATA_PATH + ".tmp";

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
    console.error(
      "[GOJO] Data save error:",
      err
    );
  }
}

// ============================================================
// ACTIVE CHECK
// ============================================================

function isActive() {
  const data = loadData();

  if (
    data.active !== true ||
    Number(data.expires) <= Date.now()
  ) {
    return false;
  }

  return true;
}

// ============================================================
// ADMIN CHECK
// ============================================================

function isAdmin(senderID) {
  return (
    String(senderID) ===
    String(ADMIN_ID)
  );
}

// ============================================================
// SILENT DETECTION
// ============================================================

function isSilentCommand(body) {
  if (
    typeof body !== "string"
  ) {
    return false;
  }

  const text =
    body.trim();

  return /^\/silent(?:\s|$)/i.test(
    text
  );
}

// ============================================================
// OTHER COMMAND DETECTION
// ============================================================

function isBotCommand(body) {
  if (
    typeof body !== "string"
  ) {
    return false;
  }

  return body.trim().startsWith("/");
}

// ============================================================
// MESSAGE DEDUPLICATION
// ============================================================

function isDuplicateMessage(messageID) {
  if (!messageID) {
    return false;
  }

  const id =
    String(messageID);

  if (seenMessages.has(id)) {
    return true;
  }

  seenMessages.add(id);

  if (
    seenMessages.size >
    MAX_SEEN_MESSAGES
  ) {
    const oldest =
      seenMessages.values()
        .next()
        .value;

    if (oldest) {
      seenMessages.delete(
        oldest
      );
    }
  }

  return false;
}

// ============================================================
// ANTI-SPAM
// ============================================================

function isSpamming(senderID) {
  const id =
    String(senderID);

  const now =
    Date.now();

  let timestamps =
    userMessageTracker.get(id);

  if (!timestamps) {
    timestamps = [];

    userMessageTracker.set(
      id,
      timestamps
    );
  }

  // Remove old entries.
  timestamps =
    timestamps.filter(
      time =>
        now - time <
        SPAM_WINDOW_MS
    );

  timestamps.push(now);

  userMessageTracker.set(
    id,
    timestamps
  );

  // Prevent unlimited user tracking.
  if (
    userMessageTracker.size >
    MAX_TRACKED_USERS
  ) {
    const first =
      userMessageTracker.keys()
        .next()
        .value;

    if (first) {
      userMessageTracker.delete(
        first
      );
    }
  }

  return (
    timestamps.length >
    USER_SPAM_LIMIT
  );
}

// ============================================================
// RANDOM REPLY
// ============================================================

function randomReply() {
  return REPLIES[
    Math.floor(
      Math.random() *
      REPLIES.length
    )
  ];
}

// ============================================================
// RANDOM EMOJI
// ============================================================

function randomEmoji() {
  return EMOJIS[
    Math.floor(
      Math.random() *
      EMOJIS.length
    )
  ];
}

// ============================================================
// SAFE REACTION
// ============================================================

function safeReact(
  api,
  messageID
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
      randomEmoji(),
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
  threadID,
  messageID
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
// CLEANUP
// ============================================================

function cleanupRuntime() {
  const now =
    Date.now();

  // Clean reply cooldowns.
  for (
    const [
      key,
      timestamp
    ] of lastReplyTime
  ) {
    if (
      now - timestamp >
      COOLDOWN_MS * 3
    ) {
      lastReplyTime.delete(
        key
      );
    }
  }

  // Clean spam trackers.
  for (
    const [
      userID,
      timestamps
    ] of userMessageTracker
  ) {
    const filtered =
      timestamps.filter(
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

  // Hard memory limits.
  while (
    lastReplyTime.size >
    MAX_REPLY_TRACKERS
  ) {
    const first =
      lastReplyTime.keys()
        .next()
        .value;

    if (!first) break;

    lastReplyTime.delete(
      first
    );
  }

  while (
    userMessageTracker.size >
    MAX_TRACKED_USERS
  ) {
    const first =
      userMessageTracker.keys()
        .next()
        .value;

    if (!first) break;

    userMessageTracker.delete(
      first
    );
  }
}

// ============================================================
// CLEANUP TIMER
// ============================================================

const cleanupTimer =
  setInterval(
    cleanupRuntime,
    60000
  );

if (
  cleanupTimer &&
  typeof cleanupTimer.unref ===
    "function"
) {
  cleanupTimer.unref();
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
        messageID,
        type
      } = event;

      if (
        !threadID ||
        !senderID
      ) {
        return;
      }

      // --------------------------------------------------------
      // Ignore bot's own messages.
      // --------------------------------------------------------

      let botID = null;

      try {
        if (
          api &&
          typeof api.getCurrentUserID ===
            "function"
        ) {
          botID =
            api.getCurrentUserID();
        }
      } catch {}

      if (
        botID &&
        String(senderID) ===
          String(botID)
      ) {
        return;
      }

      // --------------------------------------------------------
      // IMPORTANT:
      // /silent remains a valid Sanzu command.
      //
      // Gojo simply does NOT process /silent as a message.
      // It also does NOT modify Gojo's active state.
      // --------------------------------------------------------

      if (
        isSilentCommand(body)
      ) {
        return;
      }

      // --------------------------------------------------------
      // Ignore duplicate events.
      // --------------------------------------------------------

      if (
        isDuplicateMessage(
          messageID
        )
      ) {
        return;
      }

      // --------------------------------------------------------
      // Gojo must be ON.
      // --------------------------------------------------------

      if (!isActive()) {
        return;
      }

      // --------------------------------------------------------
      // Ignore ALL bot commands.
      // This keeps /silent, /gojo, etc. for the command system.
      // --------------------------------------------------------

      if (
        isBotCommand(body)
      ) {
        return;
      }

      // --------------------------------------------------------
      // Valid message only.
      // --------------------------------------------------------

      if (
        !body ||
        typeof body !== "string" ||
        !body.trim()
      ) {
        return;
      }

      // --------------------------------------------------------
      // Anti-spam.
      // --------------------------------------------------------

      if (
        isSpamming(senderID)
      ) {
        return;
      }

      // --------------------------------------------------------
      // Per-GC cooldown.
      // --------------------------------------------------------

      const threadKey =
        String(threadID);

      const now =
        Date.now();

      const last =
        lastReplyTime.get(
          threadKey
        ) || 0;

      if (
        now - last <
        COOLDOWN_MS
      ) {
        return;
      }

      // --------------------------------------------------------
      // Reaction.
      // --------------------------------------------------------

      if (
        messageID &&
        (
          type === "message" ||
          type === "message_reply" ||
          !type
        )
      ) {
        safeReact(
          api,
          messageID
        );
      }

      // --------------------------------------------------------
      // Reserve cooldown BEFORE sending.
      // Prevents duplicate replies.
      // --------------------------------------------------------

      lastReplyTime.set(
        threadKey,
        now
      );

      // --------------------------------------------------------
      // Reply.
      // --------------------------------------------------------

      safeSend(
        api,
        randomReply(),
        threadID,
        messageID
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
      // GOJO ON
      // ========================================================

      if (
        sub === "on"
      ) {
        if (
          !isAdmin(senderID)
        ) {
          return safeSend(
            api,
            "⛔ Admin only.",
            threadID,
            messageID
          );
        }

        data.active = true;

        data.expires =
          Date.now() +
          24 *
            60 *
            60 *
            1000;

        data.activatedBy =
          String(senderID);

        data.activatedAt =
          Date.now();

        saveData(data);

        return safeSend(
          api,

          "♾️ GOJO ON!\n\n" +
            "😎 24 Hours Active\n" +
            "🛡️ Anti-Spam Active\n" +
            "😎 Auto-React Active\n" +
            "🔒 /silent does not disable Gojo\n" +
            "♾️ Limitless mode active.",

          threadID,
          messageID
        );
      }

      // ========================================================
      // GOJO OFF
      // ========================================================

      if (
        sub === "off"
      ) {
        if (
          !isAdmin(senderID)
        ) {
          return safeSend(
            api,
            "⛔ Admin only.",
            threadID,
            messageID
          );
        }

        data.active = false;
        data.expires = 0;

        saveData(data);

        return safeSend(
          api,
          "🛑 Gojo OFF.",
          threadID,
          messageID
        );
      }

      // ========================================================
      // GOJO STATUS
      // ========================================================

      if (
        sub === "status"
      ) {
        if (
          !isActive()
        ) {
          return safeSend(
            api,
            "🛑 Gojo is currently OFF.",
            threadID,
            messageID
          );
        }

        const left =
          Math.max(
            0,
            Number(
              data.expires
            ) -
              Date.now()
          );

        const hours =
          Math.floor(
            left /
              (
                1000 *
                60 *
                60
              )
          );

        const mins =
          Math.floor(
            (
              left %
              (
                1000 *
                60 *
                60
              )
            ) /
              (
                1000 *
                60
              )
          );

        return safeSend(
          api,

          "♾️ GOJO STATUS\n\n" +
            "Status: ACTIVE 😎\n" +
            `Time left: ${hours}h ${mins}m\n` +
            "Anti-Spam: ON\n" +
            "Auto-React: ON\n" +
            "/silent Protection: ON\n" +
            "Silent Exempt: YES",

          threadID,
          messageID
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
          "🔒 /silent remains available.\n" +
          "♾️ Gojo is marked silent-exempt.",

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

// ============================================================
// EXPORTED SILENT PROTECTION
// ============================================================
//
// Some Sanzu loaders can check these properties before
// suppressing handleEvent modules.
//
// ============================================================

module.exports.ignoreSilent = true;
module.exports.silentExempt = true;
module.exports.keepRunningWhenSilent = true;

// ============================================================
// END
// ============================================================
