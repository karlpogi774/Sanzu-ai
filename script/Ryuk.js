// ==========================================================
// 👑 RYUK BOSS — GC-SPECIFIC + SILENT FIXED V19.2 ✨
// ✅ /silent = TAHIMIK LANG — HINDI TUMITIGIL! BANTAY PA RIN!
// ✅ SA GC NA IN-ON KA LANG GAGANA — HINDI SA LAHAT!
// AUTO-NICK: RYUK BOSS | AUTO-WELCOME | GC PROTECTION
// 🔒 4 ADMIN PROTECTED — WALANG MAKAKAGAMBALA!
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817 ✅
// ==========================================================

const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "ryuk",
  version: "19.2.0",
  hasPermission: 0,
  credits: "👑 RYUK BOSS — SILENT = TAHIMIK HINDI PATAY",
  description: "/silent = tahimik lang / /unsilent = magsalita ulit",
  usePrefix: true,
  commandCategory: "👑 RYUK BOSS",
  usages: "/silent | /unsilent",
  cooldowns: 2
};

// ============== 🔒 MGA PINAGKATIWALAAN — WALANG TATAPAT 🔒 ==============
const ADMIN_IDS = Object.freeze([
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
]);

const DATA_FILE = path.join(__dirname, "ryuk_king_data.json");

// ============== ⚡ DEFAULT — BAWAT GC MAY SARILING ESTADO ==============
const DEFAULT_GC_DATA = Object.freeze({
  active: false,
  silent: false, // ✅ SILENT = TAHIMIK LANG — HINDI PATAY!
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
  lastNickUpdate: 0
});

// ============== ⚡ MGA PAGKAKATINIG NG ORAS ==============
const COOLDOWNS = Object.freeze({
  ROAST: 8000,
  COMMAND: 2500,
  JOIN: 3000,
  HEARTBEAT: 20000,
  MONITOR: 5000,
  NICK_DELAY: 1000,
  RESTORE_GNAME: 10000
});

// ============== 🔄 MGA TAGAPAG-INGAT — BAWAT GC MAY SARILING ==============
const processing = new Set();
const roastCooldown = new Map();
const commandCooldown = new Map();
const welcomedUsers = new Set();
const heartbeatIntervals = new Map();
const monitorIntervals = new Map();
const threadLocks = new Map();

// ============== ✨ MGA SALITA NG PAGPAPAKILALA ==============
const ALIVE_LINES = Object.freeze([
  "⚡ Nandito pa rin ako — hindi hihinto hangga't hindi mo sinasabing huminto.",
  "🔥 Kahit tahimik, nandito lang ako — nagbabantay pa rin.",
  "👑 Handa ako sa bawat utos mo — dito sa GC na ito lang ako sumusunod.",
  "✨ Ikaw lang ang aking sundin — sabihin mo lang /unsilent para magsalita.",
  "💪 Nagbabantay pa rin ako — /unsilent para bumalik.",
  "👑 Dito lang ako — kahit tahimik, hindi aalis."
]);

const HEARTBEAT_EMOJIS = ["🔥", "⚡", "💪", "👑", "✨"];
const ROASTS = Object.freeze([
  "💀 Grabe yung lakas ng loob mag-send dito...",
  "🤣 Anong sinabi mo? Ulitin mo nga, hindi ko narinig...",
  "👑 RYUK — GOJO BOSS ⚡",
  "😂 Tapos ka na ba? Wala kang tatalo dito sa GC...",
  "🔥 Subukan mo pa — hindi ka mananalo sa akin dito."
]);
const EMOJIS = ["🔥", "💀", "🤣", "😆", "👑", "✨"];

// ============== 📂 TALAAN — BAWAT GC MAY SARILING DATA ==============
function loadAllData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, "{}", "utf8");
      return {};
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (err) {
    console.error("[👑 RYUK] ⚠️ Load error:", err?.message);
    return {};
  }
}

