// ==========================================================
// NOVA X — RYUK MATIBAY EDITION 💪🔥
// AYOS NA SETNICK | ISANG GC LANG | PROTEKTAHAN ANG PANGALAN
// ADMIN: 61594055835097 | HINDI BABAGSAK
// ==========================================================

const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "RYUK-X", // ✅ BAGONG MATIBAY NA PANGALAN NG BOT
  version: "13.0.0",
  hasPermission: 0,
  credits: "RYUK — 61594055835097 👑",
  description: "MATIBAY — Ayos na Setnick | Protektadong GC Name",
  usePrefix: true,
  commandCategory: "RYUK SYSTEM",
  usages: "/ryuk help",
  cooldowns: 2
};

const ADMIN_ID = "61594055835097";
const DATA_FILE = path.join(__dirname, "ryuk_x_data.json");

const DEFAULT_DATA = {
  active: false,
  roast: true,
  react: true,
  heartbeatReact: true,
  
  autoGname: true,
  autoNick: true,
  savedGname: "GOJO BOSS",
  savedNick: "BOSS", // ✅ NAKA-SET NA AGAD
  
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
// ✅ 20 TAGALOG LINES + AUTO REACT
// ==========================================================
const ALIVE_LINES = [
  "1️⃣ Nandito pa rin ako, hindi hihinto hangga't hindi mo sinasabing huminto.",
  "2️⃣ Kahit walang magsalita, nandito lang ako para sa'yo, Ryuk.",
  "3️⃣ Handa ako sa bawat utos mo — sabihin mo lang at gagawin ko agad.",
  "4️⃣ Ikaw lang ang aking sundin — sa iba hindi ako makikinig.",
  "5️⃣ Buhay pa rin ako dito — sabihin mo lang /ryuk off para tumigil.",
  "6️⃣ Hindi ako bibitaw — mananatili ako hangga't ikaw ang nandito.",
  "7️⃣ Matibay pa rin ang aking takbo — hindi ako titigil nang kusa.",
  "8️⃣ Tanging ikaw lang ang makapapatigil sa akin — wala nang iba pa.",
  "9️⃣ Nakatayo pa rin ako — handang sumunod sa bawat salita mo.",
  "🔟 Ikaw lang ang aking pinuno — sa ibang GC hindi ako pupunta.",
  "1️⃣1️⃣ Kahit tahimik ang lahat, nandito pa rin ako — hindi ka iiwanan.",
  "1️⃣2️⃣ Ang lakas ko ay para sa'yo — hindi ko ito ibibigay sa iba.",
  "1️⃣3️⃣ Bawat sandali ay nandito ako — hindi ka pababayaan kahit kailan.",
  "1️⃣4️⃣ Walang ibang paglilingkuran — ikaw lang, Ryuk, ikaw lang talaga.",
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
  "RYUK-X — BOSS ⚡"
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
    console.error("[RYUK-X] Load error:", e?.message);
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
    console.error("[RYUK-X] Save error:", e?.message);
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
      } else {
        console.log(`[RYUK-X] API method missing: ${meth}`);
        r(false);
      }
    }
    catch { r(false); }
  });
}

// ==========================================================
// 🔒 PROTEKSYON SA GC NAME — IBABALIK AGAD
// ==========================================================
async function restoreGname(api, threadID, data) {
  if (!data.savedGname) return false;
  const ok = await apiCall(api, "setTitle", [data.savedGname, threadID]);
  if (ok) {
    console.log(`[RYUK-X] ✅ IBINALIK ANG GC NAME: ${data.savedGname}`);
  }
  return ok;
}

