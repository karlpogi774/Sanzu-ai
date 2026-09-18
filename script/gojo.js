
// ======================================================
// GOJO BOT V10.0 | INFINITY MAKUNAT EDITION
// Sanzu AI Compatible Command Module
// ======================================================

const fs = require("fs");
const path = require("path");

// ==================== CONFIG ==========================

const ADMIN_ID = "61594055835097";

const DATA_FILE = path.join(__dirname, "gojo_exact_data.json");
const BACKUP_FILE = DATA_FILE + ".bak";
const TEMP_FILE = DATA_FILE + ".tmp";
const LOG_FILE = path.join(__dirname, "gojo_error.log");

const DEFAULT_DATA = {
  active: true,
  autoReact: true,
  delay: 2000,
  cooldown: 3000,
  totalReplies: 0
};

const MAX_QUEUE = 3000;
const MAX_SEEN = 10000;

const MESSAGE_QUEUE = [];
const SEEN_MESSAGES = new Set();
const USER_LAST_REPLY = new Map();

let queueRunning = false;

// ==================== GOJO QUOTES =====================

const GOJO_QUOTES = [
  "Sa buong langit at lupa, ako lamang ang nag-iisang Honored One. ♾️",
  "Infinity ang pagitan natin. Hindi mo ako maaabot. 😎",
  "Domain Expansion: Infinite Void. 🌌",
  "Relax ka lang. Nandito na ang pinakamalakas. 💙",
  "Isang mensahe, isang sagot. Walang doble-doble.",
  "Masyado kang mabagal para sa Infinity ko. ⚡",
  "Hindi ako nagyayabang. Sinasabi ko lang ang katotohanan. 😏",
  "Six Eyes activated. Walang nakakalusot sa paningin ko. 👁️",
  "Kalmado lang. Gojo Satoru ang kausap mo. ♾️",
  "Walang challenge na hindi kayang harapin ng kumpiyansa.",
  "Your move. Ako na ang bahala sa reply. 😎",
  "Kahit gaano ka kabilis, Infinity pa rin ang haharapin mo.",
  "Walang drama. Isang reply lang, sapat na. 😂",
  "Nasa ibang level ang laro ko. 🌌",
  "Sige lang, mag-message ka. May sagot ako diyan. 😆",
  "Relax. Hindi pa nga ako seryoso. 💙",
  "Ang lakas mo naman... sa chat. 😂",
  "Infinite Void: loading your thoughts... 🌌",
  "Hindi lahat ng tahimik ay talo. Minsan, nag-iisip lang.",
  "Gojo mode: ON. ♾️",
  "Walang duplicate dito. Unique ang bawat galaw.",
  "Sino'ng nagsabing kailangan kong mag-effort? 😏",
  "Six Eyes detected: may bagong message. 👁️",
  "Infinity never sleeps. Pero minsan kailangan ding magpahinga. 😂",
  "Ang bilis mo mag-chat. Hinay-hinay lang, boss. 😆",
  "Sige, noted. Pero Gojo pa rin ang pangalan ko. ♾️",
  "May bagong message? Hayaan mong sagutin ng legend.",
  "Ang buhay ay parang Infinite Void. Maraming iniisip.",
  "Kaya kong sagutin 'yan. Kaya mo bang tanggapin? 😎",
  "System online. Gojo is watching. 👁️",
  "Walang makakatalo sa kumpiyansa ng Honored One. 💙",
  "Infinity ang pagitan ng tanong mo at sagot ko. ♾️",
  "Relax, hindi pa nagsisimula ang tunay na laban. 😏",
  "Six Eyes: nakita ko na ang message mo. 👁️",
  "Ang bilis ng chat mo, parang may hinahabol na deadline. 😂",
  "Gojo Satoru reporting for duty. 🌌",
  "Hindi ako late. Dramatic entrance lang. 😎",
  "Isang reply lang, unlimited confidence. ♾️",
  "Walang lag ang utak ko. Server mo lang siguro. 😂",
  "Infinite Void: maraming thoughts, isang reply. 🌌",
  "Walang shortcut sa pagiging Honored One. 💙",
  "Kung confidence ang labanan, alam mo na. 😏",
  "Nakita ko ang message mo. Six Eyes yan. 👁️",
  "Sige, tuloy mo lang. Nakikinig ang Six Eyes.",
  "Walang katapusan ang Infinity, pero may cooldown. ⏱️",
  "Hindi lahat ng malakas ay maingay. Pero ako, minsan. 😂",
  "Ang reply ko ay parang Infinity: hindi mo inaasahan. ♾️",
  "Gojo mode activated. Please stand by. ⚡",
  "Walang problema na hindi kayang harapin nang kalmado.",
  "Sa dami ng messages, kailangan ng Gojo energy. 🌌",
  "Kung may tanong ka, ihanda mo rin ang sarili mo sa sagot. 😎",
  "Walang duplicate sa sistema ko. Original ang bawat galaw.",
  "Minsan, ang pinakamalakas na move ay maghintay. ⏳",
  "Infinity barrier: activated. ♾️",
  "Hindi ako nagmamadali. Ang queue ang bahala. 😌",
  "Ang bilis mo mag-type. Parang may world record ka. 😂",
  "Sagot muna bago drama. 💙",
  "Walang pressure. Gojo lang 'to. 😎",
  "Infinite Void: welcome sa random replies. 🌌",
  "Kalmado ang sistema kahit magulo ang group chat.",
  "May bagong message? Six Eyes detected. 👁️",
  "Walang nakakalusot sa radar ng Gojo. ♾️",
  "Sapat na ang isang reply para mapansin. 😏",
  "Ang tunay na lakas ay marunong maghintay ng turn.",
  "Queue is moving. Infinity is watching. 🌌",
  "Hindi kailangan ng sampung reply para mapansin. 😂",
  "Ang bawat message ay may sariling oras. ⏱️",
  "One message, one accepted reply. Simple lang.",
  "Gojo's here. Keep calm and carry on. 💙",
  "Kung may cooldown, may dahilan. 😌",
  "Sino'ng may kailangan? Ang pinakamalakas ay online. 😎",
  "Hindi ako nagtatago. Naka-Infinity lang. ♾️",
  "Walang lag sa confidence ko. ⚡",
  "Six Eyes sees all. 👁️",
  "Random ang quote, pero Gojo ang dating. 😂",
  "Minsan, ang katahimikan ay bahagi ng strategy.",
  "Infinite Void: processing your latest message. 🌌",
  "Hindi kailangang mag-spam para maging legendary.",
  "Gojo bot: ready kapag kailangan. 💙",
  "Ang tunay na Honored One, marunong maghintay.",
  "Bawat reply ay may sariling spotlight. ✨",
  "Walang away sa queue. Isa-isang pila lang.",
  "Relax lang, accepted messages ay may turn.",
  "Hindi kailangang mauna. Darating din ang turn ko. 😏",
  "Sagot ko? Depende sa random quote generator. 😂",
  "Gojo energy: 100%. Server energy: sana rin. 🔋",
  "Ang Infinity ay walang hanggan, ang messages ay marami.",
  "Walang panic. May error log naman. 🛠️",
  "Kung may problema, debug muna bago mag-drama.",
  "Keep your messages coming, respetuhin ang queue. ♾️",
  "Gojo Satoru: present. 😎",
  "Ang pinakamalakas, hindi kailangang magmadali.",
  "Message received. Infinity acknowledged. ♾️",
  "May bagong notification? Six Eyes confirmed. 👁️",
  "Ang quote na ito ay may Gojo seal. 💙",
  "Hindi ako basta-basta sumusuko. 😏",
  "One reply at a time. Ganyan ang tunay na control.",
  "Ang queue ay parang laban: hintayin ang tamang turn.",
  "Walang duplicate, walang kalituhan. 🌌",
  "Gojo system: stable mode activated. ⚡",
  "Hindi lahat ng message ay kailangang sagutin agad.",
  "Kung may delay, may dramatic timing. 😂",
  "Ang confidence ay libre. Gamitin nang maayos. 😎",
  "Infinity barrier: no unnecessary spam. ♾️",
  "Ang Honored One ay marunong ding magpahinga.",
  "Sagot na may style, hindi puro ingay. 💙",
  "Walang magic sa queue, maayos na proseso lang.",
  "Gojo's random wisdom has arrived. 🌌",
  "Message received. Huwag kalimutang ngumiti. 😆",
  "Endless Infinity, controlled replies. ♾️",
  "Six Eyes says: may bago kang message. 👁️",
  "Ang tunay na lakas ay consistency, hindi spam.",
  "Gojo bot is online. Keep the vibes friendly. 💙",
  "Kahit random ang quote, may Gojo energy.",
  "Ang delay ay hindi kahinaan. Timing 'yan. ⏱️",
  "Domain Expansion: Organized Reply Queue. 🌌",
  "Infinity activated. Reply queued. ♾️",
  "Sagot ko ay random, pero hindi doble-doble.",
  "Gojo signing off... hanggang sa susunod. 👋",
  "Walang makakatakas sa aking dad jokes. 😂",
  "Naka-Infinity ang depensa, naka-queue ang sagot.",
  "May bagong message? Gojo has entered the chat. 😎",
  "Ang bilis ng panahon, pero mas mabilis ang Six Eyes. 👁️",
  "Kung may pila, may sistema. Kung may sistema, may Gojo. ♾️",
  "Hindi ako nagmamadali. Ang mahalaga, makarating ang reply.",
  "Gojo's presence: detected. 💙",
  "Walang kalituhan, bawat message ay may sariling ID.",
  "Minsan, isang emoji lang ang kailangan. 😆",
  "Ang tunay na flex ay stable na bot. ⚡",
  "Keep calm. Infinity is handling the messages. 🌌",
  "Walang spam, puro organized replies.",
  "Gojo's got this. 😎",
  "Ang reply ay darating sa tamang oras. ⏳",
  "Six Eyes online. System ready. 👁️",
  "Hindi ako ordinaryong reply bot. May style ako. 💙",
  "Infinity mode: stable and ready. ♾️",
  "One queue, one flow, one Gojo. 🌌"
];

