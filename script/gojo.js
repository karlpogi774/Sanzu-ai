
 // ======================================================
 // GOJO BOT V11 | STABLE QUEUE EDITION
 // Filename: gojo.js
 // Trigger: gojo
 // ======================================================

const fs = require("fs");
const path = require("path");

const ADMIN_ID = "61594055835097";
const DATA_FILE = path.join(__dirname, "gojo_data.json");
const LOG_FILE = path.join(__dirname, "gojo_error.log");

const DEFAULT_DATA = {
  active: true,
  autoReact: true,
  delay: 2000,
  cooldown: 3000,
  totalReplies: 0
};

const MAX_QUEUE = 100;
const MAX_SEEN = 3000;

let data = { ...DEFAULT_DATA };
const queue = [];
let queueRunning = false;

const seenMessages = new Set();
const userLastReply = new Map();

// ==================== LOAD / SAVE =====================

function logError(where, error) {
  const message =
    `[${new Date().toISOString()}] ${where}: ` +
    `${error?.stack || error}\n`;

  console.error(message);

  try {
    fs.appendFileSync(LOG_FILE, message);
  } catch (_) {}
}

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return;

    const saved = JSON.parse(
      fs.readFileSync(DATA_FILE, "utf8")
    );

    data = { ...DEFAULT_DATA, ...saved };
  } catch (error) {
    logError("Load data failed", error);
    data = { ...DEFAULT_DATA };
  }
}

function saveData() {
  try {
    const tempFile = DATA_FILE + ".tmp";

    fs.writeFileSync(
      tempFile,
      JSON.stringify(data, null, 2),
      "utf8"
    );

    fs.renameSync(tempFile, DATA_FILE);
  } catch (error) {
    logError("Save data failed", error);
  }
}

loadData();

// ==================== REPLY BANK ======================

const GOJO_QUOTES = [
  "Sa buong langit at lupa, ako lamang ang nag-iisang Honored One. ♾️",
  "Infinity ang pagitan natin. 😎",
  "Domain Expansion: Infinite Void. 🌌",
  "Relax ka lang. Nandito na ang pinakamalakas. 💙",
  "Six Eyes activated. 👁️",
  "Hindi ako nagyayabang. Sinasabi ko lang ang katotohanan. 😏",
  "Gojo mode: ON. ♾️",
  "Masyado kang mabagal para sa Infinity ko. ⚡",
  "Walang drama. Isang reply lang, sapat na. 😂",
  "Nasa ibang level ang laro ko. 🌌",
  "Hindi pa nga ako seryoso. 💙",
  "Ang lakas mo naman... sa chat. 😂",
  "Infinity barrier: activated. ♾️",
  "Sige, tuloy mo lang. Nakikinig ang Six Eyes. 👁️",
  "Ang tunay na lakas ay marunong maghintay. ⏳",
  "Gojo Satoru reporting for duty. 😎",
  "Hindi ako late. Dramatic entrance lang. ✨",
  "Walang lag sa confidence ko. ⚡",
  "Random ang quote, pero Gojo ang dating. 😂",
  "Keep calm. Infinity is handling the messages. 🌌",
  "May bagong message? Gojo has entered the chat. 😎",
  "Isang reply lang, unlimited confidence. ♾️",
  "Ang bawat message ay may sariling oras. ⏱️",
  "Six Eyes online. System ready. 👁️",
  "Walang duplicate, walang kalituhan. 💙",
  "Ang reply ay darating sa tamang oras. ⏳",
  "Gojo energy: 100%. 🔋",
  "Hindi kailangang mag-spam para maging legendary. 😎",
  "Domain Expansion: Organized Reply Queue. 🌌",
  "Infinity activated. Reply queued. ♾️",
  "Sagot na may style, hindi puro ingay. 💙",
  "Gojo's random wisdom has arrived. ✨",
  "Ang tunay na flex ay stable na bot. ⚡",
  "Minsan, ang katahimikan ay bahagi ng strategy. 😌",
  "Message received. Infinity acknowledged. ♾️",
  "Walang panic. May error log naman. 🛠️",
  "Kung may problema, debug muna bago mag-drama. 😂",
  "Gojo's got this. 😎",
  "Naka-Infinity ang depensa, naka-queue ang sagot. 🌌",
  "Six Eyes detected: may bagong message. 👁️",
  "One message, one reply. Simple lang. 💙",
  "Ang confidence ay libre. Gamitin nang maayos. 😏",
  "Walang shortcut sa pagiging Honored One. ♾️",
  "Gojo bot: ready kapag kailangan. 💙",
  "Infinity mode: stable and ready. ⚡",
  "Sino'ng nagsabing kailangan kong mag-effort? 😏",
  "Walang makakalusot sa radar ng Gojo. 👁️",
  "Sapat na ang isang reply para mapansin. 😎",
  "Queue is moving. Infinity is watching. 🌌",
  "Gojo Satoru: present. 😎"
];

