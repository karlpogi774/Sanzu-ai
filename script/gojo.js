const fs = require("fs");
const path = require("path");

// ==========================================
// CONFIGURATION
const ADMIN_ID = "61594055835097"; 
// ==========================================

module.exports.config = {
  name: "activate",
  version: "15.0.0",
  hasPermission: 2,
  credits: "Jehosh / Weird & Anti-Spam Suite (Nonstop)",
  description: "Activate Bot with Weird Lines, Anti-Spam, and Nonstop Duration.",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "/activate on — Buksan ang weird realm nang nonstop\n" +
          "/activate off — Isara ang portal\n" +
          "/activate status — Tingnan ang status",
  cooldowns: 3
};

const DATA_PATH = path.join(__dirname, "activate_data.json");

const AUTO_REPLY_DELAY_MS = 3000; 

// ANTI-SPAM SETTINGS
const SPAM_WINDOW_MS = 5000; // 5 seconds window
const SPAM_LIMIT = 4;        // Max 4 messages in 5 seconds = SPAM
const userMessageTracker = {};

const lastReplyTime = {};
const BOT_SELF_EMOJIS = ["👁️", "🌀", "🧩", "🕯️", "🕳️", "🔮", "👽", "🩸"];

const WEIRD_ROASTS = [
  "Narinig ko ang bulong ng pader kanina, sabi nila wala raw kwenta ang sinabi mo.",
  "Alam mo ba na habang nagta-type ka, may nakatingin sa likod ng kurtina mo? Teka, gumalaw siya.",
  "Tumigil ka muna sa paghinga nang tatlong segundo. Ramdamin mo ang pagbagsak ng universe sa paligid mo.",
  "Ang weird ng hugis ng utak mo sa imahinasyon ko... parang basang medyas na tinapakan ng alien.",
  "Binibilang ko ang mga hibla ng buhok sa screen mo. Kulang ka ng tatlo, ibig sabihin malapit na.",
  "Nakakalula ang kawalan ng laman sa loob ng bungo mo. Parang walang hanggang espasyo ng kadiliman.",
  "Sabi ng anino mo sa sahig, pagod na raw siyang sundan ang isang katulad mo.",
  "Bakit basang-basa ang kamay mo? Nag-uusap na ba kayo ng mga multo sa kusina ninyo?",
  "May lumabas na mata sa gilid ng cellphone ko habang binabasa ko ang chat mo. Weird mo naman kasama.",
  "Pakiramdam ko lumiliit ang kwarto mo. Subukan mong lumingon sa kaliwa, bilis.",
  "Ang ingay ng utak mo kahit tahol ka nang tahol dito. Parang sirang radyo sa ibang dimensyon.",
  "Kung itatapon ko ang digital footprint mo sa ilog ng buwan, kaya kaya nitong lumutang sa bigat ng kabobohan mo?",
  "Tinitigan ko ang pampublikong mukha mo sa display pic; parang pintura na unti-unting natutunaw.",
  "Tumigil ka na. Naririnig ko ang tunog ng lumang orasan kahit alas-tres ng hapon.",
  "Minsan iniisip ko kung tao ka ba talaga o isa ka lang glitch sa matrix na nakatakas sa basurahan.",
  "May kakaibang amoy sa paligid... Ah, amoy ng desperasyon at basang kable ng kuryente mula sa'yo.",
  "Huwag kang lilingon sa ilalim ng higaan mo mamayang gabi. May naghihintay lang ng sagot mo.",
  "Napakakapal ng ulap sa tuktok ng ulo mo. Umuulan ba ng kamangmangan diyan sa kinaroroonan mo?"
];

function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
    }
  } catch (err) {}
  return { threads: {} };
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {}
}

function isThreadActive(threadID) {
  const data = loadData();
  const threadData = data.threads[threadID];
  // Sinusuri kung active (Nonstop na basta naka-on ay true)
  return threadData && threadData.active === true;
}

