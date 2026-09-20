// ==========================================================
// NOVA X — RYUK ULTIMATE 💪🔥
// TAGALOG 20 LINES + AUTO REACT | TULUY-TULOY
// ADMIN: 61594055835097 | SIGURADONG GUMAGANA
// ==========================================================

const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "nova",
  version: "11.0.0",
  hasPermission: 0,
  credits: "RYUK — 61594055835097 👑",
  description: "Tagalog 20 Lines + Auto React — Tuloy-tuloy",
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
  heartbeatReact: true, // ✅ Auto react sa bawat alive line
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
const HEARTBEAT_INTERVAL = 25000;

const processing = new Set();
const roastCooldown = new Map();
const commandCooldown = new Map();
const joinCooldown = new Map();
const heartbeatIntervals = new Map();

// ==========================================================
// ✅ 20 TAGALOG LINES — BAWAT LINYA TAMA AT MALINAW
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
  "NOVA X — Buhay pa para kay Ryuk ⚡"
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
// 💪 HEARTBEAT — TAGALOG LINES + AUTO REACT SA BAWAT LINYA ✅
// ==========================================================
function startHeartbeat(api, threadID) {
  stopHeartbeat(threadID);
  if (!loadData().active) return;

  console.log(`[RYUK] ⚡ NAKABUKAS — TAGALOG 20 LINES + REACT`);

  heartbeatIntervals.set(String(threadID), setInterval(async () => {
    const d = loadData();
    if (!d.active) {
      stopHeartbeat(threadID);
      return;
    }
    // Kunin ang linya — umuulit kapag tapos na
    const line = ALIVE_LINES[d.heartbeatIndex % 20];
    d.heartbeatIndex++;
    saveData(d);
    
    // Ipadala ang linya
    const msg = await send(api, line, threadID);
    
    // ✅ AUTO REACT SA BAWAT LINYA — SIGURADONG GUMAGANA
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
    console.log(`[RYUK] 🔴 HUMINTO`);
  }
}

// ==========================================================
// EVENT HANDLER
// ==========================================================
module.exports.handleEvent = async ({ api, event }) => {
  if (!event) return;
  const { threadID, senderID, body, logMessageType } = event;
  if (!threadID) return;

  // BAGONG MIYEMBRO — AUTO NICK & AUTO GNAME
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
    }
    if (data.autoGname && data.savedGname) {
      await apiCall(api, "setTitle", [data.savedGname, threadID]);
    }
    return;
  }

  // AUTO ROAST SA MENSAHE
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

  const adminCmds = ["on","off","roast","react","heartreact","setnick","autonick","setgname","autogname","status","info"];
  if (adminCmds.includes(cmd) && !isAdmin(senderID)) {
    return send(api, "🔒 Ryuk lang ang pwedeng mag-utos!", threadID, messageID);
  }

  if (!cooldownReady(commandCooldown, senderID, COMMAND_COOLDOWN)) return;

  const data = loadData();
  data.commandCount++;
  saveData(data);

  // ⚡ ON — SIMULAN LAHAT
  if (cmd === "on") {
    data.active = true;
    data.activatedBy = senderID;
    data.activatedAt = Date.now();
    saveData(data);
    startHeartbeat(api, threadID);
    return send(api,
      "👑 NOVA X — RYUK ONLINE!\n" +
      "✅ 20 TAGALOG LINES — Tuloy-tuloy\n" +
      "✅ AUTO REACT SA BAWAT LINYA — Gumagana!\n" +
      "🔴 Huminto: /nova off",
      threadID, messageID
    );
  }

  // 🔴 OFF — ITIGIL LAHAT
  if (cmd === "off") {
    data.active = false;
    saveData(data);
    stopHeartbeat(threadID);
    return send(api, "🔴 TUMIGIL NA — UTOS MO, RYUK!", threadID, messageID);
  }

  // ROAST ON/OFF
  if (cmd === "roast") {
    const m = String(args?.[1]||"").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/nova roast on | off", threadID, messageID);
    data.roast = m==="on"; saveData(data);
    return send(api, `🔥 Auto-roast: ${m.toUpperCase()}`, threadID, messageID);
  }

  // REACT ON/OFF
  if (cmd === "react") {
    const m = String(args?.[1]||"").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/nova react on | off", threadID, messageID);
    data.react = m==="on"; saveData(data);
    return send(api, `⚡ Reaksyon sa sagot: ${m.toUpperCase()}`, threadID, messageID);
  }

  // ✅ HEART REACT — REACT SA ALIVE LINES
  if (cmd === "heartreact") {
    const m = String(args?.[1]||"").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/nova heartreact on | off", threadID, messageID);
    data.heartbeatReact = m==="on"; saveData(data);
    return send(api, `✨ Reaksyon sa linya: ${m.toUpperCase()}`, threadID, messageID);
  }

  // SET NICK
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
    return send(api, `✅ Palayaw: "${nick}"\nTagumpay: ${ok} | Nabigo: ${no}`, threadID, messageID);
  }

  // AUTO NICK
  if (cmd === "autonick") {
    const m = String(args?.[1]||"").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/nova autonick on | off", threadID, messageID);
    if (m==="on" && !data.savedNick) return send(api, "❌ I-set muna: /nova setnick <pangalan>", threadID, messageID);
    data.autoNick = m==="on"; saveData(data);
    return send(api, `⚡ Auto Nick: ${m.toUpperCase()}`, threadID, messageID);
  }

  // SET GNAME
  if (cmd === "setgname") {
    const name = args.slice(1).join(" ").trim();
    if (!name) return send(api, "/nova setgname <pangalan>", threadID, messageID);
    data.savedGname = name; saveData(data);
    const ok = await apiCall(api, "setTitle", [name, threadID]);
    return send(api, ok ? `✅ GC Name: "${name}"` : "❌ Nabigo", threadID, messageID);
  }

  // AUTO GNAME
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
      "👑 NOVA X STATUS — RYUK",
      `Sistema: ${data.active ? "ON 🟢 TULUY-TULOY" : "OFF 🔴"}`,
      `Reaksyon sa linya: ${data.heartbeatReact ? "ON ✅" : "OFF ❌"}`,
      `Auto-roast: ${data.roast ? "ON" : "OFF"}`,
      `Reaksyon sa sagot: ${data.react ? "ON" : "OFF"}`,
      `Auto Nick: ${data.autoNick ? "ON" : "OFF"} | ${data.savedNick || "Hindi nakaset"}`,
      `Auto Gname: ${data.autoGname ? "ON" : "OFF"} | ${data.savedGname || "Hindi nakaset"}`,
      `Kasalukuyang linya: ${(data.heartbeatIndex % 20)+1} / 20`,
      `Bilang ng sagot: ${data.roastCount || 0}`
    ].join("\n"), threadID, messageID);
  }

  // INFO
  if (cmd === "info") {
    return send(api,
      "👑 NOVA X — RYUK ULTIMATE\n" +
      "Bersyon: 11.0.0\n" +
      "Admin: 61594055835097\n" +
      "✅ 20 TAGALOG LINES — Tuloy-tuloy\n" +
      "✅ AUTO REACT SA BAWAT LINYA — Gumagana!\n" +
      "✅ Lahat ng command gumagana nang tama",
      threadID, messageID
    );
  }

  // HELP
  return send(api, [
    "👑 NOVA X — MGA UTOS",
    "/nova on          → Simulan lahat",
    "/nova off         → Itigil lahat",
    "/nova heartreact on/off → Reaksyon sa bawat linya ✅",
    "/nova roast on/off → Awtomatikong sumagot",
    "/nova react on/off → Mag-reak sa sariling sagot",
    "/nova setnick <pangalan> → Palitan palayaw ng lahat",
    "/nova autonick on/off → Auto-palitan sa bagong kasali",
    "/nova setgname <pangalan> → Palitan pangalan ng GC",
    "/nova autogname on/off → Panatilihin pangalan ng GC",
    "/nova status      → Tignan ang kalagayan",
    "/nova info        → Tungkol sa bot"
  ].join("\n"), threadID, messageID);
};
    
