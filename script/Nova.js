// ==========================================================
// NOVA X — RYUK EDITION 💪🔥
// PINAKAMAKUNAT | TULUY-TULOY KAHIT WALANG MAG-CHAT
// Auto Nick: HINDI BINAGO ✅ | Admin: Ryuk 61594055835097
// Version: 8.0.0 — WALANG HIHINTO HANGGA'T DI /nova off
// ==========================================================

const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "nova",
  version: "8.0.0",
  hasPermission: 0,
  credits: "Ryuk | 61594055835097 — PINAKAMAKUNAT",
  description: "Tuloy-tuloy hangga't di /nova off + Auto Nick ✅",
  usePrefix: true,
  commandCategory: "Ryuk System",
  usages: "/nova on | /nova off",
  cooldowns: 1
};

const ADMIN_ID = "61594055835097";
const DATA_FILE = path.join(__dirname, "nova_ryuk_data.json");

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
const HEARTBEAT_INTERVAL = 25000; // ✅ Tuwing 25 segundo magpapadala kahit walang mag-chat

const processing = new Set();
const roastCooldown = new Map();
const commandCooldown = new Map();
const joinCooldown = new Map();
const heartbeatIntervals = new Map(); // ✅ Magkahiwalay bawat GC

// ==========================================================
// 🔥 MGA SAGOT — TULUY-TULOY
// ==========================================================
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

// ✅ TULUY-TULOY NA SAGOT KAHIT WALANG MAG-CHAT
const ALIVE_LINES = [
  "⚡ Nandito pa rin — hindi hihinto hangga't walang /nova off.",
  "💪 Tuloy-tuloy — kahit tahimik ang iba, nandito ako.",
  "🔥 Handa sa utos mo, Ryuk — sabihin lang, gagawin agad.",
  "✨ Hindi aalis — ikaw lang ang makapapatigil.",
  "👑 Buhay pa — sabihin mo lang /nova off para huminto.",
  "⚡ Walang bibitaw — dito lang ako hangga't buhay ka.",
  "💪 Matibay pa rin — hindi titigil nang kusa.",
  "🔥 Hihinto lang kapag sinabi mong /nova off.",
  "✨ Nakatayo pa rin — handa sa bawat utos mo.",
  "👑 Ikaw lang ang boss — sa iba hindi ako pupunta."
];

const EMOJIS = ["🔥", "💀", "🤣", "😆", "🤡"];

// ==========================================================
// DATABASE — WALANG ERROR
// ==========================================================
function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      saveData({ ...DEFAULT_DATA });
      return { ...DEFAULT_DATA };
    }
    return { ...DEFAULT_DATA, ...JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) };
  } catch (e) {
    console.error("[RYUK] Load error:", e?.message);
    return { ...DEFAULT_DATA };
  }
}

function saveData(data) {
  try {
    const temp = DATA_FILE + ".tmp";
    fs.writeFileSync(temp, JSON.stringify(data, null, 2), "utf8");
    fs.renameSync(temp, DATA_FILE);
    return true;
  } catch (e) {
    console.error("[RYUK] Save error:", e?.message);
    return false;
  }
}

