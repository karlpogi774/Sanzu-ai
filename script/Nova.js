// ==========================================================
// NOVA X — RYUK PINAKAMATIBAY 💪🔥
// AUTO RESTORE GC NAME + NICKNAME | HINDI NA MAPAPALITAN
// ADMIN: 61594055835097 | GOJO BOSS — IBABALIK AGAD
// ==========================================================

const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "nova",
  version: "12.0.0",
  hasPermission: 0,
  credits: "RYUK — 61594055835097 👑",
  description: "AUTO RESTORE GC NAME + NICKNAME — HINDI NA MAPAPALITAN",
  usePrefix: true,
  commandCategory: "RYUK SYSTEM",
  usages: "/nova help",
  cooldowns: 2
};

const ADMIN_ID = "61594055835097";
const DATA_FILE = path.join(__dirname, "nova_ryuk_data.json");

const DEFAULT_DATA = {
  active: false,
  roast: true,
  react: true,
  heartbeatReact: true,
  
  autoGname: true,
  autoNick: true,
  savedGname: "GOJO BOSS", // ✅ NAKA-SET NA AGAD
  savedNick: "GOJO BOSS",  // ✅ NAKA-SET NA AGAD
  
  lastGname: "GOJO BOSS",
  lastCheckGname: "",
  lastCheckNick: {},
  
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
const MONITOR_INTERVAL = 8000; // ✅ TUWING 8 SEGUNDO — TIGNAN KUNG NAPALITAN

const processing = new Set();
const roastCooldown = new Map();
const commandCooldown = new Map();
const joinCooldown = new Map();
const heartbeatIntervals = new Map();
const monitorIntervals = new Map();

// ==========================================================
// ✅ 20 TAGALOG LINES — TULUY-TULOY + AUTO REACT
// ==========================================================
const ALIVE_LINES = [
  "1️⃣ Nandito pa rin ako, hindi hihinto hangga't hindi mo sinasabing huminto.",
  "2️⃣ Kahit walang magsalita, nandito lang ako para sa'yo, Ryuk.",
  "3️⃣ Handa ako sa bawat utos mo — sabihin mo lang at gagawin ko agad.",
  "4️⃣ Ikaw lang ang aking sundin — sa iba hindi ako makikinig.",
  "5️⃣ Buhay pa rin ako dito — sabihin mo lang /nova off para tumigil.",
  "6️⃣ Hindi ako bibitaw — mananatili ako hangga't ikaw ang nandito.",
  "7️⃣ Matibay pa rin ang aking takbo — hindi ako titigil nang kusa.",
  "8️⃣ Tanging ikaw lang ang makapapatigil sa akin — wala nang iba pa.",
  "9️⃣ Nakatayo pa rin ako — handang sumunod sa bawat salita mo.",
  "🔟 Ikaw lang ang aking pinuno — sa ibang lugar hindi ako pupunta.",
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
  "NOVA X — GOJO BOSS ⚡"
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
// 🔒 AWTOMATIKONG IBINABALIK — GC NAME AT PALAYAW
// ==========================================================
async function restoreGname(api, threadID, data) {
  if (!data.savedGname) return false;
  const ok = await apiCall(api, "setTitle", [data.savedGname, threadID]);
  if (ok) {
    console.log(`[RYUK] ✅ IBINALIK ANG GC NAME: ${data.savedGname}`);
    data.lastGname = data.savedGname;
    saveData(data);
  }
  return ok;
}

async function restoreNickForAll(api, threadID, data) {
  if (!data.savedNick) return false;
  let info;
  try { info = await api.getThreadInfo(threadID); }
  catch { return false; }
  
  const members = info?.participantIDs || [];
  if (!members.length) return false;
  
  let okCount = 0;
  for (const uid of members) {
    if (await apiCall(api, "changeNickname", [data.savedNick, threadID, uid])) {
      okCount++;
    }
    await sleep(300);
  }
  console.log(`[RYUK] ✅ IBINALIK ANG PALAYAW SA ${okCount} NA MIYEMBRO`);
  return okCount > 0;
}

// ✅ BANTAY — TUWING 8 SEGUNDO TIGNAN KUNG NAPALITAN
function startMonitor(api, threadID) {
  stopMonitor(threadID);
  const data = loadData();
  if (!data.active) return;

  console.log(`[RYUK] 🔒 BANTAY NAKABUKAS — IBABALIK AGAD ANG GOJO BOSS`);

  monitorIntervals.set(String(threadID), setInterval(async () => {
    const d = loadData();
    if (!d.active) {
      stopMonitor(threadID);
      return;
    }
    
    // TIGNAN KUNG NAPALITAN ANG GC NAME
    let info;
    try { info = await api.getThreadInfo(threadID); }
    catch { return; }
    
    const currentName = info?.threadName || "";
    
    // KUNG HINDI TUGMA SA SAVED — IBALIK AGAD
    if (d.autoGname && d.savedGname && currentName !== d.savedGname) {
      console.log(`[RYUK] ⚠️ NAPALITAN ANG GC NAME: "${currentName}" → IBABALIK SA "${d.savedGname}"`);
      await restoreGname(api, threadID, d);
      await send(api, `⚠️ MAY NAGPALIT NG GC NAME!\n🔒 IBINALIK AGAD SA: ${d.savedGname}`, threadID);
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
// 💪 HEARTBEAT — TULUY-TULOY + AUTO REACT
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
// EVENT HANDLER — BAGONG SUMALI → AGAD PALITAN PALAYAW
// ==========================================================
module.exports.handleEvent = async ({ api, event }) => {
  if (!event) return;
  const { threadID, senderID, body, logMessageType } = event;
  if (!threadID) return;

  // ✅ BAGONG SUMALI → AGAD ILAGAY ANG GOJO BOSS
  if (logMessageType === "log:subscribe") {
    if (!cooldownReady(joinCooldown, threadID, JOIN_COOLDOWN)) return;
    const added = event.logMessageData?.addedParticipants || [];
    if (!added.length) return;
    
    const data = loadData();
    let botID = "";
    try { botID = String(api.getCurrentUserID()); } catch {}

    if (data.autoNick && data.savedNick) {
      for (const m of added) {
        const uid = String(m.userFbId || m.id || "");
        if (!uid || uid === botID) continue;
        await apiCall(api, "changeNickname", [data.savedNick, threadID, uid]);
        await sleep(400);
      }
      if (added.length > 0) {
        await send(api, `✅ Bagong kasali — palayaw inilagay: ${data.savedNick}`, threadID);
      }
    }

    if (data.autoGname && data.savedGname) {
      await apiCall(api, "setTitle", [data.savedGname, threadID]);
    }
    return;
  }

  // ✅ MAY NAGPALIT NG GC NAME MANUALLY → IBALIK AGAD
  if (logMessageType === "log:thread-name") {
    const data = loadData();
    if (!data.active || !data.autoGname || !data.savedGname) return;
    
    const newName = event.logMessageData?.name || "";
    if (newName !== data.savedGname) {
      await sleep(1000);
      await restoreGname(api, threadID, data);
      await send(api, `⚠️ Pinalitan ang GC Name!\n🔒 IBINALIK AGAD SA: ${data.savedGname}`, threadID);
    }
    return;
  }

  // AUTO ROAST
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
    if (info?.messageID && data.react) await react(api, random(EMOJIS), info.messageID);
    data.roastCount++;
    saveData(data);
  } finally {
    processing.delete(String(threadID));
  }
};

// ==========================================================
// ✅ LAHAT NG COMMAND — GUMAGANA
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

  // ⚡ ON — SIMULAN LAHAT + BANTAY
  if (cmd === "on") {
    data.active = true;
    data.activatedBy = senderID;
    data.activatedAt = Date.now();
    saveData(data);
    
    startHeartbeat(api, threadID);
    startMonitor(api, threadID); // ✅ BANTAY NAKABUKAS
    
    // I-set agad ang GOJO BOSS
    await restoreGname(api, threadID, data);
    await restoreNickForAll(api, threadID, data);
    
    return send(api,
      "👑 NOVA X — RYUK ONLINE!\n" +
      "✅ GC Name: PINANGALANANG GOJO BOSS — HINDI NA MAPAPALITAN\n" +
      "✅ Palayaw: GOJO BOSS — IBINALIK SA LAHAT\n" +
      "✅ Bantay: TUWING 8 SEGUNDO — IBABALIK AGAD\n" +
      "✅ 20 Tagalog Lines + Auto React\n" +
      "🔴 Huminto: /nova off",
      threadID, messageID
    );
  }

  // 🔴 OFF
  if (cmd === "off") {
    data.active = false;
    saveData(data);
    stopHeartbeat(threadID);
    stopMonitor(threadID);
    return send(api, "🔴 TUMIGIL NA — UTOS MO, RYUK!", threadID, messageID);
  }

  // ✅ MANUWAL NA IBALIK LAHAT
  if (cmd === "restore") {
    let gnameOk = await restoreGname(api, threadID, data);
    let nickOk = await restoreNickForAll(api, threadID, data);
    return send(api,
      `🔒 IBINALIK LAHAT!\n` +
      `GC Name: ${gnameOk ? "✅ GOJO BOSS" : "❌ Nabigo"}\n` +
      `Palayaw: ${nickOk ? "✅ GOJO BOSS sa lahat" : "❌ Nabigo"}`,
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
    return send(api, `⚡ Reaksyon sa sagot: ${m.toUpperCase()}`, threadID, messageID);
  }

  // HEART REACT
  if (cmd === "heartreact") {
    const m = String(args?.[1]||"").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/nova heartreact on | off", threadID, messageID);
    data.heartbeatReact = m==="on"; saveData(data);
    return send(api, `✨ Reaksyon sa linya: ${m.toUpperCase()}`, threadID, messageID);
  }

  // SET NICK
  if (cmd === "setnick") {
    const nick = args.slice(1).join(" ").trim() || "GOJO BOSS";
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
      await sleep(300);
    }
    return send(api, `✅ Palayaw: "${nick}"\nTagumpay: ${ok} | Nabigo: ${no}`, threadID, messageID);
  }

  // AUTO NICK
  if (cmd === "autonick") {
    const m = String(args?.[1]||"").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/nova autonick on | off", threadID, messageID);
    if (m==="on" && !data.savedNick) data.savedNick = "GOJO BOSS";
    data.autoNick = m==="on"; saveData(data);
    return send(api, `⚡ Auto Nick: ${m.toUpperCase()} — "${data.savedNick}"`, threadID, messageID);
  }

  // SET GNAME
  if (cmd === "setgname") {
    const name = args.slice(1).join(" ").trim() || "GOJO BOSS";
    data.savedGname = name; saveData(data);
    const ok = await apiCall(api, "setTitle", [name, threadID]);
    return send(api, ok ? `✅ GC Name: "${name}" — HINDI NA MAPAPALITAN!` : "❌ Nabigo", threadID, messageID);
  }

  // AUTO GNAME
  if (cmd === "autogname") {
    const m = String(args?.[1]||"").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/nova autogname on | off", threadID, messageID);
    if (m==="on" && !data.savedGname) data.savedGname = "GOJO BOSS";
    data.autoGname = m==="on"; saveData(data);
    return send(api, `⚡ Auto Gname: ${m.toUpperCase()} — "${data.savedGname}"`, threadID, messageID);
  }

  // STATUS
  if (cmd === "status") {
    return send(api, [
      "👑 NOVA X STATUS — RYUK PINAKAMATIBAY",
      `Sistema: ${data.active ? "ON 🟢 TULUY" : "OFF 🔴"}`,
      `Bantay GC Name: ${data.autoGname ? "🔒 PROTEKTAHAN — IBABALIK AGAD" : "OFF"}`,
      `Protektadong Pangalan: ${data.savedGname || "GOJO BOSS"}`,
      `Auto Nick: ${data.autoNick ? "✅ AGAD ILALAGAY SA BAGONG KASALI" : "OFF"}`,
      `Protektadong Palayaw: ${data.savedNick || "GOJO BOSS"}`,
      `Reaksyon sa linya: ${data.heartbeatReact ? "ON ✅" : "OFF"}`,
      `Kasalukuyang linya: ${(data.heartbeatIndex % 20)+1} / 20`
    ].join("\n"), threadID, messageID);
  }

  // INFO
  if (cmd === "info") {
    return send(api,
      "👑 NOVA X — RYUK PINAKAMATIBAY\n" +
      "Bersyon: 12.0.0 — INAYOS ANG PROTEKSYON\n" +
      "Admin: 61594055835097\n" +
      "🔒 GC Name: Kapag pinalitan → IBABALIK AGAD\n" +
      "✅ Bagong kasali → AGAD GOJO BOSS ANG PALAYAW\n" +
      "✅ Bantay tuwing 8 segundo — walang makakalusot",
      threadID, messageID
    );
  }

  // HELP
  return send(api, [
    "👑 NOVA X — MGA UTOS",
    "/nova on          → Simulan + I-set agad GOJO BOSS",
    "/nova off         → Itigil lahat",
    "/nova restore     → Ibalik agad GC Name at Palayaw",
    "/nova setgname <pangalan> → Palitan at protektahan GC Name",
    "/nova autogname on/off → Protektahan ang pangalan ng GC",
    "/nova setnick <pangalan> → Palitan palayaw ng lahat",
    "/nova autonick on/off → Auto-palitan sa bagong kasali",
    "/nova heartreact on/off → Reaksyon sa bawat linya",
    "/nova status      → Tignan ang kalagayan",
    "/nova info        → Tungkol sa bot"
  ].join("\n"), threadID, messageID);
};
  