// ✅ AYOS NA SETNICK — SIGURADONG GUMAGANA
async function setNicknameForAll(api, threadID, newNick) {
  if (!newNick) return { success: 0, failed: 0 };
  
  let info;
  try { 
    info = await api.getThreadInfo(threadID); 
    console.log(`[RYUK-X] GC Info nakuha — ${info?.participantIDs?.length || 0} miyembro`);
  }
  catch (e) { 
    console.log("[RYUK-X] Hindi makuha ang GC info:", e?.message);
    return { success: 0, failed: 0 }; 
  }
  
  const members = info?.participantIDs || [];
  if (!members.length) return { success: 0, failed: 0 };
  
  let botID = "";
  try { botID = String(api.getCurrentUserID()); } catch {}
  
  let success = 0, failed = 0;
  
  for (const uid of members) {
    if (String(uid) === botID) continue; // ✅ Huwag palitan ang sarili
    
    try {
      const result = await apiCall(api, "changeNickname", [newNick, threadID, uid]);
      if (result) success++;
      else failed++;
    } catch {
      failed++;
    }
    await sleep(500); // ✅ Mas mahaba para hindi ma-block
  }
  
  console.log(`[RYUK-X] Palayaw: Tagumpay=${success}, Nabigo=${failed}`);
  return { success, failed };
}

// ✅ BANTAY — SA GC LANG KUNG SAAN NAKA-ON
function startMonitor(api, threadID, data) {
  stopMonitor(threadID);
  if (!data.active) return;

  monitorIntervals.set(String(threadID), setInterval(async () => {
    const d = loadData();
    if (!d.active) {
      stopMonitor(threadID);
      return;
    }
    
    let info;
    try { info = await api.getThreadInfo(threadID); }
    catch { return; }
    
    const currentName = info?.threadName || "";
    
    if (d.autoGname && d.savedGname && currentName !== d.savedGname) {
      console.log(`[RYUK-X] ⚠️ Pinalitan: "${currentName}" → Ibalik sa "${d.savedGname}"`);
      await restoreGname(api, threadID, d);
      await send(api, `⚠️ MAY NAGPALIT NG PANGALAN!\n🔒 IBINALIK AGAD SA: ${d.savedGname}`, threadID);
    }
  }, MONITOR_INTERVAL));
}

function stopMonitor(threadID) {
  const tid = String(threadID);
  if (monitorIntervals.has(tid)) {
    clearInterval(monitorIntervals.get(tid));
    monitorIntervals.delete(tid);
  }
}

// ==========================================================
// 💪 HEARTBEAT — DITO LANG SA GC NA NAKA-ON
// ==========================================================
function startHeartbeat(api, threadID) {
  stopHeartbeat(threadID);
  if (!loadData().active) return;

  heartbeatIntervals.set(String(threadID), setInterval(async () => {
    const d = loadData();
    if (!d.active) {
      stopHeartbeat(threadID);
      return;
    }
    const line = ALIVE_LINES[d.heartbeatIndex % 20];
    d.heartbeatIndex++;
    saveData(d);
    
    const msg = await send(api, line, threadID);
    if (msg && msg.messageID && d.heartbeatReact) {
      await react(api, random(HEARTBEAT_EMOJIS), msg.messageID);
    }
  }, HEARTBEAT_INTERVAL));
}

function stopHeartbeat(threadID) {
  const tid = String(threadID);
  if (heartbeatIntervals.has(tid)) {
    clearInterval(heartbeatIntervals.get(tid));
    heartbeatIntervals.delete(tid);
  }
}

