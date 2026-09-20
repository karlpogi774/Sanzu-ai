// ==========================================================
// RYUK — MAKUNAT VERSION 1.0 INFINITE
// HINDI TITIGIL | BUONG ARAW | WALANG MALI KAHIT ISA
// DITO LANG SA GC | AUTO RECOVER | WALANG HIHINTO
// ADMIN: 61594055835097
// ==========================================================

const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "ryuk",
  version: "11.0.0",
  hasPermission: 0,
  credits: "ryuk — makunat",
  description: "hindi titigil kahit kailan — protektado lahat",
  usePrefix: true,
  commandCategory: "ryuk",
  usages: "/ryuk help",
  cooldowns: 2
};

const ADMIN_ID = "61594055835097";
const DATA_FILE = path.join(__dirname, "ryuk_data.json");

const DEFAULT_DATA = {
  active: false,
  roast: true,
  react: true,
  heartbeatReact: true,
  autoGname: true,
  autoNick: true,
  savedGname: "GOJO BOSS",
  savedNick: "BOSS",
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
const NICK_DELAY = 700;
const RESTORE_GNAME_COOLDOWN = 10000;

const processing = new Set();
const roastCooldown = new Map();
const commandCooldown = new Map();
const joinCooldown = new Map();
const heartbeatIntervals = new Map();
const monitorIntervals = new Map();
const threadLocks = new Map();

const ALIVE_LINES = [
  "nandito pa rin ako, hindi hihinto hangga't hindi mo sinasabing huminto.",
  "kahit walang magsalita, nandito lang ako para sa'yo.",
  "handa ako sa bawat utos mo — sabihin mo lang at gagawin ko agad.",
  "ikaw lang ang aking sundin — sa iba hindi ako makikinig.",
  "buhay pa rin ako dito — sabihin mo lang /ryuk off para tumigil.",
  "hindi ako bibitaw — mananatili ako hangga't ikaw ang nandito.",
  "matibay pa rin ang aking takbo — hindi ako titigil nang kusa.",
  "tanging ikaw lang ang makapapatigil sa akin — wala nang iba pa.",
  "nakatayo pa rin ako — handang sumunod sa bawat salita mo.",
  "ikaw lang ang aking pinuno — sa ibang gc hindi ako pupunta.",
  "kahit tahimik ang lahat, nandito pa rin ako — hindi ka iiwanan.",
  "ang lakas ko ay para sa'yo — hindi ko ito ibibigay sa iba.",
  "bawat sandali ay nandito ako — hindi ka pababayaan kahit kailan.",
  "walang ibang paglilingkuran — ikaw lang, ikaw lang talaga.",
  "habang buhay ka, buhay din ako — tuloy ang ating samahan.",
  "hindi ako magpapahinga — hangga't hindi mo sinasabing itigil na.",
  "dito lang ako mananatili — sa piling mo, sa ating lugar na ito.",
  "ang bawat salita ko ay para sa'yo — hindi para sa iba pang tao.",
  "walang makapapatigil sa akin — ikaw lang ang may kapangyarihan.",
  "ito man ang huling linya, babalik ako — hangga't ikaw ang kasama ko.",
  "bago mag-iba ang lahat, nandito pa rin ako — hindi lumalayo.",
  "walang pagod, walang hinto — hangga't ikaw ang kasama ko.",
  "tuloy ang takbo, tuloy ang pagbabantay — hindi ka iiwan.",
  "kahit ilang araw pa, ganyan pa rin ako — hindi magbabago.",
  "ang pangako ko ay habangbuhay — hindi ako bibitaw sa'yo.",
  "tuwing sasapit ang oras, babalik ako — hindi nawawala.",
  "walang araw na hindi kita alalahanin — nandito lang ako palagi.",
  "kahit mahaba ang katahimikan, hindi ako aalis sa piling mo.",
  "ang ating samahan ay hindi mapuputol — tuloy lang.",
  "hindi matitinag, hindi mapapagod — ganyan ako para sa'yo.",
  "tuwing magsisimula ang araw, nandito na ako — naghihintay.",
  "walang katapusan ang pagbabantay — hangga't buhay tayo.",
  "hindi ako magsasawang magsabi — nandito pa rin ako.",
  "ang bawat segundo ay patunay — hindi ako lumilisan.",
  "walang hangganan ang pananatili — ikaw lang ang utos ko.",
  "kahit magbago ang lahat, hindi magbabago ang pagsunod ko.",
  "dito lang, palagi — walang pag-iwan, walang pagtalikod.",
  "ang tibay ng loob ko ay galing sa'yo — hindi hihina.",
  "hindi matatapos ang paglilingkod — walang hangganan.",
  "tuwing babalik ka, nandito na ako — handang sumunod ulit."
];

const HEARTBEAT_EMOJIS = ["🔥", "⚡", "💪", "👑", "✨", "🖤", "⚔️", "🛡️"];
const ROASTS = [
  "grabe yung lakas ng loob mag-send 💀",
  "kailangan pa siguro ayusin yung sinabi mo 🤣",
  "ang lakas ng loob pero yung mensahe... 🤣",
  "ano nga ba ang ibig sabihin niyan? 💀",
  "kanina pa tahimik ang gc tapos biglang ganito 😂",
  "ibang klase yung pagka-random mo 💀",
  "pasensya na pero hindi ko maintindihan 🤣",
  "ang lakas ng loob mag-send talaga 😂",
  "muntik nang masaktan yung guro ng balarila 💀",
  "ang dami kong tanong sa sinabi mo 😂",
  "ang tapang mo talaga ngayon 💀",
  "ryuk — gojo boss ⚡",
  "anong sinabi mo? ulitin mo nga 🤣",
  "mukhang kailangan ng ayos yung sinulat mo 💀",
  "lakas ng loob walang kasunod 😂"
];
const EMOJIS = ["🔥", "💀", "🤣", "😆", "🤡", "⚡", "💪"];

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
    console.error("[ryuk] load error — gumamit ng default:", e?.message);
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

function isAdmin(id) { return String(id) === String(ADMIN_ID); }
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
function apiCall(api, meth, args) {
  return new Promise(r => {
    if (!api || typeof api[meth] !== "function") return r(false);
    try { api[meth](...args, e=>r(!e)); }
    catch { r(false); }
  });
}

async function restoreGname(api, threadID, data) {
  if (!data.savedGname) return false;
  const now = Date.now();
  if (now - (data.lastRestoreGname || 0) < RESTORE_GNAME_COOLDOWN) {
    console.log("[ryuk] bawal pang ibalik — hintay sandali");
    return false;
  }
  const ok = await apiCall(api, "setTitle", [data.savedGname, threadID]);
  if (ok) {
    data.lastRestoreGname = now;
    saveData(data);
    console.log("[ryuk] ✅ ibinalik gc name:", data.savedGname);
  }
  return ok;
}

async function setNickAll(api, threadID, nick) {
  if (!nick) return { success:0, failed:0 };
  const lockKey = `nick_${threadID}`;
  if (threadLocks.get(lockKey)) {
    console.log("[ryuk] ginagawa na — huwag ulitin");
    return { success:0, failed:0 };
  }
  threadLocks.set(lockKey, true);
  
  let info;
  try { 
    info = await api.getThreadInfo(threadID); 
  } catch (e) { 
    console.log("[ryuk] hindi makuha ang gc info:", e?.message);
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
  
  let s=0, f=0;
  for (const uid of members) {
    if (String(uid) === botID) continue;
    const result = await apiCall(api, "changeNickname", [nick, threadID, uid]);
    if (result) s++;
    else f++;
    await sleep(NICK_DELAY);
  }
  
  console.log(`[ryuk] palayaw — tagumpay: ${s} | nabigo: ${f}`);
  threadLocks.delete(lockKey);
  return { success:s, failed:f };
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
  console.log("[ryuk] ✅ nagbantay sa gc:", tid);
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
  console.log("[ryuk] ✅ tumitibok sa gc:", tid);
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
      await sleep(NICK_DELAY);
    }
    
    if (added.length > 0) {
      await send(api, "✅ bagong kasali → palayaw: " + d.savedNick, threadID);
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

  const adminCmds = ["on","off","restore","setnick","autonick","setgname","autogname","roast","react","heartreact","status","info"];
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
      "👑 ryuk — ONLINE DITO SA GC!\n" +
      "✅ gc name: " + data.savedGname + " — PROTEKTADO\n" +
      "✅ palayaw: \"" + data.savedNick + "\" — tagumpay: " + nickRes.success + " | nabigo: " + nickRes.failed + "\n" +
      "🔴 itigil: /ryuk off\n" +
      "💪 MAKUNAT — hindi titigil buong araw!",
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
      "gc: " + (gOk ? "✅ " + data.savedGname : "❌ hindi muna — hintay sandali") + "\n" +
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
      "tagumpay: " + res.success + "\nnabigo: " + res.failed,
      threadID, messageID
    );
  }

  if (cmd === "setgname") {
    const name = args.slice(1).join(" ").trim() || "GOJO BOSS";
    data.savedGname = name; saveData(data);
    const ok = await restoreGname(api, threadID, data);
    return send(api, ok ? "✅ gc name: \"" + name + "\" — PROTEKTADO NA!" : "✅ itinakda — ibabalik kapag pinalitan", threadID, messageID);
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
      "sistema: " + (data.active ? "ON 🟢 — HINDI TITIGIL" : "OFF 🔴"),
      "gc name: " + data.savedGname + (data.autoGname ? " — 🔒 PROTEKTADO" : ""),
      "palayaw: " + data.savedNick + (data.autoNick ? " — ✅ AUTO SA BAGONG KASALI" : ""),
      "linya: " + ((data.heartbeatIndex % ALIVE_LINES.length) + 1) + "/" + ALIVE_LINES.length,
      "bantay: tuwing 5s | tibok: tuwing 20s"
    ].join("\n"), threadID, messageID);
  }

  if (cmd === "info") {
    return send(api,
      "👑 ryuk — MAKUNAT INFINITE\n" +
      "admin: 61594055835097\n" +
      "✅ hindi titigil — walang oras na hangganan\n" +
      "✅ dito lang sa gc — hindi sa iba\n" +
      "✅ gc name — ibabalik agad kapag pinalitan\n" +
      "✅ palayaw — sa lahat, ligtas na bilis\n" +
      "✅ bagong sumali — agad may palayaw\n" +
      "✅ walang mali — bawat linya ay sinuri\n" +
      "✅ ryuk lang — simple, malinis, matibay",
      threadID, messageID
    );
  }

  return send(api, [
    "👑 ryuk — MGA UTOS",
    "/ryuk on          → simulan dito sa gc",
    "/ryuk off         → itigil dito sa gc",
    "/ryuk restore     → ibalik agad pangalan at palayaw",
    "/ryuk setgname <pangalan> → itakda pangalan ng gc",
    "/ryuk autogname on/off → protektahan pangalan ng gc",
    "/ryuk setnick <pangalan> → itakda palayaw ng lahat",
    "/ryuk autonick on/off → auto-palitan sa bagong kasali",
    "/ryuk roast on/off → awtomatikong sagot",
    "/ryuk status      → tignan kalagayan",
    "/ryuk info        → tungkol sa akin"
  ].join("\n"), threadID, messageID);
};
  
