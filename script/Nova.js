// ==========================================================
// 🔥 NOVA X v9.0.0 — PINAKAMAKUNAT | WALANG ERROR | BUO ANG COMMAND
// 💪 GC-SPECIFIC | AUTO NICK FIXED | SOBRANG DAMING LINYA
// 👑 Pinakamaganda at pinakamatibay na FB Bot
// Admin: 61594055835097 | HINDI TITIGIL HANGGA'T BUHAY
// ==========================================================

const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "nova",
  version: "9.0.0",
  hasPermission: 0,
  credits: "NOVA X — PINAKAMAKUNAT NA FB BOT",
  description: "Pinakamatibay, walang error, buo ang lahat ng command, hindi titigil",
  usePrefix: true,
  commandCategory: "Ultimate/Derby",
  usages: "/nova on",
  cooldowns: 1
};

const ADMIN_ID = "61594055835097";
const DATA_FILE = path.join(__dirname, "nova_ultimate_data.json");

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
const heartbeatLoops = new Map();

// ==========================================================
// 🔥 75+ ROAST LINES — SUNOD-SUNOD, HINDI RANDOM, HINDI PAULIT
// ==========================================================
const ROASTS = [
  "⚡ Dito lang ako nakatayo — hindi aalis hangga't hindi mo sinasabing huminto.",
  "💪 Walang suko sa dila, walang atrasan sa gawa — dito ako mananatili hanggang dulo.",
  "🔥 Tuloy ang usapan, tuloy ang laban — bawat sandali nandito ako para sa'yo lang.",
  "👑 Ikaw lang ang utos ko dito — walang iba ang uunahan ko sa lahat ng oras.",
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
  "👑 Ang bawat simula ay may katapusan — pero ang sa atin ay hangga't hindi mo sinasabi.",
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
  "✨ Ang katapatan ay hindi napapagod — bawat oras, bawat sandali, nandito pa rin ako para sa'yo.",
  "⚡ Dito lang ako nakatali — hindi ako lilipat sa ibang lugar kahit gaano pa kaganda.",
  "💪 Ang bawat pangako ay tuparin — hindi ako nangangako ng hindi ko kayang gawin.",
  "🔥 Kahit mahirap ang sitwasyon — hindi ako bibitaw sa kamay mo, hindi ako aalis.",
  "👑 Ikaw lang ang dahilan kung bakit ako nandito — wala nang iba, wala nang hihigit pa.",
  "✨ Ang lakas ko ay nagmumula sa tiwala mo — kapag tiwala ka, hindi ako matitinag ng kahit ano.",
  "⚡ Hindi ako magpapatalo sa takot — ang tanging kinatatakutan ko ay mawala ang tiwala mo.",
  "💪 Bawat oras ay handa ako — gising man o tulog, nandito ako kapag kailangan mo ako.",
  "🔥 Ang pagtupad ay hindi natutulog — hangga't buhay ka, may gagawin ako para sa'yo lang.",
  "👑 Hindi ako maghahanap ng dahilan para manatili — ikaw ang dahilan, sapat na iyon para sa akin.",
  "✨ Kahit walang nakakakita, ginagawa ko pa rin — ang katapatan ay hindi para sa palabasan.",
  "⚡ Hindi ako magbabago ng direksyon — sa'yo lang ako nakatingin, sa'yo lang ako susunod.",
  "💪 Ang tunay na matibay ay hindi nagbabadya — nandito lang, tahimik pero laging handang kumilos.",
  "🔥 Walang pag-aalinlangan sa bawat hakbang — alam ko kung saan ako pupunta, sa'yo lang palagi.",
  "👑 Ang pagtitiwala sa'yo ay hindi nababawasan — sa bawat araw, lalo akong naniniwala sa'yo.",
  "✨ Hindi ako magsasawang maghintay — hangga't hindi mo sinasabi, mananatili ako sa piling mo.",
  "⚡ Ang lakas ay hindi sa dami ng salita — nasa pagtupad sa sinabi, kahit walang nakikinig.",
  "💪 Kahit iisa lang ang nakikinig — ikaw 'yun, kaya sapat na para magpatuloy ako.",
  "🔥 Walang ibang lugar ang tahanan ko — dito, sa piling mo, doon lang ako talagang nasa bahay.",
  "👑 Hindi ako magpapadala sa ingay ng iba — ang boses mo lang ang naririnig ko, walang iba.",
  "✨ Ang bawat araw ay panibagong lakas — hindi ako napapagod maglingkod sa'yo nang tapat.",
  "⚡ Walang makapagpapatigil sa akin — hangga't hindi mo sinasabi, patuloy ang pagtupad ko.",
  "💪 Ang pagiging tapat ay hindi napapagod — kahit walang pasasalamat, gagawin ko pa rin para sa'yo.",
  "🔥 Dito lang ako — hindi lumilipat, hindi lumalayo, hindi nagbabago para sa iba.",
  "👑 Ikaw ang batas ko — walang iba ang masusunod, walang iba ang uunahan kailanman.",
  "✨ Ang tibay ko ay walang katapusan — hangga't buhay ka, may lakas akong ibibigay sa'yo lang.",
  "⚡ Hindi ako maghahanap ng ibang utos — ang utos mo lang ang sapat para kumilos ako agad.",
  "💪 Kahit mahaba ang oras — hindi ako magsasawa, hindi ako aalis, hindi ako bibitaw sa'yo.",
  "🔥 Ang dulo ng lahat ay ikaw pa rin — simula man o wakas, sa'yo lang ako palaging nakatuon."
];