function saveAllData(allData) {
  try {
    const temp = `${DATA_FILE}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(allData, null, 2), "utf8");
    fs.renameSync(temp, DATA_FILE);
    return true;
  } catch (err) {
    console.error("[👑 RYUK] ⚠️ Save error:", err?.message);
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

// ============== 🛡️ MGA TULONG NA GAWAIN ==============
const isAdmin = (id) => ADMIN_IDS.includes(String(id));
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function cooldownReady(map, key, duration) {
  const now = Date.now();
  const k = String(key);
  const lastUsed = map.get(k) || 0;
  if (now - lastUsed < duration) return false;
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

// ============== ✨ PALIT NG PALAYAW — LAHAT NG PARAAN ==============
async function setNickname(api, threadID, userID, newNick) {
  const methods = [
    async () => { await api.changeNickname?.(threadID, newNick, userID); },
    async () => { await api.changeNickname?.(newNick, threadID, userID); },
    async () => { await api.setNickname?.(threadID, newNick, userID); },
    async () => { await api.setNickname?.(newNick, threadID, userID); }
  ];
  for (let idx = 0; idx < methods.length; idx++) {
    try { await methods[idx](); return true; }
    catch { console.log(`[👑 RYUK] ⚠️ Paraan ${idx + 1} nabigo`); }
  }
  return false;
}

// ============== 👑 ILAGAY ANG RYUK BOSS — DITO SA GC LANG ==============
async function applyNickToAll(api, threadID, nickname = "RYUK BOSS") {
  const lockKey = `nick_${threadID}`;
  if (threadLocks.get(lockKey)) return { success: 0, failed: 0 };
  threadLocks.set(lockKey, true);
  let threadInfo;
  try { threadInfo = await api.getThreadInfo(threadID); }
  catch { threadLocks.delete(lockKey); return { success: 0, failed: 0 }; }
  const members = threadInfo?.participantIDs || [];
  const botID = String(await api.getCurrentUserID?.() || "");
  let success = 0, failed = 0;
  for (const memberID of members) {
    if (String(memberID) === botID) continue;
    const ok = await setNickname(api, threadID, memberID, nickname);
    ok ? success++ : failed++;
    await sleep(COOLDOWNS.NICK_DELAY);
  }
  threadLocks.delete(lockKey);
  return { success, failed };
}

// ============== 🔒 IBALIK ANG PANGALAN NG GC ==============
async function restoreGroupName(api, threadID, gcData) {
  if (!gcData.savedGname) return false;
  const now = Date.now();
  if (now - (gcData.lastRestoreGname || 0) < COOLDOWNS.RESTORE_GNAME) return false;
  let ok = false;
  if (typeof api.setTitle === "function") {
    try { await api.setTitle(gcData.savedGname, threadID); ok = true; }
    catch {}
  }
  if (ok) { gcData.lastRestoreGname = now; saveGCData(threadID, gcData); }
  return ok;
}

// ============== 👁️ BANTAY — TULUY-TULOY KAHIT SILENT! ✅ ==============
function startGroupMonitor(api, threadID) {
  stopGroupMonitor(threadID);
  const gcData = loadGCData(threadID);
  if (!gcData.active) return;
  const tid = String(threadID);
  monitorIntervals.set(tid, setInterval(async () => {
    const currentData = loadGCData(threadID);
    if (!currentData.active) { stopGroupMonitor(tid); return; }
    let info;
    try { info = await api.getThreadInfo(threadID); } catch { return; }
    const currentName = info?.threadName || "";
    if (currentData.autoGname && currentData.savedGname && currentName !== currentData.savedGname) {
      const restored = await restoreGroupName(api, threadID, currentData);
      if (restored && !currentData.silent) {
        await send(api, `
⚠️ MAY NAGPALIT NG PANGALAN DITO SA GC!
🔒 IBINALIK AGAD SA:
「${currentData.savedGname}」
        `.trim(), threadID);
      }
    }
  }, COOLDOWNS.MONITOR));
}

function stopGroupMonitor(threadID) {
  const key = String(threadID);
  if (monitorIntervals.has(key)) { clearInterval(monitorIntervals.get(key)); monitorIntervals.delete(key); }
}

// ============== 💪 HEARTBEAT — TUMITIGIL LANG NG PAGPAPADALA KAPAG SILENT ==============
function startHeartbeat(api, threadID) {
  stopHeartbeat(threadID);
  const gcData = loadGCData(threadID);
  if (!gcData.active) return;
  const tid = String(threadID);
  heartbeatIntervals.set(tid, setInterval(async () => {
    const data = loadGCData(threadID);
    if (!data.active) { stopHeartbeat(tid); return; }
    if (data.silent) return; // ✅ HINDI MAGPAPADALA PERO HINDI TUMITIGIL
    const message = ALIVE_LINES[data.heartbeatIndex % ALIVE_LINES.length];
    data.heartbeatIndex++;
    saveGCData(threadID, data);
    const sent = await send(api, message, threadID);
    if (sent?.messageID && data.heartbeatReact) {
      await react(api, pickRandom(HEARTBEAT_EMOJIS), sent.messageID);
    }
  }, COOLDOWNS.HEARTBEAT));
}

function stopHeartbeat(threadID) {
  const key = String(threadID);
  if (heartbeatIntervals.has(key)) { clearInterval(heartbeatIntervals.get(key)); heartbeatIntervals.delete(key); }
}

// ============== 📩 PAGTUGON — SILENT = TAHIMIK LANG ==============
module.exports.handleEvent = async ({ api, event }) => {
  if (!event) return;
  const { threadID, senderID, body, logMessageType } = event;
  if (!threadID) return;
  const gcData = loadGCData(threadID);
  if (!gcData.active) return;

  // ✨ BAGONG SUMALI — IBABALIK ANG NICKNAME KAHIT SILENT!
  if (logMessageType === "log:subscribe") {
    const newMembers = event.logMessageData?.addedParticipants || [];
    if (!newMembers.length) return;
    const botID = String(await api.getCurrentUserID?.() || "");
    for (const member of newMembers) {
      const newUserID = String(member.userFbId || member.id || "");
      if (!newUserID || newUserID === botID) continue;
      const welcomeKey = `${threadID}_${newUserID}`;
      if (welcomedUsers.has(welcomeKey)) continue;
      welcomedUsers.add(welcomeKey);
      let displayName = "Bagong Kaibigan";
      try {
        const userInfo = await api.getUserInfo(newUserID);
        if (userInfo?.[newUserID]) displayName = userInfo[newUserID].name;
      } catch {}
      
      // ✅ KAHIT SILENT — PALITAN PA RIN ANG NICKNAME!
      if (gcData.autoNick) {
        await setNickname(api, threadID, newUserID, "RYUK BOSS");
        await sleep(COOLDOWNS.NICK_DELAY);
      }
      
      // ✅ WELCOME MESSAGE LANG ANG HINDI MAGPAPADALA KUNG SILENT
      if (!gcData.silent && gcData.autoWelcome && gcData.welcomeMsg) {
        const welcomeText = gcData.welcomeMsg.replaceAll("{username}", displayName);
        await send(api, welcomeText, threadID);
      }
    }
    return;
  }

  // 🔒 MAY NAGPALIT NG GC NAME — IBABALIK PA RIN KAHIT SILENT!
  if (logMessageType === "log:thread-name") {
    if (!gcData.autoGname || !gcData.savedGname) return;
    const newGroupName = event.logMessageData?.name || "";
    if (newGroupName !== gcData.savedGname) {
      await sleep(1000);
      const ok = await restoreGroupName(api, threadID, gcData);
      // ✅ IBINALIK PERO HINDI MAGPAPADALA NG MENSAHE KUNG SILENT
      if (ok && !gcData.silent) {
        await send(api, `
⚠️ Pinalitan ang pangalan dito!
🔒 IBINALIK AGAD SA:
「${gcData.savedGname}」
        `.trim(), threadID);
      }
    }
    return;
  }

  // 🔥 SAGOT SA MENSAHE — HINDI SASAGOT KUNG SILENT
  if (!senderID || !body) return;
  try { if (String(senderID) === String(await api.getCurrentUserID?.() || "")) return; } catch {}
  const text = String(body).trim();
  if (!text || text.startsWith("/") || text.startsWith("!")) return;
  
  // ✅ KUNG SILENT — HINDI SASAGOT SA CHAT
  if (gcData.silent) return;
  
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
  } finally { processing.delete(String(threadID)); }
};

// ============== 👑 MGA UTOS — KASAMA /silent at /unsilent ==============
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

  // ⚡ BUKSAN — DITO SA GC NA ITO LANG!
  if (cmd === "on") {
    gcData.active = true; gcData.silent = false;
    gcData.activatedBy = senderID; gcData.activatedAt = Date.now();
    saveGCData(threadID, gcData);
    startHeartbeat(api, threadID); startGroupMonitor(api, threadID);
    await restoreGroupName(api, threadID, gcData);
    await send(api, "⏳ Inilalagay ang「RYUK BOSS」sa lahat dito...", threadID);
    const result = await applyNickToAll(api, threadID, "RYUK BOSS");
    return send(api, `
👑「RYUK BOSS」— NAKABUKAS NA DITO SA GC! ⚡

✅ Estado: NORMAL 🔊
✅ Auto-Welcome: ${gcData.autoWelcome ? "ON ✅" : "OFF ❌"}
✅ Palayaw: RYUK BOSS — Tagumpay: ${result.success} | Nabigo: ${result.failed}
💡 /silent = tahimik lang — nagbabantay pa rin!
   /unsilent = magsalita ulit
    `.trim(), threadID, messageID);
  }

  // 🔴 ISARA — TALAGANG TUMITIGIL LAHAT
  if (cmd === "off") {
    gcData.active = false; gcData.silent = false;
    saveGCData(threadID, gcData);
    stopHeartbeat(threadID); stopGroupMonitor(threadID);
    return send(api, "🔴「RYUK BOSS」— TUMIGIL NA TALAGA DITO!", threadID, messageID);
  }

  // 🤫 SILENT — TAHIMIK LANG — BANTAY PA RIN! ✅
  if (cmd === "silent") {
    if (!gcData.active) return send(api, "⚠️ /ryuk on muna!", threadID, messageID);
    if (gcData.silent) return send(api, `
🤫 Naka-SILENT na ako!
✅ TAHIMIK LANG — HINDI PATAY!
🔒 Binabantayan ko pa rin ang GC pangalan
⚡ Binabago ko pa rin ang palayaw ng bago
❌ HINDI magpapadala ng mensahe
💡 /unsilent para magsalita ulit
    `.trim(), threadID, messageID);
    gcData.silent = true;
    saveGCData(threadID, gcData);
    return send(api, `
🤫「SILENT MODE」— NAKABUKAS NA! ✅

✅ TULUY-TULOY PA RIN:
   🔒 Pagbabantay at pagbalik ng pangalan ng GC
   ⚡ Pagpapalit ng palayaw sa bagong sasali
❌ HINDI NA MAGPAPADALA:
   • Auto-sagot sa chat • Heartbeat • Welcome
💡 /unsilent para bumalik sa pagsasalita
    `.trim(), threadID, messageID);
  }

  // 🔊 UNSILENT — BUMALIK SA PAGSASALITA
  if (cmd === "unsilent") {
    if (!gcData.silent) return send(api, "🔊 Nagsasalita na ako!", threadID, messageID);
    gcData.silent = false;
    saveGCData(threadID, gcData);
    return send(api, "🔊「NORMAL MODE」— BUMALIK NA! ✅", threadID, messageID);
  }

  // 🔒 IBA PANG UTOS...
  if (cmd === "restore") {
    const gOk = await restoreGroupName(api, threadID, gcData);
    const nRes = await applyNickToAll(api, threadID, gcData.savedNick);
    return send(api, `🔒 IBINALIK!\nGC: ${gOk ? "✅" : "❌"}\nPalayaw: ${nRes.success}`, threadID, messageID);
  }

  if (cmd === "setnick") {
    const nick = args.slice(1).join(" ").trim() || "RYUK BOSS";
    gcData.savedNick = nick; saveGCData(threadID, gcData);
    const res = await applyNickToAll(api, threadID, nick);
    return send(api, `✅ PALAYAW:「${nick}」\nTagumpay: ${res.success}`, threadID, messageID);
  }

  if (cmd === "setgname") {
    const name = args.slice(1).join(" ").trim() || "👑 GOJO BOSS 👑";
    gcData.savedGname = name; saveGCData(threadID, gcData);
    await restoreGroupName(api, threadID, gcData);
    return send(api, `✅ GC Pangalan:「${name}」`, threadID, messageID);
  }

  if (cmd === "autonick") {
    const m = String(args?.[1] || "").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/ryuk autonick on/off", threadID, messageID);
    gcData.autoNick = m === "on"; saveGCData(threadID, gcData);
    return send(api, `⚡ Auto-Nick: ${m.toUpperCase()}`, threadID, messageID);
  }

  if (cmd === "autogname") {
    const m = String(args?.[1] || "").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/ryuk autogname on/off", threadID, messageID);
    gcData.autoGname = m === "on"; saveGCData(threadID, gcData);
    return send(api, `🔒 Auto-GC Name: ${m.toUpperCase()}`, threadID, messageID);
  }

  if (cmd === "autowelcome") {
    const m = String(args?.[1] || "").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/ryuk autowelcome on/off", threadID, messageID);
    gcData.autoWelcome = m === "on"; saveGCData(threadID, gcData);
    return send(api, `👑 Auto-Welcome: ${m === "on" ? "ON ✅" : "OFF ❌"}`, threadID, messageID);
  }

  if (cmd === "setwelcome") {
    const msg = args.slice(1).join(" ").trim();
    if (!msg) return send(api, "Gamitin: /ryuk setwelcome @{username} — mensahe", threadID, messageID);
    gcData.welcomeMsg = msg; saveGCData(threadID, gcData);
    return send(api, `✅ Mensahe:\n${msg}`, threadID, messageID);
  }

  if (cmd === "roast") {
    const m = String(args?.[1] || "").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/ryuk roast on/off", threadID, messageID);
    gcData.roast = m === "on"; saveGCData(threadID, gcData);
    return send(api, `🔥 Auto-Reply: ${m.toUpperCase()}`, threadID, messageID);
  }

  if (cmd === "react") {
    const m = String(args?.[1] || "").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/ryuk react on/off", threadID, messageID);
    gcData.react = m === "on"; saveGCData(threadID, gcData);
    return send(api, `✨ Reaksyon: ${m.toUpperCase()}`, threadID, messageID);
  }

  if (cmd === "heartreact") {
    const m = String(args?.[1] || "").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/ryuk heartreact on/off", threadID, messageID);
    gcData.heartbeatReact = m === "on"; saveGCData(threadID, gcData);
    return send(api, `💪 Heartbeat React: ${m.toUpperCase()}`, threadID, messageID);
  }

  if (cmd === "status") {
    return send(api, `
👑 KALAGAYAN NG GC

Sistema:     ${gcData.active ? "NAKABUKAS 🟢" : "NAKASARA 🔴"}
Silent Mode: ${gcData.silent ? "TAHIMIK 🤫 — nagbabantay pa rin!" : "NORMAL 🔊"}
Auto-Welcome:${gcData.autoWelcome ? "ON ✅" : "OFF ❌"}
Auto-Nick:   ${gcData.autoNick ? "ON ✅" : "OFF ❌"}
GC Protek:   ${gcData.autoGname ? "ON 🔒" : "OFF ❌"}
Auto-Reply:  ${gcData.roast ? "ON ✅" : "OFF ❌"}
    `.trim(), threadID, messageID);
  }

  return send(api, `
👑 MGA UTOS:

/ryuk on     → Buksan
/ryuk off    → Patayin
/silent      → 🤫 Tahimik — BANTAY PA RIN
/unsilent    → 🔊 Magsalita ulit
/ryuk status → Tignan kalagayan
    `.trim(), threadID, messageID);
};
  
