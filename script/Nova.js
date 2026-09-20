// ==========================================================
// NOVA X FIXED | GC-SPECIFIC + AUTO NICK FIXED
// Admin: 61594055835097 | ON SA GC NA 'YUN LANG GAGANA
// Auto Nick: FIXED — gumagana sa bagong kasali 💪
// Version: 8.3.0
// ==========================================================

const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "nova",
  version: "8.3.0",
  hasPermission: 0,
  credits: "NOVA X — FIXED",
  description: "GC-specific ON + Working Auto Nick",
  usePrefix: true,
  commandCategory: "Ultimate/Fixed",
  usages: "/nova on",
  cooldowns: 1
};

const ADMIN_ID = "61594055835097";
const DATA_FILE = path.join(__dirname, "nova_fixed_data.json");

// ✅ PER-GC DATA — HINDI IISA SA LAHAT
const DEFAULT_GC_DATA = {
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
  lastHeartbeat: 0,
  silent: false,
  roastIndex: 0,
  aliveIndex: 0
};

const HEARTBEAT_GAP = 22000;
const ROAST_COOLDOWN = 4000;
const JOIN_COOLDOWN = 3000;

const processing = new Set();
const roastCooldown = new Map();
const joinCooldown = new Map();
const heartbeatLoops = new Map(); // threadID → interval

// ==========================================================
// 🔥 LINES — SUNOD-SUNOD, HINDI RANDOM
// ==========================================================
const ROASTS = [
  "⚡ Nandito lang para sa GC na ito — hindi aalis hangga't walang utos.",
  "💪 Dito lang ako nakatayo — hindi lumilipat sa ibang usapan.",
  "🔥 Bawat sagot ay para sa inyo — hindi ako magkakalat sa iba.",
  "👑 Ikaw lang ang utos ko dito — sa GC na ito lang ako susunod.",
  "✨ Hindi ako naglalakbay sa ibang GC — dito lang ako mananatili.",
  "⚡ Kapag sinabi mong huminto, dito lang ako titigil — wala nang iba.",
  "💪 Ang lakas ko ay dito lang — hindi ko ibibigay sa ibang grupo.",
  "🔥 Dito tayo maglalaban — sa lugar na ito lang tayo magkikita.",
  "👑 Walang ibang GC ang paglilingkuran ko — dito lang, sa'yo lang.",
  "✨ Hindi ako magpapakita sa iba — dito lang ako hangga't buhay ka.",
  "⚡ Ang bawat salita ay para sa GC na ito — hindi para sa iba.",
  "💪 Hindi ako lumilipat-lipat — dito lang ako nakatali sa'yo.",
  "🔥 Kapag buhay dito, dito lang ako — hindi aalis sa piling niyo.",
  "👑 Ikaw lang ang may hawak dito — sa ibang GC wala akong pakialam.",
  "✨ Ang simula ay dito — ang pagtigil ay dito rin lang mangyayari.",
  "⚡ Hindi ako nagkakalat sa iba — dito lang ako nagpapakatotoo.",
  "💪 Dito ko ilalabas ang lakas — wala nang ibang lugar ang paglilingkuran.",
  "🔥 Bawat utos mo dito — dito lang isasagawa, hindi sa iba.",
  "👑 Ang GC na ito ang tahanan ko — hangga't buhay ka, dito ako mananatili."
];

const ALIVE = [
  "⚡ Buhay pa dito — hindi titigil hangga't walang /nova off.",
  "💪 Nandito pa rin sa GC na ito — hindi lumilipat sa iba.",
  "✨ Tuloy-tuloy dito — sa lugar na ito lang tayo mag-usap.",
  "🔥 Handa sa utos mo dito — sabihin lang, gagawin agad.",
  "👑 Dito lang ako — hindi maghahanap ng ibang GC.",
  "⚡ Hindi ako aalis sa inyo — hangga't buhay ang utos mo.",
  "💪 Tahimik man ang iba, dito ako — hindi lumilipat-lipat.",
  "✨ Ang pagtupad ay dito lang — sa GC na ito tayo magtuloy.",
  "🔥 Walang ibang GC ang paglilingkuran ko — dito lang, sa'yo lang.",
  "👑 Ikaw lang ang boss dito — sa iba hindi ako pupunta.",
  "⚡ Bawat oras nandito — hindi ka mag-iisa sa GC na ito.",
  "💪 Hindi ako naglalakbay — dito lang ako nakatayo nang matibay.",
  "✨ Ang tibay ko ay dito — hindi ko ibibigay sa ibang grupo.",
  "🔥 Kung may kailangan dito — sabihin mo lang, handa agad.",
  "👑 Dito tayo magtatapos — kung sabihin mo lang na huminto na."
];