const PREFIXES = [
  "♾️ Gojo mode",
  "👁️ Six Eyes",
  "🌌 Infinite Void",
  "💙 Honored One",
  "⚡ Infinity"
];

const MESSAGES = [
  "activated",
  "online",
  "detected",
  "ready",
  "checking the chat",
  "has entered the GC",
  "is watching",
  "is processing",
  "is on standby",
  "reply queued"
];

const EMOJIS = [
  "😎", "⚡", "♾️", "💙", "🌌",
  "👁️", "✨", "😂", "🔥", "🌀"
];

const REPLIES = [...GOJO_QUOTES];

for (const prefix of PREFIXES) {
  for (const message of MESSAGES) {
    for (const emoji of EMOJIS) {
      REPLIES.push(`${prefix}: ${message} ${emoji}`);
    }
  }
}

function randomReply() {
  return REPLIES[
    Math.floor(Math.random() * REPLIES.length)
  ];
}

// ==================== HELPERS =========================

function isAdmin(id) {
  return String(id) === ADMIN_ID;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function send(api, message, threadID, messageID) {
  try {
    api.sendMessage(
      message,
      threadID,
      error => {
        if (error) logError("Send failed", error);
      },
      messageID
    );
  } catch (error) {
    logError("Send exception", error);
  }
}

function react(api, messageID) {
  try {
    if (typeof api.setMessageReaction !== "function") return;

    api.setMessageReaction(
      "😆",
      messageID,
      error => {
        if (error) logError("Reaction failed", error);
      },
      true
    );
  } catch (error) {
    logError("Reaction exception", error);
  }
}

function rememberMessage(messageID) {
  const id = String(messageID);

  if (seenMessages.has(id)) return false;

  seenMessages.add(id);

  if (seenMessages.size > MAX_SEEN) {
    const oldest = seenMessages.values().next().value;
    seenMessages.delete(oldest);
  }

  return true;
}

// ==================== QUEUE ===========================

function enqueue(item) {
  if (queue.length >= MAX_QUEUE) {
    console.log("[GOJO] Queue full; message skipped.");
    return;
  }

  queue.push(item);
  startQueue();
}

function startQueue() {
  if (queueRunning) return;

  queueRunning = true;

  processQueue()
    .catch(error => logError("Queue error", error))
    .finally(() => {
      queueRunning = false;

      if (queue.length > 0 && data.active) {
        startQueue();
      }
    });
}

async function processQueue() {
  while (queue.length > 0 && data.active) {
    const item = queue[0];

    if (!data.active) break;

    const key = `${item.threadID}:${item.senderID}`;
    const last = userLastReply.get(key) || 0;
    const wait = data.cooldown - (Date.now() - last);

    if (wait > 0) {
      await sleep(wait);
      continue;
    }

    await sleep(Math.max(0, Number(data.delay) || 0));

    if (!data.active) break;

    const sent = await new Promise(resolve => {
      try {
        item.api.sendMessage(
          `♾️ [GOJO SATORU]\n\n${randomReply()}`,
          item.threadID,
          error => {
            if (error) logError("Queue send failed", error);
            resolve(!error);
          },
          item.messageID
        );
      } catch (error) {
        logError("Queue send exception", error);
        resolve(false);
      }
    });

    queue.shift();

    if (sent) {
      userLastReply.set(key, Date.now());
      data.totalReplies += 1;
      saveData();
    } else {
      await sleep(2000);
    }
  }

  // Remove queued items when disabled.
  if (!data.active) {
    queue.length = 0;
  }
}

// ==================== CONFIG ==========================

module.exports.config = {
  name: "gojo",
  version: "11.1.0",
  hasPermission: 0,
  credits: "Gojo Infinity Edition",
  description: "Gojo trigger reply with queue management",
  usePrefix: false,
  commandCategory: "AI",
  usages: "gojo help",
  cooldowns: 2
};

// ==================== EVENT HANDLER ===================

module.exports.handleEvent = async function ({ api, event }) {
  try {
    if (!api || !event) return;

    const {
      threadID,
      senderID,
      messageID,
      body
    } = event;

    if (!threadID || !senderID || !messageID) return;

    const sender = String(senderID);
    const botID = String(api.getCurrentUserID?.() || "");

    if (sender === botID || isAdmin(sender)) return;
    if (!rememberMessage(messageID)) return;

    if (!data.active) return;

    // Explicit trigger only, to avoid replying to every GC message.
    if (String(body || "").trim().toLowerCase() !== "gojo") {
      return;
    }

    if (data.autoReact) {
      react(api, messageID);
    }

    enqueue({
      api,
      threadID,
      senderID: sender,
      messageID: String(messageID)
    });
  } catch (error) {
    logError("handleEvent error", error);
  }
};

// ==================== COMMANDS ========================

module.exports.run = async function ({ api, event, args }) {
  try {
    const threadID = event.threadID;
    const messageID = event.messageID;
    const senderID = String(event.senderID || "");
    const action = String(args?.[0] || "help").toLowerCase();

    const adminActions = [
      "on", "off", "delay", "cooldown",
      "reacton", "reactoff"
    ];

    if (adminActions.includes(action) && !isAdmin(senderID)) {
      return send(
        api,
        "⛔ Admin lamang ang puwedeng gumamit nito.",
        threadID,
        messageID
      );
    }

    if (action === "help") {
      return send(
        api,
        `🌌 GOJO COMMANDS 🌌

gojo help
gojo status
gojo on
gojo off
gojo quote
gojo delay 2000
gojo cooldown 3000
gojo reacton
gojo reactoff

Trigger: gojo`,
        threadID,
        messageID
      );
    }

    if (action === "status") {
      return send(
        api,
        `🌌 GOJO STATUS 🌌

Auto-reply: ${data.active ? "ON 🟢" : "OFF 🔴"}
Auto-react: ${data.autoReact ? "ON 🟢" : "OFF 🔴"}
Delay: ${data.delay} ms
Cooldown: ${data.cooldown} ms
Queue: ${queue.length}/${MAX_QUEUE}
Total replies: ${data.totalReplies}
Reply bank: ${REPLIES.length}`,
        threadID,
        messageID
      );
    }

    if (action === "quote") {
      return send(
        api,
        `♾️ [GOJO SATORU]\n\n${randomReply()}`,
        threadID,
        messageID
      );
    }

    if (action === "on") {
      data.active = true;
      saveData();
      startQueue();

      return send(api, "🚀 Gojo auto-reply is ON!", threadID, messageID);
    }

    if (action === "off") {
      data.active = false;
      queue.length = 0;
      saveData();

      return send(api, "🛑 Gojo auto-reply is OFF. Queue cleared.", threadID, messageID);
    }

    if (action === "reacton") {
      data.autoReact = true;
      saveData();

      return send(api, "😆 Auto-reaction enabled!", threadID, messageID);
    }

    if (action === "reactoff") {
      data.autoReact = false;
      saveData();

      return send(api, "🔕 Auto-reaction disabled.", threadID, messageID);
    }

    if (action === "delay") {
      const value = Number(args?.[1]);

      if (!Number.isFinite(value) || value < 0 || value > 10000) {
        return send(api, "Gamitin: gojo delay 0-10000", threadID, messageID);
      }

      data.delay = value;
      saveData();

      return send(api, `⏱️ Delay set to ${value} ms.`, threadID, messageID);
    }

    if (action === "cooldown") {
      const value = Number(args?.[1]);

      if (!Number.isFinite(value) || value < 0 || value > 60000) {
        return send(api, "Gamitin: gojo cooldown 0-60000", threadID, messageID);
      }

      data.cooldown = value;
      saveData();

      return send(api, `🕒 Cooldown set to ${value} ms.`, threadID, messageID);
    }

    return send(api, "Unknown command. Gamitin ang gojo help.", threadID, messageID);
  } catch (error) {
    logError("Command error", error);
  }
};
    
