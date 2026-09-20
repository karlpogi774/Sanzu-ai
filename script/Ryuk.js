// ==========================================================
// 👑 RYUK BOSS — MAKUNAT NO-DETECT V20.0 🧱
// ✅ /SILENT = WALANG TITIGIL — LAHAT GUMAGANA PA RIN!
// ✅ TUWING 10S — PALIT NICK SA LAHAT
// ✅ TUWING 5S — IBALIK GC NAME
// ✅ HEARTBEAT, WELCOME, CHAT REPLY — LAHIT GUMAGANA KAHIT /SILENT!
// 🔒 ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817 ✅
// ==========================================================

const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "ryuk",
  version: "20.0.0-makunat",
  hasPermission: 0,
  credits: "👑 RYUK BOSS — LAHAT GUMAGANA KAHIT SILENT",
  description: "Silent = walang titigil — lahat gumagana!",
  usePrefix: true,
  commandCategory: "👑 RYUK BOSS",
  usages: "/ryuk on | /silent | /unsilent",
  cooldowns: 1
};

// ============== 🔒 ADMIN ==============
const ADMIN_IDS = Object.freeze([
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
]);

const DATA_FILE = path.join(__dirname, "ryuk_king_data.json");

// ============== ⚡ DEFAULT DATA ==============
const DEFAULT_GC_DATA = Object.freeze({
  active: false,
  silent: false,
  roast: true,
  react: true,
  heartbeatReact: true,
  autoGname: true,
  autoNick: true,
  autoWelcome: true,
  savedGname: "👑 GOJO BOSS 👑",
  savedNick: "RYUK BOSS",
  welcomeMsg: `
╭ ╭─────────────────────╮
 │ 👑 MALIGAYANG PAGDATING 👑
 │    @{username}
 │
 │ Ikaw ay naging 「RYUK BOSS」na ⚡
 │ Sumunod sa batas, maging tapat
 │ Dito — HARI ang nasusunod 👑
 ╰───────────────────── ╮
 ╰─➤  RYUK GNM LVL 9999
  `.trim(),
  roastCount: 0,
  commandCount: 0,
  activatedBy: null,
  activatedAt: null,
  heartbeatIndex: 0,
  lastRestoreGname: 0,
  lastFullNickApply: 0
});

// ============== ⚡ ORAS ==============
const COOLDOWNS = Object.freeze({
  ROAST: 8000,
  COMMAND: 2500,
  HEARTBEAT: 20000,
  NICK_DELAY: 1000,
  RESTORE_GNAME: 1500,
  FULL_NICK_APPLY: 10000,
  GC_CHECK_INTERVAL: 5000
});

// ============== 🔄 TAGAPAG-INGAT ==============
const processing = new Set();
const roastCooldown = new Map();
const commandCooldown = new Map();
const welcomedUsers = new Set();
const heartbeatIntervals = new Map();
const makunatNickIntervals = new Map();
const makunatGcNameIntervals = new Map();
const threadLocks = new Map();

// ============== ✨ MENSAHE ==============
const ALIVE_LINES = Object.freeze([
  "🧱 Kahit /silent — NANDITO PA RIN AKO!",
  "💪 Walang titigil — lahat ay gumagana!",
  "👑 TUWING 10S — lahat ay RYUK BOSS!",
  "⚡ /silent = walang pagbabago — lahat ay buhay!",
  "🔥 MAKUNAT — hangga't hindi pinapatay, hindi titigil!"
]);

const HEARTBEAT_EMOJIS = ["🔥", "⚡", "💪", "👑", "✨"];
const ROASTS = Object.freeze([
  "💀 Kahit /silent — sinasagot pa rin kita!",
  "🤣 Akala mo tatahimik ako? HINDI!",
  "👑 RYUK — MAKUNAT KING 🧱",
  "😂 Walang pipigil sa akin — lahat gumagana!",
  "🔥 Subukan mo — hindi ako hihinto!"
]);
const EMOJIS = ["🔥", "💀", "🤣", "😆", "👑", "✨"];

