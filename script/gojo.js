const fs = require("fs");
const path = require("path");

// ==========================================
// CONFIGURATION: ADMIN USER IDs (UID)
const ADMIN_IDS = [
  "61594055835097",
  "61594325727109",
  "61594022290817",
  "61593892603402"
];
// ==========================================

const DATA_PATH = path.join(__dirname, "gojo_data.json");
const AUTO_REPLY_MIN_DELAY_MS = 5000;
const lastReplyTime = {};

// 100 SEQUENTIAL ROASTS (Quotes, Emojis, Stickers, & Photos Text)
const FALLBACK_ROASTS = [
  { type: "text", content: "1. Nah, I'd win. Akala mo ba talaga may chance ka laban sa pinakamalakas? 🕶️✨" },
  { type: "text", content: "2. Huwag kang mag-alala, mahina ka lang talaga. Yowai mo~ 😼⚡" },
  { type: "text", content: "3. 🌌👑 Domain Expansion: Infinite Void! Sobrang daming impormasyon ba sa utak mo kaya ka napapahinto? 👁️✨" },
  { type: "text", content: "4. 📸 [PHOTO ATTACHED] Eto ang mukha ng taong hirap na hirap mag-isip sa harap ni Gojo-sensei! 🕶️📷" },
  { type: "text", content: "5. 🎯 [STICKER SENT] *Gojo Blindfold Flip* 🕶️" },
  { type: "text", content: "6. Limitless ang pagitan natin. Kahit anong gawin mo, hindi mo man lang ako madidikit. ♾️🕶️" },
  { type: "text", content: "7. It's fine. After all, you're weak. 🤞✨" },
  { type: "text", content: "8. 🕶️💙✨ 👁️♾️ ⚡😼 (Six Eyes activation aura... bilang ka muna hanggang sampu!)" },
  { type: "text", content: "9. 📸 [PHOTO ATTACHED] Gojo Satoru Smirk Photo.jpg — Tumingin ka sa tunay na panalo! 🔴🔥" },
  { type: "text", content: "10. 🎯 [STICKER SENT] *Gojo Laughing Meme Sticker* 😹" },
  { type: "text", content: "11. Relax ka lang. Ako ang pinakamalakas, kaya sanay na akong makakita ng mga sumusuko. 😼⚡" },
  "12. Puro ka dada, subukan mo kayang itaas ang Cursed Energy mo? Masyadong boring. 🔮♾️",
  "13. 👁️🕶️ Six Eyes ko pa lang, kitang-kita ko na kung gaano kababaw ang iniisip mo.",
  { type: "text", content: "14. 📸 [PHOTO ATTACHED] Cursed Technique Reversal: RED in full resolution! 🔴💥" },
  { type: "text", content: "15. 🎯 [STICKER SENT] *Yowai Mo Gojo Animated Sticker* 😼" },
  "16. Akala mo ba nakakatakot ka? Maski sa panaginip mo, hindi mo ako matatalo. 🌌😼",
  "17. Isang snap ko lang, bura agad ang kayabangan mo. Magtino ka. ⚡🤞",
  "18. 🔴🔥🔵🟣 Cursed Technique Lapse: Blue + Reversal: Red = HOLLOW PURPLE!",
  { type: "text", content: "19. 📸 [PHOTO ATTACHED] Gojo Eating Sweet Treats while watching you struggle 🍭🍧" },
  { type: "text", content: "20. 🎯 [STICKER SENT] *Infinite Void Brain Melt Sticker* 🧠⚡" },
  "21. Mabilis ka nga ba talaga o sadyang mabagal lang ang reflexes mo sa harapan ko? 🕶️⚡",
  "22. Gusto mo ba ng sweet treats muna bago kita padapanin sa pagsasanay? 🍭😼",
  "23. 👑♾️ Sa buong langit at lupa... ako lang ang natatanging Honored One!",
  "24. 📸 [PHOTO ATTACHED] Proof of your defeat graph screenshot 📊📉",
  "25. 🎯 [STICKER SENT] *Gojo Peace Sign Sticker* ✌️🕶️",
  "26. Huwag ka nang umasa. Sa dulo ng laban na 'to, ako pa rin ang nakatayo. 👑♾️",
  "27. Ang lakas ng loob mo mag-chat, may Cursed Technique ka ba man lang? 🔮🕶️",
  "28. 🌌🤞 ⚡🔴 🔮🔵 ♾️💙 (Full arsenal loaded, handa ka na ba?)",
  "29. 📸 [PHOTO ATTACHED] Gojo Sensei pointing at you with 'Yowai Mo' caption 🫵😼",
  "30. 🎯 [STICKER SENT] *Gojo Thumbs Down Sticker* 👎🕶️",
  "31. Wala sa bokabularyo ko ang matalo. Subukan mo uli sa susunod mong buhay. 🌌🤞",
  "32. Baka kailangan mo muna ng blindfold para hindi ka ma-overwhelm sa aura ko. 🕶️✨",
  "33. 👁️😼 Napakadali mong basahin. Para kang libro na bukas ang bawat pahina.",
  "34. 📸 [PHOTO ATTACHED] High Definition Hollow Purple Blast Photo 🟣💥",
  "35. 🎯 [STICKER SENT] *Gojo Bye Bye Wave Sticker* 👋✨",
  "36. Gojo Satoru lang naman ang kausap mo, matuto kang gumalang sa tuktok! 👑⚡",
  "37. Kahit magsama pa kayo ng buong tropa mo, balewala pa rin 'yan sa Infinity ko. ♾️💙",
  "38. 🍭✨ 😼🕶️ 👑⚡ 🌌👁️ (Gojo Flex Combo Activated!)",
  "39. 📸 [PHOTO ATTACHED] Gojo sleeping photo — Maski tulog, panalo pa rin! 😴💤",
  "40. 🎯 [STICKER SENT] *Gojo Shocked Face Sticker* 😲🕶️",
  "41. Ganyan ba talaga ang ginagawa mo kapag alam mong wala ka nang maipapanalo? 😼✨",
  "42. Anong pakiramdam ng tumingala sa pinakamalakas? Nakakalula ba? 🌌🕶️",
  "43. 🔮⚡ Wala ka man lang maipakitang maganda, puro ka lang salita.",
  "44. 📸 [PHOTO ATTACHED] Jujutsu High Admin Seal Certificate 📜🚫",
  "45. 🎯 [STICKER SENT] *Gojo Lollipop Pop Sticker* 🍭✨",
  "46. Gusto mo bang turuan kita kung paano maging malakas? Charot, hindi mo kaya. 🍭😼",
  "47. I'm the honored one for a reason. Manahimik ka na lang diyan. 👑🤞",
  "48. ♾️🕶️ 🔴🔥 🔵🌌 🟣💥 (Infinity Shield Max Power Enabled)",
  "49. 📸 [PHOTO ATTACHED] Gojo flexing his Six Eyes without blindfold 👁️💎",
  "50. 🎯 [STICKER SENT] *Gojo Facepalm Sticker* 🤦‍♂️🕶️",
  "51. Kahit gumamit ka pa ng mga cursed tool, balewala pa rin sa Infinity barrier ko. ♾️🕶️",
  "52. Cursed Technique Lapse: Blue! Hihilahin kita pabalik sa katotohanan na mahina ka! 🔵🌌",
  "53. 😼✨ Seryoso ka ba sa mga sinasabi mo o nagpapatawa ka lang talaga?",
  "54. 📸 [PHOTO ATTACHED] Victories Wall: Gojo 100 - You 0 🏆🥇",
  "55. 🎯 [STICKER SENT] *Gojo Wink Emoji Sticker* 😉🕶️",
  "56. Ang bagal mo mag-isip, kailangan ko pa bang hintayin ang susunod na siglo? ⏳🕶️",
  "57. Sa lakas ng aura ko, dapat nanginginig ka na habang nagta-type! ⚡🔮",
  "58. 🌌😼 Hindi ka ba napapagod na magmukhang katawa-tawa sa harap ko?",
  "59. 📸 [PHOTO ATTACHED] Gojo wearing sunglasses reflection photo 🕶️☀️",
  "60. 🎯 [STICKER SENT] *Gojo Mind Blown Sticker* 🤯⚡",
  "61. Kahit naka-pikit ako, kaya pa rin kitang talunin gamit ang isang daliri lang! 🤞🕶️",
  "62. Baka gusto mong pumasok sa Infinite Void para naman tumino 'yang utak mo? 👁️🌌",
  "63. 👑⚡ Wala ka talagang pag-asa. Bawi ka na lang sa susunod na reencarnation!",
  "64. 📸 [PHOTO ATTACHED] Gojo drinking tea comfortably photo ☕😌",
  "65. 🎯 [STICKER SENT] *Gojo No Thanks Hand Gesture Sticker* 🙅‍♂️🕶️",
  "66. Wag ka nang umarte, alam naman ng lahat na ako ang mas magaling at mas gwapo. 🕶️💙",
  "67. Akala mo siguro nakikipaglaban ka sa pantay sa'yo. Surprise! Malayo ka pa. ♾️😼",
  "68. 🔮✨ Paulit-ulit ka lang, wala ka na bang bagong sasabihin? Yowai mo!",
  "69. 📸 [PHOTO ATTACHED] Red & Blue Cursed Energy Sphere Fusion 🔴🔵",
  "70. 🎯 [STICKER SENT] *Gojo Laughing Out Loud Sticker* 😾😹",
  "71. Subukan mo pang sumagot, baka tuluyan ka nang maalis sa GC na 'to! ⚡🕶️",
  "72. I'm literally the strongest sorcerer alive. Sino ka ulit? 👑🌌",
  "73. 🔴🔥 Wag mong subukang abutin ang araw kung alam mong matutunaw ka lang!",
  "74. 📸 [PHOTO ATTACHED] Gojo Hoodie Chill Outfit Photo 🧥🕶️",
  "75. 🎯 [STICKER SENT] *Gojo Salute Sticker* 🫡👑",
  "76. Kahit anong ensayo mo, balewala pa rin kapag humarap ka sa akin. 😼♾️",
  "77. Ang cute ng effort mo, pwedeng pang-elementary level! 🍭✨",
  "78. 👁️🕶️ Masyadong maingay ang tulad mong walang tunay na kakayahan.",
  "79. 📸 [PHOTO ATTACHED] Domain Expansion Spatial Barrier FX Photo 🌌🛡️",
  "80. 🎯 [STICKER SENT] *Gojo Popcorn Eating Sticker* 🍿🎬",
  "81. Hollow Purple lang ang katapat ng lahat ng kayabangan mo! 🟣🌌",
  "82. Mapapagod ka lang sa pagsubok na tapatan ang Infinity ko. ♾️⚡",
  "83. 😼✨ Hindi ka nababagay sa arena na 'to, umuwi ka na lang at magpahinga.",
  "84. 📸 [PHOTO ATTACHED] Gojo victory sign in Shibuya photo ✌️🏙️",
  "85. 🎯 [STICKER SENT] *Gojo Sleeping Zzz Sticker* 😴☁️",
  "86. Halfway na tayo sa usapan pero wala ka pa ring maipakitang maganda! 🔮👑",
  "87. Wag kang magalit sa akin, magalit ka sa sarili mo dahil mahina ka! 🕶️⚡",
  "88. 📚😼 Mukhang kailangan mo pa ng extra lessons mula kay Gojo-sensei!",
  "89. 📸 [PHOTO ATTACHED] Gojo Eyes Closeup Lens Flare 👁️✨",
  "90. 🎯 [STICKER SENT] *Gojo Thumbs Up Sarcastic Sticker* 👍😼",
  "91. Ang daling paikutin ng tulad mo, para kang marionette sa mga daliri ko. 🤞🌌",
  "92. Akala mo ba maaapektuhan ako ng mga salita mo? Cute attempt! 💙✨",
  "93. 👁️🔮 Sa dami ng sinabi mo, wala man lang kahit isang may Sense!",
  "94. 📸 [PHOTO ATTACHED] Gojo Satoru Wallpaper HD Quality 🖼️👑",
  "95. 🎯 [STICKER SENT] *Gojo Finger Snap Explosive Sticker* 🫰💥",
  "96. Baka naman pwede kang mag-level up muna bago ka mag-message ulit? ⚡♾️",
  "97. Wag mong kalilimutan kung sino ang naghahari sa GC na 'to. 👑🕶️",
  "98. 🌌⚡ Masyado akong mabilis para sa mga mata mong mabagal!",
  "99. 📸 [PHOTO ATTACHED] Gojo Satoru Standing at the Apex Photo 🏔️👑",
  "100. 🎯 [STICKER SENT] *Line 100 Gojo Master Trophy Sticker* 🏆👑 (Babalik na sa Line 1!)"
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

async function getUserName(api, userID) {
  return new Promise((resolve) => {
    api.getUserInfo(userID, (err, ret) => {
      if (err || !ret || !ret[userID]) return resolve(null);
      resolve(ret[userID].name);
    });
  });
}

module.exports = {
  config: {
    name: "gojo",
    version: "44.0.0",
    hasPermssion: 0,
    hasPermission: 0,
    role: 0,
    credits: "Jehosh / Gojo Bot Suite",
    description: "UID Admin Verified Target Auto-Reply Engine",
    usePrefix: true,
    prefix: true,
    commandCategory: "admin",
    category: "admin",
    usages: "/gojo [on|off|target <FB Name>|status|setgname]",
    cooldowns: 1,
    countDown: 1
  },

  onStart: async function (context) {
    const { api, event, args } = context;
    const { threadID, messageID, senderID } = event;
    const sub = (args[0] || "").toLowerCase();

    // UID CHECK FOR ADMIN PERMISSION
    if (!ADMIN_IDS.includes(String(senderID))) {
      return api.sendMessage("🕶️ 😼 *Gojo Satoru:* Yowai mo~ Admin UID lang ang pwedeng gumamit nito.", threadID, messageID);
    }

    let data = loadData();
    if (!data.threads) data.threads = {};
    if (!data.threads[threadID]) {
      data.threads[threadID] = { 
        infinite: false, 
        targetName: null,
        lockedTitle: null, 
        textIndex: 0 
      };
    }

    const currentThread = data.threads[threadID];

    if (sub === "target") {
      const targetInput = args.slice(1).join(" ");
      if (!targetInput) {
        return api.sendMessage("🕶️ Maglagay ng FB Name ng target!\nHalimbawa: /gojo target Juan Dela Cruz", threadID, messageID);
      }
      currentThread.targetName = targetInput;
      saveData(data);
      return api.sendMessage(`🕶️ 🎯 Naka-set na ang target kay: "${targetInput}"`, threadID, messageID);
    }

    if (sub === "on") {
      if (!currentThread.targetName) {
        return api.sendMessage("🕶️ Mag-set muna ng target person!\nGamitin: /gojo target <FB Name>", threadID, messageID);
      }
      currentThread.infinite = true;
      saveData(data);
      return api.sendMessage(`🕶️ 🌌 GOJO TARGET MODE ACTIVATED ♾️\n🎯 Target: ${currentThread.targetName}`, threadID, messageID);
    }

    if (sub === "off") {
      currentThread.infinite = false;
      saveData(data);
      return api.sendMessage("🕶️ ⚡ Naka-OFF na ang Gojo Auto-Reply.", threadID, messageID);
    }

    if (sub === "status") {
      return api.sendMessage(
        `🕶️ **GOJO STATUS**:\n` +
        `• Active: ${currentThread.infinite ? "YES ♾️" : "NO"}\n` +
        `• Target Person: ${currentThread.targetName || "Wala pa (/gojo target <FB Name>)"}\n` +
        `• Locked GC Name: ${currentThread.lockedTitle || "None"}`, 
        threadID, messageID
      );
    }

    if (sub === "setgname") {
      const newTitle = args.slice(1).join(" ");
      if (!newTitle) return api.sendMessage("🕶️ Gamit: /gojo setgname <pangalan>", threadID, messageID);

      if (newTitle === "off") {
        currentThread.lockedTitle = null;
        saveData(data);
        return api.sendMessage("🕶️ Unlocked na ang GC Name.", threadID, messageID);
      }

      currentThread.lockedTitle = newTitle;
      saveData(data);
      api.setTitle(newTitle, threadID, () => {});
      return api.sendMessage(`🕶️ Naka-lock na ang GC Name sa: "${newTitle}"!`, threadID, messageID);
    }

    return api.sendMessage(
      "🕶️ **GOJO COMMAND LIST** 🕶️\n\n" +
      "• /gojo target <FB Name> — I-set ang aasarinh person\n" +
      "• /gojo on — Paganahin ang Auto-Reply\n" +
      "• /gojo off — Patayin ang Auto-Reply\n" +
      "• /gojo status — Tingnan ang status & target\n" +
      "• /gojo setgname <pangalan> — Lock GC Name",
      threadID, messageID
    );
  },

  run: async function (api, event, args) {
    if (typeof api === "object" && api.api && api.event) {
      return this.onStart(api);
    }
    return this.onStart({ api, event, args });
  },

  handleEvent: async function ({ api, event }) {
    try {
      const { threadID, senderID, body, messageID, logMessageType, logMessageData } = event;
      if (!threadID) return;

      const data = loadData();
      const threadData = data.threads ? data.threads[threadID] : null;

      // 1. AUTO REVERT GC NAME
      if (logMessageType === "log:thread-name" && threadData && threadData.lockedTitle) {
        if (logMessageData && logMessageData.name !== threadData.lockedTitle) {
          api.setTitle(threadData.lockedTitle, threadID, () => {});
        }
        return;
      }

      // 2. TARGET NAME AUTO-REPLY CHECK
      const botID = api.getCurrentUserID();
      if (!senderID || senderID === botID || !threadData || !threadData.infinite || !threadData.targetName) return;
      if (body && body.startsWith("/")) return;

      const senderName = await getUserName(api, senderID);
      if (!senderName || senderName.toLowerCase() !== threadData.targetName.toLowerCase()) return;

      const now = Date.now();
      if (lastReplyTime[threadID] && (now - lastReplyTime[threadID] < AUTO_REPLY_MIN_DELAY_MS)) return;

      if (typeof threadData.textIndex !== "number") threadData.textIndex = 0;
      const selectedItem = FALLBACK_ROASTS[threadData.textIndex % FALLBACK_ROASTS.length];
      threadData.textIndex = (threadData.textIndex + 1) % FALLBACK_ROASTS.length;

      saveData(data);
      lastReplyTime[threadID] = now;

      setTimeout(() => {
        const payload = typeof selectedItem === "string" ? selectedItem : selectedItem.content;
        api.sendMessage(payload, threadID, () => {}, messageID);
      }, 5000);

    } catch (err) {
      console.error("Error in Gojo handleEvent:", err);
    }
  }
};
