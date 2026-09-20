// ==========================================================
// 👑 RYUK BOSS — LUMALAPAG PA RIN KAHIT WALANG BAGO! V20 ✨
// ✅ KAHIT WALANG SUMASALI — LUMALAPAG PA RIN SA LAHAT!
// ✅ SILENT = TAHIMIK LANG — HINDI PATAY, HINDI TITIGIL!
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817 ✅
// ==========================================================

const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "ryuk",
  version: "20.0.0",
  hasPermission: 0,
  credits: "👑 RYUK BOSS — LUMALAPAG KAHIT WALANG BAGO",
  description: "/silent = tahimik lang / /unsilent = magsalita ulit",
  usePrefix: true,
  commandCategory: "👑 RYUK BOSS",
  usages: "/silent | /unsilent",
  cooldowns: 2
};

// ============== 🔒 MGA PINAGKATIWALAAN 🔒 ==============
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
  autoRefreshNick: true,
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
  lastNickUpdate: 0,
  lastFullRefresh: 0
});

// ============== ⚡ ORAS NG PAGKAKATAON ==============
const COOLDOWNS = Object.freeze({
  ROAST: 8000,
  COMMAND: 2500,
  JOIN: 3000,
  HEARTBEAT: 20000,
  MONITOR: 5000,
  NICK_DELAY: 1000,
  RESTORE_GNAME: 10000,
  FULL_REFRESH: 45000
});
// ============== 🔄 MGA TAGAPAG-INGAT ==============
const processing = new Set();
const roastCooldown = new Map();
const commandCooldown = new Map();
const welcomedUsers = new Set();
const heartbeatIntervals = new Map();
const monitorIntervals = new Map();
const refreshIntervals = new Map();
const threadLocks = new Map();

