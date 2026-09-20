// ==========================================================
// NOVA X ULTIMATE | FACEBOOK BOT MODULE — ENHANCED EDITION
// Admin: 61594055835097
// Version: 8.0.0 | Status: MAX STRENGTH 💪
// Rule: TULUY-TULUY HANGGANG HINDI SINABI ANG "nova off"
// ==========================================================

const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "nova",
  version: "8.0.0",
  hasPermission: 0,
  credits: "NOVA X ULTIMATE — GINAWANG PINAKAMAGANDA",
  description: "Pinakamalakas na bot — tuloy-tuloy hanggang nova off",
  usePrefix: true,
  commandCategory: "System/Ultimate",
  usages: "/nova help",
  cooldowns: 1
};

const ADMIN_ID = "61594055835097";
const DATA_FILE = path.join(__dirname, "nova_x_ultimate_data.json");

const DEFAULT_DATA = {
  active: false,
  roast: true,
  react: true,
  nonStop: true, // ✅ TULUY-TULUY MODE
  autoGname: false,
  autoNick: false,
  savedGname: "",
  savedNick: "",
  roastCount: 0,
  commandCount: 0,
  activatedBy: null,
  activatedAt: null,
  lastMessageTime: 0,
  silentMode: false
};

// ⚡ MGA SETTINGS — MAKUNAT AT MATIBAY
const ROAST_COOLDOWN = 5000; // Mas mabilis pero hindi spam
const COMMAND_COOLDOWN = 1500;
const JOIN_COOLDOWN = 3000;
const ALIVE_INTERVAL = 25000; // ✅ BAWAT 25 SECONDS — HINDI TITIGIL

const processing = new Set();
const roastCooldown = new Map();
const commandCooldown = new Map();
const joinCooldown = new Map();
let aliveHeartbeat = null; // ✅ ANG TULUY-TULUY NA PUSO NG BOT

// 🔥 MAS MARAMING SAGOT — HINDI NAUULIT
const ROASTS = [
  "⚡ NOVA X — nandito lang, hindi umaalis 💪",
  "Walang titigil hangga't hindi nova off ⚡",
  "Buhay pa! Ang GC ay hindi matutulog 🔥",
  "Ako ang pinakamagandang bot dito ✨",
  "Huwag mag-alala, hindi ako mawawala 💀",
  "Tuloy-tuloy ang takbo ng usapan ⚡",
  "Handa sa lahat ng oras — walang pahinga ⚡",
  "Kahit walang sumagot, nandito pa rin ako 💪",
  "Ang lakas hindi nawawala ✨",
  "Nova X — ikaw lang ang may kontrol 👑",
  "Buhay na buhay pa rin ang system ⚡",
  "Hindi hihinto hangga't hindi sinasabi ang nova off ⚡",
  "Pinakamaganda, pinakamakunat, kumpleto sa features ✅",
  "Handang magsilbi sa iyo lang, Boss 👑",
  "Walang ibang bot na katulad ko ⚡🔥"
];

const EMOJIS = ["🔥", "⚡", "💪", "✨", "👑", "💀", "🤣", "😎"];

// ✅ MGA MENSAHE KAPAG WALANG SUMAGOT — TULUY-TULUY
const ALIVE_MESSAGES = [
  "⚡ NOVA X — buhay pa rin! Hindi titigil hangga't hindi nova off",
  "💪 Nandito pa rin ako, walang alalahanin",
  "✨ Tuloy-tuloy ang takbo ng system...",
  "⚡ Handa sa susunod na utos mo, Boss",
  "🔥 GC ay aktibo — ako ang bantay dito",
  "👑 Ikaw lang ang masusunod — hangga't walang nova off, tuloy lang!",
  "✨ Ang pinakamagandang bot ay hindi napapagod"
];

// ==========================================================
// DATABASE — HINDI NAWAWALA ANG DATA
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
    console.error("[NOVA X] Database error:", error);
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
// HELPERS — PINAGANDA AT PINATIBAY
// ==========================================================

function isAdmin(id) {
  return String(id) === ADMIN_ID;
}

function random(array) {
  return array[Math.floor(Math.random() * array.length)];
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
          console.error("[NOVA X] Send error:", err);
          return resolve(null);
        }
        resolve(info || null);
      }, replyID);
    } catch (error) {
      console.error("[NOVA X] Send exception:", error);
      resolve(null);
    }
  });
}