// ==================== LOGGING =========================

function logInfo(message) {
  console.log(`[GOJO] ${new Date().toISOString()} ${message}`);
}

function logError(message, error) {
  const detail = error && error.stack
    ? error.stack
    : String(error || "");

  const line =
    `[${new Date().toISOString()}] ${message} ${detail}\n`;

  console.error("[GOJO ERROR]", line);

  try {
    fs.appendFileSync(LOG_FILE, line, "utf8");
  } catch (e) {
    console.error("[GOJO] Could not write error log:", e.message);
  }
}

// ==================== DATA MANAGEMENT =================

function normalizeData(saved) {
  const data = {
    ...DEFAULT_DATA,
    ...(saved && typeof saved === "object" ? saved : {})
  };

  data.active = data.active !== false;
  data.autoReact = data.autoReact !== false;

  data.delay = Number.isFinite(Number(data.delay))
    ? Math.max(0, Math.min(10000, Number(data.delay)))
    : DEFAULT_DATA.delay;

  data.cooldown = Number.isFinite(Number(data.cooldown))
    ? Math.max(0, Math.min(60000, Number(data.cooldown)))
    : DEFAULT_DATA.cooldown;

  data.totalReplies = Number.isFinite(Number(data.totalReplies))
    ? Math.max(0, Number(data.totalReplies))
    : 0;

  return data;
}

