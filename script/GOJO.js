const fs = require("fs");
const path = require("path");

// ==========================================
// CONFIGURATION (4 ADMIN IDS)
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
    version: "31.0.0",
    hasPermssion: 0,
    hasPermission: 0,
    credits: "Jehosh / Gojo Bot Suite",
    description: "Gojo Satoru Infinite Engine: Sequential / Loop Reply Lines, ID-Based Nickname Guard, Pure Gojo Persona",
    usePrefix: true,
    prefix: true,
    commandCategory: "admin",
    usages: "/gojo on — Start Infinite Gojo Mode\n" +
            "/gojo theme — Apply Gojo Blue Theme\n" +
            "/gojo onsetgname <pangalan> — Lock GC Name\n" +
            "/gojo offgname — Unlock GC Name\n" +
            "/gojo onsetnick <User ID> | <Bagong Nickname> — Lock Nickname via User ID\n" +
            "/gojo offnick <User ID> — Unlock Nickname via User ID\n" +
            "/gojo welcome <on/off> — Toggle Auto Welcome\n" +
            "/gojo target <User ID> — Lock Target via ID\n" +
            "/gojo untarget — Clear Target\n" +
            "/gojo off — Turn OFF Gojo Mode\n" +
            "/gojo status — Check Gojo Status",
    cooldowns: 2
  },

  onStart: async function ({ api, event, args }) {
    return this.run({ api, event, args });
  },

  handleEvent: async function ({ api, event }) {
    try {
      const { threadID, senderID, body, messageID, logMessageType, logMessageData, type, attachments } = event;
      if (!threadID) return;
      
      const botID = api.getCurrentUserID();
      const data = loadData();
      const threadData = data.threads ? data.threads[threadID] : null;

      // 🔒 1. ANTI-CHANGE GC NAME GUARD
      if (logMessageType === "log:thread-name") {
        const lockedName = threadData ? threadData.lockedTitle : null;
        const newName = logMessageData ? logMessageData.name : "";

        if (lockedName && newName !== lockedName) {
          api.setTitle(lockedName, threadID, (err) => {
            if (!err) {
              api.sendMessage(`🕶️ ♾️ *Gojo Satoru:* Subukan mo pang palitan ang GC name. Naka-lock ang Domain na 'to sa "${lockedName}". 🌌⚡`, threadID);
            }
          });
        }
        return;
      }

      // 🔒 2. ANTI-CHANGE NICKNAME GUARD (ID-BASED)
      if (logMessageType === "log:user-nickname") {
        const targetUserID = logMessageData ? logMessageData.participant_id : null;
        const newNickname = logMessageData ? logMessageData.nickname : "";
        const lockedNicknames = threadData ? threadData.lockedNicknames || {} : {};

        if (targetUserID && lockedNicknames[targetUserID]) {
          const requiredNick = lockedNicknames[targetUserID];

          if (newNickname !== requiredNick) {
            api.changeNickname(requiredNick, threadID, targetUserID, (err) => {
              if (!err) {
                api.sendMessage(`🕶️ 🤞 *Gojo Satoru:* Walang makakatagos sa Infinity Lock ko! Naka-lock ang ID na [${targetUserID}] sa "${requiredNick}". Yowai mo~ 😼⚡`, threadID);
              }
            });
          }
        }
        return;
      }

      if (!senderID) return;

      // AUTO WELCOME SYSTEM
      if (logMessageType === "log:subscribe") {
        const addedParticipants = logMessageData ? logMessageData.addedParticipants || [] : [];
        if (threadData && threadData.welcome) {
          addedParticipants.forEach((participant) => {
            const newName = participant.fullName || "Bagong Sorcerer";
            sendSilentReplyWithMentions(
              api,
              threadID,
              `🕶️ /silent *Gojo Satoru:* Welcome sa Jujutsu Realm, ${newName}! Protektado ka ng pinakamalakas sa buong mundo. 🌌✨`,
              null
            );
          });
        }
        return;
      }

      if (!isThreadActive(threadID) || senderID === botID || !threadData) return;

      if (body && body.startsWith("/")) return;

      if (threadData.targetUser && senderID !== threadData.targetUser) return;

      if (isSpamming(senderID)) return;

      const now = Date.now();
      const randomDelay = Math.floor(Math.random() * (AUTO_REPLY_MAX_DELAY_MS - AUTO_REPLY_MIN_DELAY_MS + 1)) + AUTO_REPLY_MIN_DELAY_MS;
      
      if (lastReplyTime[threadID] && (now - lastReplyTime[threadID] < AUTO_REPLY_MIN_DELAY_MS)) return;

      let selectedRoast = "";
      const isSticker = type === "sticker" || (attachments && Array.isArray(attachments) && attachments.some(a => a.type === "sticker"));
      
      const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F7FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
      const isEmojiOnly = body && body.trim().replace(emojiRegex, '').length === 0;

      // SEQUENTIAL / ROUND-BASED LINE SELECTION (SUNOD-SUNOD)
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

      // SUNOD-SUNOD NA SUFFIX / SUGGESTIONS
      if (typeof threadData.suggestIndex !== "number") threadData.suggestIndex = 0;
      const selectedSuggest = GOJO_SUGGESTIONS[threadData.suggestIndex % GOJO_SUGGESTIONS.length];
      threadData.suggestIndex = (threadData.suggestIndex + 1) % GOJO_SUGGESTIONS.length;

      saveData(data);

      if (!selectedRoast || selectedRoast.trim().length === 0) return;

      lastReplyTime[threadID] = now;

      const fullMessage = selectedRoast + selectedSuggest;

      setTimeout(() => {
        try {
          api.setMessageReaction("🐶", messageID, () => {}, true);
        } catch (e) {}
      }, 600);

      setTimeout(() => {
        sendSilentReplyWithMentions(api, threadID, fullMessage, messageID, (err, info) => {
          if (!err && info && info.messageID) {
            const randomGojoEmoji = GOJO_SELF_EMOJIS[Math.floor(Math.random() * GOJO_SELF_EMOJIS.length)];
            setTimeout(() => {
              try {
                api.setMessageReaction(randomGojoEmoji, info.messageID, () => {}, true);
              } catch (e) {}
            }, 1000);
          }
        });
      }, randomDelay);

    } catch (err) {}
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
      if (!currentThread.lockedNicknames) currentThread.lockedNicknames = {};

      if (!ADMIN_IDS.includes(senderID)) {
        return api.sendMessage("🕶️ 😼 *Gojo Satoru:* Yowai mo~ Hindi ka pwedeng magbigay ng utos sa Honored One.", threadID, messageID);
      }

      if (sub === "theme") {
        applyGojoThemeSafely(api, threadID, () => {
          return api.sendMessage("🕶️ 🌌 *Gojo Satoru:* Domain Expansion: Infinite Void Blue Theme fully applied! 🔮⚡", threadID, messageID);
        });
        return;
      }

      // ID-BASED ONSETNICK
      if (sub === "onsetnick") {
        const inputStr = args.slice(1).join(" ");
        if (!inputStr.includes("|")) {
          return api.sendMessage("🕶️ 🤞 *Gojo Satoru:* Mali ang format!\nFormat: /gojo onsetnick <Facebook User ID> | <Bagong Nickname>", threadID, messageID);
        }

        const [targetUID, newNicknameInput] = inputStr.split("|").map(s => s.trim());
        if (!targetUID || !newNicknameInput) {
          return api.sendMessage("🕶️ ⚡ *Gojo Satoru:* Maglagay ng Valid User ID at Bagong Nickname.", threadID, messageID);
        }

        currentThread.lockedNicknames[targetUID] = newNicknameInput;
        saveData(data);

        api.changeNickname(newNicknameInput, threadID, targetUID, (changeErr) => {
          if (changeErr) {
            return api.sendMessage(`⚠️ 🕶️ *Gojo Satoru:* Na-save ang Lock pero may error sa pag-apply sa ID [${targetUID}]. Siguraduhing Member siya ng GC at Admin ang bot!`, threadID, messageID);
          }
          return api.sendMessage(`🕶️ 🔒 *Gojo Satoru:* NAKA-LOCK NA ANG INFINITY NICKNAME!\n• User ID: ${targetUID}\n• Nickname: "${newNicknameInput}" 😼⚡`, threadID, messageID);
        });
        return;
      }

      // ID-BASED OFFNICK
      if (sub === "offnick") {
        const targetUID = args[1] ? args[1].trim() : null;
        if (!targetUID) {
          return api.sendMessage("🕶️ 🤞 *Gojo Satoru:* Maglagay ng User ID. Example: /gojo offnick 100012345678", threadID, messageID);
        }

        if (currentThread.lockedNicknames[targetUID]) {
          delete currentThread.lockedNicknames[targetUID];
          saveData(data);
          return api.sendMessage(`🕶️ 🌌 *Gojo Satoru:* Inalis na ang Nickname Lock para sa ID [${targetUID}].`, threadID, messageID);
        } else {
          return api.sendMessage(`🕶️ 😼 *Gojo Satoru:* Walang naka-lock na nickname para sa ID [${targetUID}].`, threadID, messageID);
        }
      }

      if (sub === "onsetgname") {
        const customGCName = args.slice(1).join(" ");
        if (!customGCName) return api.sendMessage("🕶️ 🔮 *Gojo Satoru:* Maglagay ng pangalan. Example: /gojo onsetgname Jujutsu Realm", threadID, messageID);

        currentThread.lockedTitle = customGCName;
        saveData(data);

        api.setTitle(customGCName, threadID, (err) => {
          if (err) return api.sendMessage("⚠️ 🕶️ *Gojo Satoru:* Siguraduhing Admin ako para ma-lock ang GC Name.", threadID, messageID);
          return api.sendMessage(`🕶️ 🔒 *Gojo Satoru:* Naka-LOCK na ang GC Name sa "${customGCName}". 🌌`, threadID, messageID);
        });
        return;
      }

      if (sub === "offgname") {
        currentThread.lockedTitle = null;
        saveData(data);
        return api.sendMessage("🕶️ 🔓 *Gojo Satoru:* Inalis na ang Lock sa GC Name.", threadID, messageID);
      }

      if (sub === "welcome") {
        const status = (args[1] || "").toLowerCase();
        if (status === "on") {
          currentThread.welcome = true;
          saveData(data);
          return api.sendMessage("🕶️ ✨ *Gojo Satoru:* Welcome system: ENABLED.", threadID, messageID);
        } else if (status === "off") {
          currentThread.welcome = false;
          saveData(data);
          return api.sendMessage("🕶️ ⚡ *Gojo Satoru:* Welcome system: DISABLED.", threadID, messageID);
        }
        return api.sendMessage("🕶️ 🤞 *Gojo Satoru:* Gamitin ang: /gojo welcome on O /gojo welcome off", threadID, messageID);
      }

      // INFINITE DURATION ACTIVATION
      if (sub === "on") {
        currentThread.infinite = true;
        currentThread.activatedBy = senderID;
        saveData(data);

        applyGojoThemeSafely(api, threadID);

        return api.sendMessage(
          `🕶️ 🌌 GOJO SATORU INFINITE MODE ACTIVATED ♾️\n\n` +
          `👑 Exclusive Admins:\n${ADMIN_IDS.join("\n")}\n\n` +
          `🤖 Engine: Round-Based Sequential Lines (Looping)\n` +
          `🔒 Guard: Strict ID Nickname Guard & Target Lock\n` +
          `💙 Theme: Gojo Blue Theme\n` +
          `💬 Delay: 5.0s - 7.0s (Anti-Ban Guard)\n` +
          `⏳ Duration: INFINITE / FOREVER ACTIVE ♾️⚡`,
          threadID,
          messageID
        );
      }

      // ID-BASED TARGET
      if (sub === "target") {
        const targetUID = args[1] ? args[1].trim() : null;
        if (!targetUID) {
          return api.sendMessage("🕶️ 🎯 *Gojo Satoru:* Maglagay ng User ID ng ie-eliminate. Example: /gojo target 100012345678", threadID, messageID);
        }

        currentThread.targetUser = targetUID;
        saveData(data);

        return api.sendMessage(`🕶️ 🎯 *Gojo Satoru:* Target locked sa User ID [${targetUID}]! Walang makakatakas sa Six Eyes ko. 🌌`, threadID, messageID);
      }

      if (sub === "untarget") {
        currentThread.targetUser = null;
        saveData(data);
        return api.sendMessage("🕶️ 🔓 *Gojo Satoru:* Inalis na ang Target Lock.", threadID, messageID);
      }

      if (sub === "off") {
        currentThread.infinite = false;
        currentThread.targetUser = null;
        saveData(data);
        return api.sendMessage("🕶️ ⚡ *Gojo Satoru:* Naka-OFF na ang Auto-Reply sa GC na 'to.", threadID, messageID);
      }

      if (sub === "status") {
        return api.sendMessage(
          `🕶️ 👑 GOJO BOT INFINITE STATUS ♾️:\n` +
          `• Auto-Reply: ${currentThread.infinite ? "INFINITE ACTIVE ♾️" : "OFF"}\n` +
          `• Current Text Round: Line ${(currentThread.textIndex || 0) + 1} of ${FALLBACK_ROASTS.length}\n` +
          `• GC Name Lock: ${currentThread.lockedTitle ? currentThread.lockedTitle : "OFF"}\n` +
          `• Target ID: ${currentThread.targetUser ? currentThread.targetUser : "Lahat sa GC"}\n` +
          `• Total Locked IDs: ${Object.keys(currentThread.lockedNicknames).length}`,
          threadID,
          messageID
        );
      }

      return api.sendMessage(
        `🕶️ 🌌 GOJO SATORU UNLIMITED COMMANDS ♾️:\n` +
        `/gojo on — Start Infinite Gojo Mode\n` +
        `/gojo theme — Apply Gojo Blue Theme\n` +
        `/gojo onsetgname <name> — Lock GC Name\n` +
        `/gojo onsetnick <User ID> | <Nickname> — Lock Nickname via ID\n` +
        `/gojo offnick <User ID> — Unlock Nickname via ID\n` +
        `/gojo target <User ID> — Lock Target via ID\n` +
        `/gojo off — Turn OFF`,
        threadID,
        messageID
      );
    } catch (err) {}
  }
};