function react(api, emoji, messageID) {
  if (!messageID) return Promise.resolve(false);
  return new Promise(resolve => {
    try {
      if (typeof api.setMessageReaction !== "function") return resolve(false);
      api.setMessageReaction(emoji, messageID, error => {
        if (error) return resolve(false);
        resolve(true);
      }, true);
    } catch { resolve(false); }
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function apiCall(api, method, args) {
  return new Promise(resolve => {
    try {
      if (typeof api[method] !== "function") return resolve(false);
      api[method](...args, error => resolve(!error));
    } catch { resolve(false); }
  });
}

// ==========================================================
// ✅ TULUY-TULUY NA PAG-CHAT — ANG PUSO NG BOT
// ==========================================================

function startHeartbeat(api, threadID) {
  stopHeartbeat(); // Iwas doble
  const data = loadData();
  if (!data.active) return;

  console.log("[NOVA X] ⚡ TULUY-TULUY MODE — NAKABUKAS");
  
  aliveHeartbeat = setInterval(async () => {
    const currentData = loadData();
    
    // ✅ TUMIGIL LANG KAPAG SINABI ANG "nova off"
    if (!currentData.active) {
      stopHeartbeat();
      return;
    }

    // Huwag mag-spam kung may kamakailang mensahe
    const timeSinceLast = Date.now() - (currentData.lastMessageTime || 0);
    if (timeSinceLast < ALIVE_INTERVAL * 1.5) return;

    // Huwag magsalita kung naka-silent mode
    if (currentData.silentMode) return;

    // Magpadala ng mensahe — TULUY-TULUY
    await send(api, random(ALIVE_MESSAGES), threadID);
    
    // I-update oras ng huling mensahe
    currentData.lastMessageTime = Date.now();
    saveData(currentData);
  }, ALIVE_INTERVAL);
}

function stopHeartbeat() {
  if (aliveHeartbeat) {
    clearInterval(aliveHeartbeat);
    aliveHeartbeat = null;
    console.log("[NOVA X] 🔴 TULUY-TULUY MODE — HUMINTO");
  }
}

// ==========================================================
// EVENT HANDLER — PINATIBAY
// ==========================================================

module.exports.handleEvent = async function ({ api, event }) {
  if (!event) return;
  const { threadID, senderID, body, logMessageType } = event;
  if (!threadID) return;

  // I-update oras ng huling aktibidad
  const data = loadData();
  data.lastMessageTime = Date.now();
  saveData(data);

  // --------------------------
  // BAGONG KASALI SA GC
  // --------------------------
  if (logMessageType === "log:subscribe") {
    const now = Date.now();
    const lastJoinRun = joinCooldown.get(String(threadID)) || 0;
    if (now - lastJoinRun < JOIN_COOLDOWN) return;
    joinCooldown.set(String(threadID), now);

    const added = event.logMessageData?.addedParticipants || [];
    if (!added.length) return;

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

  // --------------------------
  // KARANIWANG MENSAHE
  // --------------------------
  if (!senderID || !body) return;

  try {
    if (String(senderID) === String(api.getCurrentUserID())) return;
  } catch {}

  const text = String(body).trim();
  if (!text || text.startsWith("/") || text.startsWith("!")) return;

  if (!data.active || !data.roast) return;
  if (processing.has(String(threadID))) return;

  if (!cooldownReady(roastCooldown, threadID, ROAST_COOLDOWN)) return;

  processing.add(String(threadID));
  try {
    const msg = await send(api, random(ROASTS), threadID);
    if (msg?.messageID && data.react) {
      await react(api, random(EMOJIS), msg.messageID);
    }
    data.roastCount = Number(data.roastCount) + 1;
    saveData(data);
  } catch (e) {
    console.error("[NOVA X]", e);
  } finally {
    processing.delete(String(threadID));
  }
};

// ==========================================================
// COMMAND HANDLER — IKAW LANG ANG MAY KONTROL
// ==========================================================

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const command = String(args?.[0] || "help").toLowerCase();

  const adminCmds = ["on", "off", "roast", "react", "setnick", "setgname", "autonick", "autogname", "silent", "heartbeat"];
  if (adminCmds.includes(command) && !isAdmin(senderID)) {
    return send(api, "🔒 IKAW LANG ANG BOSS — iba bawal gamitin ito!", threadID, messageID);
  }

  if (!cooldownReady(commandCooldown, senderID, COMMAND_COOLDOWN)) return;

  const data = loadData();
  data.commandCount = Number(data.commandCount) + 1;
  saveData(data);

  // ============= ON — SIMULAN ANG LAHAT =============
  if (command === "on") {
    data.active = true;
    data.silentMode = false;
    data.activatedBy = senderID;
    data.activatedAt = Date.now();
    saveData(data);
    
    startHeartbeat(api, threadID); // ✅ SIMULAN ANG TULUY-TULUY
    
    return send(api, 
      "⚡ NOVA X ULTIMATE — NAKABUKAS NA!\n" +
      "🔥 Tuloy-tuloy: HINDI TITIGIL hangga't walang nova off\n" +
      "🔥 Auto-roast: ON\n" +
      "⚡ Reaksyon: ON\n" +
      "🛡️ Pinakamakunat na bersyon ✅\n" +
      "👑 Ikaw lang ang may kontrol!",
      threadID, messageID
    );
  }

  // ============= OFF — TUMIGIL LANG DITO =============
  if (command === "off") {
    data.active = false;
    saveData(data);
    stopHeartbeat(); // ✅ ITIGIL ANG TULUY-TULUY
    
    return send(api, 
      "🔴 NOVA X — HUMINTO NA.\n" +
      "⚡ Sabihin mo lang `/nova on` para bumalik ulit.\n" +
      "💪 Laging handa sa utos mo!",
      threadID, messageID
    );
  }

  // ============= ROAST ON/OFF =============
  if (command === "roast") {
    const mode = String(args?.[1] || "").toLowerCase();
    if (!["on","off"].includes(mode)) {
      return send(api, "Gamitin: /nova roast on | off", threadID, messageID);
    }
    data.roast = mode === "on";
    saveData(data);
    return send(api, `🔥 Auto-roast: ${mode.toUpperCase()}`, threadID, messageID);
  }

  // ============= REACT ON/OFF =============
  if (command === "react") {
    const mode = String(args?.[1] || "").toLowerCase();
    if (!["on","off"].includes(mode)) {
      return send(api, "Gamitin: /nova react on | off", threadID, messageID);
    }
    data.react = mode === "on";
    saveData(data);
    return send(api, `⚡ Reaksyon: ${mode.toUpperCase()}`, threadID, messageID);
  }

  // ============= SILENT MODE — TIGIL MAG-TALK KUNG WALANG SAGOT =============
  if (command === "silent") {
    const mode = String(args?.[1] || "").toLowerCase();
    if (!["on","off"].includes(mode)) {
      return send(api, "Gamitin: /nova silent on | off", threadID, messageID);
    }
    data.silentMode = mode === "on";
    saveData(data);
    return send(api, `🔇 Tahimik na mode: ${mode.toUpperCase()}`, threadID, messageID);
  }

  // ============= SET GROUP NAME =============
  if (command === "setgname") {
    const name = args.slice(1).join(" ").trim();
    if (!name) return send(api, "Gamitin: /nova setgname <pangalan>", threadID, messageID);
    data.savedGname = name;
    saveData(data);
    await apiCall(api, "setTitle", [name, threadID]);
    return send(api, `✅ Pangalan ng GC: ${name}\nNaka-save na!`, threadID, messageID);
  }

  // ============= AUTO GNAME =============
  if (command === "autogname") {
    const mode = String(args?.[1] || "").toLowerCase();
    if (!["on","off"].includes(mode)) {
      return send(api, "Gamitin: /nova autogname on | off", threadID, messageID);
    }
    if (mode === "on" && !data.savedGname) {
      return send(api, "❌ Mag-set muna: /nova setgname <pangalan>", threadID, messageID);
    }
    data.autoGname = mode === "on";
    saveData(data);
    return send(api, `⚡ Auto Gname: ${mode.toUpperCase()}`, threadID, messageID);
  }

  // ============= SET NICKNAME =============
  if (command === "setnick") {
    const nick = args.slice(1).join(" ").trim() || "NOVA X";
    data.savedNick = nick;
    saveData(data);
    
    let info;
    try { info = await api.getThreadInfo(threadID); } catch {
      return send(api, "❌ Hindi makuhanan ng impormasyon ang GC.", threadID, messageID);
    }
    
    const members = info?.participantIDs || [];
    if (!members.length) return send(api, "❌ Walang nakitang miyembro.", threadID, messageID);
    
    await send(api, `⏳ Binabago ang palayaw sa ${members.length} na miyembro...`, threadID);
    
    let success = 0, failed = 0;
    for (const uid of members) {
      const ok = await apiCall(api, "changeNickname", [nick, threadID, uid]);
      ok ? success++ : failed++;
      await sleep(300);
    }
    
    return send(api,
      `✅ Tapos na!\nTagumpay: ${success}\nNabigo: ${failed}\nNaka-save na palayaw!`,
      threadID, messageID
    );
  }

  // ============= AUTO NICK =============
  if (command === "autonick") {
    const mode = String(args?.[1] || "").toLowerCase();
    if (!["on","off"].includes(mode)) {
      return send(api, "Gamitin: /nova autonick on | off", threadID, messageID);
    }
    if (mode === "on" && !data.savedNick) {
      return send(api, "❌ Mag-set muna: /nova setnick <palayaw>", threadID, messageID);
    }
    data.autoNick = mode === "on";
    saveData(data);
    return send(api, `⚡ Auto Nick: ${mode.toUpperCase()}`, threadID, messageID);
  }

  // ============= STATUS =============
  if (command === "status") {
    return send(api, [
      "⚡ NOVA X ULTIMATE — KASALUKUYANG KALAGAYAN",
      `Sistema: ${data.active ? "ON 🟢 — TULUY-TULUY" : "OFF 🔴"}`,
      `Tuloy-tuloy na mensahe: ${data.active && !data.silentMode ? "AKTIBO ⚡" : "HINDI AKTIBO"}`,
      `Tahimik na mode: ${data.silentMode ? "ON 🔇" : "OFF 🔊"}`,
      `Auto-roast: ${data.roast ? "ON" : "OFF"}`,
      `Reaksyon: ${data.react ? "ON" : "OFF"}`,
      `Auto Gname: ${data.autoGname ? "ON" : "OFF"} — ${data.savedGname || "Wala pang nakaset"}`,
      `Auto Nick: ${data.autoNick ? "ON" : "OFF"} — ${data.savedNick || "Wala pang nakaset"}`,
      `Bilang ng roast: ${data.roastCount}`,
      `Bilang ng utos: ${data.commandCount}`,
      `Nagsimula noong: ${data.activatedAt ? new Date(data.activatedAt).toLocaleString() : "Hindi pa nagsisimula"}`
    ].join("\n"), threadID, messageID);
  }

  // ============= INFO =============
  if (command === "info") {
    return send(api, [
      "⚡ NOVA X ULTIMATE v8.0.0",
      "👑 Ikaw lang ang may kontrol — Admin: 61594055835097",
      "💪 Pinakamakunat, pinakamaganda, kumpleto sa features",
      "⚡ TULUY-TULUY hangga't walang sinabing 'nova off'",
      "✨ Hindi nawawala ang data, hindi nagloloko",
      "🔥 Walang katulad na bot — ikaw ang may-ari"
    ].join("\n"), threadID, messageID);
  }

  // ============= HELP =============
  return send(api, [
    "⚡ NOVA X — MGA UTOS",
    "/nova on          → Simulan ang lahat ⚡",
    "/nova off         → ITIGIL ANG LAHAT 🔴",
    "/nova status      → Tingnan ang kalagayan",
    "/nova info        → Tungkol sa akin",
    "",
    "🔥 Awtomatikong Sagot:",
    "/nova roast on/off  → I-on/patayin ang roast",
    "/nova react on/off  → I-on/patayin ang reaksyon",
    "/nova silent on/off → Huwag magsalita kung walang sagot",
    "",
    "⚡ Pangalan at Palayaw:",
    "/nova setgname <pangalan> → I-set ang pangalan ng GC",
    "/nova autogname on/off    → I-on/patayin ang awto-pangalan",
    "/nova setnick <palayaw>   → I-set ang palayaw ng lahat",
    "/nova autonick on/off      → I-on/patayin ang awto-palayaw",
    "",
    "👑 Tandaan: TULUY-TULUY hangga't hindi sinasabi ang /nova off"
  ].join("\n"), threadID, messageID);
};
 
