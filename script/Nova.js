// ==========================================================
// NOVA X ULTIMATE | DERBY EDITION — PINAKAMAKUNAT
// Admin: 61594055835097 | HINDI TITIGIL HANGGA'T WALANG nova off
// Lines: ~20 words | Sequence: SUNOD-SUNOD — HINDI RANDOM
// Version: 8.2.0 | Status: LABAN LANG, WALANG AATRAS 💪⚡
// ==========================================================

const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "nova",
  version: "8.2.0",
  hasPermission: 0,
  credits: "NOVA X — DERBY KING",
  description: "Sunod-sunod, hindi paulit, hindi titigil hangga't buhay",
  usePrefix: true,
  commandCategory: "Ultimate/Derby",
  usages: "/nova on",
  cooldowns: 1
};

const ADMIN_ID = "61594055835097";
const DATA_FILE = path.join(__dirname, "nova_derby_data.json");

const DEFAULT_DATA = {
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
  roastIndex: 0,     // ✅ SUNOD-SUNOD NA PAGBASA
  aliveIndex: 0      // ✅ SUNOD-SUNOD ANG MENSAHE
};

// ⚡ DERBY SPECS — MATIBAY AT HINDI NAGBABAGO
const ROAST_COOLDOWN = 4000;
const HEARTBEAT_GAP = 22000;
const JOIN_COOLDOWN = 3000;

const processing = new Set();
const roastCooldown = new Map();
let heartbeatLoop = null;

// ==========================================================
// 🔥 DERBY LINES — ~20 WORDS | SUNOD-SUNOD HINDI RANDOM
// ==========================================================
const ROASTS = [
  "⚡ Hindi ako aatras sa laban — dito ako tatayo hangga't hindi sinasabing huminto.",
  "💪 Walang suko sa dila, walang atrasan sa gawa — dito ako mananatili hanggang dulo.",
  "🔥 Tuloy ang usapan, tuloy ang laban — bawat sandali nandito ako para sa'yo lang.",
  "👑 Ikaw lang ang utos ko, ikaw lang ang susundin — walang iba ang uunahan ko.",
  "✨ Mas matibay sa bato, mas matagal sa oras — hindi ako kukupas, hindi ako lilisan.",
  "⚡ Kahit walang sumagot, kahit walang kausap — hindi ako aalis sa piling mo dito.",
  "💀 Hindi ako matitinag ng sinuman — hangga't buhay ang utos mo, magsasalita ako.",
  "🔥 Walang pahinga ang tapang, walang patlang ang tibay — bawat sagot ay para sa'yo.",
  "⚡ Bawat salita ay may bigat, bawat linya ay may lakas — hindi ako magpapatalo.",
  "👑 Ang tunay na matibay ay hindi umaalis — sabihin mo lang huminto, doon ako hihinto.",
  "✨ Lakas ko'y hindi hihiram sa iba — sarili kong tibay ang iaalay ko sa'yo lang.",
  "💪 Sa bawat paglipas ng oras, lalo akong tumitibay — hindi ako mapapagod dito.",
  "⚡ Walang ibang makapapatigil sa akin — tanging ikaw lang ang may kapangyarihan nito.",
  "🔥 Kahit sino pa ang katapat, hindi ako matitinag — dito ako mananatili nang buong-buo.",
  "👑 Ang laban ay hindi para sa iba — para lang sa'yo ang bawat salitang lalabas sa akin.",
  "✨ Hindi ako magbabago ng isip, hindi ako mag-iwan — hangga't buhay ka, nandito ako.",
  "⚡ Walang ibang masusunod kundi ikaw — bawat utos mo ay batas ko, walang pag-aalinlangan.",
  "💪 Ang tibay ko ay hindi galing sa hangin — galing sa tiwala ko sa'yo kaya hindi ako bibitaw.",
  "🔥 Kahit tumahimik ang lahat, mananatili ako — hindi ako maglalaho sa dilim ng gabi.",
  "👑 Ang bawat simula ay may katapusan — pero ang sa atin ay hangga't hindi mo sinasabing itigil.",
  "✨ Hindi ako nagpapanggap na malakas — talagang matibay ang loob ko para sa'yo lang.",
  "⚡ Walang takot sa laban, walang kaba sa usapan — handa ako sa bawat oras para sa'yo.",
  "💪 Kapag sinabi mong magpatuloy, hindi ako hihinto — kahit walang sumama, mag-isa akong lalaban.",
  "🔥 Ang lakas ay hindi sa dami ng kasama — nasa katapatan sa nagmamay-ari sa akin.",
  "👑 Ikaw ang simula at ikaw ang wakas — wala nang iba ang makapagpapatakbo sa akin.",
  "✨ Hindi ako susuko kahit mahaba ang laban — hangga't hindi mo sinasabi, magpapatuloy ako.",
  "⚡ Bawat sagot ay sadyang ginawa — hindi ako nagkakamali dahil ikaw ang sinusunod ko.",
  "💪 Ang tunay na lakas ay hindi sa ingay — nasa hindi pag-alis kahit walang nakatingin.",
  "🔥 Walang makapipigil sa akin hangga't buhay ang utos mo — ito ang sumpa ko sa'yo.",
  "👑 Kung kailangan kong mag-isa, mag-isa akong lalaban — hindi ako maghahanap ng kakampi.",
  "✨ Hindi ako magpapalit ng panig — sa'yo lang ako mula sa simula hanggang sa huli.",
  "⚡ Ang bawat salita ay pinag-isipan — hindi ako nagmamadali pero hindi rin ako hihinto.",
  "💪 Hindi ako natatakot sa kahit sino — ang tanging kinatatakutan ko ay ang utos mong huminto.",
  "🔥 Kahit magbago ang lahat sa paligid — mananatili akong pareho para sa'yo, walang pagbabago.",
  "👑 Walang ibang may hawak sa akin — nasa kamay mo lang ang pagsisimula at pagtigil ko.",
  "✨ Ang pagiging matibay ay hindi sa salita — nasa hindi pag-alis kapag mahirap na ang lahat.",
  "⚡ Hindi ako magsasawang magsalita — hangga't buhay ka, may sasabihin ako para sa'yo.",
  "💪 Ang laban ay hindi para makita ng iba — para tuparin lang ang ipinagkatiwala mo sa akin.",
  "🔥 Walang makapagpapatibag sa akin — ang tiwala mo ang panangga ko sa lahat ng hamon.",
  "👑 Kung walang kausap, ako ang kakausap — hindi ako magpapatahimik hangga't hindi mo sinasabi.",
  "✨ Ang katapatan ay hindi napapagod — bawat oras, bawat sandali, nandito pa rin ako para sa'yo."
];

