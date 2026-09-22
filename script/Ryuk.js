const fs = require("fs");
const path = require("path");

// ==========================================
// ADMIN IDS — IYO LANG!
const ADMIN_IDS = ["61594055835097", "61593892603402", "61594325727109", "61594022290817"];
// ==========================================

module.exports.config = {
  name: "ryuk",
  version: "25.2.0",
  hasPermission: 2,
  credits: "RYUK BOSS — GC LOCK FIXED ✅",
  description: "GC Name Lock — IBABALIK AGAD! | No Error | Makunat",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "/ryuk on — Simulan\n" +
          "/ryuk onsetgname <pangalan> — I-set at i-lock GC Name 🔒\n" +
          "/ryuk onsetnick <pangalan> — Palitan nickname ng bot\n" +
          "/ryuk welcome <on/off> — Toggle welcome\n" +
          "/ryuk off — Itigil",
  cooldowns: 3
};

const DATA_PATH = path.join(__dirname, "ryuk_data.json");

const AUTO_REPLY_DELAY_MIN = 5000;
const AUTO_REPLY_DELAY_MAX = 8000;
const SPAM_WINDOW_MS = 8000;
const USER_SPAM_LIMIT = 3;

const lastReplyTime = {};
const userMessageTracker = {};
const gcWatchIntervals = {}; // ✅ BAGONG BANTAY SA GC NAME!

const SELF_REACT_EMOJIS = ["❤️", "🔥", "💪", "✨", "💜", "👑", "⚡", "💎", "😍", "🤩"];
const USER_REACT_EMOJI = "💜";

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

const SILENT_MENTION = [
  "\n\n✨ /silent *RYUK BOSS:* Laging nagbabantay — hindi lumilisan! 👑",
  "\n\n⚡ /silent *RYUK BOSS:* Matibay, matatag — walang makakatigil! 💎",
  "\n\n💜 /silent *RYUK BOSS:* Nandito lang ako — hindi ka iiwanan! 💪",
  "\n\n🔥 /silent *RYUK BOSS:* Walang hinto hanggat hindi sinabi! ✅",
  "\n\n👑 /silent *RYUK BOSS:* Ako lang — walang kapantay, walang katulad! ✨"
];

let lineIndex = 0;

function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  } catch (err) {}
  return { threads: {} };
}

