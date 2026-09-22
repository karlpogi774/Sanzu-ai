const fs = require("fs");
const path = require("path");

// ==========================================
// CONFIGURATION — MGA ADMIN MO LANG!
const ADMIN_IDS = ["61594055835097", "61593892603402", "61594325727109", "61594022290817"];
// ==========================================

module.exports.config = {
  name: "ryuk",
  version: "25.1.0",
  hasPermission: 2,
  credits: "RYUK BOSS — GC Locked Edition",
  description: "Ryuk Bot: GC Lock | Auto Nick | Silent Mention | No Error System",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "/ryuk on — Simulan dito sa GC\n" +
          "/ryuk onsetgname <pangalan> — Set & I-lock ang GC Name 🔒\n" +
          "/ryuk onsetnick <pangalan> — Set Nickname ng Bot\n" +
          "/ryuk welcome <on/off> — Auto Welcome sa bago\n" +
          "/ryuk target @mention — Target lang ang sasagutin\n" +
          "/ryuk untarget — Alisin ang target\n" +
          "/ryuk off — Itigil sa GC na 'to\n" +
          "/ryuk status — Tingnan ang kasalukuyang settings",
  cooldowns: 3
};

const DATA_PATH = path.join(__dirname, "ryuk_data.json");

// ✅ LIGTAS NA BILIS — 5-8 SEC RANDOM! WALANG SUSPEND!
const AUTO_REPLY_DELAY_MIN = 5000;
const AUTO_REPLY_DELAY_MAX = 8000;
const SPAM_WINDOW_MS = 8000;
const USER_SPAM_LIMIT = 3;

const lastReplyTime = {};
const userMessageTracker = {};

// ✅ AUTO-REACT EMOJIS
const SELF_REACT_EMOJIS = ["❤️", "🔥", "💪", "✨", "💜", "👑", "⚡", "💎", "😍", "🤩"];
const USER_REACT_EMOJI = "💜";

// ✅ MGA LINYA MO — SUNOD-SUNOD, HINDI PAULIT-ULIT AGAD!
const MAIN_LINES = [
  "Nandito lang ako, hindi ako aalis basta-basta 💪",
  "Bantay ko ang GC na 'to, walang magagambala dito 👑",
  "Kahit tahimik, nagbabantay pa rin ako — RYUK BOSS 🔥",
  "Hindi ako titigil hanggat hindi sinabi — RYUK BOSS lang 💯",
  "Matibay, matatag, RYUK BOSS ang tanging nag-iisa ✨",
  "Walang makakatalo, walang makakatigil — dito lang ako 👁️",
  "Kahit walang nagsasalita, hindi ako iiwan sa inyo 💜",
  "Ako ang RYUK BOSS — pinakamakunat sa buong FB 👑",
  "Tuloy-tuloy, walang hinto, hanggang sa dulo ng lahat ⚡",
  "Hindi madaling mapatumba, hindi madaling mawala — ako 'to 💎",
  "Bantay-sarado, walang palya — RYUK BOSS ang tapat 💪",
  "Kahit walang boses, naririto pa rin — laging handa ✅",
  "Walang pahinga, walang pagod — para sa inyo ito 🔥",
  "Ako lang, RYUK BOSS — walang katulad, walang kapantay 👑",
  "Matibay ang pundasyon, hindi kayang gibain ng kahit sino ⛰️",
  "Tahimik man ang paligid, gising pa rin ang diwa ko 👁️",
  "Hindi ako basta-basta nawawala — nananatili ako dito 💯",
  "Sa lahat ng oras, sa lahat ng panahon — RYUK BOSS lang ⚡",
  "Walang makakapigil, walang makakatigil — patuloy ako ✨",
  "Pinakamakunat, pinakamaganda — ako lang 'yon, walang iba 👑"
];

// ✅ /silent MENTION LINYA
const SILENT_MENTION = [
  "\n\n✨ /silent *RYUK BOSS:* Laging nagbabantay — hindi lumilisan! 👑",
  "\n\n⚡ /silent *RYUK BOSS:* Matibay, matatag — walang makakatigil! 💎",
  "\n\n💜 /silent *RYUK BOSS:* Nandito lang ako — hindi ka iiwanan! 💪",
  "\n\n🔥 /silent *RYUK BOSS:* Walang hinto hanggat hindi sinabi! ✅",
  "\n\n👑 /silent *RYUK BOSS:* Ako lang — walang kapantay, walang katulad! ✨"
];

let lineIndex = 0; // ✅ SIGURADONG SUNOD-SUNOD!

function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const fileData = fs.readFileSync(DATA_PATH, "utf8");
      return JSON.parse(fileData);
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
  const threadData = data.threads ? data.threads[threadID] : null;
  return threadData && threadData.expires && Number(threadData.expires) > Date.now();
}

function getRemaining(threadID) {
  const data = loadData();
  const threadData = data.threads ? data.threads[threadID] : null;
  if (!threadData || !threadData.expires) return 0;
  const left = Number(threadData.expires) - Date.now();
  return left > 0 ? left : 0;
}