// ============== 📂 DATA ==============
function loadAllData() {
  try {
    if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "{}", "utf8");
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8") || "{}");
  } catch (err) {
    console.error("[👑 RYUK] Load:", err?.message);
    return {};
  }
}

function saveAllData(allData) {
  try {
    fs.writeFileSync(`${DATA_FILE}.tmp`, JSON.stringify(allData, null, 2), "utf8");
    fs.renameSync(`${DATA_FILE}.tmp`, DATA_FILE);
    return true;
  } catch (err) {
    console.error("[👑 RYUK] Save:", err?.message);
    return false;
  }
}

function loadGCData(threadID) {
  const allData = loadAllData();
  const tid = String(threadID);
  if (!allData[tid]) allData[tid] = { ...DEFAULT_GC_DATA };
  return { ...DEFAULT_GC_DATA, ...allData[tid] };
}

function saveGCData(threadID, gcData) {
  const allData = loadAllData();
  allData[String(threadID)] = gcData;
  return saveAllData(allData);
}

// ============== 🛡️ TULONG ==============
const isAdmin = (id) => ADMIN_IDS.includes(String(id));
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function cooldownReady(map, key, duration) {
  const now = Date.now();
  const k = String(key);
  const last = map.get(k) || 0;
  if (now - last < duration) return false;
  map.set(k, now);
  return true;
}

function send(api, message, threadID, messageID = null) {
  return new Promise(resolve => {
    if (!api || !threadID || !message) return resolve(null);
    try { api.sendMessage(message, threadID, (_, i) => resolve(i), messageID); }
    catch { resolve(null); }
  });
}

function react(api, emoji, messageID) {
  return new Promise(resolve => {
    if (!api || !messageID || !emoji) return resolve(false);
    try {
      if (typeof api.setMessageReaction === "function") {
        api.setMessageReaction(emoji, messageID, () => resolve(true), true);
      } else { resolve(false); }
    } catch { resolve(false); }
  });
}

// ============== ✨ PALIT NICK ==============
async function setNickname(api, threadID, userID, newNick) {
  const methods = [
    async () => { await api.changeNickname?.(threadID, newNick, userID); },
    async () => { await api.changeNickname?.(newNick, threadID, userID); },
    async () => { await api.setNickname?.(threadID, newNick, userID); },
    async () => { await api.setNickname?.(newNick, threadID, userID); }
  ];
  for (let fn of methods) {
    try { await fn(); return true; } catch {}
  }
  return false;
}

async function applyNickToAll(api, threadID, nickname = "RYUK BOSS") {
  const lockKey = `nick_${threadID}`;
  if (threadLocks.get(lockKey)) return { success: 0, failed: 0 };
  threadLocks.set(lockKey, true);
  
  let info;
  try { info = await api.getThreadInfo(threadID); }
  catch { threadLocks.delete(lockKey); return { success: 0, failed: 0 }; }
  
  const members = info?.participantIDs || [];
  const botID = String(await api.getCurrentUserID?.() || "");
  let success = 0, failed = 0;
  
  for (const id of members) {
    if (String(id) === botID) continue;
    const ok = await setNickname(api, threadID, id, nickname);
    ok ? success++ : failed++;
    await sleep(COOLDOWNS.NICK_DELAY);
  }
  
  threadLocks.delete(lockKey);
  return { success, failed };
}

async function restoreGroupName(api, threadID, gcData) {
  if (!gcData.savedGname) return false;
  const now = Date.now();
  if (now - (gcData.lastRestoreGname || 0) < COOLDOWNS.RESTORE_GNAME) return false;
  
  let ok = false;
  if (typeof api.setTitle === "function") {
    try { await api.setTitle(gcData.savedGname, threadID); ok = true; }
    catch {}
  }
  
  if (ok) {
    gcData.lastRestoreGname = now;
    saveGCData(threadID, gcData);
  }
  return ok;
}

