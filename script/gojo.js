// ======================================================
// GOJO BOT V11 | STABLE QUEUE EDITION
// Sanzu-style command module
// ======================================================

const fs = require("fs");
const path = require("path");

const ADMIN_ID = "61594055835097";
const DATA_FILE = path.join(__dirname, "gojo_data.json");
const LOG_FILE = path.join(__dirname, "gojo_error.log");

const DEFAULT_DATA = {
  active: true,
  autoReact: true,
  delay: 2000,
  cooldown: 3000,
  totalReplies: 0
};

const MAX_QUEUE = 500;
const MAX_SEEN = 3000;

let data = { ...DEFAULT_DATA };
let queue = [];
let queueRunning = false;
let lastQueueActivity = Date.now();
let totalRecoveries = 0;
let lastSaveTime = Date.now();

const seenMessages = new Set();
const userLastReply = new Map();

// ==================== LOAD / SAVE =====================

function logError(where, error) {
  const message =
    `[${new Date().toISOString()}] ${where}: ` +
    `${error?.stack || error}\n`;

  console.error(message);

  try {
    fs.appendFileSync(LOG_FILE, message);
  } catch (_) {}
}

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const saved = JSON.parse(
        fs.readFileSync(DATA_FILE, "utf8")
      );

      data = {
        ...DEFAULT_DATA,
        ...saved
      };
    }
  } catch (error) {
    logError("Load data failed", error);
    data = { ...DEFAULT_DATA };
  }
}

function saveData() {
  try {
    const tempFile = DATA_FILE + ".tmp";

    fs.writeFileSync(
      tempFile,
      JSON.stringify(data, null, 2)
    );

    fs.renameSync(tempFile, DATA_FILE);
    lastSaveTime = Date.now();
  } catch (error) {
    logError("Save data failed", error);
  }
}

loadData();

// ==================== GOJO REPLIES ====================

const GOJO_QUOTES = [
  "Sa buong langit at lupa, ako lamang ang nag-iisang Honored One. ♾️",
  "Infinity ang pagitan natin. Hindi mo ako maaabot. 😎",
  "Domain Expansion: Infinite Void. 🌌",
  "Relax ka lang. Nandito na ang pinakamalakas. 💙",
  "Six Eyes activated. 👁️",
  "Hindi ako nagyayabang. Sinasabi ko lang ang katotohanan. 😏",
  "Gojo mode: ON. ♾️",
  "Masyado kang mabagal para sa Infinity ko. ⚡",
  "Walang drama. Isang reply lang, sapat na. 😂",
  "Nasa ibang level ang laro ko. 🌌",
  "Hindi pa nga ako seryoso. 💙",
  "Ang lakas mo naman... sa chat. 😂",
  "Infinity barrier: activated. ♾️",
  "Sige, tuloy mo lang. Nakikinig ang Six Eyes. 👁️",
  "Ang tunay na lakas ay marunong maghintay. ⏳",
  "Gojo Satoru reporting for duty. 😎",
  "Hindi ako late. Dramatic entrance lang. ✨",
  "Walang lag sa confidence ko. ⚡",
  "Random ang quote, pero Gojo ang dating. 😂",
  "Keep calm. Infinity is handling the messages. 🌌",
  "May bagong message? Gojo has entered the chat. 😎",
  "Isang reply lang, unlimited confidence. ♾️",
  "Ang bawat message ay may sariling oras. ⏱️",
  "Six Eyes online. System ready. 👁️",
  "Walang duplicate, walang kalituhan. 💙",
  "Ang reply ay darating sa tamang oras. ⏳",
  "Gojo energy: 100%. 🔋",
  "Hindi kailangang mag-spam para maging legendary. 😎",
  "Domain Expansion: Organized Reply Queue. 🌌",
  "Infinity activated. Reply queued. ♾️",
  "Sagot na may style, hindi puro ingay. 💙",
  "Gojo's random wisdom has arrived. ✨",
  "Ang tunay na flex ay stable na bot. ⚡",
  "Minsan, ang katahimikan ay bahagi ng strategy. 😌",
  "Message received. Infinity acknowledged. ♾️",
  "Walang panic. May error log naman. 🛠️",
  "Kung may problema, debug muna bago mag-drama. 😂",
  "Gojo's got this. 😎",
  "Naka-Infinity ang depensa, naka-queue ang sagot. 🌌",
  "Six Eyes detected: may bagong message. 👁️",
  "One message, one reply. Simple lang. 💙",
  "Ang confidence ay libre. Gamitin nang maayos. 😏",
  "Walang shortcut sa pagiging Honored One. ♾️",
  "Gojo bot: ready kapag kailangan. 💙",
  "Infinity mode: stable and ready. ⚡",
  "Sino'ng nagsabing kailangan kong mag-effort? 😏",
  "Walang makakalusot sa radar ng Gojo. 👁️",
  "Sapat na ang isang reply para mapansin. 😎",
  "Queue is moving. Infinity is watching. 🌌",
  "Gojo Satoru: present. 😎",

  "Six Eyes online, kalma lang. 👁️",
  "Infinity barrier secured. ♾️",
  "Gojo checking in. 💙",
  "Infinite Void loading... 🌌",
  "Chill lang, may Gojo sa GC. 😎",
  "Gojo mode activated successfully. ⚡",
  "Message received, Six Eyes detected it. 👁️",
  "Walang panic sa Infinite Void. 🌌",
  "Gojo energy detected. 💙",
  "Reply prepared with Infinity style. ♾️",
  "Naka-standby lang ang Honored One. 😎",
  "Walang takas sa random quote ko. 😂",
  "Gojo is here, keep the peace. 💙",
  "Infinite confidence, limited words. ♾️",
  "System ready, Gojo ready. ⚡",
  "Isang message, isang sagot. 😎",
  "Gojo's got the chat covered. 👁️",
  "Infinity is working as intended. 🌌",
  "Relax, hindi ito Infinite Panic. 😂",
  "Six Eyes sees the message. 👁️"
];

// ==================== REPLY VARIATIONS =================

const PREFIXES = [
  "♾️ Gojo mode",
  "👁️ Six Eyes",
  "🌌 Infinite Void",
  "💙 Honored One",
  "⚡ Infinity"
];

const MESSAGES = [
  "activated",
  "online",
  "detected",
  "ready",
  "checking the chat",
  "has entered the GC",
  "is watching",
  "is processing",
  "is on standby",
  "reply queued"
];

const EMOJIS = [
  "😎", "⚡", "♾️", "💙", "🌌",
  "👁️", "✨", "😂", "🔥", "🌀"
];

const REPLIES = [...GOJO_QUOTES];

for (const prefix of PREFIXES) {
  for (const message of MESSAGES) {
    for (const emoji of EMOJIS) {
      REPLIES.push(`${prefix}: ${message} ${emoji}`);
    }
  }
}

function randomReply() {
  return REPLIES[
    Math.floor(Math.random() * REPLIES.length)
  ];
}