// HELPERS & STORAGE
const DATA_PATH = path.join(__dirname, "gojo_data.json");
const AUTO_REPLY_MIN_DELAY_MS = 5000;
const AUTO_REPLY_MAX_DELAY_MS = 7000;
const SPAM_WINDOW_MS = 10000;
const USER_SPAM_LIMIT = 2;

const GOJO_THEME_IDS = ["2104033373204368", "701621227181600", "4538800262808000"];
const lastReplyTime = {};
const userMessageTracker = {};

const GOJO_SELF_EMOJIS = ["🕶️", "🌌", "♾️", "💙", "⚡", "😼", "🤞", "👑", "🔮", "✨"];

// SEQUENTIAL AUTO-REPLY LINES (SUSUNDIN ITO SUNOD-SUNOD PAGKATAPOS BABALIK SA LINYA 1)
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
  "10. Puro ka dada, subukan mo kayang itaas ang Cursed Energy mo? Masyadong boring. 🔮♾️",
  "11. Six Eyes ko pa lang, kitang-kita ko na kung gaano kababaw ang iniisip mo. 👁️🕶️",
  "12. Akala mo ba nakakatakot ka? Maski sa panaginip mo, hindi mo ako matatalo. 🌌😼",
  "13. Isang snap ko lang, bura agad ang kayabangan mo. Magtino ka. ⚡🤞",
  "14. Subukan mong magyabang ulit, ipapadama ko sa'yo ang Cursed Technique Reversal: Red sa mukha mo! 🔴🔥",
  "15. Mabilis ka nga ba talaga o sadyang mabagal lang ang reflexes mo sa harapan ko? 🕶️⚡",
  "16. Gusto mo ba ng sweet treats muna bago kita padapanin sa pagsasanay? 🍭😼",
  "17. Huwag ka nang umasa. Sa dulo ng laban na 'to, ako pa rin ang nakatayo bilang Pinakamalakas. 👑♾️",
  "18. Ang lakas ng loob mo mag-chat, may Cursed Technique ka ba man lang? 🔮🕶️",
  "19. Wala sa bokabularyo ko ang matalo. Subukan mo uli sa susunod mong buhay. 🌌🤞",
  "20. Baka kailangan mo muna ng blindfold para hindi ka ma-overwhelm sa aura ko. 🕶️✨",
  "21. Napakadali mong basahin. Para kang libro na bukas ang bawat pahina. 👁️😼",
  "22. Gojo Satoru lang naman ang kausap mo, matuto kang gumalang sa tuktok! 👑⚡",
  "23. Kahit magsama pa kayo ng buong tropa mo, balewala pa rin 'yan sa Infinity ko. ♾️💙",
  "24. Ganyan ba talaga ang ginagawa mo kapag alam mong wala ka nang maipapanalo? 😼✨",
  "25. Anong pakiramdam ng tumingala sa pinakamalakas? Nakakalula ba? 🌌🕶️",
  "26. Wala ka man lang maipakitang maganda, puro ka lang salita. 🔮⚡",
  "27. Gusto mo bang turuan kita kung paano maging malakas? Charot, hindi mo kaya. 🍭😼",
  "28. I'm the honored one for a reason. Manahimik ka na lang diyan. 👑🤞",
  "29. Kahit gumamit ka pa ng mga cursed tool, balewala pa rin sa Infinity barrier ko. ♾️🕶️",
  "30. Cursed Technique Lapse: Blue! Hihilahin kita pabalik sa katotohanan na mahina ka! 🔵🌌"
];

