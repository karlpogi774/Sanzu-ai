const fs = require("fs");
const path = require("path");

// ==========================================
// CONFIGURATION (Admin IDs)
const ADMIN_IDS = ["61594325727109", "61594022290817", "61593892603402", "61594055835097"];
// ==========================================

module.exports.config = {
  name: "activate",
  version: "14.0.0",
  hasPermission: 2,
  credits: "Jehosh / Weird Suite with Anti-Spam",
  description: "Activate Bot with weird/creepy lines and strict Anti-Spam detection.",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "/activate on — Simulan ang weird realm\n" +
          "/activate off — Isara ang portal\n" +
          "/activate status — Tingnan ang status",
  cooldowns: 3
};

const DATA_PATH = path.join(__dirname, "activate_data.json");

const AUTO_REPLY_DELAY_MS = 3000; 
const SPAM_WINDOW_MS = 6000; // Oras kung saan binabantayan ang pag-spam (6 seconds)
const USER_SPAM_LIMIT = 3;   // Max na mensahe bago ma-detect na spammer
const SPAM_BAN_DURATION_MS = 15000; // Ilang segundo bago ulit sila pansinin ng bot (15 seconds cooldown)

const lastReplyTime = {};
const userMessageTracker = {};
const userSpamBans = {}; // Dito sine-save ang mga na-detect na nag-a-spam

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
  return threadData && threadData.expires && Number(threadData.expires) > Date.now();
}

// ANTI-SPAM DETECTION LOGIC
function checkAndHandleSpam(senderID, threadID, api, messageID) {
  const now = Date.now();

  // Kung naka-ban pa ang user dahil sa kaka-spam
  if (userSpamBans[senderID] && now < userSpamBans[senderID]) {
    return true; // Na-detect na nag-a-spam
  }

  if (!userMessageTracker[senderID]) {
    userMessageTracker[senderID] = [];
  }

  // Linisin ang lumang logs na lampas na sa time window
  userMessageTracker[senderID] = userMessageTracker[senderID].filter(t => now - t < SPAM_WINDOW_MS);
  userMessageTracker[senderID].push(now);

  // Kapag lumampas sa limit (Spam detected!)
  if (userMessageTracker[senderID].length > USER_SPAM_LIMIT) {
    userSpamBans[senderID] = now + SPAM_BAN_DURATION_MS; // I-ban pansamantala
    
    try {
      api.sendMessage("👁️ *Anti-Spam:* Teka lang, masyadong mabilis ang mga daliri mo. Nag-init na ang portal, manahimik ka muna nang ilang segundo.", threadID, messageID);
    } catch (e) {}

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

  // I-run ang anti-spam detection bago mag-reply
  if (checkAndHandleSpam(senderID, threadID, api, messageID)) {
    return; // Kung nag-spam, i-ignore muna ang message
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
    data.threads[threadID] = { expires: 0 };
  }

  const currentThread = data.threads[threadID];

  if (!ADMIN_IDS.includes(senderID)) {
    return api.sendMessage("👁️ *Unknown Entity:* Hindi para sa'yo ang portal na ito. Lumayo ka.", threadID, messageID);
  }

  if (sub === "on") {
    currentThread.expires = Date.now() + 24 * 60 * 60 * 1000;
    saveData(data);

    return api.sendMessage(
      `🌀 WEIRD REALM + ANTI-SPAM: BUKAS NA 🕳️\n\n` +
      `• Estado: Gising na ang mga kakaibang elemento\n` +
      `• Anti-Spam Protection: Active (Haharangin ang mga pasaway mag-spam)\n` +
      `• Tagal: 24 Oras`,
      threadID,
      messageID
    );
  }

  if (sub === "off") {
    currentThread.expires = 0;
    saveData(data);
    return api.sendMessage("🕯️ Isinara na ang portal. Tahimik na muli ang dimensyong ito.", threadID, messageID);
  }

  if (sub === "status") {
    const left = Number(currentThread.expires) - Date.now();
    if (left <= 0) return api.sendMessage("📊 Status: Naka-OFF ang weird mode sa GC na ito.", threadID, messageID);

    const hours = Math.floor(left / (1000 * 60 * 60));
    const mins = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
    return api.sendMessage(
      `📊 WEIRD & ANTI-SPAM STATUS:\n` +
      `• Oras na natitira: ${hours}h ${mins}m\n` +
      `• Sistema: Gumagana (Bizarre/Creepy Mode + Anti-Spam)`,
      threadID,
      messageID
    );
  }

  return api.sendMessage(
    `🔮 Weird Commands:\n` +
    `/activate on — Buksan ang kakaibang makina (may anti-spam)\n` +
    `/activate off — Patayin ang sistema\n` +
    `/activate status — Tingnan ang status`,
    threadID,
    messageID
  );
};