function readJSON(file) {
  try {
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    logError(`JSON read failed: ${file}`, error);
    return null;
  }
}

function loadSystemData() {
  const main = readJSON(DATA_FILE);
  if (main) return normalizeData(main);

  const backup = readJSON(BACKUP_FILE);
  if (backup) {
    logInfo("Recovered settings from backup.");
    return normalizeData(backup);
  }

  return { ...DEFAULT_DATA };
}

function saveSystemData(data) {
  try {
    const normalized = normalizeData(data);
    const json = JSON.stringify(normalized, null, 2);

    fs.writeFileSync(TEMP_FILE, json, "utf8");

    if (fs.existsSync(DATA_FILE)) {
      try {
        fs.copyFileSync(DATA_FILE, BACKUP_FILE);
      } catch (error) {
        logError("Backup copy failed", error);
      }
    }

    fs.renameSync(TEMP_FILE, DATA_FILE);
    return true;
  } catch (error) {
    logError("Settings save failed", error);

    try {
      if (fs.existsSync(TEMP_FILE)) {
        fs.unlinkSync(TEMP_FILE);
      }
    } catch (e) {}

    return false;
  }
}

// ==================== HELPERS =========================

function isAdmin(id) {
  return String(id) === ADMIN_ID;
}

function randomQuote() {
  return GOJO_QUOTES[
    Math.floor(Math.random() * GOJO_QUOTES.length)
  ];
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
        if (error) logError("Message send failed", error);
      },
      messageID
    );
  } catch (error) {
    logError("sendMessage exception", error);
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

  if (SEEN_MESSAGES.has(id)) return false;

  SEEN_MESSAGES.add(id);

  if (SEEN_MESSAGES.size > MAX_SEEN) {
    const oldest = SEEN_MESSAGES.values().next().value;
    SEEN_MESSAGES.delete(oldest);
  }

  return true;
}

