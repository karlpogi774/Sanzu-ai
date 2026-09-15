const fs = require("fs");
const path = require("path");

// ==========================================
// CONFIGURATION (ADMIN IDS)
const ADMIN_IDS = [
  "61594055835097", 
  "61594325727109", 
  "61594022290817", 
  "61593892603402"
];
// ==========================================

module.exports = {
  config: {
    name: "gojo",
    version: "32.0.0",
    hasPermission: 0,
    credits: "Jehosh / Gojo Bot Suite",
    description: "Sequential Loop Auto-Reply & ID Guard Bot",
    usePrefix: true,
    prefix: true,
    commandCategory: "admin",
    usages: "/gojo on | /gojo off | /gojo status",
    cooldowns: 2
  },

  onStart: async function ({ api, event, args }) {
    return this.run({ api, event, args });
  },

  run: async function ({ api, event, args }) {
    try {
      const { threadID, messageID, senderID } = event;
      const sub = (args[0] || "").toLowerCase();

      let data = loadData();
      if (!data.threads) data.threads = {};
      if (!data.threads[threadID]) {
        data.threads[threadID] = { 
          infinite: false,
          targetUser: null, 
          lockedTitle: null, 
          lockedNicknames: {},
          welcome: true,
          textIndex: 0,
          stickerIndex: 0,
          emojiIndex: 0,
          suggestIndex: 0
        };
      }

      const currentThread = data.threads[threadID];

      if (!ADMIN_IDS.includes(senderID)) {
        return api.sendMessage("🕶️ 😼 *Gojo Satoru:* Yowai mo~ Admin lang ang pwedeng gumamit nito.", threadID, messageID);
      }

      if (sub === "on") {
        currentThread.infinite = true;
        saveData(data);
        return api.sendMessage("🕶️ 🌌 GOJO SATORU INFINITE MODE ACTIVATED ♾️\nNaka-set sa Sequential Loop (Sunod-sunod na linya)!", threadID, messageID);
      }

      if (sub === "off") {
        currentThread.infinite = false;
        saveData(data);
        return api.sendMessage("🕶️ ⚡ Naka-OFF na ang Gojo Auto-Reply sa GC na 'to.", threadID, messageID);
      }

      if (sub === "status") {
        const textPos = (currentThread.textIndex || 0) + 1;
        return api.sendMessage(`🕶️ STATUS:\n• Active: ${currentThread.infinite ? "YES ♾️" : "NO"}\n• Current Line: ${textPos} / ${FALLBACK_ROASTS.length}`, threadID, messageID);
      }

      return api.sendMessage("🕶️ GAMITIN:\n/gojo on — Simulan ang Bot\n/gojo off — Patayin ang Bot\n/gojo status — Tingnan ang status", threadID, messageID);

    } catch (err) {
      console.error("Error in Gojo Run:", err);
    }
  },

  handleEvent: async function ({ api, event }) {
    try {
      const { threadID, senderID, body, messageID, logMessageType, logMessageData, type, attachments } = event;
      if (!threadID) return;

      const botID = api.getCurrentUserID();
      const data = loadData();
      const threadData = data.threads ? data.threads[threadID] : null;

      // 1. ANTI-CHANGE GC NAME
      if (logMessageType === "log:thread-name" && threadData && threadData.lockedTitle) {
        if (logMessageData && logMessageData.name !== threadData.lockedTitle) {
          api.setTitle(threadData.lockedTitle, threadID, () => {});
        }
        return;
      }

      // 2. ANTI-CHANGE NICKNAME
      if (logMessageType === "log:user-nickname" && threadData && threadData.lockedNicknames) {
        const targetUID = logMessageData ? logMessageData.participant_id : null;
        const newNick = logMessageData ? logMessageData.nickname : "";
        if (targetUID && threadData.lockedNicknames[targetUID]) {
          const reqNick = threadData.lockedNicknames[targetUID];
          if (newNick !== reqNick) {
            api.changeNickname(reqNick, threadID, targetUID, () => {});
          }
        }
        return;
      }

      if (!senderID || senderID === botID || !threadData || !threadData.infinite) return;
      if (body && body.startsWith("/")) return;
      if (threadData.targetUser && senderID !== threadData.targetUser) return;

      const now = Date.now();
      if (lastReplyTime[threadID] && (now - lastReplyTime[threadID] < AUTO_REPLY_MIN_DELAY_MS)) return;

      let selectedRoast = "";
      const isSticker = type === "sticker" || (attachments && Array.isArray(attachments) && attachments.some(a => a.type === "sticker"));
      const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F7FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
      const isEmojiOnly = body && body.trim().replace(emojiRegex, '').length === 0;

      // SUNOD-SUNOD NA SELECTION SYSTEM (LOOPING)
      if (isSticker) {
        if (typeof threadData.stickerIndex !== "number") threadData.stickerIndex = 0;
        selectedRoast = STICKER_ROASTS[threadData.stickerIndex % STICKER_ROASTS.length];
        threadData.stickerIndex = (threadData.stickerIndex + 1) % STICKER_ROASTS.length;
      } else if (isEmojiOnly) {
        if (typeof threadData.emojiIndex !== "number") threadData.emojiIndex = 0;
        selectedRoast = EMOJI_ROASTS[threadData.emojiIndex % EMOJI_ROASTS.length];
        threadData.emojiIndex = (threadData.emojiIndex + 1) % EMOJI_ROASTS.length;
      } else {
        if (typeof threadData.textIndex !== "number") threadData.textIndex = 0;
        selectedRoast = FALLBACK_ROASTS[threadData.textIndex % FALLBACK_ROASTS.length];
        threadData.textIndex = (threadData.textIndex + 1) % FALLBACK_ROASTS.length;
      }

      if (typeof threadData.suggestIndex !== "number") threadData.suggestIndex = 0;
      const selectedSuggest = GOJO_SUGGESTIONS[threadData.suggestIndex % GOJO_SUGGESTIONS.length];
      threadData.suggestIndex = (threadData.suggestIndex + 1) % GOJO_SUGGESTIONS.length;

      saveData(data);
      lastReplyTime[threadID] = now;

      const fullMessage = selectedRoast + selectedSuggest;

      setTimeout(() => {
        api.sendMessage(fullMessage, threadID, () => {}, messageID);
      }, 5000);

    } catch (err) {
      console.error("Error in Gojo handleEvent:", err);
    }
  }
};