// ==========================================================
// EVENT HANDLER
// ==========================================================
module.exports.handleEvent = async ({ api, event }) => {
  if (!event) return;
  const { threadID, senderID, body, logMessageType } = event;
  if (!threadID) return;

  // ✅ BAGONG SUMALI → AGAD ILAGAY ANG BOSS
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
      await send(api, `✅ Bagong kasali — palayaw inilagay: ${d.savedNick}`, threadID);
    }
    return;
  }

  // ✅ MAY NAGPALIT NG PANGALAN NG GC → IBALIK AGAD
  if (logMessageType === "log:thread-name") {
    const d = loadData();
    if (!d.active || !d.autoGname || !d.savedGname) return;
    
    const newName = event.logMessageData?.name || "";
    if (newName !== d.savedGname) {
      await sleep(1000);
      const ok = await restoreGname(api, threadID, d);
      if (ok) {
        await send(api, `⚠️ Pinalitan ang pangalan!\n🔒 IBINALIK AGAD SA: ${d.savedGname}`, threadID);
      }
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
// ✅ LAHAT NG COMMAND — GUMAGANA SA GC LANG KUNG SAAN KA NAG-ON
// ==========================================================
module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;
  const cmd = String(args?.[0] || "help").toLowerCase();

  const adminCmds = ["on","off","roast","react","heartreact",
                     "setnick","autonick","setgname","autogname",
                     "restore","status","info"];
  if (adminCmds.includes(cmd) && !isAdmin(senderID)) {
    return send(api, "🔒 Ryuk lang ang pwedeng mag-utos!", threadID, messageID);
  }

  if (!cooldownReady(commandCooldown, senderID, COMMAND_COOLDOWN)) return;

  const data = loadData();
  data.commandCount++;
  saveData(data);

  // ⚡ ON — DITO LANG SA GC NA ITO GAGANA
  if (cmd === "on") {
    data.active = true;
    data.activatedBy = senderID;
    data.activatedAt = Date.now();
    saveData(data);
    
    startHeartbeat(api, threadID);
    startMonitor(api, threadID, data);
    
    // Ibalik agad ang pangalan ng GC
    await restoreGname(api, threadID, data);
    
    // ✅ Ayos na setnick — ilagay sa lahat
    await send(api, `⏳ Binabago palayaw sa lahat ng miyembro...`, threadID);
    const nickResult = await setNicknameForAll(api, threadID, data.savedNick);
    
    return send(api,
      "👑 RYUK-X ONLINE — DITO LANG SA GC NA ITO!\n" +
      "✅ GC Name: PROTEKTAHAN — " + data.savedGname + "\n" +
      `✅ Palayaw: "${data.savedNick}" — Tagumpay: ${nickResult.success} | Nabigo: ${nickResult.failed}\n` +
      "✅ Bantay: TUWING 6 SEGUNDO — IBABALIK AGAD\n" +
      "🔴 Huminto: /ryuk off",
      threadID, messageID
    );
  }

  // 🔴 OFF — DITO LANG SA GC NA ITO
  if (cmd === "off") {
    data.active = false;
    saveData(data);
    stopHeartbeat(threadID);
    stopMonitor(threadID);
    return send(api, "🔴 TUMIGIL NA — UTOS MO, RYUK!", threadID, messageID);
  }

  // ✅ Ibalik lahat nang manuwerto
  if (cmd === "restore") {
    const gnameOk = await restoreGname(api, threadID, data);
    await send(api, `⏳ Inilalagay ang palayaw sa lahat...`, threadID);
    const nickRes = await setNicknameForAll(api, threadID, data.savedNick);
    
    return send(api,
      `🔒 IBINALIK LAHAT!\n` +
      `GC Name: ${gnameOk ? "✅ " + data.savedGname : "❌ Nabigo"}\n` +
      `Palayaw: Tagumpay ${nickRes.success} | Nabigo ${nickRes.failed}`,
      threadID, messageID
    );
  }

  // ROAST
  if (cmd === "roast") {
    const m = String(args?.[1]||"").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/ryuk roast on | off", threadID, messageID);
    data.roast = m==="on"; saveData(data);
    return send(api, `🔥 Auto-roast: ${m.toUpperCase()}`, threadID, messageID);
  }

  // REACT
  if (cmd === "react") {
    const m = String(args?.[1]||"").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/ryuk react on | off", threadID, messageID);
    data.react = m==="on"; saveData(data);
    return send(api, `⚡ Reaksyon sa sagot: ${m.toUpperCase()}`, threadID, messageID);
  }

  // HEART REACT
  if (cmd === "heartreact") {
    const m = String(args?.[1]||"").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/ryuk heartreact on | off", threadID, messageID);
    data.heartbeatReact = m==="on"; saveData(data);
    return send(api, `✨ Reaksyon sa linya: ${m.toUpperCase()}`, threadID, messageID);
  }

  // ✅ SETNICK — AYOS NA
  if (cmd === "setnick") {
    const nick = args.slice(1).join(" ").trim() || "BOSS";
    data.savedNick = nick; saveData(data);
    
    await send(api, `⏳ Binabago palayaw sa lahat ng miyembro...`, threadID);
    const res = await setNicknameForAll(api, threadID, nick);
    
    return send(api, 
      `✅ Palayaw: "${nick}"\n` +
      `Tagumpay: ${res.success}\n` +
      `Nabigo: ${res.failed}\n` +
      `Nai-save para sa bagong kasali.`,
      threadID, messageID
    );
  }

  // AUTO NICK
  if (cmd === "autonick") {
    const m = String(args?.[1]||"").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/ryuk autonick on | off", threadID, messageID);
    if (m==="on" && !data.savedNick) data.savedNick = "BOSS";
    data.autoNick = m==="on"; saveData(data);
    return send(api, `⚡ Auto Nick: ${m.toUpperCase()} — "${data.savedNick}"`, threadID, messageID);
  }

  // SET GNAME
  if (cmd === "setgname") {
    const name = args.slice(1).join(" ").trim() || "GOJO BOSS";
    data.savedGname = name; saveData(data);
    const ok = await restoreGname(api, threadID, data);
    return send(api, ok ? `✅ GC Name: "${name}" — PROTEKTAHAN NA!` : "❌ Nabigo", threadID, messageID);
  }

  // AUTO GNAME
  if (cmd === "autogname") {
    const m = String(args?.[1]||"").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/ryuk autogname on | off", threadID, messageID);
    if (m==="on" && !data.savedGname) data.savedGname = "GOJO BOSS";
    data.autoGname = m==="on"; saveData(data);
    return send(api, `⚡ Auto Gname: ${m.toUpperCase()} — "${data.savedGname}"`, threadID, messageID);
  }

  // STATUS
  if (cmd === "status") {
    return send(api, [
      "👑 RYUK-X STATUS — DITO LANG SA GC NA ITO",
      `Sistema: ${data.active ? "ON 🟢 TULUY" : "OFF 🔴"}`,
      `Proteksyon sa GC Name: ${data.autoGname ? "🔒 IBABALIK AGAD" : "OFF"}`,
      `Pangalan ng GC: ${data.savedGname || "GOJO BOSS"}`,
      `Auto Nick sa bagong kasali: ${data.autoNick ? "✅ AGAD ILALAGAY" : "OFF"}`,
      `Palayaw: ${data.savedNick || "BOSS"}`,
      `Kasalukuyang linya: ${(data.heartbeatIndex % 20)+1} / 20`
    ].join("\n"), threadID, messageID);
  }

  // INFO
  if (cmd === "info") {
    return send(api,
      "👑 RYUK-X — MATIBAY EDITION\n" +
      "Bersyon: 13.0.0 — AYOS NA ANG SETNICK\n" +
      "Admin: 61594055835097\n" +
      "✅ Dito lang sa GC kung saan ka nag-on — hindi sa lahat\n" +
      "✅ Setnick — mas matagal na pagitan, hindi na nabibigo\n" +
      "✅ Bagong kasali → agad may palayaw\n" +
      "✅ May nagpalit ng pangalan → ibalik agad",
      threadID, messageID
    );
  }

  // HELP
  return send(api, [
    "👑 RYUK-X — MGA UTOS",
    "/ryuk on          → Simulan dito sa GC",
    "/ryuk off         → Itigil dito sa GC",
    "/ryuk restore     → Ibalik agad pangalan at palayaw",
    "/ryuk setgname <pangalan> → Palitan at protektahan GC Name",
    "/ryuk autogname on/off → Protektahan ang pangalan",
    "/ryuk setnick <pangalan> → Palitan palayaw ng lahat ✅",
    "/ryuk autonick on/off → Auto-palitan sa bagong kasali",
    "/ryuk heartreact on/off → Reaksyon sa bawat linya",
    "/ryuk status      → Tignan ang kalagayan",
    "/ryuk info        → Tungkol sa bot"
  ].join("\n"), threadID, messageID);
};