const EMOJIS = ["⚡", "💪", "🔥", "👑", "✨"];

// ==========================================================
// DATABASE — PER-GC STORAGE
// ==========================================================
function loadAllData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return {};
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch { return {}; }
}

function loadGCData(threadID) {
  const all = loadAllData();
  return { ...DEFAULT_GC_DATA, ...(all[String(threadID)] || {}) };
}

function saveGCData(threadID, data) {
  try {
    const all = loadAllData();
    all[String(threadID)] = data;
    const temp = DATA_FILE + ".tmp";
    fs.writeFileSync(temp, JSON.stringify(all, null, 2), "utf8");
    fs.renameSync(temp, DATA_FILE);
    return true;
  } catch (e) {
    console.error("[NOVA X] Save error:", e);
    return false;
  }
}

// ==========================================================
// HELPERS
// ==========================================================
function isAdmin(id) { return String(id) === ADMIN_ID; }
function getNextRoast(data) {
  const line = ROASTS[data.roastIndex % ROASTS.length];
  data.roastIndex++;
  return line;
}
function getNextAlive(data) {
  const line = ALIVE[data.aliveIndex % ALIVE.length];
  data.aliveIndex++;
  return line;
}
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
// 💪 HEARTBEAT — PER-GC LANG
// ==========================================================
function startHeartbeat(api, threadID) {
  stopHeartbeat(threadID);
  const data = loadGCData(threadID);
  if (!data.active) return;

  console.log(`[NOVA X] ⚡ ACTIVE in GC: ${threadID}`);
  
  heartbeatLoops.set(String(threadID), setInterval(async () => {
    const d = loadGCData(threadID);
    if (!d.active) return stopHeartbeat(threadID);
    if (d.silent) return;
    
    const since = Date.now() - d.lastHeartbeat;
    if (since < HEARTBEAT_GAP * 1.3) return;
    
    const msg = getNextAlive(d);
    await send(api, msg, threadID);
    
    d.lastHeartbeat = Date.now();
    saveGCData(threadID, d);
  }, HEARTBEAT_GAP));
}

function stopHeartbeat(threadID) {
  const tid = String(threadID);
  if (heartbeatLoops.has(tid)) {
    clearInterval(heartbeatLoops.get(tid));
    heartbeatLoops.delete(tid);
    console.log(`[NOVA X] 🔴 STOPPED in GC: ${threadID}`);
  }
}

// ==========================================================
// EVENT — FIXED AUTO NICK SA BAGONG KASALI
// ==========================================================
module.exports.handleEvent = async ({ api, event }) => {
  if (!event) return;
  const { threadID, senderID, body, logMessageType } = event;
  if (!threadID) return;

  const d = loadGCData(threadID);
  d.lastHeartbeat = Date.now();
  saveGCData(threadID, d);

  // ✅ BAGONG KASALI — AUTO NICK FIXED
  if (logMessageType === "log:subscribe") {
    if (!cooldownReady(joinCooldown, threadID, JOIN_COOLDOWN)) return;
    joinCooldown.set(String(threadID), Date.now());

    const added = event.logMessageData?.addedParticipants || [];
    if (!added.length) return;

    let botID = "";
    try { botID = String(api.getCurrentUserID()); } catch {}

    // ✅ AUTO NICK — GUMAGANA NG TAMA
    if (d.autoNick && d.savedNick) {
      for (const member of added) {
        const userID = String(member.userFbId || member.id || "");
        if (!userID || userID === botID) continue;
        
        console.log(`[NOVA X] Setting nick for ${userID} → ${d.savedNick}`);
        await apiCall(api, "changeNickname", [d.savedNick, threadID, userID]);
        await sleep(350);
      }
    }

    // ✅ AUTO GC NAME
    if (d.autoGname && d.savedGname) {
      await apiCall(api, "setTitle", [d.savedGname, threadID]);
    }
    return;
  }

  // Normal message — roast
  if (!senderID || !body) return;
  try { if (String(senderID) === String(api.getCurrentUserID())) return; } catch {}
  
  const text = String(body).trim();
  if (!text || text.startsWith("/") || text.startsWith("!")) return;
  if (!d.active || !d.roast || processing.has(String(threadID))) return;
  if (!cooldownReady(roastCooldown, threadID, ROAST_COOLDOWN)) return;

  processing.add(String(threadID));
  try {
    const msgText = getNextRoast(d);
    const msg = await send(api, msgText, threadID);
    if (msg?.messageID && d.react) {
      await react(api, EMOJIS[d.roastIndex % EMOJIS.length], msg.messageID);
    }
    d.roastCount++;
    saveGCData(threadID, d);
  } finally {
    processing.delete(String(threadID));
  }
};

