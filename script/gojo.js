
const fs = require("fs");
const path = require("path");

// ======================================================
// GOJO BOT V10.0 | INFINITY MAKUNAT EDITION
// Sanzu AI / Node.js module.exports framework
// ======================================================

const ADMIN_ID = "61594055835097";
const DATA_FILE = path.join(__dirname, "gojo_exact_data.json");
const BACKUP_FILE = DATA_FILE + ".bak";
const TEMP_FILE = DATA_FILE + ".tmp";

const DEFAULT_DATA = {
  active: true,
  autoReact: true,
  delay: 2000,
  cooldown: 3000,
  totalReplies: 0
};

// ======================================================
// RUNTIME SYSTEMS
// ======================================================

const MESSAGE_QUEUE = [];
const SEEN_MESSAGES = new Set();
const USER_LAST_REPLY = new Map();

const MAX_SEEN_MESSAGES = 10000;

let queueRunning = false;
let saveRunning = false;

// ======================================================
// GOJO QUOTES - 110 RANDOM LINES
// ======================================================

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
  "Walang challenge na hindi kayang harapin ng pinakamalakas.",
  "Your move. Ako na ang bahala sa reply. 😎",
  "Kahit gaano ka pa kabilis, Infinity pa rin ang haharapin mo.",
  "Walang drama. Isang reply lang, sapat na. 😂",
  "Nasa ibang level ang laro ko. 🌌",
  "Sige lang, mag-message ka. May sagot ako diyan. 😆",
  "Relax. Hindi pa nga ako seryoso. 💙",
  "Ang lakas mo naman... sa chat. 😂",
  "Infinite Void: loading your thoughts... 🌌",
  "Hindi lahat ng tahimik ay talo. Minsan, nag-iisip lang ng reply.",
  "Gojo mode: ON. ♾️",
  "Walang duplicate reply dito. Unique ang bawat galaw.",
  "Sino'ng nagsabing kailangan kong mag-effort? 😏",
  "Isang tingin lang, alam ko nang may bagong message. 👁️",
  "Infinity never sleeps. Pero ako, minsan kailangan din magpahinga. 😂",
  "Ang bilis mo mag-chat. Hinay-hinay lang, boss. 😆",
  "Sige, noted. Pero Gojo pa rin ang pinakamalakas. ♾️",
  "May bagong message? Hayaan mong sagutin ng legend.",
  "Ang buhay ay parang Infinite Void. Maraming iniisip, walang katapusan.",
  "Kaya kong sagutin 'yan. Pero kaya mo bang tanggapin? 😎",
  "System online. Gojo is watching. 👁️",

  "Walang makakatalo sa kumpiyansa ng isang Honored One. 💙",
  "Infinity ang pagitan ng tanong mo at sagot ko. ♾️",
  "Relax, hindi pa nagsisimula ang tunay na laban. 😏",
  "Six Eyes: nakita ko na ang message mo. 👁️",
  "Ang bilis ng chat mo, parang may hinahabol na deadline. 😂",
  "Gojo Satoru reporting for duty. 🌌",
  "Hindi ako late. Dramatic entrance lang. 😎",
  "Isang reply lang, pero may unlimited confidence. ♾️",
  "Walang lag ang utak ko. Server mo lang siguro. 😂",
  "Infinite Void: maraming thoughts, isang reply. 🌌",
  "Walang shortcut sa pagiging Honored One. 💙",
  "Kung confidence ang labanan, alam mo na ang resulta. 😏",
  "Nakita ko ang message mo bago mo pa pindutin ang send. 👁️",
  "Sige, tuloy mo lang. Nakikinig ang Six Eyes.",
  "Walang katapusan ang Infinity, pero may katapusan ang cooldown. ⏱️",
  "Hindi lahat ng malakas, maingay. Pero ako, minsan. 😂",
  "Ang reply ko ay parang Infinity: hindi mo inaasahan. ♾️",
  "Gojo mode activated. Please stand by. ⚡",
  "Walang problema na hindi kayang harapin nang kalmado.",
  "Sa dami ng messages, kailangan ng konting Gojo energy. 🌌",

  "Kung may tanong ka, ihanda mo rin ang sarili mo sa sagot. 😎",
  "Walang duplicate sa sistema ko. Original ang bawat galaw.",
  "Minsan, ang pinakamalakas na move ay ang maghintay. ⏳",
  "Infinity barrier: activated. ♾️",
  "Hindi ako nagmamadali. Ang queue ang bahala. 😌",
  "Ang bilis mo mag-type. Parang may world record ka. 😂",
  "Sagot muna bago drama. 💙",
  "Walang pressure. Gojo lang 'to. 😎",
  "Infinite Void: welcome sa mundo ng random replies. 🌌",
  "Kalmado ang sistema, kahit magulo ang group chat.",
  "May bagong message? Six Eyes detected. 👁️",
  "Walang nakakalusot sa radar ng Gojo. ♾️",
  "Sapat na ang isang reply para ipaalala ang presence ko. 😏",
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
  "Ang sagot ay random, pero ang dating ay Gojo. 😂",
  "Minsan, ang katahimikan ay bahagi ng strategy.",
  "Infinite Void: processing your latest message. 🌌",
  "Hindi kailangang mag-spam para maging legendary.",
  "Gojo bot: ready kapag kailangan. 💙",
  "Ang tunay na Honored One, marunong maghintay.",
  "Bawat reply ay may sariling spotlight. ✨",
  "Walang away sa queue. Isa-isang pila lang.",
  "Relax lang, lahat ng accepted messages ay may turn.",
  "Hindi ko kailangang mauna. Alam kong darating ang turn ko. 😏",
  "Sagot ko? Depende sa random quote generator. 😂",
  "Gojo energy: 100%. Server energy: sana rin. 🔋",
  "Ang Infinity ay walang hanggan, ang messages ay marami.",
  "Walang panic. May error log naman. 🛠️",
  "Kung may problema, debug muna bago mag-drama.",
  "Keep your messages coming, pero respetuhin ang queue. ♾️",

  "Gojo Satoru: present. 😎",
  "Ang pinakamalakas, hindi kailangang magmadali.",
  "Message received. Infinity acknowledged. ♾️",
  "May bagong notification? Six Eyes confirmed. 👁️",
  "Ang random quote na ito ay may Gojo seal. 💙",
  "Hindi ako bot na basta-basta sumusuko. 😏",
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
  "Sige, message received. Huwag kalimutang ngumiti. 😆",
  "Endless Infinity, controlled replies. ♾️",

  "Six Eyes says: may bago kang message. 👁️",
  "Ang tunay na lakas ay consistency, hindi spam.",
  "Gojo bot is online. Keep the vibes friendly. 💙",
  "Kahit random ang quote, siguradong may Gojo energy.",
  "Walang talo sa maayos na sistema. 😎",
  "Ang delay ay hindi kahinaan. Timing 'yan. ⏱️",
  "Domain Expansion: Organized Reply Queue. 🌌",
  "Infinity activated. Reply queued. ♾️",
  "Sagot ko ay random, pero hindi doble-doble.",
  "Gojo signing off... hanggang sa susunod na message. 👋"
];

