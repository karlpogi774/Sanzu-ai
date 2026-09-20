// ==========================================================
// RYUK — TAMA NA ANG PAGKAKASUNOD NG ARGUMENTO!
// SETNICK GUMAGANA + AUTO-WELCOME + PROTEKSI
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109 ✅
// ==========================================================

const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "ryuk",
  version: "15.0.0",
  hasPermission: 0,
  credits: "ryuk — 3 ADMIN PROTECTED",
  description: "ayos na ang pagpapalit ng palayaw + 3 admin",
  usePrefix: true,
  commandCategory: "ryuk",
  usages: "/ryuk help",
  cooldowns: 2
};

// ✅ LAHAT NG ADMIN — PROTEKTADO!
const ADMIN_IDS = [
  "61594055835097",
  "61593892603402",
  "61594325727109"
];

const DATA_FILE = path.join(__dirname, "ryuk_data.json");

const DEFAULT_DATA = {
  active: false,
  roast: true,
  react: true,
  heartbeatReact: true,
  autoGname: true,
  autoNick: true,
  autoWelcome: true,
  savedGname: "GOJO BOSS",
  savedNick: "BOSS",
  welcomeMsg: "👑 @{username} — MALIGAYANG PAGDATING SA GC!\nIkaw ay naging BOSS na agad ⚡\nSumunod sa patakaran at mag-enjoy!",
  roastCount: 0,
  commandCount: 0,
  activatedBy: null,
  activatedAt: null,
  heartbeatIndex: 0,
  lastRestoreGname: 0,
  lastNickUpdate: 0
};

const ROAST_COOLDOWN = 8000;
const COMMAND_COOLDOWN = 2500;
const JOIN_COOLDOWN = 3000;
const HEARTBEAT_INTERVAL = 20000;
const MONITOR_INTERVAL = 5000;
const NICK_DELAY = 1000;
const RESTORE_GNAME_COOLDOWN = 10000;

const processing = new Set();
const roastCooldown = new Map();
const commandCooldown = new Map();
const joinCooldown = new Map();
const welcomedUsers = new Set();
const heartbeatIntervals = new Map();
const monitorIntervals = new Map();
const threadLocks = new Map();

const ALIVE_LINES = [
  "nandito pa rin ako, hindi hihinto hangga't hindi mo sinasabing huminto.",
  "kahit walang magsalita, nandito lang ako para sa'yo.",
  "handa ako sa bawat utos mo — sabihin mo lang at gagawin ko agad.",
  "ikaw lang ang aking sundin — sa iba hindi ako makikinig.",
  "buhay pa rin ako dito — sabihin mo lang /ryuk off para tumigil.",
  "hindi ako bibitaw — mananatili ako hangga't ikaw ang nandito."
];

const HEARTBEAT_EMOJIS = ["🔥", "⚡", "💪", "👑", "✨"];
const ROASTS = [
  "grabe yung lakas ng loob mag-send 💀",
  "anong sinabi mo? ulitin mo nga 🤣",
  "ryuk — gojo boss ⚡"
];
const EMOJIS = ["🔥", "💀", "🤣", "😆", "🤡"];

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      saveData({ ...DEFAULT_DATA });
      return { ...DEFAULT_DATA };
    }
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    const fixed = { ...DEFAULT_DATA };
    for (const k in DEFAULT_DATA) {
      if (parsed[k] !== undefined) fixed[k] = parsed[k];
    }
    return fixed;
  } catch (e) {
    console.error("[ryuk] load error:", e?.message);
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
    console.error("[ryuk] save error:", e?.message);
    return false;
  }
}