function isSpamming(senderID) {
  const now = Date.now();
  if (!userMessageTracker[senderID]) userMessageTracker[senderID] = [];
  userMessageTracker[senderID] = userMessageTracker[senderID].filter(t => now - t < SPAM_WINDOW_MS);
  userMessageTracker[senderID].push(now);
  return userMessageTracker[senderID].length > USER_SPAM_LIMIT;
}

function pickLine() {
  const line = MAIN_LINES[lineIndex];
  lineIndex = (lineIndex + 1) % MAIN_LINES.length;
  return line;
}

function pickSilent() {
  return SILENT_MENTION[Math.floor(Math.random() * SILENT_MENTION.length)];
}

function pickSelfReact() {
  return SELF_REACT_EMOJIS[Math.floor(Math.random() * SELF_REACT_EMOJIS.length)];
}

function changeNicknameForAll(api, threadID, nickname) {
  try {
    api.getThreadInfo(threadID, (err, info) => {
      if (err || !info || !info.participantIDs) return;
      info.participantIDs.forEach((userID, index) => {
        setTimeout(() => {
          try {
            api.changeNickname(nickname, threadID, userID, () => {});
          } catch (e) {}
        }, index * 2000);
      });
    });
  } catch (e) {}
}

function sendSilentMention(api, threadID, text, replyID, callback) {
  try {
    api.getThreadInfo(threadID, (err, info) => {
      let mentionsArray = [];
      if (!err && info && info.participantIDs) {
        mentionsArray = info.participantIDs.map(id => ({
          tag: "/silent",
          id: id
        }));
      }
      api.sendMessage({ body: text, mentions: mentionsArray }, threadID, callback || (() => {}), replyID);
    });
  } catch (e) {}
}

// ===== EVENT HANDLER =====
module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, body, messageID, logMessageType, logMessageData, type } = event;
    if (!threadID || !senderID) return;
    
    const botID = api.getCurrentUserID();
    const data = loadData();
    const threadData = data.threads ? data.threads[threadID] : null;

    // 👋 AUTO WELCOME
    if (logMessageType === "log:subscribe") {
      const added = logMessageData?.addedParticipants || [];
      if (threadData && threadData.welcome) {
        added.forEach(p => {
          if (p.id === botID) return;
          setTimeout(() => {
            sendSilentMention(
              api,
              threadID,
              `👋 Welcome @${p.name || "kaibigan"}! Dito sa GC ni RYUK BOSS 👑\nMasaya kaming nandito ka — mag-enjoy at ingat palagi! 💜`,
              null
            );
          }, 1500);
        });
      }
      return;
    }

    // 🔒 GC NAME PROTECTION — IBABALIK AGAD!
    if (logMessageType === "log:thread-name" && threadData && threadData.lockedName) {
      setTimeout(() => {
        try {
          api.setTitle(threadData.lockedName, threadID, () => {});
        } catch (e) {}
      }, 1000);
      return;
    }

    if (!isThreadActive(threadID) || senderID === botID || !threadData) return;
    if (body && body.startsWith("/")) return;

    // 🎯 TARGET CHECK
    if (threadData.targetUser && senderID !== threadData.targetUser) return;

    // 🛡️ ANTI-SPAM
    if (isSpamming(senderID)) return;

    // ⏱️ COOLDOWN — 5-8 SEC DELAY
    const now = Date.now();
    const delay = AUTO_REPLY_DELAY_MIN + Math.floor(Math.random() * (AUTO_REPLY_DELAY_MAX - AUTO_REPLY_DELAY_MIN));
    if (lastReplyTime[threadID] && now - lastReplyTime[threadID] < delay) return;
    lastReplyTime[threadID] = now;

    // 💖 REACT SA MENSAHE NG IBA
    setTimeout(() => {
      try { api.setMessageReaction(USER_REACT_EMOJI, messageID, () => {}, true); } catch (e) {}
    }, 500);

    // ✅ SEND — SUNOD-SUNOD NA LINYA!
    setTimeout(() => {
      const msgText = pickLine() + pickSilent();
      sendSilentMention(api, threadID, msgText, messageID, (err, sent) => {
        // ✅ REACT SA SARILING MENSAHE
        if (!err && sent?.messageID) {
          setTimeout(() => {
            try { api.setMessageReaction(pickSelfReact(), sent.messageID, () => {}, true); } catch (e) {}
          }, 800);
        }
      });
    }, delay);

  } catch (err) {}
};