// ======================================================
// DATA MANAGEMENT
// ======================================================

function cloneDefaults() {
  return { ...DEFAULT_DATA };
}

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

function readJsonFile(file) {
  try {
    if (!fs.existsSync(file)) return null;

    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    console.error(`[GOJO] Read error (${file}):`, error.message);
    return null;
  }
}

function loadSystemData() {
  const primary = readJsonFile(DATA_FILE);

  if (primary) {
    return normalizeData(primary);
  }

  // Recover from backup if the main file is missing or invalid.
  const backup = readJsonFile(BACKUP_FILE);

  if (backup) {
    console.warn("[GOJO] Recovering settings from backup.");
    return normalizeData(backup);
  }

  return cloneDefaults();
}

function saveSystemData(data) {
  if (saveRunning) {
    console.warn("[GOJO] Save already in progress.");
    return false;
  }

  saveRunning = true;

  try {
    const normalized = normalizeData(data);
    const json = JSON.stringify(normalized, null, 2);

    // Write temp first, then replace the main file.
    fs.writeFileSync(TEMP_FILE, json, "utf8");

    if (fs.existsSync(DATA_FILE)) {
      try {
        fs.copyFileSync(DATA_FILE, BACKUP_FILE);
      } catch (backupError) {
        console.error("[GOJO] Backup error:", backupError.message);
      }
    }

    fs.renameSync(TEMP_FILE, DATA_FILE);
    return true;
  } catch (error) {
    console.error("[GOJO] Save error:", error.message);

    try {
      if (fs.existsSync(TEMP_FILE)) {
        fs.unlinkSync(TEMP_FILE);
      }
    } catch (cleanupError) {}

    return false;
  } finally {
    saveRunning = false;
  }
}

// ======================================================
// HELPERS
// ======================================================