function saveData(data) {
  try { fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf8"); } catch (err) {}
}

function isThreadActive(threadID) {
  const data = loadData();
  const t = data.threads?.[threadID];
  return t && t.expires && Number(t.expires) > Date.now();
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

function sendSilentMention(api, threadID, text, replyID, callback) {
  try {
    api.getThreadInfo(threadID, (err, info) => {
      const mentionsArray = !err && info?.participantIDs
        ? info.participantIDs.map(id => ({ tag: "/silent", id }))
        : [];
      api.sendMessage({ body: text, mentions: mentionsArray }, threadID, callback || (() => {}), replyID);
    });
  } catch (e) {}
}

// ✅ SIMULANG BANTAY ANG GC NAME — BAWAT 2 SEGUNDO!
function startGCNameWatch(api, threadID, targetName) {
  stopGCNameWatch(threadID);
  
  gcWatchIntervals[threadID] = setInterval(async () => {
    if (!isThreadActive(threadID)) {
      stopGCNameWatch(threadID);
      return;
    }
    try {
      const info = await api.getThreadInfo(threadID);
      const currentName = info?.threadName || "";
      
      // ✅ KUNG NAGBAGO O TINANGGAL — IBALIK AGAD!
      if (currentName !== targetName) {
        await api.setTitle(targetName, threadID);
      }
    } catch (e) {}
  }, 2000); // ✅ BAWAT 2 SEGUNDO — MABILIS!
}

function stopGCNameWatch(threadID) {
  if (gcWatchIntervals[threadID]) {
    clearInterval(gcWatchIntervals[threadID]);
    delete gcWatchIntervals[threadID];
  }
}

// ===== EVENT HANDLER =====
module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, body, messageID, logMessageType, logMessageData } = event;
    if (!threadID || !senderID) return;
    
    const botID = api.getCurrentUserID();
    const data = loadData();
    const cfg = data.threads?.[threadID];

    // 👋 AUTO WELCOME
    if (logMessageType === "log:subscribe" && cfg?.welcome) {
      const added = logMessageData?.addedParticipants || [];
      added.forEach(p => {
        if (p.userFbId === botID) return;
        setTimeout(() => {
          sendSilentMention(api, threadID,
            `👋 Welcome ${p.fullName || "kaibigan"}! Dito sa GC ni RYUK BOSS 👑\nMasaya kaming nandito ka — mag-enjoy at ingat palagi! 💜`,
            null
          );
        }, 1500);
      });
      return;
    }

    // 🔒 AGAD NA PAGSURI KUNG NAGBAGO ANG PANGALAN
    if (logMessageType === "log:thread-name" && cfg?.lockedName) {
      setTimeout(() => {
        api.setTitle(cfg.lockedName, threadID, () => {});
      }, 500); // ✅ 0.5 SEGUNDOS — SOBRANG BILIS!
      return;
    }

    if (!isThreadActive(threadID) || senderID === botID || !cfg) return;
    if (body?.startsWith("/")) return;

    // 🎯 TARGET CHECK
    if (cfg.targetUser && senderID !== cfg.targetUser) return;

    // 🛡️ ANTI-SPAM
    const now = Date.now();
    if (!userMessageTracker[senderID]) userMessageTracker[senderID] = [];
    userMessageTracker[senderID] = userMessageTracker[senderID].filter(t => now - t < SPAM_WINDOW_MS);
    userMessageTracker[senderID].push(now);
    if (userMessageTracker[senderID].length > USER_SPAM_LIMIT) return;

    // ⏱️ DELAY
    const delay = AUTO_REPLY_DELAY_MIN + Math.floor(Math.random() * (AUTO_REPLY_DELAY_MAX - AUTO_REPLY_DELAY_MIN));
    if (lastReplyTime[threadID] && now - lastReplyTime[threadID] < delay) return;
    lastReplyTime[threadID] = now;

    // 💖 REACT SA USER
    setTimeout(() => {
      try { api.setMessageReaction(USER_REACT_EMOJI, messageID, () => {}, true); } catch (e) {}
    }, 500);

    // ✅ SEND REPLY
    setTimeout(() => {
      const msgText = pickLine() + pickSilent();
      sendSilentMention(api, threadID, msgText, messageID, (err, sent) => {
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

    if (!ADMIN_IDS.includes(senderID)) {
      return api.sendMessage("👑 RYUK BOSS: Hindi mo hawak ang kapangyarihan dito!", threadID, messageID);
    }

    // ✅ ON
    if (sub === "on") {
      cfg.expires = Date.now() + 30 * 24 * 60 * 60 * 1000;
      saveData(data);
      
      // ✅ SIMULANG BANTAY AGAD KUNG MAY NAKA-LOCK NA!
      if (cfg.lockedName) startGCNameWatch(api, threadID, cfg.lockedName);
      
      return api.sendMessage(
        "👑 RYUK BOSS — NAKA-ON NA! ✨\n\n" +
        "🛡️ Bilis: 5-8 sec — ligtas!\n" +
        "🔒 GC Name Lock: " + (cfg.lockedName ? `✅ ${cfg.lockedName} — BINABANTAYAN NA!` : "❌ Hindi pa naka-set") + "\n" +
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
      stopGCNameWatch(threadID);
      saveData(data);
      return api.sendMessage("🛑 RYUK BOSS — HUMINTO NA. Salamat 👑", threadID, messageID);
    }

    // ✅ SET & LOCK GC NAME — MAY BANTAY AGAD!
    if (sub === "onsetgname") {
      const name = args.slice(1).join(" ").trim();
      if (!name) return api.sendMessage("⚠️ Gamitin: /ryuk onsetgname pangalan ng gc", threadID, messageID);
      
      cfg.lockedName = name;
      saveData(data);
      
      // ✅ SIMULANG BANTAY — AGAD!
      startGCNameWatch(api, threadID, name);
      
      api.setTitle(name, threadID, (err) => {
        if (err) {
          return api.sendMessage("⚠️ Hindi mapalitan. Siguraduhing ADMIN ang bot sa GC!", threadID, messageID);
        }
        return api.sendMessage(
          `🔒 GC Name NAI-LOCK AT BINABANTAYAN NA! ✅\n\n` +
          `🏷️ Pangalan: ${name}\n` +
          `🛡️ Bawat 2 segundo — IBABALIK KO AGAD KUNG MAY NAGPALIT!\n` +
          `WALANG MAKAKAPALIT DITO! 👑`,
          threadID, messageID
        );
      });
      return;
    }

    // ✅ SET NICK
    if (sub === "onsetnick") {
      const nick = args.slice(1).join(" ").trim();
      if (!nick) return api.sendMessage("⚠️ Gamitin: /ryuk onsetnick RYUK BOSS", threadID, messageID);
      cfg.botNick = nick;
      saveData(data);
      api.changeNickname(nick, threadID, api.getCurrentUserID(), () => {});
      return api.sendMessage(`👤 Nickname NAI-SET NA: ${nick} ✅`, threadID, messageID);
    }

    // ✅ WELCOME
    if (sub === "welcome") {
      const mode = args[1]?.toLowerCase();
      if (mode === "on") { cfg.welcome = true; saveData(data); }
      else if (mode === "off") { cfg.welcome = false; saveData(data); }
      else return api.sendMessage("⚠️ /ryuk welcome on | /ryuk welcome off", threadID, messageID);
      return api.sendMessage("👋 Auto Welcome: " + (cfg.welcome ? "✅ NAKA-ON" : "❌ NAKA-OFF"), threadID, messageID);
    }

    // ✅ TARGET / UNTARGET / STATUS — TINANGKILIKAN PARA HINDI MAHABA
    if (sub === "target") {
      const ids = Object.keys(mentions || {});
      if (!ids[0]) return api.sendMessage("⚠️ /ryuk target @tao", threadID, messageID);
      cfg.targetUser = ids[0];
      saveData(data);
      return api.sendMessage(`🎯 Naka-target na: <@${ids[0]}>`, threadID, messageID, { mentions: [{ tag: `<@${ids[0]}>`, id: ids[0] }] });
    }

    if (sub === "untarget") {
      cfg.targetUser = null;
      saveData(data);
      return api.sendMessage("🎯 Inalis na — lahat sasagutin ko ✅", threadID, messageID);
    }

    if (sub === "status") {
      const left = cfg.expires ? Number(cfg.expires) - Date.now() : 0;
      if (left <= 0) return api.sendMessage("❌ Naka-OFF", threadID, messageID);
      const d = Math.floor(left / 86400000);
      const h = Math.floor((left % 86400000) / 3600000);
      return api.sendMessage(
        `👑 STATUS:\n⏳ ${d}a ${h}o\n🔒 GC Name: ${cfg.lockedName || "Wala"}\n👋 Welcome: ${cfg.welcome?"ON":"OFF"}\n🎯 Target: ${cfg.targetUser || "Lahat"}`,
        threadID, messageID
      );
    }

    return api.sendMessage(
      "👑 UTOS:\n/ryuk on — Simula\n/ryuk onsetgname pangalan — I-lock GC 🔒\n/ryuk onsetnick pangalan — Palitan nick\n/ryuk welcome on/off — Welcome\n/ryuk off — Hinto",
      threadID, messageID
    );

  } catch (err) {}
};
                           