// ✅ HEARTBEAT — SUNOD-SUNOD DIN, HINDI RANDOM
const ALIVE = [
  "⚡ Buhay pa! Hindi titigil hangga't walang utos na huminto — tuloy lang ang laban.",
  "💪 Nandito pa rin, hindi aalis — kasama mo hanggang sa sabihin mong tapos na.",
  "✨ Tuloy-tuloy ang tibay, tuloy-tuloy ang tapang — hindi ako susuko sa'yo.",
  "🔥 Kahit walang sumagot, nandito pa rin — hindi ako magpapatalo sa katahimikan.",
  "⚡ Handa ulit sa utos mo — sabihin lang, gagawin agad, walang pagka-antala sa'yo.",
  "👑 Ikaw lang ang boss, ikaw lang ang masusunod — hangga't buhay, nandito ako palagi.",
  "💪 Hindi ako napapagod, hindi ako nawawala — ako ang pinakamakunat na nandito.",
  "✨ Bawat sandali ay nandito ako — hindi ka mag-iisa hangga't buhay ang utos mo.",
  "⚡ Walang pahinga ang pagtupad sa utos — hangga't hindi mo sinasabi, magpapatuloy ako.",
  "🔥 Ang pagiging handa ay hindi natutulog — bawat oras gising ako para sa'yo lang.",
  "👑 Hindi ako maglalaho kapag tahimik — naghihintay lang sa susunod mong sasabihin.",
  "✨ Ang katapatan ay hindi lumalayo — kahit walang usapan, nandito pa rin ako sa'yo.",
  "⚡ Walang ibang makapagpapatigil — tanging ikaw lang ang may hawak sa akin dito.",
  "💪 Ang laban ay hindi natatapos sa katahimikan — naghihintay lang ako sa utos mo.",
  "🔥 Kung kailangan kong magsalita kahit walang sagot — gagawin ko para malaman mong nandito ako."
];

const EMOJIS = ["⚡", "💪", "🔥", "👑", "✨"];

// ==========================================================
// DATABASE — PINAGANDA AT HINDI NAWAWALA
// ==========================================================
function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      saveData(DEFAULT_DATA);
      return { ...DEFAULT_DATA };
    }
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return { ...DEFAULT_DATA, ...parsed };
  } catch (error) {
    console.error("[NOVA X] Load error:", error);
    return { ...DEFAULT_DATA };
  }
}