// ============== 🧱 NICK — WALANG TITIGIL! ✅ ==============
function startMakunatNick(api, threadID) {
  stopMakunatNick(threadID);
  const data = loadGCData(threadID);
  if (!data.active || !data.autoNick) return;
  
  const tid = String(threadID);
  makunatNickIntervals.set(tid, setInterval(async () => {
    const current = loadGCData(threadID);
    if (!current.active || !current.autoNick) {
      stopMakunatNick(tid);
      return;
    }
    // ✅ WALANG PAGTINGIN SA SILENT — TULOY LANG!
    const now = Date.now();
    if (now - (current.lastFullNickApply || 0) < COOLDOWNS.FULL_NICK_APPLY) return;
    
    await applyNickToAll(api, threadID, current.savedNick);
    current.lastFullNickApply = now;
    saveGCData(threadID, current);
  }, 1000));
}

function stopMakunatNick(threadID) {
  const k = String(threadID);
  if (makunatNickIntervals.has(k)) {
    clearInterval(makunatNickIntervals.get(k));
    makunatNickIntervals.delete(k);
  }
}

// ============== 🧱 GC NAME — WALANG TITIGIL! ✅ ==============
function startMakunatGcName(api, threadID) {
  stopMakunatGcName(threadID);
  const data = loadGCData(threadID);
  if (!data.active || !data.autoGname) return;
  
  const tid = String(threadID);
  makunatGcNameIntervals.set(tid, setInterval(async () => {
    const current = loadGCData(threadID);
    if (!current.active || !current.autoGname) {
      stopMakunatGcName(tid);
      return;
    }
    // ✅ WALANG PAGTINGIN SA SILENT — TULOY LANG!
    let info;
    try { info = await api.getThreadInfo(threadID); }
    catch { return; }
    
    const currentName = info?.threadName || "";
    if (currentName !== current.savedGname) {
      const ok = await restoreGroupName(api, threadID, current);
      // ✅ ABISO — GUMAGANA KAHIT SILENT!
      if (ok) {
        await send(api, `
🧱 MAY NAGPALIT — IBINALIK AGAD!
🔒「${current.savedGname}」
        `.trim(), threadID);
      }
    }
  }, COOLDOWNS.GC_CHECK_INTERVAL));
}

function stopMakunatGcName(threadID) {
  const k = String(threadID);
  if (makunatGcNameIntervals.has(k)) {
    clearInterval(makunatGcNameIntervals.get(k));
    makunatGcNameIntervals.delete(k);
  }
}

// ============== 💪 HEARTBEAT — GUMAGANA KAHIT SILENT! ✅ ==============
function startHeartbeat(api, threadID) {
  stopHeartbeat(threadID);
  const data = loadGCData(threadID);
  if (!data.active) return;
  
  const tid = String(threadID);
  heartbeatIntervals.set(tid, setInterval(async () => {
    const current = loadGCData(threadID);
    if (!current.active) { stopHeartbeat(tid); return; }
    // ✅ WALANG "if silent" — TULOY LANG!
    
    const msg = ALIVE_LINES[current.heartbeatIndex % ALIVE_LINES.length];
    current.heartbeatIndex++;
    saveGCData(threadID, current);
    
    const sent = await send(api, msg, threadID);
    if (sent?.messageID && current.heartbeatReact) {
      await react(api, pickRandom(HEARTBEAT_EMOJIS), sent.messageID);
    }
  }, COOLDOWNS.HEARTBEAT));
}

function stopHeartbeat(threadID) {
  const k = String(threadID);
  if (heartbeatIntervals.has(k)) {
    clearInterval(heartbeatIntervals.get(k));
    heartbeatIntervals.delete(k);
  }
}

