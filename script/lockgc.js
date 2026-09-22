// ==========================================================
// 🔒 LOCK GC NAME + BOT NICKNAME — HINDI MAPAPALITAN! ✅
// ✅ I-LOCK ANG PANGALAN NG GC
// ✅ I-LOCK ANG NICKNAME NG BOT
// ✅ KAPAG MAY NAGPALIT — BABALIK AGAD SA PINILI MO ⚡
// ✅ IKAW LANG ANG MAKAKASET NG PANGALAN
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// ==========================================================

const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "lockgc_data.json");

const ADMIN_IDS = new Set([
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
]);

const gcWatchIntervals = {};
const nickWatchIntervals = {};

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {}
  return { threads: {} };
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function isAdmin(id) {
  return ADMIN_IDS.has(String(id));
}

// ✅ I-LOCK ANG GC NAME
function startGCLock(api, threadID, targetName) {
  stopGCLock(threadID);
  
  gcWatchIntervals[threadID] = setInterval(async () => {
    try {
      const info = await new Promise(res => api.getThreadInfo(threadID, (_, i) => res(i)));
      if (info?.threadName !== targetName) {
        await api.setTitle(targetName, threadID);
      }
    } catch {}
  }, 1500);
}

function stopGCLock(threadID) {
  if (gcWatchIntervals[threadID]) {
    clearInterval(gcWatchIntervals[threadID]);
    delete gcWatchIntervals[threadID];
  }
}

// ✅ I-LOCK ANG NICKNAME NG BOT
function startNickLock(api, threadID, botID, targetNick) {
  stopNickLock(threadID);
  
  nickWatchIntervals[threadID] = setInterval(async () => {
    try {
      const info = await new Promise(res => api.getThreadInfo(threadID, (_, i) => res(i)));
      const currentNick = info?.nicknames?.[botID] || "";
      if (currentNick !== targetNick) {
        await api.changeNickname(targetNick, threadID, botID);
      }
    } catch {}
  }, 2000);
}

function stopNickLock(threadID) {
  if (nickWatchIntervals[threadID]) {
    clearInterval(nickWatchIntervals[threadID]);
    delete nickWatchIntervals[threadID];
  }
}