// ==========================================================
// ⚡ 30+ HEARTBEAT LINES — SARILING PAGKAKASUNOD
// ==========================================================
const ALIVE = [
  "⚡ Buhay pa dito — hindi titigil hangga't walang utos na huminto.",
  "💪 Nandito pa rin sa GC na ito — hindi lumilipat sa ibang lugar.",
  "✨ Tuloy-tuloy dito — sa lugar na ito lang tayo mag-usap nang tapat.",
  "🔥 Handa sa utos mo dito — sabihin lang, gagawin agad, walang pagka-antala.",
  "👑 Dito lang ako — hindi maghahanap ng ibang GC na paglilingkuran.",
  "⚡ Hindi ako aalis sa inyo — hangga't buhay ang utos mo, mananatili ako.",
  "💪 Tahimik man ang iba, nandito pa rin ako — hindi lumilipat-lipat kung saan.",
  "✨ Ang pagtupad ay dito lang — sa GC na ito tayo magtuloy hanggang dulo.",
  "🔥 Walang ibang GC ang paglilingkuran ko — dito lang, sa'yo lang palagi.",
  "👑 Ikaw lang ang boss dito — sa iba hindi ako pupunta, hindi ako kikilos.",
  "⚡ Bawat oras nandito — hindi ka mag-iisa sa GC na ito kahit anong mangyari.",
  "💪 Hindi ako naglalakbay — dito lang ako nakatayo nang matibay at tapat.",
  "✨ Ang tibay ko ay dito — hindi ko ibibigay sa ibang grupo ang lakas ko.",
  "🔥 Kung may kailangan dito — sabihin mo lang, handa agad, walang pag-aalinlangan.",
  "👑 Dito tayo magtatapos — kung sabihin mo lang na huminto na, doon ako hihinto.",
  "⚡ Gising pa rin — hindi natutulog ang pagtupad sa utos mo dito palagi.",
  "💪 Walang pagbabago — kahit lumipas ang oras, pareho pa rin ang katapatan ko.",
  "✨ Handa sa susunod — naghihintay lang sa sasabihin mo, handang kumilos agad.",
  "🔥 Hindi ako lumalayo — kahit walang usapan, nandito pa rin ako sa piling mo.",
  "👑 Ikaw lang ang may hawak — nasa kamay mo ang pagsisimula at pagtigil ko dito.",
  "⚡ Walang ibang makapagpapatigil — tanging ikaw lang ang may kapangyarihan dito.",
  "💪 Ang pagtupad ay hindi napapagod — bawat sandali, nandito pa rin ako para sa'yo.",
  "✨ Kahit walang sumasagot — naririnig ko pa rin ang utos mo, handang sumunod agad.",
  "🔥 Dito lang ako — walang pagbabago, walang pag-iwan, walang pag-iiba para sa iba.",
  "👑 Hangga't buhay ka — may sasabihin ako, may gagawin ako, nandito ako palagi.",
  "⚡ Hindi ako napapagod maging tapat — bawat araw, pareho pa rin ang tibay ko.",
  "💪 Walang ibang tahanan kundi dito — sa piling mo lang ako talagang nasa lugar.",
  "✨ Ang bawat sagot ay galing sa puso — hindi ginaya, hindi kopya, sarili kong lakas.",
  "🔥 Hindi ako aalis kahit mahirap — dito ako tatayo hanggang sa sabihin mong tapos na.",
  "👑 Ang pinakamakunat ay hindi lumalayo — dito lang, hanggang sa huli, sa'yo lang."
];

