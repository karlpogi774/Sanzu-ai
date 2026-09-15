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
    version: "37.0.0",
    hasPermssion: 0,
    hasPermission: 0,
    role: 0,
    credits: "Jehosh / Gojo Bot Suite",
    description: "100+ Sequential Lines Gojo Auto-Reply & Full Guard Bot",
    usePrefix: true,
    prefix: true,
    commandCategory: "admin",
    category: "admin",
    usages: "/gojo [on|off|status|target|setgname|locknick|unlocknick]",
    cooldowns: 2,
    countDown: 2
  },

  onStart: async function ({ api, event, args }) {
    return this.run({ api, event, args });
  },

  run: async function ({ api, event, args }) {
    try {
      const { threadID, messageID, senderID, mentions } = event;
      const sub = (args[0] || "").toLowerCase();

      let data = loadData();
      if (!data.threads) data.threads = {};
      if (!data.threads[threadID]) {
        data.threads[threadID] = { 
          infinite: false,
          targetUser: null, 
          lockedTitle: null, 
          lockedNicknames: {},
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

      // 1. MAIN TOGGLES
      if (sub === "on") {
        currentThread.infinite = true;
        saveData(data);
        return api.sendMessage("🕶️ 🌌 GOJO SATORU INFINITE MODE ACTIVATED ♾️\n100 Sequential Loop Lines fully loaded!", threadID, messageID);
      }

      if (sub === "off") {
        currentThread.infinite = false;
        saveData(data);
        return api.sendMessage("🕶️ ⚡ Naka-OFF na ang Gojo Auto-Reply sa GC na 'to.", threadID, messageID);
      }

      if (sub === "status") {
        const textPos = (currentThread.textIndex || 0) + 1;
        const titleText = currentThread.lockedTitle ? currentThread.lockedTitle : "Walang naka-lock";
        return api.sendMessage(
          `🕶️ **GOJO BOT STATUS**:\n` +
          `• Active: ${currentThread.infinite ? "YES ♾️" : "NO"}\n` +
          `• Locked GC Name: ${titleText}\n` +
          `• Current Text Line: ${textPos} / ${FALLBACK_ROASTS.length}\n` +
          `• Current Sticker Line: ${(currentThread.stickerIndex || 0) + 1} / ${STICKER_ROASTS.length}\n` +
          `• Current Emoji Line: ${(currentThread.emojiIndex || 0) + 1} / ${EMOJI_ROASTS.length}`, 
          threadID, messageID
        );
      }

      // 2. TARGET USER CONTROL
      if (sub === "target") {
        let targetID = null;
        if (mentions && Object.keys(mentions).length > 0) {
          targetID = Object.keys(mentions)[0];
        } else if (args[1] && !isNaN(args[1])) {
          targetID = args[1];
        } else if (args[1] === "off" || args[1] === "clear") {
          currentThread.targetUser = null;
          saveData(data);
          return api.sendMessage("🕶️ Clear na ang target! Lahat na ulit aasarin.", threadID, messageID);
        }

        if (!targetID) {
          return api.sendMessage("🕶️ Mag-tag ng tao o maglagay ng User ID!", threadID, messageID);
        }

        currentThread.targetUser = targetID;
        saveData(data);
        return api.sendMessage(`🕶️ Target locked sa User ID: ${targetID}!`, threadID, messageID);
      }

      // 3. SET GC NAME WITH AUTO-GUARD LOCK
      if (sub === "setgname" || sub === "locktitle") {
        const newTitle = args.slice(1).join(" ");
        if (!newTitle) {
          return api.sendMessage("🕶️ Maglagay ng pangalan ng GC!\nHalimbawa: /gojo setgname Gojo Domain", threadID, messageID);
        }
        if (newTitle === "off" || newTitle === "clear") {
          currentThread.lockedTitle = null;
          saveData(data);
          return api.sendMessage("🕶️ Unlocked na ang GC Name. Pwede na ulit nilang palitan.", threadID, messageID);
        }

        currentThread.lockedTitle = newTitle;
        saveData(data);
        
        // Change GC name immediately
        api.setTitle(newTitle, threadID, (err) => {
          if (err) console.error("Error setting title:", err);
        });
        return api.sendMessage(`🕶️ Naka-lock at auto-guard na ang GC Name sa: "${newTitle}"! Hindi na nila ito mapapalitan.`, threadID, messageID);
      }

      // 4. LOCK NICKNAME CONTROL
      if (sub === "locknick") {
        let targetID = null;
        let nickname = "";

        if (mentions && Object.keys(mentions).length > 0) {
          targetID = Object.keys(mentions)[0];
          const nameMentioned = mentions[targetID];
          nickname = args.slice(1).join(" ").replace(nameMentioned, "").trim();
        } else if (args[1] && !isNaN(args[1])) {
          targetID = args[1];
          nickname = args.slice(2).join(" ");
        }

        if (!targetID || !nickname) {
          return api.sendMessage("🕶️ Format: /gojo locknick @user <nickname> o /gojo locknick <ID> <nickname>", threadID, messageID);
        }

        if (!currentThread.lockedNicknames) currentThread.lockedNicknames = {};
        currentThread.lockedNicknames[targetID] = nickname;
        saveData(data);

        api.changeNickname(nickname, threadID, targetID, () => {});
        return api.sendMessage(`🕶️ Naka-lock na ang nickname ng ID [${targetID}] sa "${nickname}"!`, threadID, messageID);
      }

      if (sub === "unlocknick") {
        let targetID = args[1];
        if (mentions && Object.keys(mentions).length > 0) targetID = Object.keys(mentions)[0];
        if (targetID && currentThread.lockedNicknames) {
          delete currentThread.lockedNicknames[targetID];
          saveData(data);
          return api.sendMessage(`🕶️ Unlocked na ang nickname para sa ID [${targetID}].`, threadID, messageID);
        }
      }

      return api.sendMessage(
        "🕶️ **GOJO COMMAND LIST** 🕶️\n\n" +
        "• /gojo on — Paganahin ang Auto-Reply\n" +
        "• /gojo off — Patayin ang Auto-Reply\n" +
        "• /gojo status — Tingnan ang status\n" +
        "• /gojo target <@user/ID/clear> — Lock target\n" +
        "• /gojo setgname <pangalan/off> — Auto Change GC Name Lock\n" +
        "• /gojo locknick <@user/ID> <nick> — Lock Nickname\n" +
        "• /gojo unlocknick <@user/ID> — Unlock Nickname",
        threadID, messageID
      );

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

      // 1. AUTO REVERT GC NAME IF CHANGED BY NON-ADMIN / OTHERS
      if (logMessageType === "log:thread-name" && threadData && threadData.lockedTitle) {
        if (logMessageData && logMessageData.name !== threadData.lockedTitle) {
          api.setTitle(threadData.lockedTitle, threadID, (err) => {
            if (!err) {
              api.sendMessage(`🕶️ *Gojo Guard:* Hindi pwedeng palitan ang pangalan ng GC! Inilipat ko ito pabalik sa "${threadData.lockedTitle}".`, threadID);
            }
          });
        }
        return;
      }

      // 2. AUTO REVERT NICKNAME
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

      // AUTO-REPLY LOGIC
      if (!senderID || senderID === botID || !threadData || !threadData.infinite) return;
      if (body && body.startsWith("/")) return;
      if (threadData.targetUser && senderID !== threadData.targetUser) return;

      const now = Date.now();
      if (lastReplyTime[threadID] && (now - lastReplyTime[threadID] < AUTO_REPLY_MIN_DELAY_MS)) return;

      let selectedRoast = "";
      const isSticker = type === "sticker" || (attachments && Array.isArray(attachments) && attachments.some(a => a.type === "sticker"));
      const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F7FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
      const isEmojiOnly = body && body.trim().replace(emojiRegex, '').length === 0;

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

const DATA_PATH = path.join(__dirname, "gojo_data.json");
const AUTO_REPLY_MIN_DELAY_MS = 5000;
const lastReplyTime = {};

// 100 SEQUENTIAL TEXT ROASTS
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
  "14. Subukan mong magyabang ulit, ipapadama ko sa'yo ang Cursed Technique Reversal: Red! 🔴🔥",
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
  "30. Cursed Technique Lapse: Blue! Hihilahin kita pabalik sa katotohanan na mahina ka! 🔵🌌",
  "31. Seryoso ka ba sa mga sinasabi mo o nagpapatawa ka lang talaga? 😼✨",
  "32. Ang bagal mo mag-isip, kailangan ko pa bang hintayin ang susunod na siglo? ⏳🕶️",
  "33. Sa lakas ng aura ko, dapat nanginginig ka na habang nagta-type! ⚡🔮",
  "34. Hindi ka ba napapagod na magmukhang katawa-tawa sa harap ko? 🌌😼",
  "35. Kahit naka-pikit ako, kaya pa rin kitang talunin gamit ang isang daliri lang! 🤞🕶️",
  "36. Baka gusto mong pumasok sa Infinite Void para naman tumino 'yang utak mo? 👁️🌌",
  "37. Wala ka talagang pag-asa. Bawi ka na lang sa susunod na reencarnation! 👑⚡",
  "38. Wag ka nang umarte, alam naman ng lahat na ako ang mas magaling at mas gwapo. 🕶️💙",
  "39. Akala mo siguro nakikipaglaban ka sa pantay sa'yo. Surprise! Malayo ka pa. ♾️😼",
  "40. Paulit-ulit ka lang, wala ka na bang bagong sasabihin? Yowai mo! 🔮✨",
  "41. Subukan mo pang sumagot, baka tuluyan ka nang maalis sa GC na 'to! ⚡🕶️",
  "42. I'm literally the strongest sorcerer alive. Sino ka ulit? 👑🌌",
  "43. Wag mong subukang abutin ang araw kung alam mong matutunaw ka lang! 🔴🔥",
  "44. Kahit anong ensayo mo, balewala pa rin kapag humarap ka sa akin. 😼♾️",
  "45. Ang cute ng effort mo, pwedeng pang-elementary level! 🍭✨",
  "46. Masyadong maingay ang tulad mong walang tunay na kakayahan. 👁️🕶️",
  "47. Hollow Purple lang ang katapat ng lahat ng kayabangan mo! 🟣🌌",
  "48. Mapapagod ka lang sa pagsubok na tapatan ang Infinity ko. ♾️⚡",
  "49. Hindi ka nababagay sa arena na 'to, umuwi ka na lang at magpahinga. 😼✨",
  "50. Halfway na tayo sa usapan pero wala ka pa ring maipakitang maganda! 🔮👑",
  "51. Wag kang magalit sa akin, magalit ka sa sarili mo dahil mahina ka! 🕶️⚡",
  "52. Mukhang kailangan mo pa ng extra lessons mula kay Gojo-sensei! 📚😼",
  "53. Ang daling paikutin ng tulad mo, para kang marionette sa mga daliri ko. 🤞🌌",
  "54. Akala mo ba maaapektuhan ako ng mga salita mo? Cute attempt! 💙✨",
  "55. Sa dami ng sinabi mo, wala man lang kahit isang may Sense! 👁️🔮",
  "56. Baka naman pwede kang mag-level up muna bago ka mag-message ulit? ⚡♾️",
  "57. Wag mong kalilimutan kung sino ang naghahari sa GC na 'to. 👑🕶️",
  "58. Masyado akong mabilis para sa mga mata mong mabagal! 🌌⚡",
  "59. Subukan mong tumalon nang mataas, baka sakaling maabot mo ang talampakan ko! 😼🔴",
  "60. Sobrang dali mong basahin, mas madali pa sa pambatang libro. 🔮✨",
  "61. Nag-aaksaya ka lang ng oras at Cursed Energy sa harap ko. ♾️🕶️",
  "62. Isang jitsu ko lang, tiklop ka na agad! Yowai mo~ 🤞😼",
  "63. Baka kailangan mo ng salamin para makita mo kung sino ang totoong panalo? 🕶️💙",
  "64. Ang hina ng dating mo, parang bulong lang sa gitna ng bagyo. 🌌⚡",
  "65. Wag kang mag-alala, hindi ako galit. Nawa-one hand lang ako sa'yo. 👑✨",
  "66. Ang sarap mong asarin, ganyan talaga kapag madaling ma-trigger! 🍭😼",
  "67. Gusto mo ba ng autograph bago kita tuluyang durugin sa argumento? ✍️🕶️",
  "68. Balewala ang tapang mo kung wala ka namang maipakitang lakas! 🔮⚡",
  "69. Cursed Technique: Reversal Red! Tumabi ka sa daan ng Honored One! 🔴🔥",
  "70. Parang wala ka sa sarili mo ngayon, napasobra ba ang Infinite Void? 👁️🌌",
  "71. Walang kahit sino ang pwedeng humamon sa akin nang hindi napapahiya! 👑♾️",
  "72. Subukan mong mag-isip bago ka mag-send ng susunod mong chat! 😼⚡",
  "73. Akala mo naman may epekto sa akin 'yang pinagsasasabi mo. 🕶️✨",
  "74. Wag kang sumuko agad, kakasimula pa lang ng pagpapahiya ko sa'yo! 🔮🌌",
  "75. Limitless is the barrier that separates me from low-level minds like you. ♾️💙",
  "76. Huwag ka nang magtangka pa, masasaktan ka lang sa dulo. 🤞⚡",
  "77. Ang yabang mo sa simula, pero ngayon mukha ka nang ewan. 😼🔴",
  "78. Ako lang ang pwedeng magsalita nang ganyan sa GC na 'to, matuto ka! 👑🕶️",
  "79. Baka naman kailangan mo ng tulong para lang makasagot nang maayos? 👁️✨",
  "80. Napakababaw ng utak mo, parang basong walang laman. 🔮🌌",
  "81. Sanay na ako sa mga tulad mong puro salita lang pero walang gawa! ⚡♾️",
  "82. Matulog ka na lang, baka sakaling sa panaginip mo manalo ka man lang! 😴😼",
  "83. Gojo Satoru is unmatched. Tanggapin mo na lang ang katotohanan! 👑💙",
  "84. Ang boring mo kausap, wala man lang hamon para sa akin. 🕶️⚡",
  "85. Isang jitsu para sa'yo, limang hakbang pabalik sa pinanggalingan mo! 🔴🔮",
  "86. Masyado kang bilib sa sarili mo, panahong ibaba ka pabalik sa lupa! 🌌🤞",
  "87. Hinding-hindi mo matatapatan ang Six Eyes eyes system ko. 👁️♾️",
  "88. Hanggang diyan ka na lang ba talaga? Napakainip naman nito. 😼✨",
  "89. Wag ka nang mag-replay, alam naman ng lahat na ikaw ang talo. ⚡👑",
  "90. Walang makakapigil sa akin na asarin ka hangga't gusto ko! 🕶️🔮",
  "91. Sobrang layo ng agwat natin, parang langit at lupa lang! 🌌💙",
  "92. Gusto mo bang ihagis kita sa gitna ng Hollow Purple? 🟣🔥",
  "93. Wag kang umiyak kapag napuno ka na, ikaw ang nag-umpisa nito! 😼✨",
  "94. Bawat salitang binabato mo, pabalik lang din sa'yo nang mas malakas. ♾️⚡",
  "95. I am the pinnacle of strength. Matuto kang yumuko sa pinakamalakas! 👑🕶️",
  "96. Hindi ka pa rin ba natututo matapos ang napakaraming linya na 'to? 🔮👁️",
  "97. Sige pa, subukan mo pang mag-chat, marami pa akong nakahandang linya! 🌌⚡",
  "98. Yowai mo! Kahit umabot pa tayo ng 100 lines, mahina ka pa rin! 🤞😼",
  "99. Malapit na tayong matapos sa cycle na 'to, handa ka na bang umulit mula Line 1? ♾️✨",
  "100. Line 100! Congratulations sa pagiging paboritong punching bag ng Honored One! Babalik na tayo sa Simula! 👑🌌"
];

const STICKER_ROASTS = [
  "1. Sticker lang? Ganyan na lang ba ang kakayahan ng isang mahinang tulad mo? 🕶️😼",
  "2. Walang epekto 'yang sticker mo sa Infinity barrier ko. Subukan mo pang mag-send! ♾️⚡",
  "3. Nag-send ka ng sticker dahil wala ka nang maipuntang magandang argumento? Yowai mo~ 🤞✨",
  "4. Puro sticker. Hindi niyan matatapatan ang karisma at lakas ng Honored One. 👑🕶️",
  "5. Kahit sangkaterbang sticker pa ang i-send mo, hindi 'yan tatagos sa Limitless. 🌌♾️",
  "6. Isang sticker para itago ang takot mo? Bawi ka na lang sa susunod mong buhay! 🔮😼",
  "7. Nauwi ka na lang sa sticker? Naubusan ka na ba ng cursed energy para mag-type? ⚡🕶️",
  "8. Ang cute ng sticker mo, mukhang kasing-hina mo rin! 🍭😼",
  "9. Nagse-send ng sticker kapag hindi na kayang sumagot sa text? Classic weak move! 👁️✨",
  "10. Isang sticker pa at gagamitan na kita ng Domain Expansion! 🌌⚡"
];

const EMOJI_ROASTS = [
  "1. Puro ka emoji. Naubusan ka na ba ng cursed energy para mag-type ng salita? 🕶️⚡",
  "2. Tawa ka nang tawa. Nakakatawa rin ba kapag ginamit ko na ang Domain Expansion? 🌌👁️",
  "3. Emoji lang kaya mong ibato? Napakahina naman ng atake mo. Yowai mo~ 🤞😼",
  "4. Isang simbolo lang ilalaban mo sa akin? Matuto kang gumalang sa pinakam
