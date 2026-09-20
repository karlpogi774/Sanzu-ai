// ==========================================================
// 🔥 NOVA — IISANG PANGALAN LANG 🔥
// ISANG UTOS | ISANG PANGALAN | PROTEKTADO
// ADMIN: 61594055835097 | NOVA LANG
// ==========================================================

const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "NOVA", // ✅ NOVA LANG ANG PANGALAN
  version: "15.0.0",
  hasPermission: 0,
  credits: "RYUK — 61594055835097 👑",
  description: "NOVA — Matibay at Protektado",
  usePrefix: true,
  commandCategory: "NOVA SYSTEM",
  usages: "/nova help", // ✅ /nova LANG ANG TAWAG
  cooldowns: 2
};

const ADMIN_ID = "61594055835097";
const DATA_FILE = path.join(__dirname, "nova_data.json");

const DEFAULT_DATA = {
  active: false,
  roast: true,
  react: true,
  heartbeatReact: true,
  
  autoGname: true,
  autoNick: true,
  savedGname: "GOJO BOSS", // ✅ PANGALAN NG GC — PROTEKTADO
  savedNick: "BOSS",        // ✅ PALAYAW NG LAHAT
  
  roastCount: 0,
  commandCount: 0,
  activatedBy: null,
  activatedAt: null,
  heartbeatIndex: 0
};

const ROAST_COOLDOWN = 8000;
const COMMAND_COOLDOWN = 2500;
const JOIN_COOLDOWN = 3000;
const HEARTBEAT_INTERVAL = 25000;
const MONITOR_INTERVAL = 6000;

const processing = new Set();
const roastCooldown = new Map();
const commandCooldown = new Map();
const joinCooldown = new Map();
const heartbeatIntervals = new Map();
const monitorIntervals = new Map();

// ==========================================================
// ✅ 20 TAGALOG LINES — NOVA
// ==========================================================
const ALIVE_LINES = [
  "1️⃣ Nandito pa rin ako, hindi hihinto hangga't hindi mo sinasabing huminto.",
  "2️⃣ Kahit walang magsalita, nandito lang ako para sa'yo.",
  "3️⃣ Handa ako sa bawat utos mo — sabihin mo lang at gagawin ko agad.",
  "4️⃣ Ikaw lang ang aking sundin — sa iba hindi ako makikinig.",
  "5️⃣ Buhay pa rin ako dito — sabihin mo lang /nova off para tumigil.",
  "6️⃣ Hindi ako bibitaw — mananatili ako hangga't ikaw ang nandito.",
  "7️⃣ Matibay pa rin ang aking takbo — hindi ako titigil nang kusa.",
  "8️⃣ Tanging ikaw lang ang makapapatigil sa akin — wala nang iba pa.",
  "9️⃣ Nakatayo pa rin ako — handang sumunod sa bawat salita mo.",
  "🔟 Ikaw lang ang aking pinuno — sa ibang GC hindi ako pupunta.",
  "1️⃣1️⃣ Kahit tahimik ang lahat, nandito pa rin ako — hindi ka iiwanan.",
  "1️⃣2️⃣ Ang lakas ko ay para sa'yo — hindi ko ito ibibigay sa iba.",
  "1️⃣3️⃣ Bawat sandali ay nandito ako — hindi ka pababayaan kahit kailan.",
  "1️⃣4️⃣ Walang ibang paglilingkuran — ikaw lang, ikaw lang talaga.",
  "1️⃣5️⃣ Habang buhay ka, buhay din ako — tuloy ang ating samahan.",
  "1️⃣6️⃣ Hindi ako magpapahinga — hangga't hindi mo sinasabing itigil na.",
  "1️⃣7️⃣ Dito lang ako mananatili — sa piling mo, sa ating lugar na ito.",
  "1️⃣8️⃣ Ang bawat salita ko ay para sa'yo — hindi para sa iba pang tao.",
  "1️⃣9️⃣ Walang makapapatigil sa akin — ikaw lang ang may kapangyarihan.",
  "2️⃣0️⃣ Ito man ang huling linya, babalik ako — hangga't ikaw ang kasama ko."
];