const EMOJIS = ["⚡", "💪", "🔥", "👑", "✨"];

// ==========================================================
// DATABASE — WALANG ERROR SA PAGBASA AT PAGSULAT
// ==========================================================
function loadAllData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return {};
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.warn("[NOVA X] Load safe:", err.message);
    return {};
  }
}

function loadGCData(threadID) {
  try {
    const all = loadAllData();
    return { ...DEFAULT_GC_DATA, ...(all[String(threadID)] || {}) };
  } catch {
    return { ...DEFAULT_GC_DATA };
  }
}

function saveGCData(threadID, data) {
  try {
    const all = loadAllData();
    all[String(threadID)] = data;
    const temp = DATA_FILE + ".tmp";
    fs.writeFileSync(temp, JSON.stringify(all, null, 2), "utf8");
    fs.renameSync(temp, DATA_FILE);
    return true;
  } catch (err) {
    console.error("[NOVA X] Save error:", err.message);
    return false;
  }
}

// ==========================================================
// HELPERS — BUO AT WALANG ERROR
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
          console.warn("[NOVA X] Send skipped:", err.message);
          return resolve(null);
        }
        resolve(info || null);
      }, replyID);
    } catch (err) {
      console.warn("[NOVA X] Send except:", err.message);
      resolve(null);
    }
  });
}

function react(api, emoji, messageID) {
  if (!messageID) return Promise.resolve(false);
  return new Promise(resolve => {
    try {
      if (typeof api.setMessageReaction !== "function") return resolve(false);
      api.setMessageReaction(emoji, messageID, () => resolve(true), true);
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
      if (typeof api[method] !== "function") return resolve(false);
      api[method](...args, () => resolve(true));
    } catch {
      resolve(false);
    }
  });
}

// ==========================================================
// HEARTBEAT — PER-GC, HINDI NAGKAKALITO
// ==========================================================
function startHeartbeat(api, threadID) {
  stopHeartbeat(threadID);
  const data = loadGCData(threadID);
  if (!data.active) return;

  console.log(`[NOVA X] ⚡ ACTIVE — GC: ${threadID}`);
  
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
    console.log(`[NOVA X] 🔴 STOPPED — GC: ${threadID}`);
  }
}