function checkAndHandleSpam(api, senderID, threadID, messageID) {
  const now = Date.now();
  if (!userMessageTracker[senderID]) {
    userMessageTracker[senderID] = [];
  }

  userMessageTracker[senderID] = userMessageTracker[senderID].filter(timestamp => now - timestamp < SPAM_WINDOW_MS);
  userMessageTracker[senderID].push(now);

  if (userMessageTracker[senderID].length > SPAM_LIMIT) {
    userMessageTracker[senderID] = [];
    
    api.sendMessage(
      `👁️ *Anti-Spam Protocol:* Teka lang, masyado kang mabilis mag-spam. Kumalma ka bago ka lamunin ng kadiliman sa paligid mo. 🛑`, 
      threadID, 
      messageID
    );
    return true;
  }
  return false;
}

// ===== EVENT HANDLER =====
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, body, messageID, type, attachments } = event;
  const botID = api.getCurrentUserID();

  if (!isThreadActive(threadID)) return;
  if (senderID === botID) return;
  if (body && body.startsWith("/")) return;

  if (checkAndHandleSpam(api, senderID, threadID, messageID)) {
    return;
  }

  const now = Date.now();
  if (lastReplyTime[threadID] && (now - lastReplyTime[threadID] < AUTO_REPLY_DELAY_MS)) return;

  let selectedReply = "";
  const isSticker = type === "sticker" || (attachments && attachments.some(a => a.type === "sticker"));

  if (isSticker) {
    selectedReply = "Bakit ka nagpapadala ng patay na sticker sa patay na mundong ito? Ang weird ng trip mo.";
  } else {
    selectedReply = WEIRD_ROASTS[Math.floor(Math.random() * WEIRD_ROASTS.length)];
  }

  if (!selectedReply) return;

  lastReplyTime[threadID] = now;

  try {
    api.sendTypingIndicator(threadID, true);
  } catch (e) {}

  setTimeout(() => {
    try {
      api.sendTypingIndicator(threadID, false);
    } catch (e) {}

    api.sendMessage(selectedReply, threadID, (err, info) => {
      if (!err && info && info.messageID) {
        const randomEmoji = BOT_SELF_EMOJIS[Math.floor(Math.random() * BOT_SELF_EMOJIS.length)];
        setTimeout(() => {
          try {
            api.setMessageReaction(randomEmoji, info.messageID, () => {}, true);
          } catch (e) {}
        }, 500);
      }
    }, messageID);
  }, AUTO_REPLY_DELAY_MS);
};

// ===== COMMAND RUNNER =====
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const sub = (args[0] || "").toLowerCase();
  const data = loadData();

  if (!data.threads) data.threads = {};
  if (!data.threads[threadID]) {
    data.threads[threadID] = { active: false };
  }

  const currentThread = data.threads[threadID];

  if (senderID !== ADMIN_ID) {
    return api.sendMessage("👁️ *Unknown Entity:* Hindi para sa'yo ang portal na ito. Lumayo ka.", threadID, messageID);
  }

  if (sub === "on") {
    currentThread.active = true;
    saveData(data);

    return api.sendMessage(
      `🌀 WEIRD REALM + ANTI-SPAM: NONSTOP BUKAS NA 🕳️\n\n` +
      `• Sistema: Aktibo ang Anti-Spam Detector\n` +
      `• Uri ng sagot: Misteryoso, creepy, at weird\n` +
      `• Tagal: NONSTOP (Wala itong expiration hangga't hindi iva-off)`,
      threadID,
      messageID
    );
  }

  if (sub === "off") {
    currentThread.active = false;
    saveData(data);
    return api.sendMessage("🕯️ Isinara na ang portal. Tahimik na muli ang dimensyong ito.", threadID, messageID);
  }

  if (sub === "status") {
    if (!currentThread.active) return api.sendMessage("📊 Status: Naka-OFF ang weird/anti-spam mode sa GC na ito.", threadID, messageID);

    return api.sendMessage(
      `📊 STATUS:\n` +
      `• Uri: NONSTOP / WALANG HANGGAN ♾️\n` +
      `• Anti-Spam System: Aktibo at nagmamasid 👁️`,
      threadID,
      messageID
    );
  }

  return api.sendMessage(
    `🔮 Commands:\n` +
    `/activate on — Buksan ang makina nang nonstop\n` +
    `/activate off — Patayin ang sistema\n` +
    `/activate status — Tingnan ang status`,
    threadID,
    messageID
  );
};