// STORAGE & DATA PATH
const DATA_PATH = path.join(__dirname, "gojo_data.json");
const AUTO_REPLY_MIN_DELAY_MS = 5000;
const lastReplyTime = {};

// LINYA NG MGA SASABIHIN (SUNOD-SUNOD AT BABALIK SA LINYA 1 PAGKATAPOS NG HULI)
const FALLBACK_ROASTS = [
  "1. Nah, I'd win. Akala mo ba talaga may chance ka laban sa pinakamalakas? 🕶️✨",
  "2. Huwag kang mag-alala, mahina ka lang talaga. Yowai mo~ 😼⚡",
  "3. Sa buong langit at lupa... ako lang ang natatanging Honored One. 🌌👑",
  "4. Limitless ang pagitan natin. Kahit anong gawin mo, hindi mo man lang ako madidikit. ♾️🕶️",
  "5. Masyadong mababa ang level mo. Kailangan mo pa ng ilang daang taon para makahabol sa akin. 🔮😼",
  "6. Domain Expansion: Infinite Void! Sobrang daming impormasyon ba sa utak mo kaya ka napapahinto? 🌌👁️",
  "7. It's fine. After all, you're weak. 🤞✨",
  "8. Titingnan mo ba ako nang ganyan dahil lang sa gwapo ako at napakalakas? 🕶️💙",
  "9. Relax ka lang. Ako ang pinakamalakas, kaya sanay na akong makakita ng mga sumusuko. 😼⚡",
  "10. Puro ka dada, subukan mo kayang itaas ang Cursed Energy mo? Masyadong boring. 🔮♾️"
];

const STICKER_ROASTS = [
  "1. Sticker lang? Ganyan na lang ba ang kakayahan ng isang mahinang tulad mo? 🕶️😼",
  "2. Walang epekto 'yang sticker mo sa Infinity barrier ko. ♾️⚡",
  "3. Nag-send ka ng sticker dahil wala ka nang maipuntang magandang argumento? Yowai mo~ 🤞✨"
];

const EMOJI_ROASTS = [
  "1. Puro ka emoji. Naubusan ka na ba ng cursed energy para mag-type? 🕶️⚡",
  "2. Tawa ka nang tawa. Nakakatawa rin ba kapag ginamit ko na ang Domain Expansion? 🌌👁️",
  "3. Emoji lang kaya mong ibato? Napakahina naman ng atake mo. Yowai mo~ 🤞😼"
];

const GOJO_SUGGESTIONS = [
  "\n\n🕶️ /silent *Gojo Satoru: Don't worry, I'm the strongest.* 🌌",
  "\n\n🌌 /silent *Gojo Satoru: Domain Expansion: Infinite Void.* ♾️",
  "\n\n♾️ /silent *Gojo Satoru: You can't touch me, weakling.* ⚡"
];

function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const fileData = fs.readFileSync(DATA_PATH, "utf8");
      if (fileData) return JSON.parse(fileData);
    }
  } catch (err) {}
  return { threads: {} };
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {}
          }