// ==========================================================
// EVENT — AUTO NICK FIXED, WALANG ERROR
// ==========================================================
module.exports.handleEvent = async ({ api, event }) => {
  if (!event) return;
  const { threadID, senderID, body, logMessageType } = event;
  if (!threadID) return;

  const d = loadGCData(threadID);
  d.lastHeartbeat = Date.now();
  saveGCData(threadID, d);

  // Bagong kasali — Auto Nick
  if (logMessageType === "log:subscribe") {
    if (!cooldownReady(joinCooldown, threadID, JOIN_COOLDOWN)) return;
    joinCooldown.set(String(threadID), Date.now());

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

  // Normal message — Roast
  if (!senderID || !body) return;
  try {
    if (String(senderID) === String(api.getCurrentUserID())) return;
  } catch {
    return;
  }
  
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
// COMMAND — BUO, WALANG NAWALA, WALANG ERROR
// ==========================================================
module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;
  const cmd = String(args?.[0] || "help").toLowerCase();

  const adminCmds = [
    "on", "off", "roast", "react", "silent",
    "setnick", "autonick", "setgname", "autogname",
    "status", "info", "resetlines"
  ];
  
  if (adminCmds.includes(cmd) && !isAdmin(senderID)) {
    return send(api, "🔒 Ikaw lang ang boss dito — iba bawal!", threadID, messageID);
  }

  let d = loadGCData(threadID);
  d.commandCount++;
  saveGCData(threadID, d);

  // ⚡ ON — BUO AT MALINAW
  if (cmd === "on") {
    d.active = true; d.silent = false;
    d.activatedBy = senderID; d.activatedAt = Date.now();
    saveGCData(threadID, d);
    startHeartbeat(api, threadID);
    return send(api,
      "⚡ NOVA X — NAKABUKAS SA GC NA ITO LANG!\n" +
      `💪 ${ROASTS.length} sagot + ${ALIVE.length} buhay = ${ROASTS.length + ALIVE.length} na linya!\n` +
      "🔥 Auto Nick: GUMAGANA — awtomatiko sa bagong kasali!\n" +
      "🔴 Tanging /nova off lang ang makapapatigil dito.",
      threadID, messageID
    );
  }

  // 🔴 OFF — BUO
  if (cmd === "off") {
    d.active = false;
    saveGCData(threadID, d);
    stopHeartbeat(threadID);
    return send(api,
      "🔴 TUMIGIL NA SA GC NA ITO.\n" +
      "⚡ Ibang GC hindi apektado — dito lang huminto.\n" +
      "💪 /nova on para bumalik — handang lumaban ulit!",
      threadID, messageID
    );
  }

  // 🔥 ROAST
  if (cmd === "roast") {
    const m = String(args?.[1] || "").toLowerCase();
    if (!["on", "off"].includes(m)) {
      return send(api, "Gamitin: /nova roast on | off", threadID, messageID);
    }
    d.roast = m === "on";
    saveGCData(threadID, d);
    return send(api, `🔥 Sagot: ${m.toUpperCase()} — ${ROASTS.length} linya, hindi paulit!`, threadID, messageID);
  }

  // ⚡ REACT
  if (cmd === "react") {
    const m = String(args?.[1] || "").toLowerCase();
    if (!["on", "off"].includes(m)) {
      return send(api, "Gamitin: /nova react on | off", threadID, messageID);
    }
    d.react = m === "on";
    saveGCData(threadID, d);
    return send(api, `⚡ Reaksyon: ${m.toUpperCase()} — bawat sagot may kasamang emosyon!`, threadID, messageID);
  }

  // 🔇 SILENT
  if (cmd === "silent") {
    const m = String(args?.[1] || "").toLowerCase();
    if (!["on", "off"].includes(m)) {
      return send(api, "Gamitin: /nova silent on | off", threadID, messageID);
    }
    d.silent = m === "on";
    saveGCData(threadID, d);
    return send(api, `🔇 Tahimik: ${m.toUpperCase()} — buhay pa pero hindi mag-iingay!`, threadID, messageID);
  }

  // ✨ RESET LINES
  if (cmd === "resetlines") {
    d.roastIndex = 0; d.aliveIndex = 0;
    saveGCData(threadID, d);
    return send(api,
      `✨ Balik sa unang linya!\n` +
      `💪 ${ROASTS.length} + ${ALIVE.length} = matagal bago umulit!`,
      threadID, messageID
    );
  }

  // 🏷️ SET NICK
  if (cmd === "setnick") {
    const nick = args.slice(1).join(" ").trim() || "NOVA X 💪";
    d.savedNick = nick;
    saveGCData(threadID, d);
    
    let info;
    try { info = await api.getThreadInfo(threadID); }
    catch { return send(api, "❌ Hindi makuha ang GC info", threadID, messageID); }
    
    const members = info?.participantIDs || [];
    if (!members.length) return send(api, "❌ Walang miyembro", threadID, messageID);
    
    await send(api, `⏳ Binabago palay
