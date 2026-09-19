// ==========================================================
// NOVA X | ALL-IN-ONE FACEBOOK BOT MODULE
// Stable command handling + cooldown + persistent settings
// ==========================================================

const fs = require("fs");
const path = require("path");

// ==========================================================
// CONFIG
// ==========================================================

module.exports.config = {
  name: "nova",
  version: "5.0.0",
  hasPermission: 0,
  credits: "NOVA X",
  description: "All-in-one stable group utility and fun bot.",
  usePrefix: true,
  commandCategory: "System/Fun",
  usages: "/nova help",
  cooldowns: 3
};

const ADMIN_ID = "61594055835097";

const DATA_FILE = path.join(
  __dirname,
  "nova_x_data.json"
);

// ==========================================================
// SETTINGS
// ==========================================================

const DEFAULT_DATA = {
  active: false,
  roast: true,
  react: true,
  activatedBy: null,
  activatedAt: null,
  roastCount: 0,
  commandCount: 0
};

const ROAST_COOLDOWN = 8000;
const COMMAND_COOLDOWN = 2500;

const processing = new Set();
const roastCooldown = new Map();
const commandCooldown = new Map();

// ==========================================================
// CONTENT
// ==========================================================

const ROASTS = [
  "Bro really pressed send with confidence 💀",
  "That message needed a second draft 🤣",
  "The confidence is impressive. The message is questionable.",
  "Interesting choice of words 💀",
  "The group chat was peaceful five seconds ago.",
  "Bro unlocked a new level of random.",
  "Respectfully... what was the plan here? 🤣",
  "That message arrived with confidence and left with consequences.",
  "Somewhere, a grammar teacher just felt a disturbance.",
  "I have questions. Many questions. 💀",
  "The audacity is loud today.",
  "Bro cooked something. Nobody knows what it is.",
  "That was definitely a message.",
  "10/10 confidence, questionable execution.",
  "NOVA has entered the chat ⚡"
];

const EMOJIS = [
  "🔥",
  "💀",
  "🤣",
  "😆",
  "🤡"
];

// ==========================================================
// DATABASE
// ==========================================================

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      saveData(DEFAULT_DATA);
      return { ...DEFAULT_DATA };
    }

    const raw = fs.readFileSync(
      DATA_FILE,
      "utf8"
    );

    const parsed = JSON.parse(raw);

    return {
      ...DEFAULT_DATA,
      ...parsed
    };
  } catch (error) {
    console.error(
      "[NOVA X] Database error:",
      error
    );

    return { ...DEFAULT_DATA };
  }
}

function saveData(data) {
  try {
    const temporary =
      DATA_FILE + ".tmp";

    fs.writeFileSync(
      temporary,
      JSON.stringify(data, null, 2),
      "utf8"
    );

    fs.renameSync(
      temporary,
      DATA_FILE
    );

    return true;
  } catch (error) {
    console.error(
      "[NOVA X] Save error:",
      error
    );

    return false;
  }
}

// ==========================================================
// HELPERS
// ==========================================================

function isAdmin(id) {
  return String(id) === ADMIN_ID;
}

function random(array) {
  return array[
    Math.floor(Math.random() * array.length)
  ];
}

function cooldownReady(
  map,
  key,
  duration
) {
  const now = Date.now();
  const previous = map.get(key) || 0;

  if (
    now - previous <
    duration
  ) {
    return false;
  }

  map.set(key, now);
  return true;
}

function send(api, message, threadID, replyID) {
  return new Promise((resolve) => {
    try {
      api.sendMessage(
        message,
        threadID,
        (error, info) => {
          if (error) {
            console.error(
              "[NOVA X] sendMessage:",
              error
            );

            resolve(null);
            return;
          }

          resolve(info || null);
        },
        replyID
      );
    } catch (error) {
      console.error(
        "[NOVA X] send exception:",
        error
      );

      resolve(null);
    }
  });
}

function react(api, emoji, messageID) {
  if (!messageID) return;

  try {
    api.setMessageReaction(
      emoji,
      messageID,
      (error) => {
        if (error) {
          console.error(
            "[NOVA X] reaction:",
            error
          );
        }
      },
      true
    );
  } catch (error) {
    console.error(
      "[NOVA X] reaction exception:",
      error
    );
  }
}

function sleep(ms) {
  return new Promise(
    resolve => setTimeout(resolve, ms)
  );
}

// ==========================================================
// EVENT HANDLER
// ==========================================================