module.exports.config = {
  name: "lockgc",
  version: "1.0.0",
  hasPermission: 0,
  credits: "RYUK — LOCK GC + NICK ✅",
  description: "I-lock ang GC Name at Bot Nickname — hindi mapapalitan!",
  usePrefix: true,
  commandCategory: "🔒 LOCKGC",
  usages: "/lockgc gcname [pangalan] — I-lock GC Name\n" +
          "/lockgc nick [pangalan] — I-lock Bot Nickname\n" +
          "/lockgc off — Alisin ang lahat ng lock"
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const botID = api.getCurrentUserID();

  if (!isAdmin(senderID)) {
    return api.sendMessage("🔒 Ikaw lang ang pwedeng magpatakbo nito!", threadID, messageID);
  }

  let data = loadData();
  if (!data.threads) data.threads = {};
  if (!data.threads[threadID]) {
    data.threads[threadID] = {
      lockedGName: null,
      lockedNick: null
    };
  }
  const cfg = data.threads[threadID];

  const cmd = (args[0] || "").toLowerCase();

  // ✅ I-LOCK ANG GC NAME
  if (cmd === "gcname") {
    const name = args.slice(1).join(" ").trim();
    if (!name) {
      return api.sendMessage(
        "⚠️ Gamitin: /lockgc gcname [pangalan ng GC]\n" +
        "Halimbawa: /lockgc gcname RYUK BOSS GC 👑",
        threadID, messageID
      );
    }

    cfg.lockedGName = name;
    saveData(data);
    startGCLock(api, threadID, name);

    await api.setTitle(name, threadID, (err) => {
      if (err) {
        return api.sendMessage(
          "⚠️ Hindi mapalitan! Siguraduhin na ADMIN ang bot sa GC.",
          threadID, messageID
        );
      }
      return api.sendMessage(
        `🔒 GC NAME LOCKED ✅\n\n` +
        `Pangalan: ${name}\n` +
        `Kapag may nagpalit — ibabalik ko agad! ⚡\n\n` +
        "👑 RYUK BOSS",
        threadID, messageID
      );
    });
    return;
  }

  // ✅ I-LOCK ANG NICKNAME NG BOT
  if (cmd === "nick") {
    const nick = args.slice(1).join(" ").trim();
    if (!nick) {
      return api.sendMessage(
        "⚠️ Gamitin: /lockgc nick [pangalan ng Bot]\n" +
        "Halimbawa: /lockgc nick RYUK BOSS 👑",
        threadID, messageID
      );
    }

    cfg.lockedNick = nick;
    saveData(data);
    startNickLock(api, threadID, botID, nick);

    await api.changeNickname(nick, threadID, botID, (err) => {
      if (err) {
        return api.sendMessage(
          "⚠️ Hindi mapalitan! Siguraduhin na ADMIN ang bot sa GC.",
          threadID, messageID
        );
      }
      return api.sendMessage(
        `🔒 BOT NICKNAME LOCKED ✅\n\n` +
        `Pangalan: ${nick}\n` +
        `Kapag may nagpalit — ibabalik ko agad! ⚡\n\n` +
        "👑 RYUK BOSS",
        threadID, messageID
      );
    });
    return;
  }

  // ✅ ALISIN ANG LAHAT NG LOCK
  if (cmd === "off") {
    stopGCLock(threadID);
    stopNickLock(threadID);
    cfg.lockedGName = null;
    cfg.lockedNick = null;
    saveData(data);
    return api.sendMessage(
      "🔒 LAHAT NG LOCK AY TINANGGAL NA ✅\n" +
      "Pwede nang magpalit muli.",
      threadID, messageID
    );
  }

  // ✅ STATUS
  if (cmd === "status") {
    return api.sendMessage(
      "🔒 LOCKGC STATUS:\n\n" +
      `🏷️ GC Name: ${cfg.lockedGName || "Wala"} ${cfg.lockedGName ? "✅ LOCKED" : ""}\n` +
      `👤 Bot Nick: ${cfg.lockedNick || "Wala"} ${cfg.lockedNick ? "✅ LOCKED" : ""}\n\n` +
      "Gamitin:\n" +
      "/lockgc gcname [pangalan] — I-lock GC Name\n" +
      "/lockgc nick [pangalan] — I-lock Bot Nickname\n" +
      "/lockgc off — Alisin lock",
      threadID, messageID
    );
  }

  // ✅ TULONG
  return api.sendMessage(
    "🔒 LOCK GC — HINDI MAPAPALITAN ✅\n\n" +
    "/lockgc gcname [pangalan] — I-lock ang pangalan ng GC 🔒\n" +
    "/lockgc nick [pangalan] — I-lock ang nickname ng Bot 🔒\n" +
    "/lockgc status — Tingnan ang nakalock ✅\n" +
    "/lockgc off — Alisin ang lahat ng lock ❌\n\n" +
    "⚡ Kapag may nagpalit — ibabalik ko agad sa pinili mo!\n" +
    "👑 Ikaw lang ang makakapagpalit!",
    threadID, messageID
  );
};

// ✅ AGAD NA PAGBABALIK KAPAG MAY NAGPALIT
module.exports.handleEvent = async function ({ api, event }) {
  const tid = event.threadID;
  const data = loadData();
  const cfg = data.threads?.[tid];
  if (!cfg) return;

  const botID = api.getCurrentUserID();

  // May nagpalit ng GC Name
  if (event.logMessageType === "log:thread-name" && cfg.lockedGName) {
    setTimeout(() => {
      api.setTitle(cfg.lockedGName, tid, () => {});
    }, 500);
  }

  // May nagpalit ng Nickname ng Bot
  if (event.logMessageType === "log:user-nickname" && cfg.lockedNick) {
    if (event.logMessageData?.participant_id === botID) {
      if ((event.logMessageData.nickname || "") !== cfg.lockedNick) {
        setTimeout(() => {
          api.changeNickname(cfg.lockedNick, tid, botID, () => {});
        }, 500);
      }
    }
  }
};