// SEQUENTIAL STICKER ROASTS
const STICKER_ROASTS = [
  "1. Sticker lang? Ganyan na lang ba ang kakayahan ng isang mahinang tulad mo? 🕶️😼",
  "2. Walang epekto 'yang sticker mo sa Infinity barrier ko. Subukan mo pang mag-send! ♾️⚡",
  "3. Nag-send ka ng sticker dahil wala ka nang maipuntang magandang argumento? Yowai mo~ 🤞✨",
  "4. Puro sticker. Hindi niyan matatapatan ang karisma at lakas ng Honored One. 👑🕶️",
  "5. Kahit sangkaterbang sticker pa ang i-send mo, hindi 'yan tatagos sa Limitless. 🌌♾️",
  "6. Isang sticker para itago ang takot mo? Bawi ka na lang sa susunod mong buhay! 🔮😼",
  "7. Nauwi ka na lang sa sticker? Naubusan ka na ba ng cursed energy para mag-type? ⚡🕶️",
  "8. Ang cute ng sticker mo, mukhang kasing-hina mo rin! 🍭😼"
];

// SEQUENTIAL EMOJI ROASTS
const EMOJI_ROASTS = [
  "1. Puro ka emoji. Naubusan ka na ba ng cursed energy para mag-type ng salita? 🕶️⚡",
  "2. Tawa ka nang tawa. Nakakatawa rin ba kapag ginamit ko na ang Domain Expansion? 🌌👁️",
  "3. Emoji lang kaya mong ibato? Napakahina naman ng atake mo. Yowai mo~ 🤞😼",
  "4. Isang simbolo lang ilalaban mo sa akin? Matuto kang gumalang sa pinakamalakas. 👑✨",
  "5. Wala na bang ibang naiisip 'yang utak mo kundi mag-reply ng emoji? 🔮🕶️",
  "6. Emoji spam won't save you from Infinite Void. Mag-isip ka naman ng magandang sasabihin! ♾️🌌",
  "7. Nag-reply ka lang ng emoji kasi alam mong wala kang binatbat sa akin. 😼⚡"
];

// SEQUENTIAL SUFFIXES
const GOJO_SUGGESTIONS = [
  "\n\n🕶️ /silent *Gojo Satoru: Don't worry, I'm the strongest.* 🌌",
  "\n\n🌌 /silent *Gojo Satoru: Domain Expansion: Infinite Void.* ♾️",
  "\n\n♾️ /silent *Gojo Satoru: You can't touch me, weakling.* ⚡",
  "\n\n🤞 /silent *Gojo Satoru: Yowai mo~ So weak.* 😼",
  "\n\n⚡ /silent *Gojo Satoru: Sa buong langit at lupa, ako ang natatanging Honored One.* 👑"
];

function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const fileData = fs.readFileSync(DATA_PATH, "utf8");
      if (fileData) {
        const parsed = JSON.parse(fileData);
        if (parsed && typeof parsed === "object") {
          if (!parsed.threads) parsed.threads = {};
          return parsed;
        }
      }
    }
  } catch (err) {}
  return { threads: {} };
}

function saveData(da
