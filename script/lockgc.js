// =====================================================
// LOCKGC | NON-PREFIX GROUP LOCK SETTINGS
// Separate file: lockgc.js
// =====================================================

const fs = require("fs");
const path = require("path");

const ADMIN_ID = "61594055835097";
const DATA_FILE = path.join(__dirname, "lockgc_data.json");

module.exports.config = {
  name: "lockgc",
  version: "1.0.0",
  hasPermission: 0,
  credits: "Titan Bot",
  description: "Group lock settings",
  usePrefix: false,
  commandCategory: "Group",
  usages: "lockgc help",
  cooldowns: 3
};

const LOCK_TYPES = ["name", "photo", "nickname", "chat"];

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, "{}");
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (err) {
    console.error("[LOCKGC] Load error:", err);
    return {};
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("[LOCKGC] Save error:", err);
  }
}

function getGroup(data, threadID) {
  if (!data[threadID]) {
    data[threadID] = {
      name: false,
      photo: false,
      nickname: false,
      chat: false
    };
  }

  for (const type of LOCK_TYPES) {
    if (typeof data[threadID][type] !== "boolean") {
      data[threadID][type] = false;
    }
  }

  return data[threadID];
}

function send(api, event, text) {
  return api.sendMessage(text, event.threadID, event.messageID);
}

// Owner ID OR current group admin
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

module.exports.run = async function ({ api, event, args }) {
  const action = String(args[0] || "help").toLowerCase();
  const type = String(args[1] || "").toLowerCase();

  const data = loadData();
  const group = getGroup(data, event.threadID);

  if (action === "help") {
    return send(api, event,
`🔒 LOCKGC | COMMANDS

lockgc help
lockgc status

lockgc lock name
lockgc lock photo
lockgc lock nickname
lockgc lock chat
lockgc lock all

lockgc unlock name
lockgc unlock photo
lockgc unlock nickname
lockgc unlock chat
lockgc unlock all

name = group name
photo = group photo
nickname = member nickname
chat = chat restriction setting

⚠️ Lock enforcement depends on API support.`);
  }

  if (action === "status") {
    return send(api, event,
`🔒 LOCKGC STATUS

Name: ${group.name ? "LOCKED" : "UNLOCKED"}
Photo: ${group.photo ? "LOCKED" : "UNLOCKED"}
Nickname: ${group.nickname ? "LOCKED" : "UNLOCKED"}
Chat: ${group.chat ? "LOCKED" : "UNLOCKED"}

These are saved settings. Actual enforcement requires supported API actions.`);
  }

  if (action !== "lock" && action !== "unlock") {
    return send(api, event,
      "Unknown command. Type: lockgc help");
  }

  if (!LOCK_TYPES.includes(type) && type !== "all") {
    return send(api, event,
      "Use: lockgc lock/unlock name|photo|nickname|chat|all");
  }

  return isAdmin(api, event, allowed => {
    if (!allowed) {
      return send(api, event,
        "⚠️ Bot owner o GC admin lang ang puwedeng mag-lock/unlock.");
    }

    const locked = action === "lock";

    if (type === "all") {
      for (const key of LOCK_TYPES) {
        group[key] = locked;
      }
    } else {
      group[type] = locked;
    }

    saveData(data);

    const label = locked ? "LOCKED" : "UNLOCKED";
    const note = locked
      ? "\n\n⚠️ Na-save ang setting. Hindi garantisadong mapipigilan ang pagbabago nang walang API enforcement."
      : "\n\nNa-save ang setting bilang unlocked.";

    return send(api, event,
      `🔒 LOCKGC\n${type.toUpperCase()}: ${label}${note}`);
  });
};