// ==========================================================
// HELPERS
// ==========================================================
function isAdmin(id) { return String(id) === ADMIN_ID; }
function random(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function cooldownReady(map, key, dur) {
  const now = Date.now();
  const last = map.get(String(key)) || 0;
  if (now - last < dur) return false;
  map.set(String(key), now);
  return true;
}
function send(api, msg, tid, rid=null) {
  return new Promise(r => {
    try { api.sendMessage(msg, tid, (e,i)=>r(e?null:i), rid); }
    catch { r(null); }
  });
}
function react(api, em, mid) {
  return new Promise(r => {
    try { api.setMessageReaction(em, mid, ()=>r(true), true); }
    catch { r(false); }
  });
}
function sleep(ms) { return new Promise(r=>setTimeout(r,ms)); }
function apiCall(api, meth, args) {
  return new Promise(r => {
    try { api[meth](...args, e=>r(!e)); }
    catch { r(false); }
  });
}

// ==========================================================
// 💪 HEARTBEAT — TULUY-TULOY KAHIT WALANG MAG-CHAT
// HINDI HIHINTO HANGGA'T HINDI /nova off
// ==========================================================
function startHeartbeat(api, threadID) {
  stopHeartbeat(threadID);
  const data = loadData();
  if (!data.active) return;

  console.log(`[RYUK] ⚡ NAKABUKAS SA GC: ${threadID} — TULUY-TULOY`);

  heartbeatIntervals.set(String(threadID), setInterval(async () => {
    const d = loadData();
    
    // ✅ KUNG NAKA-OFF, HUMINTO — KUNG HINDI, TULUY LANG!
    if (!d.active) {
      stopHeartbeat(threadID);
      return;
    }

    // ✅ Magpadala ng "buhay pa" na mensahe
    const line = ALIVE_LINES[d.heartbeatIndex % ALIVE_LINES.length];
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
    console.log(`[RYUK] 🔴 HUMINTO SA GC: ${threadID}`);
  }
}

// ==========================================================
// ✅ AUTO NICK — HINDI BINAGO! GINAYA SA ORIHINAL
// ==========================================================
module.exports.handleEvent = async ({ api, event }) => {
  if (!event) return;
  const { threadID, senderID, body, logMessageType } = event;
  if (!threadID) return;

  // ✅ BAGONG KASALI — AUTO NICK HINDI BINAGO
  if (logMessageType === "log:subscribe") {
    if (!cooldownReady(joinCooldown, threadID, JOIN_COOLDOWN)) return;

    const added = event.logMessageData?.addedParticipants || [];
    if (!added.length) return;

    const data = loadData();
    let botID = "";
    try { botID = String(api.getCurrentUserID()); } catch {}

    // ✅ AUTO NICK — ORIHINAL, WALANG BINAGO
    if (data.autoNick && data.savedNick) {
      for (const member of added) {
        const userID = String(member.userFbId || member.id || "");
        if (!userID || userID === botID) continue;
        
        await apiCall(api, "changeNickname", [data.savedNick, threadID, userID]);
        await sleep(400);
      }
    }

    // ✅ AUTO GC NAME — ORIHINAL
    if (data.autoGname && data.savedGname) {
      await apiCall(api, "setTitle", [data.savedGname, threadID]);
    }
    return;
  }

  // ✅ NORMAL MESSAGE — ROAST
  if (!senderID || !body) return;
  try { if (String(senderID) === String(api.getCurrentUserID())) return; } catch {}
  
  const text = String(body).trim();
  if (!text || text.startsWith("/") || text.startsWith("!")) return;

  const data = loadData();
  if (!data.active || !data.roast || processing.has(String(threadID))) return;
  if (!cooldownReady(roastCooldown, threadID, ROAST_COOLDOWN)) return;

  processing.add(String(threadID));
  try {
    const info = await send(api, random(ROASTS), threadID);
    if (info?.messageID && data.react) {
      await react(api, random(EMOJIS), info.messageID);
    }
    data.roastCount = Number(data.roastCount) + 1;
    saveData(data);
  } finally {
    processing.delete(String(threadID));
  }
};

// ==========================================================
// COMMAND — IKAW LANG ANG MAKAPATIGIL
// ==========================================================
module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;

  try {
    const cmd = String(args?.[0] || "help").toLowerCase();

    const adminCmds = ["on","off","roast","react","setnick","autonick","setgname","autogname","status","info"];
    if (adminCmds.includes(cmd) && !isAdmin(senderID)) {
      return send(api, "🔒 Ryuk lang ang pwedeng mag-utos!", threadID, messageID);
    }

    if (!cooldownReady(commandCooldown, senderID, COMMAND_COOLDOWN)) return;

    const data = loadData();
    data.commandCount = Number(data.commandCount) + 1;
    saveData(data);

    // ⚡ ON — SIMULAN ANG TULUY-TULOY
    if (cmd === "on") {
      data.active = true;
      data.activatedBy = senderID;
      data.activatedAt = Date.now();
      saveData(data);
      
      startHeartbeat(api, threadID);
      
      return send(api,
        "⚡ NOVA X — NAKABUKAS NA!\n" +
        "💪 Tuloy-tuloy kahit walang magsalita.\n" +
        "✅ Auto Nick: HINDI BINAGO — gumagana!\n" +
        "🔴 Ikaw lang makapapatigil: /nova off",
        threadID, messageID
      );
    }

    // 🔴 OFF — IKAW LANG ANG MAKAGAWI
    if (cmd === "off") {
      data.active = false;
      saveData(data);
      stopHeartbeat(threadID);
      return send(api,
        "🔴 TUMIGIL NA — UTOS MO, RYUK!\n" +
        "💪 Babalik kapag /nova on ka ulit.",
        threadID, messageID
      );
    }

    // ROAST
    if (cmd === "roast") {
      const m = String(args?.[1]||"").toLowerCase();
      if (!["on","off"].includes(m)) return send(api, "/nova roast on | off", threadID, messageID);
      data.roast = m==="on"; saveData(data);
      return send(api, `🔥 Auto-roast: ${m.toUpperCase()}`, threadID, messageID);
    }

    // REACT
    if (cmd === "react") {
      const m = String(args?.[1]||"").toLowerCase();
      if (!["on","off"].includes(m)) return send(api, "/nova react on | off", threadID, messageID);
      data.react = m==="on"; saveData(data);
      return send(api, `⚡ Reaksyon: ${m.toUpperCase()}`, threadID, messageID);
    }

    // ✅ SET NICK — HINDI BINAGO
    if (cmd === "setnick") {
      const nick = args.slice(1).join(" ").trim() || "NOVA X";
      data.savedNick = nick; saveData(data);
      
      let info;
      try { info = await api.getThreadInfo(threadID); }
      catch { return send(api, "❌ Hindi makuha ang GC info", threadID, messageID); }
      
      const members = info?.participantIDs || [];
      if (!members.length) return send(api, "❌ Walang miyembro", threadID, messageID);
      
      await send(api, `⏳ Binabago palayaw sa ${members.length} na miyembro...`, threadID);
      
      let ok=0, no=0;
      for (const uid of members) {
        if (await apiCall(api, "changeNickname", [nick, threadID, uid])) ok++;
        else no++;
        await sleep(400);
      }
      
      return send(api,
        `✅ Palayaw: "${nick}"\nTagumpay: ${ok} | Nabigo: ${no}\nI-on: /nova autonick on`,
        threadID, messageID
      );
    }

    // ✅ AUTO NICK — HINDI BINAGO
    if (cmd === "autonick") {
      const m = String(args?.[1]||"").toLowerCase();
      if (!["on","off"].includes(m)) return send(api, "/nova autonick on | off", threadID, messageID);
      if (m==="on" && !data.savedNick) return send(api, "❌ I-set muna: /nova setnick <pangalan>", threadID, messageID);
      data.autoNick = m==="on"; saveData(data);
      return send(api, `⚡ Auto Nick: ${m.toUpperCase()}`, threadID, messageID);
    }

    // ✅ SET GC NAME — HINDI BINAGO
    if (cmd === "setgname") {
      const name = args.slice(1).join(" ").trim();
      if (!name) return send(api, "/nova setgname <pangalan>", threadID, messageID);
      data.savedGname = name; saveData(data);
      const ok = await apiCall(api, "setTitle", [name, threadID]);
      return send(api, ok ? `✅ GC Name: "${name}"` : "❌ Nabigo", threadID, messageID);
    }

    // ✅ AUTO GC NAME — HINDI BINAGO
    if (cmd === "autogname") {
      const m = String(args?.[1]||"").toLowerCase();
      if (!["on","off"].includes(m)) return send(api, "/nova autogname on | off", threadID, messageID);
      if (m==="on" && !data.savedGname) return send(api, "❌ I-set muna: /nova setgname <pangalan>", threadID, messageID);
      data.autoGname = m==="on"; saveData(data);
      return send(api, `⚡ Auto Gname: ${m.toUpperCase()}`, threadID, messageID);
    }

    // STATUS
    if (cmd === "status") {
      return send(api, [
        "⚡ NOVA X STATUS — RYUK EDITION",
        `System: ${data.active ? "ON 🟢" : "OFF 🔴"}`,
        `Auto-roast: ${data.roast ? "ON" : "OFF"}`,
        `Reaction: ${data.react ? "ON" : "OFF"}`,
        `Auto Nick: ${data.autoNick ? "ON" : "OFF"} | ${data.savedNick || "Hindi nakaset"}`,
        `Auto Gname: ${data.autoGname ? "ON" : "OFF"} | ${data.savedGname || "Hindi nakaset"}`,
        `Roasts: ${data.roastCount || 0}`,
        `Tuloy-tuloy: ${data.active ? "HINDI HIHINTO 💪" : "Tumigil na"}`
      ].join("\n"), threadID, messageID);
    }

    // HELP
    return send(api, [
      "⚡ NOVA X — RYUK EDITION",
      "/nova on — Simulan, tuloy-tuloy kahit walang magsalita",
      "/nova off — Huminto (Ikaw lang makagawa)",
      "/nova roast on/off",
      "/nova react on/off",
      "/nova setnick <pangalan>",
      "/nova autonick on/off ✅ HINDI BINAGO",
      "/nova setgname <pangalan>",
      "/nova autogname on/off",
      "/nova status"
    ].join("\n"), threadID, messageID);

  } catch (err) {
    console.error("[RYUK] Error:", err);
    return send(api, "⚠️ Walang problema — patuloy pa rin 💪", threadID, messageID);
  }
};
  