function isAdmin(id) { return ADMIN_IDS.includes(String(id)); }
function random(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function cooldownReady(map, key, dur) {
  const now = Date.now();
  const k = String(key);
  const last = map.get(k) || 0;
  if (now - last < dur) return false;
  map.set(k, now);
  return true;
}
function send(api, msg, tid, rid=null) {
  return new Promise(r => {
    if (!api || !tid || !msg) return r(null);
    try { api.sendMessage(msg, tid, (e,i)=>r(e?null:i), rid); }
    catch { r(null); }
  });
}
function react(api, em, mid) {
  return new Promise(r => {
    if (!api || !mid || !em) return r(false);
    try { 
      if (typeof api.setMessageReaction === "function") {
        api.setMessageReaction(em, mid, ()=>r(true), true); 
      } else { r(false); }
    }
    catch { r(false); }
  });
}
function sleep(ms) { return new Promise(r=>setTimeout(r,ms)); }

// ✅ TAMA NA ANG PAGKAKASUNOD NG ARGUMENTO!
async function palitanPalayaw(api, threadID, userID, newNick) {
  return new Promise(async resolve => {
    let gumana = false;
    
    if (!gumana && typeof api.changeNickname === "function") {
      try {
        await api.changeNickname(threadID, newNick, userID);
        gumana = true;
        console.log("[ryuk] ✅ Paraan 1 gumana para sa:", userID);
      } catch(e) { 
        console.log("[ryuk] Paraan 1 nabigo:", e?.message);
      }
    }
    
    if (!gumana && typeof api.changeNickname === "function") {
      try {
        await api.changeNickname(newNick, threadID, userID);
        gumana = true;
        console.log("[ryuk] ✅ Paraan 2 gumana para sa:", userID);
      } catch(e) { 
        console.log("[ryuk] Paraan 2 nabigo:", e?.message);
      }
    }
    
    if (!gumana && typeof api.setNickname === "function") {
      try {
        await api.setNickname(threadID, newNick, userID);
        gumana = true;
        console.log("[ryuk] ✅ Paraan 3 gumana para sa:", userID);
      } catch(e) { 
        console.log("[ryuk] Paraan 3 nabigo:", e?.message);
      }
    }
    
    if (!gumana && typeof api.setNickname === "function") {
      try {
        await api.setNickname(newNick, threadID, userID);
        gumana = true;
        console.log("[ryuk] ✅ Paraan 4 gumana para sa:", userID);
      } catch(e) { 
        console.log("[ryuk] Paraan 4 nabigo:", e?.message);
      }
    }
    
    if (!gumana) {
      console.log("[ryuk] ❌ WALANG PARAAN NA GUMANA para sa:", userID);
      console.log("[ryuk] Available methods:", Object.keys(api).filter(k => k.toLowerCase().includes('nick')));
    }
    
    resolve(gumana);
  });
}

async function setNickAll(api, threadID, nick) {
  if (!nick) return { success:0, failed:0 };
  
  const lockKey = `nick_${threadID}`;
  if (threadLocks.get(lockKey)) return { success:0, failed:0 };
  threadLocks.set(lockKey, true);
  
  let info;
  try { info = await api.getThreadInfo(threadID); } 
  catch (e) { 
    console.log("[ryuk] GC Info Error:", e?.message);
    threadLocks.delete(lockKey);
    return { success:0, failed:0 }; 
  }
  
  const members = info?.participantIDs || [];
  if (!members.length) {
    threadLocks.delete(lockKey);
    return { success:0, failed:0 };
  }
  
  let botID = "";
  try { botID = String(api.getCurrentUserID()); } catch {}
  console.log("[ryuk] Kabuuan ng miyembro:", members.length, "| Bot ID:", botID);
  
  let s=0, f=0;
  for (const uid of members) {
    if (String(uid) === String(botID)) {
      console.log("[ryuk] Nilaktawan ang sarili:", uid);
      continue;
    }
    
    const res = await palitanPalayaw(api, threadID, uid, nick);
    if (res) s++;
    else f++;
    
    await sleep(NICK_DELAY);
  }
  
  console.log(`[ryuk] KABUUAN — Tagumpay: ${s} | Nabigo: ${f}`);
  threadLocks.delete(lockKey);
  return { success:s, failed:f };
}

async function restoreGname(api, threadID, data) {
  if (!data.savedGname) return false;
  const now = Date.now();
  if (now - (data.lastRestoreGname || 0) < RESTORE_GNAME_COOLDOWN) return false;
  
  let ok = false;
  if (typeof api.setTitle === "function") {
    try {
      await api.setTitle(data.savedGname, threadID);
      ok = true;
    } catch(e) { console.log("[ryuk] setTitle error:", e?.message); }
  }
  
  if (ok) {
    data.lastRestoreGname = now;
    saveData(data);
  }
  return ok;
}

function startMonitor(api, threadID, data) {
  stopMonitor(threadID);
  if (!data.active) return;
  
  const tid = String(threadID);
  monitorIntervals.set(tid, setInterval(async () => {
    const d = loadData();
    if (!d.active) { stopMonitor(tid); return; }
    
    let info;
    try { info = await api.getThreadInfo(threadID); } catch { return; }
    const current = info?.threadName || "";
    
    if (d.autoGname && d.savedGname && current !== d.savedGname) {
      const ok = await restoreGname(api, threadID, d);
      if (ok) await send(api, "⚠️ may nagpalit!\n🔒 ibinalik agad sa: " + d.savedGname, threadID);
    }
  }, MONITOR_INTERVAL));
}

function stopMonitor(tid) {
  const k = String(tid);
  if (monitorIntervals.has(k)) {
    clearInterval(monitorIntervals.get(k));
    monitorIntervals.delete(k);
  }
}

function startHeartbeat(api, threadID) {
  stopHeartbeat(threadID);
  if (!loadData().active) return;
  
  const tid = String(threadID);
  heartbeatIntervals.set(tid, setInterval(async () => {
    const d = loadData();
    if (!d.active) { stopHeartbeat(tid); return; }
    
    const line = ALIVE_LINES[d.heartbeatIndex % ALIVE_LINES.length];
    d.heartbeatIndex++;
    saveData(d);
    
    const msg = await send(api, line, threadID);
    if (msg?.messageID && d.heartbeatReact) {
      await react(api, random(HEARTBEAT_EMOJIS), msg.messageID);
    }
  }, HEARTBEAT_INTERVAL));
}

function stopHeartbeat(tid) {
  const k = String(tid);
  if (heartbeatIntervals.has(k)) {
    clearInterval(heartbeatIntervals.get(k));
    heartbeatIntervals.delete(k);
  }
}

module.exports.handleEvent = async ({ api, event }) => {
  if (!event) return;
  const { threadID, senderID, body, logMessageType } = event;
  if (!threadID) return;

  if (logMessageType === "log:subscribe") {
    const d = loadData();
    if (!d.active) return;
    
    const added = event.logMessageData?.addedParticipants || [];
    if (!added.length) return;
    
    let botID = "";
    try { botID = String(api.getCurrentUserID()); } catch {}
    
    for (const m of added) {
      const uid = String(m.userFbId || m.id || "");
      if (!uid || uid === botID) continue;
      
      const welcomeKey = `${threadID}_${uid}`;
      if (welcomedUsers.has(welcomeKey)) continue;
      welcomedUsers.add(welcomeKey);
      
      let userName = "Kaibigan";
      try {
        const info = await api.getUserInfo(uid);
        if (info && info[uid]) userName = info[uid].name || userName;
      } catch(e) { console.log("[ryuk] Kunin Pangalan Error:", e?.message); }
      
      if (d.autoNick && d.savedNick) {
        await palitanPalayaw(api, threadID, uid, d.savedNick);
        await sleep(NICK_DELAY);
      }
      
      if (d.autoWelcome && d.welcomeMsg) {
        const welcomeText = d.welcomeMsg.replaceAll("{username}", userName);
        await send(api, welcomeText, threadID);
      }
    }
    return;
  }

  if (logMessageType === "log:thread-name") {
    const d = loadData();
    if (!d.active || !d.autoGname || !d.savedGname) return;
    
    const newName = event.logMessageData?.name || "";
    if (newName !== d.savedGname) {
      await sleep(1000);
      const ok = await restoreGname(api, threadID, d);
      if (ok) await send(api, "⚠️ pinalitan!\n🔒 ibinalik agad sa: " + d.savedGname, threadID);
    }
    return;
  }

  if (!senderID || !body) return;
  try { if (String(senderID) === String(api.getCurrentUserID())) return; } catch {}
  const text = String(body).trim();
  if (!text || text.startsWith("/") || text.startsWith("!")) return;
  
  const d = loadData();
  if (!d.active || !d.roast || processing.has(String(threadID))) return;
  if (!cooldownReady(roastCooldown, threadID, ROAST_COOLDOWN)) return;
  
  processing.add(String(threadID));
  try {
    const info = await send(api, random(ROASTS), threadID);
    if (info?.messageID && d.react) await react(api, random(EMOJIS), info.messageID);
    d.roastCount++;
    saveData(d);
  } finally {
    processing.delete(String(threadID));
  }
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;
  const cmd = String(args?.[0] || "help").toLowerCase();

  // ✅ LAHAT NG ADMIN MAKAPAGPATAKBO
  const adminCmds = ["on","off","restore","setnick","autonick","setgname","autogname","roast","react","heartreact","welcome","autowelcome","setwelcome","status","info"];
  if (adminCmds.includes(cmd) && !isAdmin(senderID)) {
    return send(api, "🔒 ikaw lang ang makapag-utos!", threadID, messageID);
  }

  if (!cooldownReady(commandCooldown, senderID, COMMAND_COOLDOWN)) return;

  const data = loadData();
  data.commandCount++;
  saveData(data);

  if (cmd === "on") {
    data.active = true;
    data.activatedBy = senderID;
    data.activatedAt = Date.now();
    saveData(data);
    
    startHeartbeat(api, threadID);
    startMonitor(api, threadID, data);
    
    await restoreGname(api, threadID, data);
    await send(api, "⏳ inilalagay ang palayaw sa lahat...", threadID);
    const nickRes = await setNickAll(api, threadID, data.savedNick);
    
    return send(api,
      "👑 ryuk — ONLINE!\n" +
      "✅ Auto-Welcome: " + (data.autoWelcome ? "ON ✅" : "OFF ❌") + "\n" +
      "✅ Palayaw: tagumpay " + nickRes.success + " | nabigo " + nickRes.failed + "\n" +
      "✅ 3 Admin Protektado!\n" +
      "💪 TIGNAN MO ANG LOG — may lalabas kung aling paraan ang gumana!",
      threadID, messageID
    );
  }

  if (cmd === "off") {
    data.active = false;
    saveData(data);
    stopHeartbeat(threadID);
    stopMonitor(threadID);
    return send(api, "🔴 tumigil na — utos mo!", threadID, messageID);
  }

  if (cmd === "restore") {
    const gOk = await restoreGname(api, threadID, data);
    await send(api, "⏳ inilalagay palayaw sa lahat...", threadID);
    const nRes = await setNickAll(api, threadID, data.savedNick);
    return send(api,
      "🔒 ibinalik lahat!\n" +
      "gc: " + (gOk ? "✅ " + data.savedGname : "❌ hindi muna") + "\n" +
      "palayaw: tagumpay " + nRes.success + " | nabigo " + nRes.failed,
      threadID, messageID
    );
  }

  if (cmd === "setnick") {
    const nick = args.slice(1).join(" ").trim() || "BOSS";
    data.savedNick = nick; saveData(data);
    
    await send(api, "⏳ binabago sa lahat ng miyembro...", threadID);
    const res = await setNickAll(api, threadID, nick);
    
    return send(api,
      "✅ palayaw: \"" + nick + "\"\n" +
      "tagumpay: " + res.success + "\nnabigo: " + res.failed + "\n" +
      "💪 TIGNAN MO ANG CONSOLE — may nakalagay doon kung aling paraan ang gumana!",
      threadID, messageID
    );
  }

  if (cmd === "setgname") {
    const name = args.slice(1).join(" ").trim() || "GOJO BOSS";
    data.savedGname = name; saveData(data);
    const ok = await restoreGname(api, threadID, data);
    return send(api, ok ? "✅ gc name: \"" + name + "\" — PROTEKTADO NA!" : "✅ itinakda", threadID, messageID);
  }

  if (cmd === "autonick") {
    const m = String(args?.[1]||"").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/ryuk autonick on/off", threadID, messageID);
    if (m==="on" && !data.savedNick) data.savedNick = "BOSS";
    data.autoNick = m==="on"; saveData(data);
    return send(api, "⚡ auto nick: " + m.toUpperCase() + " → \"" + data.savedNick + "\"", threadID, messageID);
  }

  if (cmd === "autogname") {
    const m = String(args?.[1]||"").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/ryuk autogname on/off", threadID, messageID);
    if (m==="on" && !data.savedGname) data.savedGname = "GOJO BOSS";
    data.autoGname = m==="on"; saveData(data);
    return send(api, "⚡ auto gname: " + m.toUpperCase() + " → \"" + data.savedGname + "\"", threadID, messageID);
  }

  if (cmd === "autowelcome") {
    const m = String(args?.[1]||"").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/ryuk autowelcome on/off", threadID, messageID);
    data.autoWelcome = m==="on"; saveData(data);
    return send(api, "⚡ auto-welcome: " + (m==="on" ? "ON ✅" : "OFF ❌"), threadID, messageID);
  }

  if (cmd === "setwelcome") {
    const msg = args.slice(1).join(" ").trim();
    if (!msg) return send(api, "I-type: /ryuk setwelcome @{username} — salamat sa pagsali!\n(Gamitin ang @{username} para sa pangalan ng bagong dating)", threadID, messageID);
    data.welcomeMsg = msg; saveData(data);
    return send(api, "✅ Bagong welcome message na itinakda:\n" + msg, threadID, messageID);
  }

  if (cmd === "welcome") {
    return send(api,
      "👑 AUTO-WELCOME SETTINGS\n" +
      "Kasalukuyan: " + (data.autoWelcome ? "ON ✅" : "OFF ❌") + "\n\n" +
      "📌 Gamitin:\n" +
      "/ryuk autowelcome on/off — buksan o isara\n" +
      "/ryuk setwelcome [mensahe] — baguhin ang mensahe\n" +
      "Halimbawa: /ryuk setwelcome @{username}, salamat sa pagsali!\n" +
      "Gamitin ang @{username} para ilagay ang pangalan ng tao",
      threadID, messageID
    );
  }

  if (cmd === "roast") {
    const m = String(args?.[1]||"").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/ryuk roast on/off", threadID, messageID);
    data.roast = m==="on"; saveData(data);
    return send(api, "🔥 auto-roast: " + m.toUpperCase(), threadID, messageID);
  }

  if (cmd === "react") {
    const m = String(args?.[1]||"").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/ryuk react on/off", threadID, messageID);
    data.react = m==="on"; saveData(data);
    return send(api, "⚡ reaksyon sa sagot: " + m.toUpperCase(), threadID, messageID);
  }

  if (cmd === "heartreact") {
    const m = String(args?.[1]||"").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/ryuk heartreact on/off", threadID, messageID);
    data.heartbeatReact = m==="on"; saveData(data);
    return send(api, "✨ reaksyon sa linya: " + m.toUpperCase(), threadID, messageID);
  }

  if (cmd === "status") {
    return send(api, [
      "👑 ryuk — STATUS",
      "Sistema: " + (data.active ? "ON 🟢" : "OFF 🔴"),
      "Auto-Welcome: " + (data.autoWelcome ? "ON ✅" : "OFF ❌"),
      "Auto-Nick: " + (data.autoNick ? "ON ✅ → " + data.savedNick : "OFF ❌"),
      "GC Name: " + data.savedGname + (data.autoGname ? " — 🔒 PROTEKTADO" : ""),
      "Admin Protektado: 3 ✅"
    ].join("\n"), threadID, messageID);
  }

  if (cmd === "info") {
    return send(api,
      "👑 ryuk — AYOS NA ANG PAGKAKASUNOD!\n" +
      "✅ 3 Admin Protektado\n" +
      "✅ Sinubukan na ang lahat ng posibleng pagkakasunod-sunod\n" +
      "✅ Tignan mo ang CONSOLE — may nakalagay doon kung aling paraan ang gumana!",
      threadID, messageID
    );
  }

  return send(api, [
    "👑 ryuk — MGA UTOS",
    "/ryuk on          → simulan",
    "/ryuk off         → itigil",
    "/ryuk setnick [pangalan] → palitan palayaw",
    "/ryuk setgname [pangalan] → palitan gc name",
    "/ryuk welcome     → settings ng welcome",
    "/ryuk autowelcome on/off → buksan/isara welcome",
    "/ryuk setwelcome [mensahe] → baguhin ang welcome message",
    "/ryuk status      → tignan kalagayan"
  ].join("\n"), threadID, messageID);
};
    