// ==========================================================
// COMMAND — SA GC NA 'YUN LANG GAGANA
// ==========================================================
module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;
  const cmd = String(args?.[0] || "help").toLowerCase();

  const adminCmds = ["on","off","roast","react","silent","setnick","autonick","setgname","autogname","status","info","resetlines"];
  if (adminCmds.includes(cmd) && !isAdmin(senderID)) {
    return send(api, "🔒 Ikaw lang ang boss dito!", threadID, messageID);
  }

  let d = loadGCData(threadID);
  d.commandCount++;
  saveGCData(threadID, d);

  // ⚡ ON — DITO LANG SA GC NA ITO
  if (cmd === "on") {
    d.active = true; d.silent = false;
    d.activatedBy = senderID; d.activatedAt = Date.now();
    saveGCData(threadID, d);
    
    startHeartbeat(api, threadID);
    
    return send(api,
      "⚡ NOVA X — NAKABUKAS SA GC NA ITO LANG!\n" +
      "💪 Hindi gagana sa ibang GC — dito lang ako nakatali.\n" +
      "🔥 Auto Nick: GUMAGANA — awtomatiko sa bagong kasali!\n" +
      "🔴 /nova off lang ang makapapatigil dito.",
      threadID, messageID
    );
  }

  // 🔴 OFF — DITO LANG TUMITIGIL
  if (cmd === "off") {
    d.active = false;
    saveGCData(threadID, d);
    stopHeartbeat(threadID);
    return send(api,
      "🔴 TUMIGIL NA SA GC NA ITO.\n" +
      "⚡ Ibang GC hindi apektado — dito lang huminto.\n" +
      "💪 /nova on para bumalik dito.",
      threadID, messageID
    );
  }

  // ROAST
  if (cmd === "roast") {
    const m = String(args?.[1]||"").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/nova roast on | off", threadID, messageID);
    d.roast = m==="on"; saveGCData(threadID, d);
    return send(api, `🔥 Sagot: ${m.toUpperCase()} — dito lang sa GC na ito`, threadID, messageID);
  }

  // REACT
  if (cmd === "react") {
    const m = String(args?.[1]||"").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/nova react on | off", threadID, messageID);
    d.react = m==="on"; saveGCData(threadID, d);
    return send(api, `⚡ Reaksyon: ${m.toUpperCase()}`, threadID, messageID);
  }

  // SILENT
  if (cmd === "silent") {
    const m = String(args?.[1]||"").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/nova silent on | off", threadID, messageID);
    d.silent = m==="on"; saveGCData(threadID, d);
    return send(api, `🔇 Tahimik: ${m.toUpperCase()} — buhay pa pero hindi mag-iingay`, threadID, messageID);
  }

  // RESET LINES
  if (cmd === "resetlines") {
    d.roastIndex = 0; d.aliveIndex = 0; saveGCData(threadID, d);
    return send(api, "✨ Balik sa unang linya — dito lang sa GC na ito!", threadID, messageID);
  }

  // ✅ SET NICK — I-SAVE AT IPALIWANAG
  if (cmd === "setnick") {
    const nick = args.slice(1).join(" ").trim() || "NOVA X 💪";
    d.savedNick = nick;
    saveGCData(threadID, d);
    
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
    
    return send(api,
      `✅ Palayaw naitakda: "${nick}"\n` +
      `Tagumpay: ${ok} | Nabigo: ${no}\n` +
      `⚡ I-on ang Auto Nick: /nova autonick on\n` +
      `Kapag may sumali, awtomatiko na itong ilalapat!`,
      threadID, messageID
    );
  }

  // ✅ AUTO NICK — FIXED
  if (cmd === "autonick") {
    const m = String(args?.[1]||"").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/nova autonick on | off", threadID, messageID);
    
    if (m === "on" && !d.savedNick) {
      return send(api, "❌ Una: /nova setnick <palayaw>", threadID, messageID);
    }
    
    d.autoNick = m === "on";
    saveGCData(threadID, d);
    
    return send(api,
      `⚡ Auto Nick: ${m.toUpperCase()}\n` +
      (m === "on" 
        ? `✅ Gumagana na! Kapag may sumali, palitan agad ng: "${d.savedNick}"` 
        : "🔇 Hindi na awtomatiko ang pagpapalit"),
      threadID, messageID
    );
  }

  // SET GNAME
  if (cmd === "setgname") {
    const n = args.slice(1).join(" ").trim();
    if (!n) return send(api, "/nova setgname <pangalan>", threadID, messageID);
    d.savedGname = n; saveGCData(threadID, d);
    await apiCall(api, "setTitle", [n, threadID]);
    return send(api, `✅ GC Name: "${n}" — naka-save dito`, threadID, messageID);
  }

  // AUTO GNAME
  if (cmd === "autogname") {
    const m = String(args?.[1]||"").toLowerCase();
    if (!["on","off"].includes(m)) return send(api, "/nova autogname on | off", threadID, messageID);
    if (m==="on" && !d.savedGname) return send(api, "Una: /nova setgname <pangalan>", threadID, messageID);
    d.autoGname = m==="on"; saveGCData(threadID, d);
    return send(api, `⚡ Auto Gname: ${m.toUpperCase()}`, threadID, messageID);
  }

  // STATUS
  if (cmd === "status") {
    return send(api, [
      "⚡ NOVA X — KALAGAYAN NG GC NA ITO",
      `Sistema: ${d.active ? "AKTIBO DITO 💪" : "HUMINTO DITO 🔴"}`,
      `Tahimik: ${d.silent ? "OO 🔇" : "HINDI 🔊"}`,
      `Sagot: ${d.roast ? "ON 🔥" : "OFF"} — linya ${d.roastIndex+1}`,
      `Auto Nick: ${d.autoNick ? "ON ✅" : "OFF"} → "${d.savedNick || "Wala pang nakaset"}"`,
      `Auto Gname: ${d.autoGname ? "ON" : "OFF"} → "${d.savedGname || "Wala pang nakaset"}"`,
      `Bilang ng sagot: ${d.roastCount}`,
      `Simula dito: ${d.activatedAt ? new Date(d.activatedAt).toLocaleString() : "Hindi pa nagsisimula"}`,
      "",
      "💪 DITO LANG GAGANA — hindi sa ibang GC!"
    ].join("\n"), threadID, messageID);
  }

  // INFO
  if (cmd === "info") {
    return send(api, [
      "⚡ NOVA X FIXED v8.3.0",
      "✅ GC-SPECIFIC — /nova on dito lang gumagana",
      "✅ AUTO NICK FIXED — gumagana sa bagong kasali",
      "💪 Hindi apektado ang ibang GC",
      "🔴 /nova off — dito lang titigil"
    ].join("\n"), threadID, messageID);
  }

  // HELP
  return send(api, [
    "⚡ NOVA X — MGA UTOS",
    "/nova on          → Simulan SA GC NA ITO LANG",
    "/nova off         → Itigil SA GC NA ITO LANG",
    "/nova status      → Tingnan kalagayan dito",
    "/nova info        → Tungkol sa akin",
    "",
    "🔥 Auto Nick (FIXED):",
    "/nova setnick <pangalan>  → I-set palayaw",
    "/nova autonick on         → I-on auto sa bagong kasali ✅",
    "/nova autonick off        → Patayin",
    "",
    "⚡ Iba pa:",
    "/nova roast on/off",
    "/nova react on/off",
    "/nova silent on/off",
    "/nova setgname <pangalan>",
    "/nova autogname on/off",
    "",
    "💪 DITO LANG GAGANA — hindi sa ibang GC!"
  ].join("\n"), threadID, messageID);
};
  