// ===== COMMANDS =====
module.exports.run = async function ({ api, event, args }) {
  try {
    const { threadID, messageID, senderID, mentions } = event;
    const sub = (args[0] || "").toLowerCase();
    let data = loadData();

    if (!data.threads) data.threads = {};
    if (!data.threads[threadID]) {
      data.threads[threadID] = {
        expires: 0,
        targetUser: null,
        lockedName: null,
        botNick: "RYUK BOSS",
        welcome: true
      };
    }
    const cfg = data.threads[threadID];

    // 🔒 ADMIN LANG
    if (!ADMIN_IDS.includes(senderID)) {
      return api.sendMessage("👑 RYUK BOSS: Hindi mo hawak ang kapangyarihan dito!", threadID, messageID);
    }

    // ✅ ON
    if (sub === "on") {
      cfg.expires = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 ARAW — MAKUNAT!
      saveData(data);
      return api.sendMessage(
        "👑 RYUK BOSS — NAKA-ON NA! ✨\n\n" +
        "🛡️ Bilis: 5-8 sec — ligtas!\n" +
        "🔒 GC Name Lock: " + (cfg.lockedName ? `✅ ${cfg.lockedName}` : "❌ Hindi pa naka-set") + "\n" +
        "👤 Nick: " + cfg.botNick + "\n" +
        "👋 Auto Welcome: " + (cfg.welcome ? "✅ ON" : "❌ OFF") + "\n" +
        "🎯 Target: " + (cfg.targetUser || "Lahat sa GC") + "\n" +
        "⏳ Tagal: 30 ARAW — hindi titigil!",
        threadID, messageID
      );
    }

    // ✅ OFF
    if (sub === "off") {
      cfg.expires = 0;
      cfg.targetUser = null;
      saveData(data);
      return api.sendMessage("🛑 RYUK BOSS — HUMINTO NA. Salamat 👑", threadID, messageID);
    }

    // ✅ SET & LOCK GC NAME
    if (sub === "onsetgname") {
      const name = args.slice(1).join(" ").trim();
      if (!name) return api.sendMessage("⚠️ Gamitin: /ryuk onsetgname pangalan ng gc", threadID, messageID);
      cfg.lockedName = name;
      saveData(data);
      api.setTitle(name, threadID, () => {});
      return api.sendMessage(`🔒 GC Name NAI-LOCK NA!\nPangalan: ${name}\nIBABALIK KO AGAD KAPAG MAY NAGPALIT! ✅`, threadID, messageID);
    }

    // ✅ SET BOT NICK
    if (sub === "onsetnick") {
      const nick = args.slice(1).join(" ").trim();
      if (!nick) return api.sendMessage("⚠️ Gamitin: /ryuk onsetnick RYUK BOSS", threadID, messageID);
      cfg.botNick = nick;
      saveData(data);
      api.changeNickname(nick, threadID, api.getCurrentUserID(), () => {});
      return api.sendMessage(`👤 Nickname NAI-SET NA: ${nick} ✅`, threadID, messageID);
    }

    // ✅ WELCOME TOGGLE
    if (sub === "welcome") {
      const mode = args[1]?.toLowerCase();
      if (mode === "on") { cfg.welcome = true; saveData(data); }
      else if (mode === "off") { cfg.welcome = false; saveData(data); }
      else return api.sendMessage("⚠️ /ryuk welcome on | /ryuk welcome off", threadID, messageID);
      return api.sendMessage("👋 Auto Welcome: " + (cfg.welcome ? "✅ NAKA-ON" : "❌ NAKA-OFF"), threadID, messageID);
    }

    // ✅ TARGET
    if (sub === "target") {
      const ids = Object.keys(mentions || {});
      if (!ids[0]) return api.sendMessage("⚠️ /ryuk target @tao", threadID, messageID);
      cfg.targetUser = ids[0];
      saveData(data);
      return api.sendMessage(`🎯 Naka-target na: <@${ids[0]}>`, threadID, messageID, { mentions: [{ tag: `<@${ids[0]}>`, id: ids[0] }] });
    }

    // ✅ UNTARGET
    if (sub === "untarget") {
      cfg.targetUser = null;
      saveData(data);
      return api.sendMessage("🎯 Inalis na ang target — lahat sasagutin ko uli ✅", threadID, messageID);
    }

    // ✅ STATUS
    if (sub === "status") {
      const left = getRemaining(threadID);
      if (left <= 0) return api.sendMessage("❌ Naka-OFF sa GC na 'to", threadID, messageID);
      const d = Math.floor(left / 86400000);
      const h = Math.floor((left % 86400000) / 3600000);
      return api.sendMessage(
        "👑 RYUK BOSS STATUS:\n\n" +
        `⏳ Natitira: ${d} araw ${h} oras\n` +
        `🔒 GC Name: ${cfg.lockedName || "Hindi naka-lock"}\n` +
        `👤 Nick: ${cfg.botNick}\n` +
        `👋 Welcome: ${cfg.welcome ? "ON" : "OFF"}\n` +
        `🎯 Target: ${cfg.targetUser || "Lahat"}\n` +
        `🛡️ Admin: ${ADMIN_IDS.length}`,
        threadID, messageID
      );
    }

    // ✅ HELP
    return api.sendMessage(
      "👑 RYUK BOSS COMMANDS:\n\n" +
      "/ryuk on — Simulan dito\n" +
      "/ryuk off — Itigil\n" +
      "/ryuk onsetgname pangalan — I-lock GC Name 🔒\n" +
      "/ryuk onsetnick pangalan — Palitan Nick ng bot\n" +
      "/ryuk welcome on/off — Toggle Welcome\n" +
      "/ryuk target @tao — Isang tao lang sasagutin\n" +
      "/ryuk untarget — Balik sa lahat\n" +
      "/ryuk status — Tingnan ang status",
      threadID, messageID
    );

  } catch (err) {}
};
  