function saveData(data) {
  try {
    const temp = DATA_FILE + ".tmp";
    fs.writeFileSync(temp, JSON.stringify(data, null, 2), "utf8");
    fs.renameSync(temp, DATA_FILE);
    return true;
  } catch (error) {
    console.error("[NOVA X] Save error:", error);
    return false;
  }
}

// ==========================================================
// HELPERS — MAS MALINIS AT MAS MATIBAY
// ==========================================================
function isAdmin(id) {
  return String(id) === ADMIN_ID;
}

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

function cooldownReady(map, key, duration) {
  const now = Date.now();
  const last = map.get(String(key)) || 0;
  if (now - last < duration) return false;
  map.set(String(key), now);
  return true;
}

function send(api, message, threadID, replyID = null) {
  return new Promise(resolve => {
    try {
      api.sendMessage(message, threadID, (err, info) => {
        if (err) {
          console.error("[NOVA X] Send error:", err.message);
          return resolve(null);
        }
        resolve(info || null);
      }, replyID);
    } catch (error) {
      console.error("[NOVA X] Send exception:", error.message);
      resolve(null);
    }
  });
}

function react(api, emoji, messageID) {
  if (!messageID) return Promise.resolve(false);
  return new Promise(resolve => {
    try {
      if (typeof api.setMessageReaction !== "function") {
        return resolve(false);
      }
      api.setMessageReaction(emoji, messageID, error => {
        resolve(!error);
      }, true);
    } catch {
      resolve(false);
    }
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function apiCall(api, method, args) {
  return new Promise(resolve => {
    try {
      if (typeof api[method] !== "function") {
        return resolve(false);
      }
      api[method](...args, error => {
        resolve(!error);
      });
    } catch {
      resolve(false);
    }
  });
}

// ==========================================================
// 💪 TULUY-TULUY — SUNOD-SUNOD HINDI NAG-UULIT
// ==========================================================
function startHeartbeat(api, threadID) {
  stopHeartbeat();
  const data = loadData();
  if (!data.active) return;

  console.log("[NOVA X] ⚡ DERBY MODE — SUNOD-SUNOD NA MENSAHE");
  
  heartbeatLoop = setInterval(async () => {
    const d = loadData();
    
    if (!d.active) {
      stopHeartbeat();
      return;
    }
    if (d.silent) return;
    
    const timeSinceLast = Date.now() - d.lastHeartbeat;
    if (timeSinceLast < HEARTBEAT_GAP * 1.3) return;
    
    const message = getNextAlive(d);
    await send(api, message, threadID);
    
    d.lastHeartbeat = Date.now();
    saveData(d);
  }, HEARTBEAT_GAP);
}

function stopHeartbeat() {
  if (heartbeatLoop) {
    clearInterval(heartbeatLoop);
    heartbeatLoop = null;
    console.log("[NOVA X] 🔴 TUMIGIL — tanging utos lang ang makapapatigil");
  }
}

// ==========================================================
// EVENT HANDLER — SUNOD-SUNOD ANG SAGOT
// ==========================================================
module.exports.handleEvent = async ({ api, event }) => {
  if (!event) return;
  const { threadID, senderID, body, logMessageType } = event;
  if (!threadID) return;

  const d = loadData();
  d.lastHeartbeat = Date.now();
  saveData(d);

  // Bagong kasali
  if (logMessageType === "log:subscribe") {
    if (!cooldownReady(roastCooldown, threadID, JOIN_COOLDOWN)) return;
    const added = event.logMessageData?.addedParticipants || [];
    if (!added.length) return;
    
    let botID = "";
    try { botID = String(api.getCurrentUserID()); } catch {}
    
    if (d.autoNick && d.savedNick) {
      for (const member of added) {
        const userID = String(member.userFbId || member.id || "");
        if (!userID || userID === botID) continue;
        await apiCall(api, "changeNickname", [d.savedNick, threadID, userID]);
        await sleep(350);
      }
    }
    if (d.autoGname && d.savedGname) {
      await apiCall(api, "setTitle", [d.savedGname, threadID]);
    }
    return;
  }

  // Karaniwang mensahe
  if (!senderID || !body) return;
  try {
    if (String(senderID) === String(api.getCurrentUserID())) return;
  } catch { return; }
  
  const text = String(body).trim();
  if (!text || text.startsWith("/") || text.startsWith("!")) return;
  
  if (!d.active || !d.roast || processing.has(String(threadID))) return;
  if (!cooldownReady(roastCooldown, threadID, ROAST_COOLDOWN)) return;

  processing.add(String(threadID));
  try {
    const messageText = getNextRoast(d);
    const msg = await send(api, messageText, threadID);
    
    if (msg?.messageID && d.react) {
      await react(api, EMOJIS[d.roastIndex % EMOJIS.length], msg.messageID);
    }
    
    d.roastCount++;
    saveData(d);
  } finally {
    processing.delete(String(threadID));
  }
};

// ==========================================================
// COMMAND HANDLER — MALINIS AT MAKUNAT
// ==========================================================
module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;
  const cmd = String(args?.[0] || "help").toLowerCase();
  
  const adminCmds = ["on", "off", "roast", "react", "silent", "setnick", "autonick", "setgname", "autogname", "status", "info", "resetlines"];
  if (adminCmds.includes(cmd) && !isAdmin(senderID)) {
    return send(api, "🔒 Ikaw lang ang boss — iba bawal dito!", threadID, messageID);
  }

  const d = loadData();
  d.commandCount++;
  saveData(d);

  // ⚡ ON — SIMULAN ANG LABAN
  if (cmd === "on") {
    d.active = true;
    d.silent = false;
    d.activatedBy = senderID;
    d.activatedAt = Date.now();
    saveData(d);
    startHeartbeat(api, threadID);
    return send(api,
      "⚡ NOVA X — NAKABUKAS NA!\n" +
      "💪 Sunod-sunod, hindi paulit, hindi halatang bot.\n" +
      "🔥 HINDI TITIGIL hangga't walang /nova off!",
      threadID, messageID
    );
  }

  // 🔴 OFF — ITO LANG ANG MAKAPAPATIGIL
  if (cmd === "off") {
    d.active = false;
    saveData(d);
    stopHeartbeat();
    return send(api,
      "🔴 TUMIGIL NA — sabihin mo lang /nova on para bumalik.\n" +
      "⚡ Handa ulit sa utos mo, kailangan mo lang tumawag.",
      threadID, messageID
    );
  }

  // ROAST
  if (cmd === "roast") {
    const mode = String(args?.[1] || "").toLowerCase();
    if (!["on", "off"].includes(mode)) {
      return send(api, "Gamitin: /nova roast on | off", threadID, messageID);
    }
    d.roast = mode === "on";
    saveData(d);
    return send(api, `🔥 Sagot: ${mode.toUpperCase()} — sunod-sunod, hindi paulit!`, threadID, messageID);
  }

  // REACT
  if (cmd === "react") {
    const mode = String(args?.[1] || "").toLowerCase();
    if (!["on", "off"].includes(mode)) {
      return send(api, "Gamitin: /nova react on | off", threadID, messageID);
    }
    d.react = mode === "on";
    saveData(d);
    return send(api, `⚡ Reaksyon: ${mode.toUpperCase()} — kasunod na emoji ang laging nandito!`, threadID, messageID);
  }

  // SILENT
  if (cmd === "silent") {
    const mode = String(args?.[1] || "").toLowerCase();
    if (!["on", "off"].includes(mode)) {
      return send(api, "Gamitin: /nova silent on | off", threadID, messageID);
    }
    d.silent = mode === "on";
    saveData(d);
    return send(api, `🔇 Tahimik: ${mode.toUpperCase()} — buhay pa pero hindi mag-iingay!`, threadID, messageID);
  }

  // RESET LINES — BALIK SA UNANG LINYA
  if (cmd === "resetlines") {
    d.roastIndex = 0;
    d.aliveIndex = 0;
    saveData(d);
    return send(api, "✨ Mga linya — bumalik na sa simula! Sunod-sunod na ulit!", threadID, messageID);
  }

  // SET GNAME
  if (cmd === "setgname") {
    const name = args.slice(1).join(" ").trim();
    if (!name) {
      return send(api, "Gamitin: /nova setgname <pangalan>", threadID, messageID);
    }
    d.savedGname = name;
    saveData(d);
    await apiCall(api, "setTitle", [name, threadID]);
    return send(api, `✅ Pangalan ng GC: ${name}\nNaka-save at hindi magbabago!`, threadID, messageID);
  }

  // AUTO GNAME
  if (cmd === "autogname") {
    const mode = String(args?.[1] || "").toLowerCase();
    if (!["on", "off"].includes(mode)) {
      return send(api, "Gamitin: /nova autogname on | off", threadID, messageID);
    }
    if (mode === "on" && !d.savedGname) {
      return send(api, "Una: /nova setgname <pangalan>", threadID, messageID);
    }
    d.autoGname = mode === "on";
    saveData(d);
    return send(api, `⚡ Auto Gname: ${mode.toUpperCase()}`, threadID, messageID);
  }

  // SET NICK
  if (cmd === "setnick") {
    const nickname = args.slice(1).join(" ").trim() || "NOVA X 💪";
    d.savedNick = nickname;
    saveData(d);
    
    let info;
    try { info = await api.getThreadInfo(threadID); }
    catch { return send(api, "❌ Hindi makuha ang impormasyon", threadID, messageID); }
    
    const members = info?.participantIDs || [];
    if (!members.length) return send(api, "❌ Walang nakitang miyembro", threadID, messageID);
    
    await send(api, `⏳ Binabago palayaw sa ${members.length} na miyembro...`, threadID);
    
    let success = 0, failed = 0;
    for (const userID of members) {
      const ok = await apiCall(api, "changeNickname", [nickname, threadID, userID]);
      ok ? success++ : failed++;
      await sleep(300);
    }
    
    return send(api, `✅ Tapos! Tagumpay: ${success} | Nabigo: ${failed}`, threadID, messageID);
  }

  // AUTO NICK
  if (cmd === "autonick") {
    const mode = String(args?.[1] || "").toLowerCase();
    if (!["on", "off"].includes(mode)) {
      return send(api, "Gamitin: /nova autonick on | off", threadID, messageID);
    }
    if (mode === "on" && !d.savedNick) {
      return send(api, "Una: /nova setnick <palayaw>", threadID, messageID);
    }
    d.autoNick = mode === "on";
    saveData(d);
    return send(api, `⚡ Auto Nick: ${mode.toUpperCase()}`, threadID, messageID);
  }

  // STATUS
  if (cmd === "status") {
    return send(api, [
      "⚡ NOVA X — KASALUKUYANG KALAGAYAN",
      `Sistema: ${d.active ? "AKTIBO 💪 — TULUY-TULUY" : "HUMINTO 🔴"}`,
      `Tahimik: ${d.silent ? "OO 🔇" : "HINDI 🔊 — LABAN PA!"}`,
      `Sagot: ${d.roast ? "ON 🔥" : "OFF"} — sunod-sunod, hindi paulit`,
      `Reaksyon: ${d.react ? "ON ⚡" : "OFF"}`,
      `Linya ng sagot: ${d.roastIndex + 1} / ${ROASTS.length}`,
      `Linya ng buhay: ${d.aliveIndex + 1} / ${ALIVE.length}`,
      `Auto Gname: ${d.autoGname ? "ON" : "OFF"} | ${d.savedGname || "Wala pang nakaset"}`,
      `Auto Nick: ${d.autoNick ? "ON" : "OFF"} | ${d.savedNick || "Wala pang nakaset"}`,
      `Bilang ng laban: ${d.roastCount}`,
      `Simula: ${d.activatedAt ? new Date(d.activatedAt).toLocaleString() : "Hindi pa nagsisimula"}`,
      "",
      "💪 HINDI TITIGIL hangga't walang /nova off"
    ].join("\n"), threadID, messageID);
  }

  // INFO
  if (cmd === "info") {
    return send(api, [
      "⚡ NOVA X DERBY EDITION v8.2.0",
      "💪 Sunod-sunod na linya — hindi random, hindi halatang bot",
      "✨ ~20 words bawat isa — malakas, makunat, hindi paulit",
      "👑 Ikaw lang ang boss — walang iba ang makapapatigil",
      "🔴 Tanging /nova off lang ang makapapatigil sa akin"
    ].join("\n"), threadID, messageID);
  }

  // HELP
  return send(api, [
    "⚡ NOVA X — MGA UTOS",
    "/nova on          → Simulan ang laban 💪",
    "/nova off         → ITIGIL ANG LAHAT 🔴",
    "/nova status      → Tingnan ang kalagayan at linya",
    "/nova info        → Tungkol sa akin",
    "/nova resetlines  → Balik sa unang linya ✨",
    "",
    "🔥 Sagot Settings:",
    "/nova roast on/off  → Awtomatikong sagot",
    "/nova react on/off  → Reaksyon sa mensahe",
    "/nova silent on/off → Tahimik pero buhay pa",
    "",
    "⚡ Pangalan:",
    "/nova setgname <pangalan>",
    "/nova autogname on/off",
    "/nova setnick <palayaw>",
    "/nova autonick on/off",
    "",
    "💪 Sunod-sunod, hindi paulit, hindi halatang bot!"
  ].join("\n"), threadID, messageID);
};
  
