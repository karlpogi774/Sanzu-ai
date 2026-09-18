// =====================================================
// TITAN BOT | NON-PREFIX GC TROLLER
// Auto-reply + Mention reply + Admin controls
// =====================================================

const fs = require("fs");
const path = require("path");

const ADMIN_ID = "61594055835097";
const DATA_FILE = path.join(__dirname, "titan_data.json");

const AUTO_COOLDOWN = 30000; // 30 seconds
const CALL_COOLDOWN = 8000;  // 8 seconds

module.exports.config = {
  name: "titan",
  version: "2.1.0",
  hasPermission: 0,
  credits: "Titan Bot",
  description: "GC banter auto-reply bot",
  usePrefix: false,
  commandCategory: "Fun",
  usages: "titan help | titan on | titan off | titan status",
  cooldowns: 3
};

const BANTER = [
  "Ang lakas mong mang-asar, parang may championship sa kakulitan. 😂",
  "Nag-type ka pa lang, ramdam na agad ang ingay ng GC. 😭",
  "Troller ka rin pala? Sige, salitan tayo, bawal pikon. 😎",
  "Ang bilis mo mag-reply, parang naka-duty ka sa GC.",
  "Relax lang, GC lang 'to, hindi finals ng asaran. 😂",
  "May bagong message na naman. Sino na naman ang makulit?",
  "Dahan-dahan sa pag-type, baka maubos kakulitan mo. 😭",
  "Ang GC tahimik sana… kaso may dumating na naman. 😂",
  "Sige lang, banat pa. Naka-ready ang kakulitan mode.",
  "Mukhang may laban na naman sa paligsahan ng banat. 😎"
];

const CALL_REPLIES = [
  "Tinawag mo ako? Nandito lang, nakaabang sa kakulitan. 😎",
  "Present! Sino ang may bagong banat diyan? 😂",
  "Titan online. Pero bawal pikon ha. 😭",
  "Ano 'yon? May bagong episode na naman ba ng asaran?"
];

const lastReply = new Map();

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (err) {
    console.error("[TITAN] Load error:", err);
    return {};
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("[TITAN] Save error:", err);
  }
}

function getGroup(data, threadID) {
  if (!data[threadID]) data[threadID] = { enabled: true };
  return data[threadID];
}

function send(api, event, text) {
  return api.sendMessage(text, event.threadID, event.messageID);
}

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Bot owner OR a current group admin
function isAdmin(api, event, callback) {
  if (String(event.senderID) === ADMIN_ID) {
    return callback(true);
  }

  api.getThreadInfo(event.threadID, (err, info) => {
    if (err || !info) return callback(false);

    const admins = info.adminIDs || [];
    const allowed = admins.some(item => {
      const id = typeof item === "string"
        ? item
        : item.id || item.userID;

      return String(id) === String(event.senderID);
    });

    callback(allowed);
  });
}

// ---------------- COMMANDS ----------------

module.exports.run = async function ({ api, event, args }) {
  const sub = String(args[0] || "help").toLowerCase();
  const data = loadData();
  const group = getGroup(data, event.threadID);

  if (sub === "help") {
    return send(api, event,
`🛡️ TITAN BOT | GC TROLLER

titan help
titan on
titan off
titan status

• Auto-reply sa GC
• Reply kapag tinawag o na-mention
• May cooldown laban sa spam

Admin/GC admin lang ang puwedeng mag-on/off.`);
  }

  if (sub === "status") {
    return send(api, event,
      `🛡️ Titan auto-reply: ${group.enabled ? "ON" : "OFF"}`);
  }

  if (sub === "on" || sub === "off") {
    return isAdmin(api, event, allowed => {
      if (!allowed) {
        return send(api, event,
          "⚠️ Admin lang ng bot o GC ang puwedeng mag-on/off.");
      }

      group.enabled = sub === "on";
      saveData(data);

      return send(api, event,
        `🛡️ Titan auto-reply: ${group.enabled ? "ON" : "OFF"}`);
    });
  }

  return send(api, event,
    "Hindi kilalang command. I-type ang titan help.");
};

// ---------------- AUTO-REPLY ----------------

module.exports.handleEvent = async function ({ api, event }) {
  if (!event || !event.threadID || !event.body) return;
  if (event.isGroup === false) return;

  const body = String(event.body).trim();
  if (!body) return;

  // Avoid replying to the bot's own messages
  const botID = String(
    typeof api.getCurrentUserID === "function"
      ? api.getCurrentUserID()
      : ""
  );

  if (botID && String(event.senderID) === botID) return;

  // Ignore Titan control commands
  if (/^titan\s+(on|off|help|status)\b/i.test(body)) return;

  const data = loadData();
  const group = getGroup(data, event.threadID);
  if (!group.enabled) return;

  const mentions = event.mentions || {};
  const taggedBot = botID &&
    Object.prototype.hasOwnProperty.call(mentions, botID);

  const calledBot = /\btitan\b/i.test(body);
  const key = String(event.threadID);
  const now = Date.now();

  // Reply when directly called or mentioned
  if (taggedBot || calledBot) {
    const callKey = key + ":call";
    const lastCall = lastReply.get(callKey) || 0;

    if (now - lastCall < CALL_COOLDOWN) return;

    lastReply.set(callKey, now);
    return send(api, event, randomItem(CALL_REPLIES));
  }

  // General auto-reply: once per group every 30 seconds
  const last = lastReply.get(key) || 0;
  if (now - last < AUTO_COOLDOWN) return;

  lastReply.set(key, now);
  return send(api, event, randomItem(BANTER));
};
