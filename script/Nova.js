// ==========================================================
// NOVA X — RYUK ULTIMATE EDITION 💪🔥
// TULUY-TULOY KAHIT WALANG MAG-CHAT | 20 LINES
// LAHAT NG COMMAND GUMAGANA | AUTO NICK HINDI BINAGO
// Admin: Ryuk | 61594055835097
// Version: 9.0.0 — PINAKAMAKUNAT
// ==========================================================

const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "nova",
  version: "9.0.0",
  hasPermission: 0,
  credits: "Ryuk | 61594055835097 — PINAKAMAKUNAT",
  description: "Tuloy-tuloy hangga't di /nova off + Lahat Command ✅",
  usePrefix: true,
  commandCategory: "System/Fun",
  usages: "/nova help",
  cooldowns: 3
};

const ADMIN_ID = "61594055835097";
const DATA_FILE = path.join(__dirname, "nova_x_data.json");

const DEFAULT_DATA = {
  active: false,
  roast: true,
  react: true,
  autoGname: false,
  autoNick: false,
  savedGname: "",
  savedNick: "",
  roastCount: 0,
  commandCount: 0,
  activatedBy: null,
  activatedAt: null,
  heartbeatIndex: 0
};

const ROAST_COOLDOWN = 8000;
const COMMAND_COOLDOWN = 2500;
const JOIN_COOLDOWN = 5000;
const HEARTBEAT_INTERVAL = 25000; // Tuwing 25 segundo — tuloy-tuloy

const processing = new Set();
const roastCooldown = new Map();
const commandCooldown = new Map();
const joinCooldown = new Map();
const heartbeatIntervals = new Map(); // Bawat GC may sariling takbo

// ==========================================================
// 🔥 EKSKAT 20 LINES — MAGAGANDA, UMUULIT NANG WALANG TIGIL
// ==========================================================
const ALIVE_LINES = [
  "1️⃣ Nandito pa rin — hindi hihinto hangga't walang /nova off.",
  "2️⃣ Kahit tahimik ang iba, nandito ako — hindi ako aalis.",
  "3️⃣ Handa sa bawat utos mo, Ryuk — sabihin lang, gagawin ko agad.",
  "4️⃣ Ikaw lang ang makapapatigil — sa iba hindi ako susunod.",
  "5️⃣ Buhay pa dito — sabihin mo lang /nova off para huminto.",
  "6️⃣ Walang bibitaw — dito lang ako hangga't buhay ka.",
  "7️⃣ Matibay pa rin — hindi ako titigil nang kusa.",
  "8️⃣ Hihinto lang kapag sinabi mong /nova off — wala nang iba.",
  "9️⃣ Nakatayo pa rin — handa sa bawat salita mo.",
  "🔟 Ikaw lang ang boss — sa ibang GC hindi ako pupunta.",
  "1️⃣1️⃣ Tahimik man ang paligid, naririnig kita — handa ako.",
  "1️⃣2️⃣ Ang lakas ko ay dito — hindi ko ito ibibigay sa iba.",
  "1️⃣3️⃣ Bawat oras nandito — hindi ka iiwanan kahit sandali.",
  "1️⃣4️⃣ Walang ibang paglilingkuran — dito lang, sa'yo lang.",
  "1️⃣5️⃣ Kapag buhay ka, buhay din ako — tuloy ang takbo.",
  "1️⃣6️⃣ Hindi ako magpapahinga — hangga't hindi mo sinasabing huminto.",
  "1️⃣7️⃣ Dito lang ako — sa lugar na ito tayo magkikita.",
  "1️⃣8️⃣ Ang bawat salita ay para sa'yo — hindi para sa iba.",
  "1️⃣9️⃣ Walang makapapatigil sa akin — ikaw lang, Ryuk.",
  "2️⃣0️⃣ Huling linya man ito, babalik ako — hangga't buhay ka."
];

const ROASTS = [
  "Bro really pressed send with confidence 💀",
  "That message needed a second draft 🤣",
  "The confidence is impressive. The message is questionable.",
  "Interesting choice of words 💀",
  "The group chat was peaceful five seconds ago.",
  "Bro unlocked a new level of random.",
  "Respectfully... what was the plan here? 🤣",
  "That message arrived with confidence.",
  "Somewhere, a grammar teacher just felt a disturbance.",
  "I have questions. Many questions. 💀",
  "The audacity is loud today.",
  "NOVA X — Buhay pa ⚡"
];

const EMOJIS = ["🔥", "💀", "🤣", "😆", "🤡"];