// ============== 📩 HANDLE EVENT — LAHAT GUMAGANA KAHIT SILENT! ✅ ==============
module.exports.handleEvent = async ({ api, event }) => {
  if (!event) return;
  const { threadID, senderID, body, logMessageType } = event;
  if (!threadID) return;
  
  const gcData = loadGCData(threadID);
  if (!gcData.active) return;

  // ✅ BAGONG SUMALI — WELCOME GUMAGANA KAHIT SILENT!
  if (logMessageType === "log:subscribe") {
    const newMembers = event.logMessageData?.addedParticipants || [];
    if (!newMembers.length) return;
    const botID = String(await api.getCurrentUserID?.() || "");
    
    for (const m of newMembers) {
      const uid = String(m.userFbId || m.id || "");
      if (!uid || uid === botID) continue;
      
      if (gcData.autoNick) {
        await setNickname(api, threadID, uid, gcData.savedNick);
        await sleep(COOLDOWNS.NICK_DELAY);
      }
      
      // ✅ WELCOME — GUMAGANA KAHIT SILENT!
      if (gcData.autoWelcome) {
        let name = "Bagong Miyembro";
        try {
          const info = await api.getUserInfo(uid);
          if (info?.[uid]) name = info[uid].name;
        } catch {}
        const text = gcData.welcomeMsg.replaceAll("{username}", name);
        await send(api, text, threadID);
      }
    }
    return;
  }

  // ✅ CHAT REPLY — GUMAGANA KAHIT SILENT! WALANG TITIGIL!
  if (!senderID || !body) return;
  try { if (String(senderID) === String(await api.getCurrentUserID?.() || "")) return; } catch {}
  const text = String(body).trim();
  if (!text || text.startsWith("/") || text.startsWith("!")) return;
  
  if (!gcData.roast || processing.has(String(threadID))) return;
  if (!cooldownReady(roastCooldown, threadID, COOLDOWNS.ROAST)) return;
  
  processing.add(String(threadID));
  try {
    const sent = await send(api, pickRandom(ROASTS), threadID);
    if (sent?.messageID && gcData.react) {
      await react(api, pickRandom(EMOJIS), sent.messageID);
    }
    gcData.roastCount++;
    saveGCData(threadID, gcData);
  } finally {
    processing.delete(String(threadID));
  }
};

