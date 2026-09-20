// ==========================================================
 // NOVA X ULTIMATE | FACEBOOK BOT MODULE
 // Admin: 61594055835097
 // ==========================================================

const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "nova",
  version: "7.0.0",
  hasPermission: 0,
  credits: "NOVA X",
  description: "NOVA X group utility and fun module",
  usePrefix: true,
  commandCategory: "System/Fun",
  usages: "/nova help",
  cooldowns: 3
};

const ADMIN_ID = "61594055835097";
const DATA_FILE = path.join(__dirname, "nova_x_data.json");

const DEFAULT_DATA = {
  active: false,
  roast: true,
  react: true,

  autoGname: false,
  autoNick: false,
  savedGname: "",
  savedNick: "",

  roastCount: 0,
  commandCount: 0,
  activatedBy: null,
  activatedAt: null
};

const ROAST_COOLDOWN = 8000;
const COMMAND_COOLDOWN = 2500;
const JOIN_COOLDOWN = 5000;

const processing = new Set();
const roastCooldown = new Map();
const commandCooldown = new Map();
const joinCooldown = new Map();

const ROASTS = [
  "Bro really pressed send with confidence 💀",
  "That message needed a second draft 🤣",
  "The confidence is impressive. The message is questionable.",
  "Interesting choice of words 💀",
  "The group chat was peaceful five seconds ago.",
  "Bro unlocked a new level of random.",
  "Respectfully... what was the plan here? 🤣",
  "That message arrived with confidence.",
  "Somewhere, a grammar teacher just felt a disturbance.",
  "I have questions. Many questions. 💀",
  "The audacity is loud today.",
  "NOVA has entered the chat ⚡"
];

const EMOJIS = ["🔥", "💀", "🤣", "😆", "🤡"];

// ==========================================================
// DATABASE
// ==========================================================

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      saveData(DEFAULT_DATA);
      return { ...DEFAULT_DATA };
    }

    const parsed = JSON.parse(
      fs.readFileSync(DATA_FILE, "utf8")
    );

    return { ...DEFAULT_DATA, ...parsed };
  } catch (error) {
    console.error("[NOVA X] Database error:", error);
    return { ...DEFAULT_DATA };
  }
}

