// ==========================================================
// NOVA BOT | STABLE AUTO-ROAST MODULE
// Version 3.0
// Persistent settings + cooldown + error recovery
// ==========================================================

const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "nova",
  version: "3.0.0",
  hasPermission: 0,
  credits: "NOVA",
  description: "Stable auto-roast with admin controls and cooldown.",
  usePrefix: true,
  commandCategory: "Fun",
  usages: "/nova on | off | status | setnick | setgname",
  cooldowns: 5
};

// ==========================================================
// CONFIG
// ==========================================================

const ADMIN_ID = "61594055835097";

const DATA_PATH = path.join(__dirname, "nova_data.json");

const REACT_EMOJIS = [
  "🔥",
  "💀",
  "🤣",
  "😆",
  "🤡"
];

const ROASTS = [
  "Bro really thought that message was necessary 💀",
  "The confidence is impressive. The message? Not so much.",
  "You typed all that just to embarrass yourself?",
  "Main character energy, questionable plot.",
  "The group chat was peaceful until this message appeared.",
  "That was certainly a choice 💀",
  "Somewhere, a grammar teacher just felt a disturbance.",
  "Bro pressed send with absolute confidence.",
  "That message needs a second draft.",
  "I have no words... and somehow you used all of them.",
  "The audacity is loud today.",
  "Respectfully, what was the plan here? 🤣",
  "That message arrived with confidence and left with consequences.",
  "Bro unlocked a new level of random.",
  "Interesting message. Very interesting. 💀"
];

// ==========================================================
// RUNTIME CONTROL
// ==========================================================

// Prevent multiple replies to the same thread at once.
const processingThreads = new Set();

// Per-thread cooldown.
const cooldowns = new Map();

// Prevent repeated command execution.
const commandCooldowns = new Map();

const ROAST_COOLDOWN = 8000;
const COMMAND_COOLDOWN = 3000;

// ==========================================================
// DATA
// ==========================================================

function defaultData() {
  return {
    active: false,
    activatedBy: null,
    activatedAt: null,
    roastCount: 0
  };
}