module.exports.handleEvent =
async function ({ api, event }) {

  try {

    if (!event) return;

    const {
      threadID,
      senderID,
      body
    } = event;

    if (
      !threadID ||
      !senderID ||
      !body
    ) {
      return;
    }

    // Ignore bot's own messages.
    try {
      const botID =
        api.getCurrentUserID();

      if (
        botID &&
        String(botID) ===
        String(senderID)
      ) {
        return;
      }
    } catch (_) {}

    const text =
      String(body).trim();

    if (!text) return;

    // Ignore commands.
    if (
      text.startsWith("/") ||
      text.startsWith("!")
    ) {
      return;
    }

    const data = loadData();

    if (!data.active) return;

    if (!data.roast) return;

    // Prevent simultaneous processing.
    if (
      processing.has(threadID)
    ) {
      return;
    }

    // Per-group cooldown.
    if (
      !cooldownReady(
        roastCooldown,
        threadID,
        ROAST_COOLDOWN
      )
    ) {
      return;
    }

    processing.add(threadID);

    try {

      const message =
        random(ROASTS);

      const emoji =
        random(EMOJIS);

      const info =
        await send(
          api,
          message,
          threadID
        );

      if (
        data.react &&
        info &&
        info.messageID
      ) {
        react(
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
        "[NOVA X] Event processing:",
        error
      );

    } finally {

      processing.delete(
        threadID
      );
    }

  } catch (error) {

    console.error(
      "[NOVA X] handleEvent:",
      error
    );
  }
};

// ==========================================================
// COMMAND HANDLER
// ==========================================================

module.exports.run =
async function ({
  api,
  event,
  args
}) {

  const threadID =
    event.threadID;

  const messageID =
    event.messageID;

  const senderID =
    event.senderID;

  try {

    const command =
      String(
        args?.[0] || "help"
      ).toLowerCase();

    // ------------------------------------------------------
    // ADMIN COMMANDS
    // ------------------------------------------------------

    const adminCommands = [
      "on",
      "off",
      "roast",
      "react",
      "setnick",
      "setgname"
    ];

    if (
      adminCommands.includes(command) &&
      !isAdmin(senderID)
    ) {
      return send(
        api,
        "🔒 This NOVA X control is admin-only.",
        threadID,
        messageID
      );
    }

    // Command cooldown.
    if (
      !cooldownReady(
        commandCooldown,
        senderID,
        COMMAND_COOLDOWN
      )
    ) {
      return;
    }

    const data = loadData();

    data.commandCount =
      Number(data.commandCount || 0) + 1;

    saveData(data);

    // ------------------------------------------------------
    // ON
    // ------------------------------------------------------

    if (command === "on") {

      data.active = true;
      data.activatedBy = senderID;
      data.activatedAt = Date.now();

      saveData(data);

      return send(
        api,
        [
          "╔══════════════════════╗",
          "        ⚡ NOVA X",
          "╚══════════════════════╝",
          "",
          "🟢 SYSTEM: ONLINE",
          "🔥 AUTO-ROAST: ON",
          "⚡ SELF-REACT: ON",
          "🛡️ COOLDOWN: ON",
          "💾 DATABASE: SAVED",
          "",
          "NOVA X is ready."
        ].join("\n"),
        threadID,
        messageID
      );
    }

    // ------------------------------------------------------
    // OFF
    // ------------------------------------------------------

    if (command === "off") {

      data.active = false;

      saveData(data);

      return send(
        api,
        "🔴 NOVA X auto system has been turned OFF.",
        threadID,
        messageID
      );
    }

    // ------------------------------------------------------
    // ROAST TOGGLE
    // ------------------------------------------------------

    if (command === "roast") {

      const mode =
        String(
          args?.[1] || ""
        ).toLowerCase();

      if (
        mode !== "on" &&
        mode !== "off"
      ) {
        return send(
          api,
          "Usage: /nova roast on | off",
          threadID,
          messageID
        );
      }

      data.roast =
        mode === "on";

      saveData(data);

      return send(
        api,
        `🔥 Auto-roast: ${
          data.roast
            ? "ENABLED"
            : "DISABLED"
        }`,
        threadID,
        messageID
      );
    }

    // ------------------------------------------------------
    // REACT TOGGLE
    // ------------------------------------------------------

    if (command === "react") {

      const mode =
        String(
          args?.[1] || ""
        ).toLowerCase();

      if (
        mode !== "on" &&
        mode !== "off"
      ) {
        return send(
          api,
          "Usage: /nova react on | off",
          threadID,
          messageID
        );
      }

      data.react =
        mode === "on";

      saveData(data);

      return send(
        api,
        `⚡ Self-react: ${
          data.react
            ? "ENABLED"
            : "DISABLED"
        }`,
        threadID,
        messageID
      );
    }

    // ------------------------------------------------------
    // STATUS
    // ------------------------------------------------------

    if (command === "status") {

      const status =
        data.active
          ? "ONLINE 🟢"
          : "OFFLINE 🔴";

      const activated =
        data.activatedAt
          ? new Date(
              data.activatedAt
            ).toLocaleString()
          : "Never";

      return send(
        api,
        [
          "╔══════════════════════╗",
          "        NOVA X STATUS",
          "╚══════════════════════╝",
          "",
          `System: ${status}`,
          `Auto-roast: ${data.roast ? "ON" : "OFF"}`,
          `Self-react: ${data.react ? "ON" : "OFF"}`,
          `Roasts: ${data.roastCount || 0}`,
          `Commands: ${data.commandCount || 0}`,
          `Activated: ${activated}`,
          "",
          "Cooldown: 8 seconds/group"
        ].join("\n"),
        threadID,
        messageID
      );
    }

    // ------------------------------------------------------
    // INFO
    // ------------------------------------------------------

    if (command === "info") {

      return send(
        api,
        [
          "⚡ NOVA X",
          "",
          "Version: 5.0.0",
          "Mode: Stable",
          "Database: Persistent",
          "Protection: Enabled",
          "",
          `Admin ID: ${ADMIN_ID}`
        ].join("\n"),
        threadID,
        messageID
      );
    }

    // ------------------------------------------------------
    // SET NICKNAME
    // ------------------------------------------------------

    if (command === "setnick") {

      let info;

      try {
        info =
          await api.getThreadInfo(
            threadID
          );
      } catch (error) {

        console.error(
          "[NOVA X] getThreadInfo:",
          error
        );

        return send(
          api,
          "❌ Hindi makuha ang group information.",
          threadID,
          messageID
        );
      }

      const members =
        info?.participantIDs || [];

      if (!members.length) {
        return send(
          api,
          "❌ Walang members na nakuha.",
          threadID,
          messageID
        );
      }

      const nickname =
        args.slice(1).join(" ").trim() ||
        "NOVA X";

      await send(
        api,
        `⏳ Setting nickname to "${nickname}" for ${members.length} members...`,
        threadID
      );

      let success = 0;
      let failed = 0;

      for (
        const userID of members
      ) {

        try {

          await new Promise(
            resolve => {

              api.changeNickname(
                nickname,
                threadID,
                userID,
                error => {

                  if (error) {
                    failed++;
                  } else {
                    success++;
                  }

                  resolve();
                }
              );

            }
          );

          // Prevent request burst.
          await sleep(400);

        } catch (_) {
          failed++;
        }
      }

      return send(
        api,
        [
          "✅ Nickname process finished.",
          "",
          `Nickname: ${nickname}`,
          `Success: ${success}`,
          `Failed: ${failed}`
        ].join("\n"),
        threadID,
        messageID
      );
    }

    // ------------------------------------------------------
    // SET GROUP NAME
    // ------------------------------------------------------

    if (command === "setgname") {

      const newName =
        args.slice(1).join(" ").trim();

      if (!newName) {
        return send(
          api,
          "Usage: /nova setgname <new name>",
          threadID,
          messageID
        );
      }

      try {

        await new Promise(
          resolve => {

            api.setTitle(
              newName,
              threadID,
              error => {

                if (error) {
                  console.error(
                    "[NOVA X] setTitle:",
                    error
                  );
                }

                resolve();
              }
            );

          }
        );

        return send(
          api,
          `✅ Group name changed to:\n${newName}`,
          threadID,
          messageID
        );

      } catch (error) {

        console.error(
          "[NOVA X] setgname:",
          error
        );

        return send(
          api,
          "❌ Failed to change the group name. Check the bot's group permissions.",
          threadID,
          messageID
        );
      }
    }

    // ------------------------------------------------------
    // HELP
    // ------------------------------------------------------

    return send(
      api,
      [
        "╔══════════════════════╗",
        "          ⚡ NOVA X",
        "╚══════════════════════╝",
        "",
        "SYSTEM",
        "/nova on",
        "/nova off",
        "/nova status",
        "/nova info",
        "",
        "AUTO FEATURES",
        "/nova roast on",
        "/nova roast off",
        "/nova react on",
        "/nova react off",
        "",
        "GROUP",
        "/nova setnick <name>",
        "/nova setgname <name>",
        "",
        "🛡️ Admin controls protected",
        "⚡ Cooldown enabled",
        "💾 Persistent database",
        "🔧 Error handling enabled"
      ].join("\n"),
      threadID,
      messageID
    );

  } catch (error) {

    console.error(
      "[NOVA X] Command error:",
      error
    );

    return send(
      api,
      "⚠️ NOVA X encountered an error while processing the command.",
      threadID,
      messageID
    );
  }
};