function saveData(data) {
  try {
    const temp = DATA_FILE + ".tmp";

    fs.writeFileSync(
      temp,
      JSON.stringify(data, null, 2),
      "utf8"
    );

    fs.renameSync(temp, DATA_FILE);
    return true;
  } catch (error) {
    console.error("[NOVA X] Save error:", error);
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
  return array[Math.floor(Math.random() * array.length)];
}

function cooldownReady(map, key, duration) {
  const now = Date.now();
  const last = map.get(String(key)) || 0;

  if (now - last < duration) return false;

  map.set(String(key), now);
  return true;
}

function send(api, message, threadID, replyID) {
  return new Promise(resolve => {
    try {
      api.sendMessage(
        message,
        threadID,
        (err, info) => {
          if (err) {
            console.error("[NOVA X] Send error:", err);
            return resolve(null);
          }

          resolve(info || null);
        },
        replyID
      );
    } catch (error) {
      console.error("[NOVA X] Send exception:", error);
      resolve(null);
    }
  });
}

function react(api, emoji, messageID) {
  if (!messageID) return Promise.resolve(false);

  return new Promise(resolve => {
    try {
      if (typeof api.setMessageReaction !== "function") {
        console.error(
          "[NOVA X] setMessageReaction is not supported."
        );
        return resolve(false);
      }

      api.setMessageReaction(
        emoji,
        messageID,
        error => {
          if (error) {
            console.error("[NOVA X] Reaction failed:", error);
            return resolve(false);
          }

          resolve(true);
        },
        true
      );
    } catch (error) {
      console.error("[NOVA X] Reaction exception:", error);
      resolve(false);
    }
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function apiCall(api, method, args) {
  return new Promise(resolve => {
    try {
      if (typeof api[method] !== "function") {
        console.error(`[NOVA X] API method missing: ${method}`);
        return resolve(false);
      }

      api[method](...args, error => {
        if (error) {
          console.error(`[NOVA X] ${method} error:`, error);
          return resolve(false);
        }

        resolve(true);
      });
    } catch (error) {
      console.error(`[NOVA X] ${method} exception:`, error);
      resolve(false);
    }
  });
}

// ==========================================================
// EVENT HANDLER
// ==========================================================

module.exports.handleEvent = async function ({ api, event }) {
  if (!event) return;

  const { threadID, senderID, body } = event;

  if (!threadID) return;

  // --------------------------------------------------------
  // NEW MEMBER EVENT
  // FCA-style event: log:subscribe
  // --------------------------------------------------------

  if (event.logMessageType === "log:subscribe") {
    const data = loadData();
    const now = Date.now();
    const lastJoinRun = joinCooldown.get(String(threadID)) || 0;

    if (now - lastJoinRun < JOIN_COOLDOWN) return;

    joinCooldown.set(String(threadID), now);

    const addedParticipants =
      event.logMessageData?.addedParticipants || [];

    if (!addedParticipants.length) return;

    let botID = "";

    try {
      botID = String(api.getCurrentUserID());
    } catch (error) {
      console.error("[NOVA X] Cannot get bot ID:", error);
    }

    // Auto nickname for newly joined members
    if (data.autoNick && data.savedNick) {
      for (const member of addedParticipants) {
        const userID = String(
          member.userFbId || member.id || ""
        );

        if (!userID || userID === botID) continue;

        await apiCall(api, "changeNickname", [
          data.savedNick,
          threadID,
          userID
        ]);

        await sleep(400);
      }
    }

    // Reapply saved group name after member joins
    if (data.autoGname && data.savedGname) {
      await apiCall(api, "setTitle", [
        data.savedGname,
        threadID
      ]);
    }

    return;
  }

  // --------------------------------------------------------
  // NORMAL MESSAGE EVENTS
  // --------------------------------------------------------

  if (!senderID || !body) return;

  try {
    const botID = String(api.getCurrentUserID());

    if (String(senderID) === botID) return;
  } catch (_) {}

  const text = String(body).trim();

  if (!text || text.startsWith("/") || text.startsWith("!")) {
    return;
  }

  const data = loadData();

  if (!data.active || !data.roast) return;
  if (processing.has(String(threadID))) return;

  if (
    !cooldownReady(
      roastCooldown,
      threadID,
      ROAST_COOLDOWN
    )
  ) {
    return;
  }

  processing.add(String(threadID));

  try {
    const info = await send(
      api,
      random(ROASTS),
      threadID
    );

    if (info && info.messageID && data.react) {
      await react(
        api,
        random(EMOJIS),
        info.messageID
      );
    }

    data.roastCount =
      Number(data.roastCount || 0) + 1;

    saveData(data);
  } catch (error) {
    console.error("[NOVA X] Event error:", error);
  } finally {
    processing.delete(String(threadID));
  }
};

// ==========================================================
// COMMAND HANDLER
// ==========================================================

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  try {
    const command = String(args?.[0] || "help").toLowerCase();

    const adminCommands = [
      "on",
      "off",
      "roast",
      "react",
      "setnick",
      "setgname",
      "autonick",
      "autogname"
    ];

    if (
      adminCommands.includes(command) &&
      !isAdmin(senderID)
    ) {
      return send(
        api,
        "🔒 This command is admin-only.",
        threadID,
        messageID
      );
    }

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
        "⚡ NOVA X ONLINE\n" +
        "🔥 Auto-roast: ON\n" +
        `⚡ Self-react: ${data.react ? "ON" : "OFF"}\n` +
        "🛡️ Cooldown: ON",
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
        "🔴 NOVA X auto-roast system OFF.",
        threadID,
        messageID
      );
    }

    // ------------------------------------------------------
    // ROAST TOGGLE
    // ------------------------------------------------------

    if (command === "roast") {
      const mode = String(args?.[1] || "").toLowerCase();

      if (!["on", "off"].includes(mode)) {
        return send(
          api,
          "Usage: /nova roast on | off",
          threadID,
          messageID
        );
      }

      data.roast = mode === "on";
      saveData(data);

      return send(
        api,
        `🔥 Auto-roast: ${mode.toUpperCase()}`,
        threadID,
        messageID
      );
    }

    // ------------------------------------------------------
    // REACT TOGGLE
    // ------------------------------------------------------

    if (command === "react") {
      const mode = String(args?.[1] || "").toLowerCase();

      if (!["on", "off"].includes(mode)) {
        return send(
          api,
          "Usage: /nova react on | off",
          threadID,
          messageID
        );
      }

      data.react = mode === "on";
      saveData(data);

      return send(
        api,
        `⚡ Self-react: ${mode.toUpperCase()}`,
        threadID,
        messageID
      );
    }

    // ------------------------------------------------------
    // SET GROUP NAME
    // Saves name and applies it immediately
    // ------------------------------------------------------

    if (command === "setgname") {
      const name = args.slice(1).join(" ").trim();

      if (!name) {
        return send(
          api,
          "Usage: /nova setgname <name>",
          threadID,
          messageID
        );
      }

      data.savedGname = name;
      saveData(data);

      const success = await apiCall(
        api,
        "setTitle",
        [name, threadID]
      );

      if (!success) {
        return send(
          api,
          "❌ Group name update failed. Check bot permissions and API compatibility.",
          threadID,
          messageID
        );
      }

      return send(
        api,
        `✅ Group name changed to:\n${name}\n\nSaved for Auto Gname.`,
        threadID,
        messageID
      );
    }

    // ------------------------------------------------------
    // AUTO GROUP NAME ON/OFF
    // ------------------------------------------------------

    if (command === "autogname") {
      const mode = String(args?.[1] || "").toLowerCase();

      if (!["on", "off"].includes(mode)) {
        return send(
          api,
          "Usage: /nova autogname on | off",
          threadID,
          messageID
        );
      }

      if (mode === "on" && !data.savedGname) {
        return send(
          api,
          "❌ Set a group name first:\n/nova setgname <name>",
          threadID,
          messageID
        );
      }

      data.autoGname = mode === "on";
      saveData(data);

      return send(
        api,
        `⚡ Auto Gname: ${mode.toUpperCase()}`,
        threadID,
        messageID
      );
    }

    // ------------------------------------------------------
    // SET NICKNAME
    // Saves nickname and applies to current members
    // ------------------------------------------------------

    if (command === "setnick") {
      const nickname =
        args.slice(1).join(" ").trim() || "NOVA X";

      data.savedNick = nickname;
      saveData(data);

      let info;

      try {
        info = await api.getThreadInfo(threadID);
      } catch (error) {
        console.error("[NOVA X] getThreadInfo:", error);

        return send(
          api,
          "❌ Cannot get group information.",
          threadID,
          messageID
        );
      }

      const members = info?.participantIDs || [];

      if (!members.length) {
        return send(
          api,
          "❌ No group members found.",
          threadID,
          messageID
        );
      }

      await send(
        api,
        `⏳ Updating ${members.length} nicknames...`,
        threadID
      );

      let success = 0;
      let failed = 0;

      for (const userID of members) {
        try {
          const result = await apiCall(
            api,
            "changeNickname",
            [nickname, threadID, userID]
          );

          if (result) success++;
          else failed++;

          await sleep(400);
        } catch (error) {
          failed++;
          console.error("[NOVA X] Nickname update:", error);
        }
      }

      return send(
        api,
        "✅ Nickname update finished.\n" +
        `Success: ${success}\n` +
        `Failed: ${failed}\n` +
        "Saved for Auto Nick.",
        threadID,
        messageID
      );
    }

    // ------------------------------------------------------
    // AUTO NICKNAME ON/OFF
    // ------------------------------------------------------

    if (command === "autonick") {
      const mode = String(args?.[1] || "").toLowerCase();

      if (!["on", "off"].includes(mode)) {
        return send(
          api,
          "Usage: /nova autonick on | off",
          threadID,
          messageID
        );
      }

      if (mode === "on" && !data.savedNick) {
        return send(
          api,
          "❌ Set a nickname first:\n/nova setnick <name>",
          threadID,
          messageID
        );
      }

      data.autoNick = mode === "on";
      saveData(data);

      return send(
        api,
        `⚡ Auto Nick: ${mode.toUpperCase()}`,
        threadID,
        messageID
      );
    }

    // ------------------------------------------------------
    // STATUS
    // ------------------------------------------------------

    if (command === "status") {
      return send(
        api,
        [
          "⚡ NOVA X STATUS",
          `System: ${data.active ? "ON 🟢" : "OFF 🔴"}`,
          `Auto-roast: ${data.roast ? "ON" : "OFF"}`,
          `Self-react: ${data.react ? "ON" : "OFF"}`,
          `Auto Gname: ${data.autoGname ? "ON" : "OFF"}`,
          `Saved group name: ${data.savedGname || "Not set"}`,
          `Auto Nick: ${data.autoNick ? "ON" : "OFF"}`,
          `Saved nickname: ${data.savedNick || "Not set"}`,
          `Roasts: ${data.roastCount || 0}`,
          `Commands: ${data.commandCount || 0}`,
          `Activated: ${
            data.activatedAt
              ? new Date(data.activatedAt).toLocaleString()
              : "Never"
          }`
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
        "⚡ NOVA X\n" +
        "Version: 7.0.0\n" +
        "Admin-only controls enabled.\n" +
        "Auto Gname and Auto Nick supported when the bot API provides the required events and methods.",
        threadID,
        messageID
      );
    }

    // ------------------------------------------------------
    // HELP
    // ------------------------------------------------------

    return send(
      api,
      [
        "⚡ NOVA X COMMANDS",
        "/nova on",
        "/nova off",
        "/nova status",
        "/nova info",
        "/nova roast on | off",
        "/nova react on | off",
        "/nova setnick <name>",
        "/nova autonick on | off",
        "/nova setgname <name>",
        "/nova autogname on | off"
      ].join("\n"),
      threadID,
      messageID
    );

  } catch (error) {
    console.error("[NOVA X] Command error:", error);

    return send(
      api,
      "⚠️ NOVA X encountered an error.",
      threadID,
      messageID
    );
  }
};