function loadData() {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      const data = defaultData();
      saveData(data);
      return data;
    }

    const raw = fs.readFileSync(DATA_PATH, "utf8");
    const data = JSON.parse(raw);

    return {
      ...defaultData(),
      ...data
    };
  } catch (error) {
    console.error("[NOVA] Data load error:", error);
    return defaultData();
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(
      DATA_PATH,
      JSON.stringify(data, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error("[NOVA] Data save error:", error);
  }
}

// ==========================================================
// HELPERS
// ==========================================================

function isAdmin(senderID) {
  return String(senderID) === ADMIN_ID;
}

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function canProcess(map, key, duration) {
  const now = Date.now();
  const last = map.get(key) || 0;

  if (now - last < duration) {
    return false;
  }

  map.set(key, now);
  return true;
}

function safeSend(api, message, threadID, replyTo) {
  return new Promise((resolve) => {
    try {
      api.sendMessage(
        message,
        threadID,
        (error, info) => {
          if (error) {
            console.error("[NOVA] sendMessage error:", error);
            return resolve(null);
          }

          resolve(info || null);
        },
        replyTo
      );
    } catch (error) {
      console.error("[NOVA] sendMessage exception:", error);
      resolve(null);
    }
  });
}

function safeReact(api, emoji, messageID) {
  if (!messageID) return;

  try {
    api.setMessageReaction(
      emoji,
      messageID,
      (error) => {
        if (error) {
          console.error("[NOVA] reaction error:", error);
        }
      },
      true
    );
  } catch (error) {
    console.error("[NOVA] reaction exception:", error);
  }
}

// ==========================================================
// EVENT HANDLER
// ==========================================================

module.exports.handleEvent = async function ({ api, event }) {
  try {
    if (!event) return;

    const {
      threadID,
      senderID,
      body
    } = event;

    if (!threadID || !senderID || !body) return;

    // Ignore own messages.
    let botID = null;

    try {
      botID = api.getCurrentUserID();
    } catch (_) {}

    if (botID && String(senderID) === String(botID)) {
      return;
    }

    const text = String(body).trim();

    // Ignore commands.
    if (
      text.startsWith("/") ||
      text.startsWith("!")
    ) {
      return;
    }

    const data = loadData();

    if (!data.active) return;

    // Only one automatic response at a time per thread.
    if (processingThreads.has(threadID)) {
      return;
    }

    // Thread cooldown.
    if (!canProcess(cooldowns, threadID, ROAST_COOLDOWN)) {
      return;
    }

    processingThreads.add(threadID);

    try {
      const roast = randomItem(ROASTS);
      const emoji = randomItem(REACT_EMOJIS);

      const info = await safeSend(
        api,
        roast,
        threadID
      );

      if (info && info.messageID) {
        safeReact(
          api,
          emoji,
          info.messageID
        );
      }

      data.roastCount =
        Number(data.roastCount || 0) + 1;

      saveData(data);

    } catch (error) {
      console.error(
        "[NOVA] Auto-roast error:",
        error
      );
    } finally {
      processingThreads.delete(threadID);
    }

  } catch (error) {
    // Important: event errors should not kill the whole module.
    console.error(
      "[NOVA] Event handler error:",
      error
    );
  }
};

// ==========================================================
// COMMAND HANDLER
// ==========================================================

module.exports.run = async function ({
  api,
  event,
  args
}) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const senderID = event.senderID;

  try {
    // Admin-only controls.
    if (!isAdmin(senderID)) {
      return safeSend(
        api,
        "❌ NOVA controls are available only to the bot admin.",
        threadID,
        messageID
      );
    }

    // Command cooldown.
    if (
      !canProcess(
        commandCooldowns,
        senderID,
        COMMAND_COOLDOWN
      )
    ) {
      return;
    }

    const sub = String(
      args?.[0] || ""
    ).toLowerCase();

    const data = loadData();

    // ======================================================
    // ON
    // ======================================================

    if (sub === "on") {
      data.active = true;
      data.activatedBy = senderID;
      data.activatedAt = Date.now();

      saveData(data);

      return safeSend(
        api,
        [
          "╔════════════════════╗",
          "      ⚡ NOVA BOT",
          "╚════════════════════╝",
          "",
          "✅ Auto-roast: ON",
          "🛡️ Cooldown: ENABLED",
          "🔥 Self-react: ENABLED",
          "💾 Persistent state: ENABLED",
          "",
          "Use /nova off to stop."
        ].join("\n"),
        threadID,
        messageID
      );
    }

    // ======================================================
    // OFF
    // ======================================================

    if (sub === "off") {
      data.active = false;

      saveData(data);

      return safeSend(
        api,
        "🛑 NOVA auto-roast has been turned OFF.",
        threadID,
        messageID
      );
    }

    // ======================================================
    // STATUS
    // ======================================================

    if (sub === "status") {
      const status =
        data.active ? "ONLINE 🟢" : "OFFLINE 🔴";

      const activated =
        data.activatedAt
          ? new Date(data.activatedAt)
              .toLocaleString()
          : "Not activated";

      return safeSend(
        api,
        [
          "╔════════════════════╗",
          "       NOVA STATUS",
          "╚════════════════════╝",
          "",
          `Status: ${status}`,
          `Roasts sent: ${data.roastCount || 0}`,
          `Activated: ${activated}`,
          "Cooldown: 8 seconds/thread",
          "Self-react: ENABLED",
          "Persistent storage: ENABLED"
        ].join("\n"),
        threadID,
        messageID
      );
    }

    // ======================================================
    // SET NICKNAME
    // ======================================================

    if (sub === "setnick") {
      let threadInfo;

      try {
        threadInfo =
          await api.getThreadInfo(threadID);
      } catch (error) {
        console.error(
          "[NOVA] getThreadInfo error:",
          error
        );

        return safeSend(
          api,
          "❌ Hindi makuha ang group information.",
          threadID,
          messageID
        );
      }

      const participants =
        threadInfo?.participantIDs || [];

      if (!participants.length) {
        return safeSend(
          api,
          "❌ Walang members na nakuha sa group.",
          threadID,
          messageID
        );
      }

      const nickname = "NOVA";

      await safeSend(
        api,
        `⏳ Updating nicknames for ${participants.length} members...`,
        threadID
      );

      let success = 0;
      let failed = 0;

      // Sequential processing para hindi sabay-sabay
      // ang requests.
      for (const userID of participants) {
        try {
          await new Promise((resolve) => {
            api.changeNickname(
              nickname,
              threadID,
              userID,
              (error) => {
                if (error) {
                  failed++;
                } else {
                  success++;
                }

                // Small delay between requests.
                setTimeout(resolve, 350);
              }
            );
          });
        } catch (_) {
          failed++;
        }
      }

      return safeSend(
        api,
        [
          "✅ Nickname update finished.",
          "",
          `Success: ${success}`,
          `Failed: ${failed}`
        ].join("\n"),
        threadID,
        messageID
      );
    }

    // ======================================================
    // SET GROUP NAME
    // ======================================================

    if (sub === "setgname") {
      const groupName =
        "NOVA BOT • OFFICIAL GC";

      try {
        await new Promise((resolve) => {
          api.setTitle(
            groupName,
            threadID,
            (error) => {
              if (error) {
                console.error(
                  "[NOVA] setTitle error:",
                  error
                );
              }

              resolve();
            }
          );
        });

        return safeSend(
          api,
          `✅ Group name changed to:\n${groupName}`,
          threadID,
          messageID
        );

      } catch (error) {
        console.error(
          "[NOVA] group name exception:",
          error
        );

        return safeSend(
          api,
          "❌ Hindi ma-change ang group name. Kailangan ng bot ng sapat na group permissions.",
          threadID,
          messageID
        );
      }
    }

    // ======================================================
    // HELP
    // ======================================================

    return safeSend(
      api,
      [
        "╔════════════════════╗",
        "        ⚡ NOVA BOT",
        "╚════════════════════╝",
        "",
        "/nova on",
        "→ Enable auto-roast",
        "",
        "/nova off",
        "→ Disable auto-roast",
        "",
        "/nova status",
        "→ Show bot status",
        "",
        "/nova setnick",
        "→ Set member nicknames to NOVA",
        "",
        "/nova setgname",
        "→ Change group name",
        "",
        "🛡️ Admin controls only",
        "⚡ Cooldown enabled",
        "💾 Settings are persistent"
      ].join("\n"),
      threadID,
      messageID
    );

  } catch (error) {
    console.error(
      "[NOVA] Command handler error:",
      error
    );

    return safeSend(
      api,
      "⚠️ NOVA encountered an error while processing that command.",
      threadID,
      messageID
    );
  }
};