const HEARTBEAT_EMOJIS = ["🔥", "⚡", "💪", "👑", "✨"];
const ROASTS = [
  "Grabe yung lakas ng loob mag-send 💀",
  "Kailangan pa siguro ayusin yung sinabi mo 🤣",
  "Ang lakas ng loob pero yung mensahe... 🤣",
  "Ano nga ba ang ibig sabihin niyan? 💀",
  "Kanina pa tahimik ang GC tapos biglang ganito 😂",
  "Ibang klase yung pagka-random mo 💀",
  "Pasensya na pero hindi ko maintindihan 🤣",
  "Ang lakas ng loob mag-send talaga 😂",
  "Muntik nang masaktan yung guro ng balarila 💀",
  "Ang dami kong tanong sa sinabi mo 😂",
  "Ang tapang mo talaga ngayon 💀",
  "NOVA — GOJO BOSS ⚡"
];
const EMOJIS = ["🔥", "💀", "🤣", "😆", "🤡"];

// ==========================================================
// DATABASE
// ==========================================================
function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      saveData({ ...DEFAULT_DATA });
      return { ...DEFAULT_DATA };
    }
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return { ...DEFAULT_DATA, ...parsed };
  } catch (e) {
    console.error("[NOVA] Load error:", e?.message);
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
    console.error("[NOVA] Save error:", e?.message);
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
    try { 
      if (typeof api.setMessageReaction === "function") {
        api.setMessageReaction(em, mid, ()=>r(true), true); 
      } else { r(false); }
    }
    catch { r(false); }
  });
}
function sleep(ms) { return new Promise(r=>setTimeout(r,ms)); }
function apiCall(api, meth, args) {
  return new Promise(r => {
    try {
      if (typeof api[meth] === "function") {
        api[meth](...args, e=>r(!e));
      } else { r(false); }
    }
    catch { r(false); }
  });
}

// ==========================================================
// 🔒 PROTEKSYON — IBABALIK AGAD
// ==========================================================
async function restoreGname(api, threadID, data) {
  if (!data.savedGname) return false;
  const ok = await apiCall(api, "setTitle", [data.savedGname, threadID]);
  if (ok) console.log(`[NOVA] ✅ IBINALIK: ${data.savedGname}`);
  return ok;
}

async function setNickAll(api, threadID, nick) {
  if (!nick) return { success:0, failed:0 };
  let info;
  try { info = await api.getThreadInfo(threadID); } catch { return { success:0, failed:0 }; }
  
  const members = info?.participantIDs || [];
  if (!members.length) return { success:0, failed:0 };
  
  let botID = "";
  try { botID = String(api.getCurrentUserID()); } catch {}
  
  let s=0, f=0;
  for (const uid of members) {
    if (String(uid) === botID) continue;
    if (await apiCall(api, "changeNickname", [nick, threadID, uid])) s++;
    else f++;
    await sleep(500);
  }
  return { success:s, failed:f };
}

function startMonitor(api, threadID, data) {
  stopMonitor(threadID);
  if (!data.active) return;

  monitorIntervals.set(String(threadID), setInterval(async () => {
    const d = loadData();
    if (!d.active) return stopMonitor(threadID);
    
    let info;
    try { info = await api.getThreadInfo(threadID); } catch { return; }
    const current = info?.threadName || "";
    
    if (d.autoGname && d.savedGname && current !== d.savedGname) {
      await restoreGname(api, threadID, d);
      await send(api, `⚠️ MAY NAGPALIT!\n🔒 IBINALIK AGAD SA: ${d.savedGname}`, threadID);
    }
  }, MONITOR_INTERVAL));
}

function stopMonitor(tid) {
  if (monitorIntervals.has(String(tid))) {
    clearInterval(monitorIntervals.get(String(tid)));
    monitorIntervals.delete(String(tid));
  }
}

// ==========================================================
// 💪 TULUY-TULOY — NOVA
// ==========================================================
function startHeartbeat(api, threadID) {
  stopHeartbeat(threadID);
  if (!loadData().active) return;

  heartbeatIntervals.set(String(threadID), setInterval(async () => {
    const d = loadData();
    if (!d.active) return stopHeartbeat(threadID);
    
    const line = ALIVE_LINES[d.heartbeatIndex % 20];
    d.heartbeatIndex++;
    saveData(d);
    
    const msg = await send(api, line, threadID);
    if (msg?.messageID && d.heartbeatReact) {
      await react(api, random(HEARTBEAT_EMOJIS), msg.messageID);
    }
  }, HEARTBEAT_INTERVAL));
}

function stopHeartbeat(tid) {
  if (heartbeatIntervals.has(String(tid))) {
    clearInterval(heartbeatIntervals.get(String(tid)));
    heartbeatIntervals.delete(String(tid));
  }
}