// ==================== QUEUE SYSTEM ====================

function enqueue(item) {
  if (MESSAGE_QUEUE.length >= MAX_QUEUE) {
    logInfo("Queue full; new message not accepted.");
    return false;
  }

  MESSAGE_QUEUE.push(item);
  logInfo(`Queued message. Pending: ${MESSAGE_QUEUE.length}`);

  startQueue();
  return true;
}

function startQueue() {
  if (queueRunning) return;

  queueRunning = true;

  processQueue()
    .catch(error => logError("Queue crashed", error))
    .finally(() => {
      queueRunning = false;

      if (MESSAGE_QUEUE.length > 0) {
        startQueue();
      }
    });
}

async function sendQueuedMessage(item) {
  return new Promise(resolve => {
    try {
      item.api.sendMessage(
        `♾️ [GOJO SATORU]\n\n${randomQuote()}`,
        item.threadID,
        error => resolve(!error),
        item.messageID
      );
    } catch (error) {
      logError("Queued send exception", error);
      resolve(false);
    }
  });
}

async function processQueue() {
  while (MESSAGE_QUEUE.length > 0) {
    const item = MESSAGE_QUEUE[0];

    try {
      const data = loadSystemData();

      // Pause queue while disabled. Keep pending messages.
      if (!data.active) {
        await sleep(1000);
        continue;
      }

      const key = `${item.threadID}:${item.senderID}`;
      const last = USER_LAST_REPLY.get(key) || 0;
      const remaining = data.cooldown - (Date.now() - last);

      // Wait for cooldown; do not discard the message.
      if (remaining > 0) {
        await sleep(Math.min(remaining, 1000));
        continue;
      }

      if (typeof item.api.sendTypingIndicator === "function") {
        try {
          item.api.sendTypingIndicator(item.threadID, () => {});
        } catch (error) {}
      }

      await sleep(data.delay);

      // Recheck active state after delay.
      if (!loadSystemData().active) continue;

      const sent = await sendQueuedMessage(item);

      if (!sent) {
        logInfo("Send failed. Keeping queue item for retry.");
        await sleep(5000);
        continue;
      }

      USER_LAST_REPLY.set(key, Date.now());

      const updated = loadSystemData();
      updated.totalReplies += 1;
      saveSystemData(updated);

      MESSAGE_QUEUE.shift();

      logInfo(
        `Reply sent. Total replies: ${updated.totalReplies}`
      );

    } catch (error) {
      logError("Queue item processing failed", error);
      await sleep(3000);
    }
  }
}

// ==================== BOT CONFIG ======================

module.exports.config = {
  name: "gojo",
  version: "10.0.0",
  hasPermission: 0,
  credits: "Gojo Infinity Framework",
  description: "Gojo V10 Makunat Edition | Reply Queue, Anti-Duplicate, Auto React, Admin Controls.",
  usePrefix: true,
  commandCategory: "AI",
  usages:
    "/gojo help - Show commands\n" +
    "/gojo status - System status\n" +
    "/gojo on - Enable auto reply (Admin)\n" +
    "/gojo off - Disable auto reply (Admin)\n" +
    "/gojo delay <ms> - Set reply delay (Admin)\n" +
    "/gojo cooldown <ms> - Set user cooldown (Admin)\n" +
    "/gojo reacton - Enable auto reaction (Admin)\n" +
    "/gojo reactoff - Disable auto reaction (Admin)\n" +
    "/gojo quote - Random Gojo quote",
  cooldowns: 2
};

// ==================== EVENT HANDLER ==================

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, messageID, body } = event;

    if (!threadID || !senderID || !messageID) return;

    const sender = String(senderID);
    const botID = String(api.getCurrentUserID());

    if (sender === botID || isAdmin(sender)) return;

    if (!rememberMessage(messageID)) return;

    const data = loadSystemData();

    if (data.autoReact) react(api, messageID);

    if (!data.active) return;

    // Ignore slash commands.
    if (body && body.startsWith("/")) return;

    enqueue({
      api,
      threadID,
      senderID: sender,
      messageID: String(messageID)
    });

  } catch (error) {
    logError("handleEvent failed", error);
  }
};

// ==================== COMMAND RUNNER ==================