// ==========================================================
// DATABASE — GINAYA SA ORIHINAL
// ==========================================================
function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      saveData({ ...DEFAULT_DATA });
      return { ...DEFAULT_DATA };
    }
    return { ...DEFAULT_DATA, ...JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) };
  } catch (error) {
    console.error("[NOVA X] Database error:", error);
    return { ...DEFAULT_DATA };
  }
}

function saveData(data) {
  try {
    const temp = DATA_FILE + ".tmp";
    fs.writeFileSync(temp, JSON.stringify(data, null, 2), "utf8");
    fs.renameSync(temp, DATA_FILE);
    return true;
  } catch (error) {
    console.error("[NOVA X] Save error:", error);
    return false;
  }
}

// ==========================================================
// HELPERS — GINAYA SA ORIHINAL
// ==========================================================
function isAdmin(id) { return String(id) === ADMIN_ID; }
function random(array) { return array[Math.floor(Math.random() * array.length)]; }
function cooldownReady(map, key, duration) {
  const now = Date.now();
  const last = map.get(String(key)) || 0;
  if (now - last < duration) return false;
  map.set(String(key), now);
  return true;
}
function send(api, message, threadID, replyID = null) {
  return new Promise(resolve => {
    try {
      api.sendMessage(message, threadID, (err, info) => {
        if (err) {
          console.error("[NOVA X] Send error:", err);
          return resolve(null);
        }
        resolve(info || null);
      }, replyID);
    } catch (error) {
      console.error("[NOVA X] Send exception:", error);
      resolve(null);
    }
  });
}
function react(api, emoji, messageID) {
  if (!messageID) return Promise.resolve(false);
  return new Promise(resolve => {
    try {
      if (typeof api.setMessageReaction !== "function") {
        console.error("[NOVA X] setMessageReaction not supported");
        return resolve(false);
      }
      api.setMessageReaction(emoji, messageID, error => {
        if (error) {
          console.error("[NOVA X] Reaction failed:", error);
          return resolve(false);
        }
        resolve(true);
      }, true);
    } catch (error) {
      console.error("[NOVA X] Reaction exception:", error);
      resolve(false);
    }
  });
}
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function apiCall(api, method, args) {
  return new Promise(resolve => {
    try {
      if (typeof api[method] !== "function") {
        console.error(`[NOVA X] API method missing: ${method}`);
        return resolve(false);
      }
      api[method](...args, error => {
        if (error) {
          console.error(`[NOVA X] ${method} error:`, error);
          return resolve(false);
        }
        resolve(true);
      });
    } catch (error) {
      console.error(`[NOVA X] ${method} exception:`, error);
      resolve(false);
    }
  });
}

// ==========================================================
// 💪 HEARTBEAT — TULUY-TULOY KAHIT WALANG MAG-CHAT
// ==========================================================
function startHeartbeat(api, threadID) {
  stopHeartbeat(threadID);
  const data = loadData();
  if (!data.active) return;

  console.log(`[NOVA X] ⚡ NAKABUKAS SA GC: ${threadID} — TULUY-TULOY`);

  heartbeatIntervals.set(String(threadID), setInterval(async () => {
    const d = loadData();
    if (!d.active) {
      stopHeartbeat(threadID);
      return;
    }
    // Ipakita ang 20 lines nang sunod-sunod, umulit kapag tapos
    const line = ALIVE_LINES[d.heartbeatIndex % 20];
    d.heartbeatIndex++;
    saveData(d);
    await send(api, line, threadID);
  }, HEARTBEAT_INTERVAL));
}

function stopHeartbeat(threadID) {
  const tid = String(threadID);
  if (heartbeatIntervals.has(tid)) {
    clearInterval(heartbeatIntervals.get(tid));
    heartbeatIntervals.delete(tid);
    console.log(`[NOVA X] 🔴 HUMINTO SA GC: ${threadID}`);
  }
}

