const fs = require("fs");
const path = require("path");

// ==========================================
const ADMIN_IDS = ["61594055835097", "61593892603402", "61594325727109", "61594022290817"];
// ==========================================

module.exports.config = {
  name: "ryuk",
  version: "25.7.3",
  hasPermission: 2,
  credits: "RYUK BOSS — SETALLNICK FIXED ✅",
  description: "ON = Simula lang | SETALLNICK = Gumagana na!",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "/ryuk on — Simula lang ✅\n" +
          "/ryuk onsetgname <pangalan> — I-lock GC Name 🔒\n" +
          "/ryuk onsetnick <pangalan> — Palitan Nick ng Bot 👤\n" +
          "/ryuk setallnick <pangalan> — Palitan sa LAHAT ✨\n" +
          "/ryuk off — Hinto",
  cooldowns: 1
};

const DATA_PATH = path.join(__dirname, "ryuk_data.json");

const AUTO_REPLY_DELAY_MIN = 5000;
const AUTO_REPLY_DELAY_MAX = 8000;
const SPAM_WINDOW_MS = 8000;
const USER_SPAM_LIMIT = 3;
const SET_ALL_NICK_DELAY = 2000;

const lastReplyTime = {};
const userMessageTracker = {};
const gcWatchIntervals = {};
const nickWatchIntervals = {};

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

function startGCNameWatch(api, threadID, targetName) {
  stopGCNameWatch(threadID);
  gcWatchIntervals[threadID] = setInterval(async () => {
    if (!isThreadActive(threadID)) { stopGCNameWatch(threadID); return; }
    try {
      const info = await new Promise(res => api.getThreadInfo(threadID, (_, i) => res(i)));
      if (info?.threadName !== targetName) await api.setTitle(targetName, threadID);
    } catch (e) {}
  }, 1500);
}

function stopGCNameWatch(threadID) {
  if (gcWatchIntervals[threadID]) { clearInterval(gcWatchIntervals[threadID]); delete gcWatchIntervals[threadID]; }
}

function startNickWatch(api, threadID, botID, targetNick) {
  stopNickWatch(threadID);
  let lastAppliedNick = null;
  nickWatchIntervals[threadID] = setInterval(async () => {
    if (!isThreadActive(threadID)) { stopNickWatch(threadID); return; }
    try {
      const info = await new Promise(res => api.getThreadInfo(threadID, (_, i) => res(i)));
      const currentNick = info?.nicknames?.[botID] || "";
      if (currentNick !== targetNick && lastAppliedNick !== targetNick) {
        lastAppliedNick = targetNick;
        await api.changeNickname(targetNick, threadID, botID);
        setTimeout(() => { lastAppliedNick = null; }, 5000);
      }
    } catch (e) { lastAppliedNick = null; }
  }, 2000);
}

function stopNickWatch(threadID) {
  if (nickWatchIntervals[threadID]) { clearInterval(nickWatchIntervals[threadID]); delete nickWatchIntervals[threadID]; }
}

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, senderID, body, messageID, logMessageType, logMessageData } = event;
    if (!threadID || !senderID) return;
    const botID = api.getCurrentUserID();
    const data = loadData();
    const cfg = data.threads?.[threadID];

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

    if (logMessageType === "log:thread-name" && cfg?.lockedName) {
      setTimeout(() => api.setTitle(cfg.lockedName, threadID, () => {}), 300);
      return;
    }

    if (logMessageType === "log:user-nickname" && cfg?.botNick && logMessageData?.participant_id === botID) {
      if ((logMessageData.nickname || "") !== cfg.botNick) {
        setTimeout(() => api.changeNickname(cfg.botNick, threadID, botID, () => {}), 500);
      }
      return;
    }

    if (!isThreadActive(threadID) || senderID === botID || !cfg) return;
    if (body?.startsWith("/")) return;

    if (cfg.targetUser && senderID !== cfg.targetUser) return;

    const now = Date.now();
    if (!userMessageTracker[senderID]) userMessageTracker[senderID] = [];
    userMessageTracker[senderID] = userMessageTracker[senderID].filter(t => now - t < SPAM_WINDOW_MS);
    userMessageTracker[senderID].push(now);
    if (userMessageTracker[senderID].length > USER_SPAM_LIMIT) return;

    const delay = AUTO_REPLY_DELAY_MIN + Math.floor(Math.random() * (AUTO_REPLY_DELAY_MAX - AUTO_REPLY_DELAY_MIN));
    if (lastReplyTime[threadID] && now - lastReplyTime[threadID] < delay) return;
    lastReplyTime[threadID] = now;

    setTimeout(() => {
      try { api.setMessageReaction(USER_REACT_EMOJI, messageID, () => {}, true); } catch (e) {}
    }, 500);

    setTimeout(() => {
      const msgText = pickLine() + pickSilent();
      sendSilentMention(api, threadID, msgText, messageID, (err, sent) => {
        if (!err && sent?.messageID) {
          setTimeout(() => {
            try { api.setMessageReaction(SELF_REACT_EMOJIS[Math.floor(Math.random() * SELF_REACT_EMOJIS.length)], sent.messageID, () => {}, true); } catch (e) {}
          }, 800);
        }
      });
    }, delay);
  } catch (err) {}
};