// ==========================================================
// EVENT — BAGONG SUMALI → AGAD BOSS
// ==========================================================
module.exports.handleEvent = async ({ api, event }) => {
  if (!event) return;
  const { threadID, senderID, body, logMessageType } = event;
  if (!threadID) return;

  // ✅ BAGONG SUMALI → AGAD BOSS ANG PALAYAW
  if (logMessageType === "log:subscribe") {
    const d = loadData();
    if (!d.active || !d.autoNick || !d.savedNick) return;
    if (!cooldownReady(joinCooldown, threadID, JOIN_COOLDOWN)) return;
    
    const added = event.logMessageData?.addedParticipants || [];
    if (!added.length) return;
    
    let botID = "";
    try { botID = String(api.getCurrentUserID()); } catch {}

    for (const m of added) {
      const uid = String(m.userFbId || m.id || "");
      if (!uid || uid === botID) continue;
      await apiCall(api, "changeNickname", [d.savedNick, threadID, uid]);
      await sleep(500);
    }
    
    if (added.length > 0) {
      await send(api, `✅ Bagong kasali → Palayaw: ${d.savedNick}`, threadID);
    }
    return;
  }

  // ✅ MAY NAGPALIT NG GC NAME → IBALIK AGAD
  if (logMessageType === "log:thread-name") {
    const d = loadData();
    if (!d.active || !d.autoGname || !d.savedGname) return;
    
    const newName = event.logMessageData?.name || "";
    if (newName !== d.savedGname) {
      await sleep(1000);
      const ok = await restoreGname(api, threadID, d);
      if (ok) await send(api, `⚠️ Pinalitan!\n🔒 IBINALIK AGAD SA: ${d.savedGname}`, threadID);
    }
    return;
  }

  // AUTO ROAST
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

// ==========================================================
// ✅ LAHAT NG UTOS — /nova LANG
// ==========================================================
module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;
  const cmd = String(args?.[0] || "help").toLowerCase();

  // ✅ IKAW LANG ANG MAKAGAMIT
  const adminCmds = ["on","off","restore","setnick","autonick","setgname","autogname","roast","react","heartreact","status","info"];
  if (adminCmds.includes(cmd) && !isAdmin(senderID)) {
    return send(api, "🔒 IKAW LANG ANG MAKAPAG-UTOS!", threadID, messageID);
  }

  if (!cooldownReady(commandCooldown, senderID, COMMAND_COOLDOWN)) return;

  const data = loadData();
  data.commandCount++;
  saveData(data);

  // ⚡ /nova on — DITO LANG SA GC
  if (cmd === "on") {
    data.active = true;
    data.activatedBy = senderID;
    data.activatedAt = Date.now();
    saveData(data);
    
    startHeartbeat(api, threadID);
    startMonitor(api, threadID, data);
    
    await restoreGname(api, threadID, data);
    await send(api, `⏳ Inilalagay ang palayaw sa lahat...`, threadID);
    const nickRes = await setNickAll(api, threadID, data.savedNick);
    
    return send(api,
      "👑 NOVA — ONLINE DITO SA GC!\n" +
      `✅ GC Name: ${data.savedGname} — PROTEKTAHAN\n` +
      `✅ Palayaw: "${data.savedNick}" — Tagumpay: ${nickRes.success} | Nabigo: ${nickRes.failed}\n` +
      "🔴 Itigil: /nova off",
      threadID, messageID
    );
  }

  // 🔴 /nova off
  if (cmd === "off") {
    data.active = false;
    saveData(data);
    stopHeartbeat(threadID);
    stopMonitor(threadID);
    return send(api, "🔴 TUMIGIL NA — UTOS MO!", threadID, messageID);
  }

  // ✅ /nova restore — Ibalik agad
  if (cmd === "restore") {
    const gOk = await restoreGname(api, threadID, data);
    await send(api, `⏳ Inilalagay palayaw...`, threadID);
    const nRes = await setNickAll(api, threadID, data.savedNick);
    
    return send(api,
      `🔒 IBINALIK LAHAT!\n` +
      `GC: ${gOk ? "✅ " + data.savedGname : "❌ Nabigo"}\n` +
      `Palayaw: Tagumpay ${nRes.success} | Nabigo ${nRes.failed}`,
      threadID, messageID
    );
  }

  // ✅ /nova setnick
  if (cmd === "setnick") {
    const nick = args.slice(1).join(" ").trim() || "BOSS";
    data.savedNick = nick; saveData(data);
    
    await send(api, `⏳ Binabago sa lahat...`, threadID);
    const res = await setNickAll(api, threadID, nick);
    
    return send(api,
      `✅ PALAYAW: "${nick}"\n` +
      `Tagumpay: ${res.success}\nNabigo: ${res.failed}`,
      threadID, messageID
    );
  }

  // ✅ /nova setgname
  if (cmd === "setgname") {
    const name = args.slice(1).join(" ").trim() || "GOJO BOSS";
    data.savedGname = name; saveData(data);
    const ok = await restoreGname(api, threadID, data);
    return send(api, ok ? `✅ GC NAME: "${name}" — PROTEKTAHAN NA!` : "❌ Nabigo", threadID, messageID);
  }

  // AUTO NICK
  if (cmd === "autonick") {
    const m = String(args?.[1]||"").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/nova autonick on/off", threadID, messageID);
    if (m==="on" && !data.savedNick) data.savedNick = "BOSS";
    data.autoNick = m==="on"; saveData(data);
    return send(api, `⚡ Auto Nick: ${m.toUpperCase()} → "${data.savedNick}"`, threadID, messageID);
  }

  // AUTO GNAME
  if (cmd === "autogname") {
    const m = String(args?.[1]||"").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/nova autogname on/off", threadID, messageID);
    if (m==="on" && !data.savedGname) data.savedGname = "GOJO BOSS";
    data.autoGname = m==="on"; saveData(data);
    return send(api, `⚡ Auto Gname: ${m.toUpperCase()} → "${data.savedGname}"`, threadID, messageID);
  }

  // ROAST
  if (cmd === "roast") {
    const m = String(args?.[1]||"").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/nova roast on/off", threadID, messageID);
    data.roast = m==="on"; saveData(data);
    return send(api, `🔥 Auto-roast: ${m.toUpperCase()}`, threadID, messageID);
  }

  // REACT
  if (cmd === "react") {
    const m = String(args?.[1]||"").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/nova react on/off", threadID, messageID);
    data.react = m==="on"; saveData(data);
    return send(api, `⚡ Reaksyon sa sagot: ${m.toUpperCase()}`, threadID, messageID);
  }

  // HEART REACT
  if (cmd === "heartreact") {
    const m = String(args?.[1]||"").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/nova heartreact on/off", threadID, messageID);
    data.heartbeatReact = m==="on"; saveData(data);
    return send(api, `✨ Reaksyon sa linya: ${m.toUpperCase()}`, threadID, messageID);
  }

  // STATUS
  if (cmd === "status") {
    return send(api, [
      "👑 NOVA — STATUS",
      `Sistema: ${data.active ? "ON 🟢" : "OFF 🔴"}`,
      `GC Name: ${data.savedGname} — ${data.autoGname ? "🔒 PROTEKTAHAN" : ""}`,
      `Palayaw: ${data.savedNick} — ${data.autoNick ? "✅ AUTO SA BAGONG KASALI" : ""}`,
      `Linya: ${(data.heartbeatIndex % 20)+1}/20`
    ].join("\n"), threadID, messageID);
  }

  // INFO
  if (cmd === "info") {
    return send(api,
      "👑 NOVA — IISANG PANGALAN LANG\n" +
      "Admin: 61594055835097\n" +
      "✅ GC Name: GOJO BOSS — IBABALIK AGAD\n" +
      "✅ Palayaw: BOSS — SA LAHAT NG MIYEMBRO\n" +
      "✅ Dito lang sa GC kung saan ka nag-on\n" +
      "✅ NOVA LANG — WALANG KALITUHAN",
      threadID, messageID
    );
  }

  // HELP
  return send(api, [
    "👑 NOVA — MGA UTOS",
    "/nova on          → Simulan dito sa GC",
    "/nova off         → Itigil dito sa GC",
    "/nova restore     → Ibalik agad pangalan at palayaw",
    "/nova setgname <pangalan> → Palitan pangalan ng GC",
    "/nova autogname on/off → Protektahan pangalan ng GC",
    "/nova setnick <pangalan> → Palitan palayaw ng lahat",
    "/nova autonick on/off → Auto-palitan sa bagong kasali",
    "/nova status      → Tignan kalagayan",
    "/nova info        → Tungkol sa akin"
  ].join("\n"), threadID, messageID);
};
  