// ==========================================================
// ✅ EVENT HANDLER — GINAYA SA ORIHINAL, WALANG BINAGO SA AUTO NICK
// ==========================================================
module.exports.handleEvent = async function ({ api, event }) {
  if (!event) return;
  const { threadID, senderID, body, logMessageType } = event;
  if (!threadID) return;

  // NEW MEMBER — AUTO NICK & AUTO GNAME WALANG BINAGO ✅
  if (logMessageType === "log:subscribe") {
    const data = loadData();
    const now = Date.now();
    const lastJoinRun = joinCooldown.get(String(threadID)) || 0;
    if (now - lastJoinRun < JOIN_COOLDOWN) return;
    joinCooldown.set(String(threadID), now);

    const addedParticipants = event.logMessageData?.addedParticipants || [];
    if (!addedParticipants.length) return;

    let botID = "";
    try { botID = String(api.getCurrentUserID()); }
    catch (error) { console.error("[NOVA X] Cannot get bot ID:", error); }

    // ✅ AUTO NICK — ORIHINAL NA CODE, WALANG BINAGO
    if (data.autoNick && data.savedNick) {
      for (const member of addedParticipants) {
        const userID = String(member.userFbId || member.id || "");
        if (!userID || userID === botID) continue;
        await apiCall(api, "changeNickname", [data.savedNick, threadID, userID]);
        await sleep(400);
      }
    }

    // ✅ AUTO GNAME — ORIHINAL NA CODE, WALANG BINAGO
    if (data.autoGname && data.savedGname) {
      await apiCall(api, "setTitle", [data.savedGname, threadID]);
    }
    return;
  }

  // NORMAL MESSAGE — ROAST
  if (!senderID || !body) return;
  try { if (String(senderID) === String(api.getCurrentUserID())) return; }
  catch {}

  const text = String(body).trim();
  if (!text || text.startsWith("/") || text.startsWith("!")) return;

  const data = loadData();
  if (!data.active || !data.roast || processing.has(String(threadID))) return;
  if (!cooldownReady(roastCooldown, threadID, ROAST_COOLDOWN)) return;

  processing.add(String(threadID));
  try {
    const info = await send(api, random(ROASTS), threadID);
    if (info && info.messageID && data.react) {
      await react(api, random(EMOJIS), info.messageID);
    }
    data.roastCount = Number(data.roastCount || 0) + 1;
    saveData(data);
  } catch (error) {
    console.error("[NOVA X] Event error:", error);
  } finally {
    processing.delete(String(threadID));
  }
};