module.exports.run = async function ({ api, event, args }) {
  try {
    const { threadID, senderID, messageID } = event;

    const action = String(args[0] || "help").toLowerCase();
    const data = loadSystemData();

    const adminActions = [
      "on", "off", "delay", "cooldown", "reacton", "reactoff"
    ];

    if (action === "help") {
      return send(
        api,
        `🌌 GOJO INFINITY V10 | MAKUNAT EDITION 🌌

╭──「 COMMAND PANEL 」
│
├ /gojo help
│   Ipakita ang commands
│
├ /gojo status
│   Tingnan ang system status
│
├ /gojo on
│   I-on ang auto-reply
│
├ /gojo off
│   I-off ang auto-reply
│
├ /gojo delay 2000
│   Baguhin ang reply delay
│
├ /gojo cooldown 3000
│   Baguhin ang cooldown
│
├ /gojo reacton
│   I-on ang 😆 reaction
│
├ /gojo reactoff
│   I-off ang reaction
│
├ /gojo quote
│   Random Gojo quote
│
╰────────────────────

🔐 Admin ID: ${ADMIN_ID}
♾️ Gojo Infinity Framework`,
        threadID,
        messageID
      );
    }

    if (action === "status") {
      return send(
        api,
        `🌌 GOJO SYSTEM STATUS 🌌

╭──「 SYSTEM 」
│
├ 🤖 Auto Reply:
│   ${data.active ? "🟢 ONLINE" : "🔴 OFFLINE"}
│
├ 😆 Auto Reaction:
│   ${data.autoReact ? "🟢 ON" : "🔴 OFF"}
│
├ ⏱️ Reply Delay:
│   ${data.delay} ms
│
├ 🕒 User Cooldown:
│   ${data.cooldown} ms
│
├ 📥 Pending Queue:
│   ${MESSAGE_QUEUE.length}
│
├ 💬 Total Replies:
│   ${data.totalReplies}
│
├ 📚 Gojo Quotes:
│   ${GOJO_QUOTES.length}
│
╰────────────────────

♾️ GOJO V10 MAKUNAT EDITION`,
        threadID,
        messageID
      );
    }

    if (action === "quote") {
      return send(
        api,
        `♾️ [GOJO SATORU]\n\n${randomQuote()}`,
        threadID,
        messageID
      );
    }

    if (adminActions.includes(action) && !isAdmin(senderID)) {
      return send(
        api,
        "⛔ Access denied. Admin lamang ang puwedeng gumamit nito.",
        threadID,
        messageID
      );
    }

    if (action === "on") {
      data.active = true;
      saveSystemData(data);
      startQueue();

      return send(
        api,
        "🚀 GOJO SYSTEM ACTIVATED!\n\n♾️ Auto-reply: ON\n📥 Pending queue resumed.",
        threadID,
        messageID
      );
    }

    if (action === "off") {
      data.active = false;
      saveSystemData(data);

      return send(
        api,
        "🛑 GOJO AUTO-REPLY PAUSED!\n\n📥 Pending messages will wait until the system is turned on again.",
        threadID,
        messageID
      );
    }

    if (action === "reacton") {
      data.autoReact = true;
      saveSystemData(data);

      return send(
        api,
        "😆 Auto-reaction enabled!",
        threadID,
        messageID
      );
    }

    if (action === "reactoff") {
      data.autoReact = false;
      saveSystemData(data);

      return send(
        api,
        "🔕 Auto-reaction disabled.",
        threadID,
        messageID
      );
    }

    if (action === "delay") {
      const value = Number(args[1]);

      if (
        args[1] === undefined ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > 10000
      ) {
        return send(
          api,
          "⚠️ Delay must be between 0 and 10000 ms.\nExample: /gojo delay 2000",
          threadID,
          messageID
        );
      }

      data.delay = value;
      saveSystemData(data);

      return send(
        api,
        `⏱️ Reply delay updated to ${value} ms.`,
        threadID,
        messageID
      );
    }

    if (action === "cooldown") {
      const value = Number(args[1]);

      if (
        args[1] === undefined ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > 60000
      ) {
        return send(
          api,
          "⚠️ Cooldown must be between 0 and 60000 ms.\nExample: /gojo cooldown 3000",
          threadID,
          messageID
        );
      }

      data.cooldown = value;
      saveSystemData(data);

      return send(
        api,
        `🕒 User cooldown updated to ${value} ms.`,
        threadID,
        messageID
      );
    }

    return send(
      api,
      "⚠️ Unknown command.\nI-type ang /gojo help para makita ang commands.",
      threadID,
      messageID
    );

  } catch (error) {
    logError("Command runner failed", error);
  }
};