module.exports.run = async function ({ api, event, args }) {
  try {
    const { threadID, messageID, senderID } = event;
    const sub = (args[0] || "").toLowerCase();
    let data = loadData();
    const botID = api.getCurrentUserID();

    if (!data.threads) data.threads = {};
    if (!data.threads[threadID]) {
      data.threads[threadID] = {
        expires: 0,
        targetUser: null,
        lockedName: null,
        botNick: null,
        welcome: true
      };
    }
    const cfg = data.threads[threadID];

    if (!ADMIN_IDS.includes(senderID)) {
      return api.sendMessage("👑 RYUK BOSS: Hindi mo hawak ang kapangyarihan dito!", threadID, messageID);
    }

    if (sub === "on") {
      cfg.expires = Date.now() + 30 * 24 * 60 * 60 * 1000;
      saveData(data);
      if (cfg.lockedName) startGCNameWatch(api, threadID, cfg.lockedName);
      return api.sendMessage(
        "👑 RYUK BOSS — NAKA-ON NA! ✨\n\n" +
        "✅ Simula lang — hindi pa nagpapalit!\n" +
        "👤 Para sa Bot: /ryuk onsetnick [pangalan]\n" +
        "👥 Para sa LAHAT: /ryuk setallnick [pangalan] ✨\n" +
        "⏳ Tagal: 30 ARAW",
        threadID, messageID
      );
    }

    if (sub === "off") {
      cfg.expires = 0;
      cfg.targetUser = null;
      stopGCNameWatch(threadID);
      stopNickWatch(threadID);
      saveData(data);
      return api.sendMessage("🛑 RYUK BOSS — HUMINTO NA 👑", threadID, messageID);
    }

    if (sub === "onsetgname") {
      const name = args.slice(1).join(" ").trim();
      if (!name) return api.sendMessage("⚠️ /ryuk onsetgname pangalan ng gc", threadID, messageID);
      cfg.lockedName = name;
      saveData(data);
      startGCNameWatch(api, threadID, name);
      api.setTitle(name, threadID, (err) => {
        if (err) return api.sendMessage("⚠️ Hindi mapalitan — ADMIN ba ang bot sa GC?", threadID, messageID);
        return api.sendMessage(`🔒 GC Name LOCKED ✅\nPangalan: ${name} 👑`, threadID, messageID);
      });
      return;
    }

    if (sub === "onsetnick") {
      const nick = args.slice(1).join(" ").trim();
      if (!nick) return api.sendMessage("⚠️ /ryuk onsetnick RYUK BOSS", threadID, messageID);
      cfg.botNick = nick;
      saveData(data);
      startNickWatch(api, threadID, botID, nick);
      api.changeNickname(nick, threadID, botID, (err) => {
        if (err) return api.sendMessage("⚠️ Hindi mapalitan — ADMIN ba ang bot sa GC?", threadID, messageID);
        return api.sendMessage(
          `👤 Nick ng Bot LOCKED ✅\nPangalan: ${nick}\nℹ️ Sa lahat: /ryuk setallnick ${nick} ✨`,
          threadID, messageID
        );
      });
      return;
    }

    // ✅ SETALLNICK — AYOS NA!
    if (sub === "setallnick") {
      const targetNick = args.slice(1).join(" ").trim();
      if (!targetNick) {
        return api.sendMessage("⚠️ Gamitin: /ryuk setallnick <pangalan>\nHalimbawa: /ryuk setallnick RYUK", threadID, messageID);
      }

      new Promise((resolve) => {
        api.getThreadInfo(threadID, (err, info) => {
          if (err || !info) resolve({ error: true });
          else resolve({ error: false, info });
        });
      }).then(async (result) => {
        if (result.error) {
          return api.sendMessage("⚠️ Hindi makuha ang impormasyon!", threadID, messageID);
        }
        
        const info = result.info;
        let members = [];

        if (Array.isArray(info.participantIDs) && info.participantIDs.length) {
          members = info.participantIDs;
        }
        else if (Array.isArray(info.participants) && info.participants.length) {
          members = info.participants.map(p => p.id || p.userID || p.psid).filter(Boolean);
        }
        else if (Array.isArray(info.members) && info.members.length) {
          members = info.members.map(p => p.id || p.userID || p.psid).filter(Boolean);
        }

        if (!members.length) {
          return api.sendMessage("⚠️ Hindi makuha ang listahan ng miyembro!", threadID, messageID);
        }

        members = members.filter(id => String(id) !== String(botID));
        const currentNicks = info.nicknames || {};
        let count = 0, skipped = 0, failed = 0;

        await api.sendMessage(
          `✨ SINISIMULAN NA — ${members.length} MIYEMBRO!\nPangalan: ${targetNick} 💪`,
          threadID, messageID
        );

        for (const id of members) {
          try {
            await new Promise(res => setTimeout(res, SET_ALL_NICK_DELAY));
            if (currentNicks[String(id)] === targetNick) {
              skipped++;
              continue;
            }
            await new Promise((res) => {
              api.changeNickname(targetNick, threadID, id, (err) => {
                err ? failed++ : count++;
                res();
              });
            });
          } catch {
            failed++;
          }
        }

        await api.sendMessage(
          `✅ TAPOS NA!\n\n✅ Nilagay: ${count}\n⏭️ Pareho na: ${skipped}\n⚠️ Nabigo: ${failed}\n\nLahat: ${targetNick} 👑`,
          threadID
        );
      });
      return;
    }

    if (sub === "welcome") {
      const mode = args[1]?.toLowerCase();
      if (mode === "on") { cfg.welcome = true; saveData(data); }
      else if (mode === "off") { cfg.welcome = false; saveData(data); }
      else return api.sendMessage("⚠️ /ryuk welcome on | off", threadID, messageID);
      return api.sendMessage("👋 Welcome: " + (cfg.welcome ? "✅ ON" : "❌ OFF"), threadID, messageID);
    }

    if (sub === "target") {
      const ids = Object.keys(event.mentions || {});
      if (!ids[0]) return api.sendMessage("⚠️ /ryuk target @tao", threadID, messageID);
      cfg.targetUser = ids[0];
      saveData(data);
      return api.sendMessage(`🎯 Target: <@${ids[0]}>`, threadID, messageID, { mentions: [{ tag: `<@${ids[0]}>`, id: ids[0] }] });
    }
    if (sub === "untarget") { cfg.targetUser = null; saveData(data); return api.sendMessage("🎯 Inalis na ✅", threadID, messageID); }
    if (sub === "status") {
      const left = cfg.expires ? Number(cfg.expires) - Date.now() : 0;
      if (left <= 0) return api.sendMessage("❌ Naka-OFF", threadID, messageID);
      const d = Math.floor(left / 86400000);
      const h = Math.floor((left % 86400000) / 3600000);
      return api.sendMessage(
        `👑 STATUS:\n⏳ ${d}a ${h}o\n🔒 GC: ${cfg.lockedName||"Wala"}\n👤 Nick: ${cfg.botNick||"Hindi pa nakaset"}\n👋 Welcome: ${cfg.welcome?"ON":"OFF"}`,
        threadID, messageID
      );
    }

    return api.sendMessage(
      "👑 UTOS:\n/ryuk on — Simula lang ✅\n/ryuk onsetgname pangalan — I-lock GC 🔒\n/ryuk onsetnick pangalan — Palitan Nick ng Bot 👤\n/ryuk setallnick pangalan — Palitan sa LAHAT ✨\n/ryuk off — Hinto",
      threadID, messageID
    );
  } catch (err) {}
};
                           