// ============== ✨ MGA SALITA ==============
const ALIVE_LINES = Object.freeze([
  "⚡ Nandito pa rin ako — hindi hihinto hangga't hindi mo sinasabing huminto.",
  "🔥 Kahit tahimik, nandito lang ako — nagbabantay at lumalapag pa rin.",
  "👑 Handa ako sa bawat utos mo — palitan ko palagi ang palayaw ninyo.",
  "✨ Ikaw lang ang aking sundin — sabihin mo lang /unsilent para magsalita.",
  "💪 Kahit walang bago — pinapanatili ko ang RYUK BOSS sa lahat!",
  "👑 Dito lang ako — hindi titigil sa paglalagay ng palayaw!"
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

// ============== 📂 TALAAN ==============
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

// ============== 🛡️ MGA TULONG ==============
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
// ============== ✨ PALIT NG PALAYAW ==============
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

// ============== 👑 ILAGAY SA LAHAT ==============
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

// ============== 🔄 BAGONG — LUMALAPAG SA LAHAT KAHIT WALANG BAGO! ✅ ==============
function startNickRefresh(api, threadID) {
  stopNickRefresh(threadID);
  const gcData = loadGCData(threadID);
  if (!gcData.active || !gcData.autoRefreshNick) return;
  const tid = String(threadID);
  
  (async () => {
    const data = loadGCData(threadID);
    if (!data.active || !data.autoRefreshNick) return;
    await applyNickToAll(api, threadID, data.savedNick);
    data.lastFullRefresh = Date.now();
    saveGCData(threadID, data);
  })();
  
  refreshIntervals.set(tid, setInterval(async () => {
    const data = loadGCData(threadID);
    if (!data.active || !data.autoRefreshNick) { stopNickRefresh(tid); return; }
    
    const now = Date.now();
    if (now - (data.lastFullRefresh || 0) < COOLDOWNS.FULL_REFRESH) return;
    
    await applyNickToAll(api, threadID, data.savedNick);
    data.lastFullRefresh = now;
    saveGCData(threadID, data);
    
    if (!data.silent) {
      if ((data.lastFullRefresh / COOLDOWNS.FULL_REFRESH) % 3 === 0) {
        await send(api, "⚡ Napanatili ang「RYUK BOSS」sa lahat!", threadID);
      }
    }
  }, COOLDOWNS.FULL_REFRESH));
}

function stopNickRefresh(threadID) {
  const key = String(threadID);
  if (refreshIntervals.has(key)) { clearInterval(refreshIntervals.get(key)); refreshIntervals.delete(key); }
                                                      }
               // ============== 👁️ BANTAY NG GC ==============
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

// ============== 💪 HEARTBEAT ==============
function startHeartbeat(api, threadID) {
  stopHeartbeat(threadID);
  const gcData = loadGCData(threadID);
  if (!gcData.active) return;
  const tid = String(threadID);
  heartbeatIntervals.set(tid, setInterval(async () => {
    const data = loadGCData(threadID);
    if (!data.active) { stopHeartbeat(tid); return; }
    if (data.silent) return;
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

// ============== 📩 PAGTUGON SA MENSAHE ==============
module.exports.handleEvent = async ({ api, event }) => {
  if (!event) return;
  const { threadID, senderID, body, logMessageType } = event;
  if (!threadID) return;
  const gcData = loadGCData(threadID);
  if (!gcData.active) return;

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
      
      if (gcData.autoNick) {
        await setNickname(api, threadID, newUserID, gcData.savedNick);
        await sleep(COOLDOWNS.NICK_DELAY);
      }
      
      if (!gcData.silent && gcData.autoWelcome && gcData.welcomeMsg) {
        const welcomeText = gcData.welcomeMsg.replaceAll("{username}", displayName);
        await send(api, welcomeText, threadID);
      }
    }
    return;
  }

  if (logMessageType === "log:thread-name") {
    if (!gcData.autoGname || !gcData.savedGname) return;
    const newGroupName = event.logMessageData?.name || "";
    if (newGroupName !== gcData.savedGname) {
      await sleep(1000);
      const ok = await restoreGroupName(api, threadID, gcData);
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

  if (!senderID || !body) return;
  try { if (String(senderID) === String(await api.getCurrentUserID?.() || "")) return; } catch {}
  const text = String(body).trim();
  if (!text || text.startsWith("/") || text.startsWith("!")) return;
  
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
      // ============== 👑 MGA UTOS ==============
module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;
  const cmd = String(args?.[0] || "help").toLowerCase();
  const adminCmds = ["on","off","silent","unsilent","restore","setnick","autonick","autorefresh","setgname","autogname","roast","react","heartreact","autowelcome","setwelcome","status"];
  if (adminCmds.includes(cmd) && !isAdmin(senderID)) {
    return send(api, "🔒 BAWAL — hindi pinagkatiwalaan!", threadID, messageID);
  }
  if (!cooldownReady(commandCooldown, senderID, COOLDOWNS.COMMAND)) return;
  let gcData = loadGCData(threadID);
  gcData.commandCount++;
  saveGCData(threadID, gcData);

  if (cmd === "on") {
    gcData.active = true; gcData.silent = false;
    gcData.activatedBy = senderID; gcData.activatedAt = Date.now();
    saveGCData(threadID, gcData);
    startHeartbeat(api, threadID);
    startGroupMonitor(api, threadID);
    startNickRefresh(api, threadID);
    await restoreGroupName(api, threadID, gcData);
    await send(api, "⏳ Inilalagay ang「RYUK BOSS」sa lahat dito...", threadID);
    const result = await applyNickToAll(api, threadID, "RYUK BOSS");
    return send(api, `
👑「RYUK BOSS」— NAKABUKAS NA! LUMALAPAG PA RIN! ⚡

✅ Estado: NORMAL 🔊
✅ Auto-Welcome: ${gcData.autoWelcome ? "ON ✅" : "OFF ❌"}
✅ Auto-Refresh: LUMALAPAG SA LAHAT KAHIT WALANG BAGO! ✅
✅ Palayaw: RYUK BOSS — Tagumpay: ${result.success} | Nabigo: ${result.failed}
💡 /silent = tahimik lang — nagbabantay & lumalapag pa rin!
   /unsilent = magsalita ulit
    `.trim(), threadID, messageID);
  }

  if (cmd === "off") {
    gcData.active = false; gcData.silent = false;
    saveGCData(threadID, gcData);
    stopHeartbeat(threadID);
    stopGroupMonitor(threadID);
    stopNickRefresh(threadID);
    return send(api, "🔴「RYUK BOSS」— TUMIGIL NA TALAGA!", threadID, messageID);
  }

  if (cmd === "silent") {
    if (!gcData.active) return send(api, "⚠️ /ryuk on muna!", threadID, messageID);
    if (gcData.silent) return send(api, `
🤫 Naka-SILENT na ako!
✅ TAHIMIK LANG — HINDI PATAY! HINDI TUMITIGIL!
🔒 Binabantayan ko pa rin ang pangalan ng GC
⚡ LUMALAPAG PA RIN — PINAPALIT ANG PALAYAW SA LAHAT!
❌ HINDI magpapadala ng mensahe
💡 /unsilent para magsalita ulit
    `.trim(), threadID, messageID);
    gcData.silent = true;
    saveGCData(threadID, gcData);
    return send(api, `
🤫「SILENT MODE」— NAKABUKAS NA! ✅

✅ TULUY-TULOY PA RIN:
   🔒 Pagbabantay at pagbalik ng pangalan ng GC
   ⚡ LUMALAPAG SA LAHAT — PALIT NG PALAYAW BAWAT ORAS!
   ✅ Palitan ng palayaw sa bagong sasali
❌ HINDI NA MAGPAPADALA:
   • Auto-sagot • Heartbeat • Welcome
💡 /unsilent para bumalik sa pagsasalita
    `.trim(), threadID, messageID);
  }

  if (cmd === "unsilent") {
    if (!gcData.silent) return send(api, "🔊 Nagsasalita na ako!", threadID, messageID);
    gcData.silent = false;
    saveGCData(threadID, gcData);
    return send(api, "🔊「NORMAL MODE」— BUMALIK NA! ✅", threadID, messageID);
  }

  if (cmd === "autorefresh") {
    const m = String(args?.[1] || "").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/ryuk autorefresh on/off", threadID, messageID);
    gcData.autoRefreshNick = m === "on";
    saveGCData(threadID, gcData);
    if (gcData.active) {
      if (m === "on") startNickRefresh(api, threadID);
      else stopNickRefresh(threadID);
    }
    return send(api, `⚡ Auto-Refresh Palayaw: ${m.toUpperCase()}\n${m === "on" ? "✅ LUMALAPAG SA LAHAT BAWAT ORAS!" : "❌ Titigil sa pagpapalit sa lahat"}`, threadID, messageID);
  }

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
Silent Mode: ${gcData.silent ? "TAHIMIK 🤫 — LUMALAPAG PA RIN!" : "NORMAL 🔊"}
Auto-Refresh:${gcData.autoRefreshNick ? "LUMALAPAG SA LAHAT ⚡✅" : "OFF ❌"}
Auto-Welcome:${gcData.autoWelcome ? "ON ✅" : "OFF ❌"}
Auto-Nick:   ${gcData.autoNick ? "ON ✅" : "OFF ❌"}
GC Protek:   ${gcData.autoGname ? "ON 🔒" : "OFF ❌"}
Auto-Reply:  ${gcData.roast ? "ON ✅" : "OFF ❌"}
    `.trim(), threadID, messageID);
  }

  return send(api, `
👑 MGA UTOS:

/ryuk on     → Buksan — LUMALAPAG AGAD!
/ryuk off    → Patayin
/silent      → 🤫 Tahimik — LUMALAPAG PA RIN SA LAHAT!
/unsilent    → 🔊 Magsalita ulit
/ryuk autorefresh on/off → Ipagpatuloy/Pigilan ang pagpapalit sa lahat
/ryuk status → Tignan kalagayan
    `.trim(), threadID, messageID);
};
      