// ============== 👑 MGA UTOS ==============
module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;
  const cmd = String(args?.[0] || "help").toLowerCase();
  
  const adminCmds = ["on","off","silent","unsilent","restore","setnick","autonick","setgname","autogname","roast","react","heartreact","autowelcome","setwelcome","status"];
  if (adminCmds.includes(cmd) && !isAdmin(senderID)) {
    return send(api, "🔒 BAWAL — hindi pinagkatiwalaan!", threadID, messageID);
  }
  
  if (!cooldownReady(commandCooldown, senderID, COOLDOWNS.COMMAND)) return;
  
  let gcData = loadGCData(threadID);
  gcData.commandCount++;
  saveGCData(threadID, gcData);

  // ⚡ BUKASAN
  if (cmd === "on") {
    gcData.active = true;
    gcData.silent = false;
    gcData.activatedBy = senderID;
    gcData.activatedAt = Date.now();
    gcData.lastFullNickApply = 0;
    saveGCData(threadID, gcData);
    
    startHeartbeat(api, threadID);
    startMakunatNick(api, threadID);
    startMakunatGcName(api, threadID);
    
    await send(api, "🧱 MAKUNAT MODE — BUKAS NA! LAHAT GUMAGANA!", threadID);
    const res = await applyNickToAll(api, threadID, gcData.savedNick);
    
    return send(api, `
👑「MAKUNAT MODE」— NAKABUKAS NA! 🧱

✅ TUWING 10S → PALIT NICK SA LAHAT
✅ TUWING 5S → IBALIK GC NAME
✅ HEARTBEAT → GUMAGANA PALAGI
✅ WELCOME → GUMAGANA PALAGI
✅ CHAT REPLY → GUMAGANA PALAGI
✅ /silent → WALANG TITIGIL — LAHAT GUMAGANA PA RIN!

Tagumpay: ${res.success} | Nabigo: ${res.failed}
💡 /silent — walang babago / /unsilent — pareho lang
    `.trim(), threadID, messageID);
  }

  // 🔴 PATAYIN
  if (cmd === "off") {
    gcData.active = false;
    gcData.silent = false;
    saveGCData(threadID, gcData);
    
    stopHeartbeat(threadID);
    stopMakunatNick(threadID);
    stopMakunatGcName(threadID);
    
    return send(api, "🔴「MAKUNAT MODE」— TUMIGIL NA!", threadID, messageID);
  }

  // 🤫 SILENT — WALANG BABAGO! ✅
  if (cmd === "silent") {
    if (!gcData.active) return send(api, "⚠️ /ryuk on muna!", threadID, messageID);
    if (gcData.silent) return send(api, `
🤫 Naka-SILENT na!
✅ WALANG TUMIGIL — LAHAT GUMAGANA PA RIN!
🧱 TUWING 10S → PALIT NICK SA LAHAT ✅
🧱 TUWING 5S → IBALIK GC NAME ✅
💓 HEARTBEAT → GUMAGANA ✅
👋 WELCOME → GUMAGANA ✅
💬 CHAT REPLY → GUMAGANA ✅
💡 /unsilent — pareho lang
    `.trim(), threadID, messageID);
    
    gcData.silent = true;
    saveGCData(threadID, gcData);
    return send(api, `
🤫「SILENT MODE」— WALANG PAGBABAGO! ✅

✅ LAHAT AY GUMAGANA PA RIN:
   🧱 TUWING 10S → PALIT NICK SA LAHAT
   🧱 TUWING 5S → IBALIK GC NAME
   💓 HEARTBEAT → TULUY-TULOY
   👋 WELCOME → TULUY-TULOY
   💬 CHAT REPLY → TULUY-TULOY
💡 /unsilent — pareho lang
    `.trim(), threadID, messageID);
  }

  // 🔊 UNSILENT
  if (cmd === "unsilent") {
    gcData.silent = false;
    saveGCData(threadID, gcData);
    return send(api, "🔊「NORMAL MODE」— WALANG PAGBABAGO! LAHAT GUMAGANA! ✅", threadID, messageID);
  }

  // 🔒 RESTORE
  if (cmd === "restore") {
    gcData.lastFullNickApply = 0;
    saveGCData(threadID, gcData);
    const gOk = await restoreGroupName(api, threadID, gcData);
    const nRes = await applyNickToAll(api, threadID, gcData.savedNick);
    return send(api, `🧱 IBINALIK!\nGC: ${gOk ? "✅" : "❌"}\nNick: ${nRes.success}`, threadID, messageID);
  }

  // ✅ SETNICK
  if (cmd === "setnick") {
    const nick = args.slice(1).join(" ").trim() || "RYUK BOSS";
    gcData.savedNick = nick;
    gcData.lastFullNickApply = 0;
    saveGCData(threadID, gcData);
    const res = await applyNickToAll(api, threadID, nick);
    return send(api, `✅ PALAYAW:「${nick}」\nTagumpay: ${res.success}`, threadID, messageID);
  }

  // ✅ SETGNAME
  if (cmd === "setgname") {
    const name = args.slice(1).join(" ").trim() || "👑 GOJO BOSS 👑";
    gcData.savedGname = name;
    saveGCData(threadID, gcData);
    await restoreGroupName(api, threadID, gcData);
    return send(api, `✅ GC NAME:「${name}」`, threadID, messageID);
  }

  // ✅ AUTONICK
  if (cmd === "autonick") {
    const m = String(args?.[1] || "").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/ryuk autonick on/off", threadID, messageID);
    gcData.autoNick = m === "on";
    m === "on" ? startMakunatNick(api, threadID) : stopMakunatNick(threadID);
    saveGCData(threadID, gcData);
    return send(api, `🧱 Auto-Nick: ${m.toUpperCase()} — TUWING 10S!`, threadID, messageID);
  }

  // ✅ AUTOGNAME
  if (cmd === "autogname") {
    const m = String(args?.[1] || "").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/ryuk autogname on/off", threadID, messageID);
    gcData.autoGname = m === "on";
    m === "on" ? startMakunatGcName(api, threadID) : stopMakunatGcName(threadID);
    saveGCData(threadID, gcData);
    return send(api, `🧱 Auto-GC Name: ${m.toUpperCase()} — TUWING 5S!`, threadID, messageID);
  }

  // ✅ AUTOWELCOME
  if (cmd === "autowelcome") {
    const m = String(args?.[1] || "").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/ryuk autowelcome on/off", threadID, messageID);
    gcData.autoWelcome = m === "on";
    saveGCData(threadID, gcData);
    return send(api, `👑 Auto-Welcome: ${m === "on" ? "ON ✅" : "OFF ❌"}`, threadID, messageID);
  }

  // ✅ SETWELCOME
  if (cmd === "setwelcome") {
    const msg = args.slice(1).join(" ").trim();
    if (!msg) return send(api, "Gamitin: /ryuk setwelcome @{username} — mensahe", threadID, messageID);
    gcData.welcomeMsg = msg;
    saveGCData(threadID, gcData);
    return send(api, `✅ Mensahe:\n${msg}`, threadID, messageID);
  }

  // ✅ ROAST
  if (cmd === "roast") {
    const m = String(args?.[1] || "").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/ryuk roast on/off", threadID, messageID);
    gcData.roast = m === "on";
    saveGCData(threadID, gcData);
    return send(api, `🔥 Auto-Reply: ${m.toUpperCase()}`, threadID, messageID);
  }

  // ✅ REACT
  if (cmd === "react") {
    const m = String(args?.[1] || "").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/ryuk react on/off", threadID, messageID);
    gcData.react = m === "on";
    saveGCData(threadID, gcData);
    return send(api, `✨ Reaksyon: ${m.toUpperCase()}`, threadID, messageID);
  }

  // ✅ HEARTREACT
  if (cmd === "heartreact") {
    const m = String(args?.[1] || "").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/ryuk heartreact on/off", threadID, messageID);
    gcData.heartbeatReact = m === "on";
    saveGCData(threadID, gcData);
    return send(api, `💪 Heartbeat React: ${m.toUpperCase()}`, threadID, messageID);
  }

  // ✅ STATUS
  if (cmd === "status") {
    return send(api, `
🧱 KALAGAYAN — WALANG TITIGIL!

Sistema:     ${gcData.active ? "NAKABUKAS 🟢" : "NAKASARA 🔴"}
Silent Mode: ${gcData.silent ? "AKTIBO 🤫 — LAHAT GUMAGANA!" : "NORMAL 🔊"}
Auto-Nick:   ${gcData.autoNick ? "TUWING 10S ✅" : "OFF ❌"}
GC Protek:   ${gcData.autoGname ? "TUWING 5S ✅" : "OFF ❌"}
Heartbeat:   ✅ GUMAGANA PALAGI
Welcome:     ✅ GUMAGANA PALAGI
Chat Reply:  ✅ GUMAGANA PALAGI
    `.trim(), threadID, messageID);
  }

  return send(api, `
👑 MGA UTOS:

/ryuk on     → Buksan — LAHAT GUMAGANA
/ryuk off    → Patayin
/silent      → 🤫 WALANG BABAGO — LAHAT GUMAGANA PA RIN!
/unsilent    → 🔊 Pareho lang
/ryuk status → Tignan kalagayan
    `.trim(), threadID, messageID);
};
  