function isAdmin(senderID) {
  return String(senderID) === ADMIN_ID;
}

function randomQuote() {
  return GOJO_QUOTES[
    Math.floor(Math.random() * GOJO_QUOTES.length)
  ];
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function logInfo(message) {
  console.log(`[GOJO] ${new Date().toISOString()} ${message}`);
}

function logError(message, error) {
  console.error(
    `[GOJO ERROR] ${new Date().toISOString()} ${message}`,
    error || ""
  );
}

function rememberMessage(messageID) {
  const id = String(messageID);

  if (SEEN_MESSAGES.has(id)) {
    return false;
  }

  SEEN_MESSAGES.add(id);

  if (SEEN_MESSAGES.size > MAX_SEEN_MESSAGES) {
    const oldest = SEEN_MESSAGES.values().next().value;
    SEEN_MESSAGES.delete(oldest);
  }

  return true;
}

function send(api, message, threadID, messageID) {
  return api.sendMessage(
    message,
    threadID,
    error => {
      if (error) {
        logError("Command send failed:", error);
      }
    },
    messageID
  );
}

function sendTyping(api, threadID) {
  if (typeof api.sendTypingIndicator !== "function") return;

  try {
    api.sendTypingIndicator(threadID, () => {});
  } catch (error) {
    logError("Typing indicator failed:", error.message);
  }
}

function react(api, messageID) {
  if (typeof api.setMessageReaction !== "function") return;

  try {
    api.setMessageReaction("😆", messageID, error => {
      if (error) {
        logError("Reaction failed:", error);
      }
    }, true);
  } catch (error) {
    logError("Reaction exception:", error.message);
  }
}

// ======================================================
// QUEUE SYSTEM
// ======================================================

function enqueueMessage(item) {
  MESSAGE_QUEUE.push(item);

  logInfo(
    `Queued message. Queue size: ${MESSAGE_QUEUE.length}`
  );

  startQueue();
}

function startQueue() {
  if (queueRunning) return;

  queueRunning = true;

  processQueue()
    .catch(error => {
      logError("Queue processor crashed:", error);
    })
    .finally(() => {
      queueRunning = false;

      // If something arrived during shutdown, resume processing.
      if (MESSAGE_QUEUE.length > 0) {
        startQueue();
      }
    });
}

async function processQueue() {
  while (MESSAGE_QUEUE.length > 0) {
    const item = MESSAGE_QUEUE[0];

    try {
      const data = loadSystemData();

      // Pause queue while the bot is off.
      if (!data.active) {
        await sleep(1000);
        continue;
      }

      const cooldownKey = `${item.threadID}:${item.senderID}`;
      const lastReply = USER_LAST_REPLY.get(cooldownKey) || 0;
      const now = Date.now();

      const remainingCooldown =
        data.cooldown - (now - lastReply);

      // Wait instead of discarding the queued message.
      if (remainingCooldown > 0) {
        await sleep(remainingCooldown);
        continue;
      }

      sendTyping(item.api, item.threadID);

      const delay = Math.max(
        0,
        Math.min(Number(data.delay) || 0, 10000)
      );

      if (delay > 0) {
        await sleep(delay);
      }

      // Check status again after delay.
      const latestData = loadSystemData();

      if (!latestData.active) {
        continue;
      }

      const reply = `♾️ [GOJO SATORU]\n\n${randomQuote()}`;

      const sent = await new Promise(resolve => {
        try {
          item.api.sendMessage(
            reply,
            item.threadID,
            error => resolve(!error),
            item.messageID
          );
        } catch (error) {
          logError("sendMessage exception:", error.message);
          resolve(false);
        }
      });

      if (sent) {
        USER_LAST_REPLY.set(cooldownKey, Date.now());

        latestData.totalReplies =
          (latestData.totalReplies || 0) + 1;

        saveSystemData(latestData);

        logInfo(
          `Reply sent. Total: ${latestData.totalReplies}`
        );

        // Remove only after successful send.
        MESSAGE_QUEUE.shift();
      } else {
        // Avoid rapid retries if the API is failing.
        logError("Reply failed. Retrying after 5 seconds.");
        await sleep(5000);
      }
    } catch (error) {
      logError("Queue item error:", error.message);
      await sleep(3000);
    }
  }
}

// ======================================================
// BOT CONFIG
// ======================================================

module.exports.config = {
  name: "gojo",
  version: "10.0.0",
  hasPermission: 0,
  credits: "Gojo Infinity Framework",
  description:
    "Gojo auto-reply queue, random quotes, admin controls, auto-react.",
  usePrefix: true,
  cooldowns: 2
};

// ======================================================
// HANDLE EVENT
// ======================================================

module.exports.handleEvent = async function ({
  api,
  event
}) {
  try {
    const {
      threadID,
      senderID,
      messageID
    } = event;

    if (!threadID || !senderID || !messageID) return;

    const sender = String(senderID);
    const botID = String(api.getCurrentUserID());

    // Ignore bot messages and admin messages.
    if (sender === botID || isAdmin(sender)) return;

    const data = loadSystemData();

    // Prevent duplicate event processing.
    if (!rememberMessage(messageID)) return;

    // React even if the auto-reply system is off.
    if (data.autoReact) {
      react(api, messageID);
    }

    if (!data.active) return;

    enqueueMessage({
      api,
      threadID,
      senderID: sender,
      messageID
    });

  } catch (error) {
    logError("handleEvent exception:", error.message);
  }
};

// ======================================================
// COMMAND RUNNER
// ======================================================

module.exports.run = async function ({
  api,
  event,
  args
}) {
  try {
    const {
      threadID,
      senderID,
      messageID
    } = event;

    const action = String(args[0] || "help").toLowerCase();
    const data = loadSystemData();

    const adminActions = [
      "on",
      "off",
      "reacton",
      "reactoff",
      "delay",
      "cooldown"
    ];

    // --------------------------------------------------
    // HELP
    // --------------------------------------------------

    if (action === "help") {
      return send(
        api,
        `🌌 GOJO INFINITY V10 🌌

╭───「 COMMAND PANEL 」
│
├ /gojo help
│   Show commands
│
├ /gojo status
│   System status
│
├ /gojo on
│   Activate auto-reply
│
├ /gojo off
│   Pause auto-reply
│
├ /gojo reacton
│   Enable 😆 reaction
│
├ /gojo reactoff
│   Disable reaction
│
├ /gojo delay 2000
│   Set reply delay (ms)
│
├ /gojo cooldown 3000
│   Set user cooldown (ms)
│
├ /gojo quote
│   Random Gojo quote
│
╰──────────────────

🔐 Admin controls are restricted.
♾️ Gojo V10 Makunat Edition`,
        threadID,
        messageID
      );
    }

    // --------------------------------------------------
    // STATUS
    // --------------------------------------------------

    if (action === "status") {
      return send(
        api,
        `🌌 GOJO SYSTEM STATUS 🌌

╭───「 SYSTEM 」
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
├ 📥 Queue:
│   ${MESSAGE_QUEUE.length} pending
│
├ 💬 Total Replies:
│   ${data.totalReplies}
│
├ 📚 Quotes:
│   ${GOJO_QUOTES.length}
│
╰──────────────────

♾️ GOJO V10 INFINITY`,
        threadID,
        messageID
      );
    }

    // --------------------------------------------------
    // RANDOM QUOTE
    // --------------------------------------------------

    if (action === "quote") {
      return send(
        api,
        `♾️ [GOJO SATORU]\n\n${randomQuote()}`,
        threadID,
        messageID
      );
    }

    // --------------------------------------------------
    // ADMIN AUTHORIZATION
    // --------------------------------------------------

    if (adminActions.includes(action) && !isAdmin(senderID)) {
      return send(
        api,
        "⛔ Access denied. Admin lamang ang puwedeng gumamit nito.",
        threadID,
        messageID
      );
    }

    // --------------------------------------------------
    // TURN ON
    // --------------------------------------------------

    if (action === "on") {
      data.active = true;
      saveSystemData(data);

      startQueue();

      return send(
        api,
        "🚀 GOJO SYSTEM ACTIVATED!\n\n♾️ Auto-reply: ON\n📥 Queue resumed.",
        threadID,
        messageID
      );
    }

    // --------------------------------------------------
    // TURN OFF
    // --------------------------------------------------

    if (action === "off") {
      data.active = false;
      saveSystemData(data);

      return send(
        api,
        "🛑 GOJO AUTO-REPLY PAUSED!\n\nPending queue will wait until the system is turned on again.",
        threadID,
        messageID
      );
    }

    // --------------------------------------------------
    // REACTION ON
    // --------------------------------------------------

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

    // --------------------------------------------------
    // REACTION OFF
    // --------------------------------------------------

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

    // --------------------------------------------------
    // CHANGE REPLY DELAY
    // --------------------------------------------------

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
          "⚠️ G
