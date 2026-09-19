const fs = require("fs");
const path = require("path");

const ADMIN_ID = "61594055835097";
const BOT_NAME = "VOID";
const DATA_PATH = path.join(__dirname, "void_data.json");

const GROUP_COOLDOWN = 8000;
const USER_COOLDOWN = 12000;

const REPLIES = [
  "VOID: May banat ka pa? 😂",
  "VOID: Sige lang, pakita mo pa galing mo 😭",
  "VOID: Parang kulang yung banat mo ah 😂",
  "VOID: Narinig ka namin. Next! 😎",
  "VOID: Huwag kang pikon, biruan lang 😂",
  "VOID: May kasunod pa ba o hanggang doon lang? 👀",
  "VOID: Relax lang, GC lang 'to 😂",
  "VOID: Sige, laban lang sa banat 😭"
];

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  } catch {
    return {};
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function send(api, event, message) {
  return api.sendMessage(message, event.threadID, event.messageID);
}

function isOwner(event) {
  return String(event.senderID) === ADMIN_ID;
}

const groupCooldown = new Map();
const userCooldown = new Map();

module.exports.config = {
  name: "void",
  version: "1.0.0",
  hasPermission: 0,
  credits: "VOID",
  description: "Per-GC troll bot",
  usePrefix: false,
  commandCategory: "Group",
  usages: "void help",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args }) {
  const action = String(args[0] || "").toLowerCase();
  const threadID = String(event.threadID);

  const data = loadData();

  if (!data[threadID]) {
    data[threadID] = {
      enabled: false
    };
  }

  if (action === "help") {
    return send(api, event, [
      `🤖 ${BOT_NAME}`,
      "",
      "void on",
      "void off",
      "void status",
      "void help",
      "",
      "Per-GC ang ON/OFF."
    ].join("\n"));
  }

  if (action === "on") {
    if (!isOwner(event)) {
      return send(api, event,
        "⛔ Owner lang ang puwedeng mag-ON ng VOID."
      );
    }

    data[threadID].enabled = true;
    saveData(data);

    return send(api, event,
      "⚡ VOID ON — activated sa GC na ito."
    );
  }

  if (action === "off") {
    if (!isOwner(event)) {
      return send(api, event,
        "⛔ Owner lang ang puwedeng mag-OFF ng VOID."
      );
    }

    data[threadID].enabled = false;
    saveData(data);

    return send(api, event,
      "🛑 VOID OFF — disabled sa GC na ito."
    );
  }

  if (action === "status") {
    return send(api, event,
      `🤖 VOID STATUS\n\n` +
      `GC: ${data[threadID].enabled ? "ON ⚡" : "OFF 🛑"}`
    );
  }

  return send(api, event,
    "❌ Gamitin: void help"
  );
};

module.exports.handleEvent = async function ({ api, event }) {
  if (!event) return;
  if (!event.threadID || !event.body || !event.senderID) return;

  const threadID = String(event.threadID);
  const senderID = String(event.senderID);

  // Huwag reply sa sariling owner messages.
  if (senderID === ADMIN_ID) return;

  const data = loadData();

  if (!data[threadID]?.enabled) return;

  const now = Date.now();

  const lastGroupReply =
    groupCooldown.get(threadID) || 0;

  const userKey =
    `${threadID}:${senderID}`;

  const lastUserReply =
    userCooldown.get(userKey) || 0;

  // Global per-GC cooldown.
  if (now - lastGroupReply < GROUP_COOLDOWN) return;

  // Per-user cooldown.
  if (now - lastUserReply < USER_COOLDOWN) return;

  const message =
    String(event.body).trim().toLowerCase();

  const triggerWords = [
    "haha",
    "😂",
    "banat",
    "pikon",
    "away",
    "troll"
  ];

  const triggered = triggerWords.some(word =>
    message.includes(word)
  );

  if (!triggered) return;

  groupCooldown.set(threadID, now);
  userCooldown.set(userKey, now);

  const reply =
    REPLIES[
      Math.floor(Math.random() * REPLIES.length)
    ];

  return api.sendMessage(
    reply,
    event.threadID
  );
};