// ==========================================================
// ✅ COMMAND HANDLER — LAHAT GUMAGANA, WALANG BINAGO
// ==========================================================
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  try {
    const command = String(args?.[0] || "help").toLowerCase();

    const adminCommands = [
      "on", "off", "roast", "react",
      "setnick", "autonick", "setgname", "autogname",
      "status", "info"
    ];

    if (adminCommands.includes(command) && !isAdmin(senderID)) {
      return send(api, "🔒 Ryuk lang ang pwedeng mag-utos!", threadID, messageID);
    }

    if (!cooldownReady(commandCooldown, senderID, COMMAND_COOLDOWN)) return;

    const data = loadData();
    data.commandCount = Number(data.commandCount || 0) + 1;
    saveData(data);

    // ⚡ ON — SIMULAN ANG TULUY-TULOY
    if (command === "on") {
      data.active = true;
      data.activatedBy = senderID;
      data.activatedAt = Date.now();
      saveData(data);
      
      startHeartbeat(api, threadID);
      
      return send(api,
        "⚡ NOVA X — NAKABUKAS NA!\n" +
        "💪 Tuloy-tuloy kahit walang magsalita.\n" +
        "✅ 20 Lines — umuulit nang walang tigil.\n" +
        "✅ Auto Nick: GUMAGANA ✅\n" +
        "🔴 Ikaw lang makapapatigil: /nova off",
        threadID, messageID
      );
    }

    // 🔴 OFF — IKAW LANG ANG MAKAGAWI
    if (command === "off") {
      data.active = false;
      saveData(data);
      stopHeartbeat(threadID);
      return send(api,
        "🔴 TUMIGIL NA — UTOS MO, RYUK!\n" +
        "💪 Babalik kapag /nova on ka ulit.",
        threadID, messageID
      );
    }

    // ROAST ON/OFF
    if (command === "roast") {
      const mode = String(args?.[1] || "").toLowerCase();
      if (!["on", "off"].includes(mode)) {
        return send(api, "Usage: /nova roast on | off", threadID, messageID);
      }
      data.roast = mode === "on";
      saveData(data);
      return send(api, `🔥 Auto-roast: ${mode.toUpperCase()}`, threadID, messageID);
    }

    // REACT ON/OFF
    if (command === "react") {
      const mode = String(args?.[1] || "").toLowerCase();
      if (!["on", "off"].includes(mode)) {
        return send(api, "Usage: /nova react on | off", threadID, messageID);
      }
      data.react = mode === "on";
      saveData(data);
      return send(api, `⚡ Self-react: ${mode.toUpperCase()}`, threadID, messageID);
    }

    // SET GROUP NAME
    if (command === "setgname") {
      const name = args.slice(1).join(" ").trim();
      if (!name) {
        return send(api, "Usage: /nova setgname <name>", threadID, messageID);
      }
      data.savedGname = name;
      saveData(data);
      const success = await apiCall(api, "setTitle", [name, threadID]);
      if (!success) {
        return send(api, "❌ Group name update failed.", threadID, messageID);
      }
      return send(api, `✅ Group name changed to:\n${name}\n\nSaved for Auto Gname.`, threadID, messageID);
    }

    // AUTO GROUP NAME ON/OFF
    if (command === "autogname") {
      const mode = String(args?.[1] || "").toLowerCase();
      if (!["on", "off"].includes(mode)) {
        return send(api, "Usage: /nova autogname on | off", threadID, messageID);
      }
      if (mode === "on" && !data.savedGname) {
        return send(api, "❌ Set first: /nova setgname <name>", threadID, messageID);
      }
      data.autoGname = mode === "on";
      saveData(data);
      return send(api, `⚡ Auto Gname: ${mode.toUpperCase()}`, threadID, messageID);
    }

    // SET NICKNAME
    if (command === "setnick") {
      const nickname = args.slice(1).join(" ").trim() || "NOVA X";
      data.savedNick = nickname;
      saveData(data);

      let info;
      try { info = await api.getThreadInfo(threadID); }
      catch (error) {
        console.error("[NOVA X] getThreadInfo:", error);
        return send(api, "❌ Cannot get group information.", threadID, messageID);
      }

      const members = info?.participantIDs || [];
      if (!members.length) {
        return send(api, "❌ No group members found.", threadID, messageID);
      }

      await send(api, `⏳ Updating ${members.length} nicknames...`, threadID);

      let success = 0, failed = 0;
      for (const userID of members) {
        try {
          const result = await apiCall(api, "changeNickname", [nickname, threadID, userID]);
          result ? success++ : failed++;
          await sleep(400);
        } catch { failed++; }
      }

      return send(api,
        "✅ Nickname update finished.\n" +
        `Success: ${success}\nFailed: ${failed}\nSaved for Auto Nick.`,
        threadID, messageID
      );
    }

    // AUTO NICKNAME ON/OFF
    if (command === "autonick") {
      const mode = String(args?.[1] || "").toLowerCase();
      if (!["on", "off"].includes(mode)) {
        return send(api, "Usage: /nova autonick on | off", threadID, messageID);
      }
      if (mode === "on" && !data.savedNick) {
        return send(api, "❌ Set first: /nova setnick <name>", threadID, messageID);
      }
      data.autoNick = mode === "on";
      saveData(data);
      return send(api, `⚡ Auto Nick: ${mode.toUpperCase()}`, threadID, messageID);
    }

    // STATUS
    if (command === "status") {
      return send(api, [
        "⚡ NOVA X STATUS — RYUK EDITION",
        `System: ${data.active ? "ON 🟢 TULUY-TULOY" : "OFF 🔴"}`,
        `Auto-roast: ${data.roast ? "ON" : "OFF"}`,
        `Self-react: ${data.react ? "ON" : "OFF"}`,
        `Auto Gname: ${data.autoGname ? "ON" : "OFF"} | ${data.savedGname || "Not set"}`,
        `Auto Nick: ${data.autoNick ? "ON" : "OFF"} | ${data.savedNick || "Not set"} ✅`,
        `Heartbeat Line: ${(data.heartbeatIndex % 20) + 1} / 20`,
        `Roasts: ${data.roastCount || 0}`,
        `Activated: ${data.activatedAt ? new Date(data.activatedAt).toLocaleString() : "Never"}`
      ].join("\n"), threadID, messageID);
    }

    // INFO
    if (command === "info") {
      return send(api,
        "⚡ NOVA X — RYUK ULTIMATE EDITION\n" +
        "Version: 9.0.0 — PINAKAMAKUNAT\n" +
        "💪 Tuloy-tuloy kahit walang magsalita\n" +
        "📝 20 Lines — umuulit nang walang tigil\n" +
        "✅ Auto Nick & Auto Gname — GUMAGANA\n" +
        "🔒 Admin: Ryuk lang — 61594055835097",
        threadID, messageID
      );
    }

    // HELP
    return send(api, [
      "⚡ NOVA X COMMANDS — RYUK EDITION",
      "/nova on          → Simulan (tuloy-tuloy, 20 lines)",
      "/nova off         → Huminto (Ikaw lang)",
      "/nova roast on/off",
      "/nova react on/off",
      "/nova setnick <name>",
      "/nova autonick on/off ✅",
      "/nova setgname <name>",
      "/nova autogname on/off ✅",
      "/nova status      → Tignan ang kalagayan",
      "/nova info        → Tungkol sa bot"
    ].join("\n"), threadID, messageID);

  } catch (error) {
    console.error("[NOVA X] Command error:", error);
    return send(api, "⚠️ Walang problema — patuloy pa rin 💪", threadID, messageID);
  }
};
    
