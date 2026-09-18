// ======================================================
// GOJO BOT V11 | INFINITY MAKUNAT EDITION
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

// ==================== INFINITY GUARD ==================

let lastQueueActivity = Date.now();
let totalRecoveries = 0;
let lastSaveTime = Date.now();
let watchdogBusy = false;

// ==================== MEMORY ==========================

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

  // ================= EXTRA LINES =================

  "Infinity shield online. 🛡️",
  "Six Eyes scan complete. 👁️",
  "Gojo system is still running. ⚡",
  "Message detected. Preparing response. 📡",
  "Reply engine online. 🚀",
  "Infinite Void connection stable. 🌌",
  "No panic. Queue is under control. 😎",
  "Gojo protocol activated. ♾️",
  "Another message entered the queue. 📥",
  "System check complete. 💙",
  "Infinity remains active. ⚡",
  "Six Eyes sees everything in the chat. 👁️",
  "Reply prepared successfully. ✅",
  "Gojo engine standing by. 😎",
  "Processing message through Infinity. ♾️",
  "The strongest has received your message. 🌌",
  "Response sequence initiated. 🚀",
  "Gojo mode remains active. 💙",
  "Queue secured. 🛡️",
  "Nothing gets past Infinity. ♾️",
  "Chat signal detected. 📡",
  "Reply system is ready. ⚡",
  "Infinite Void monitoring the conversation. 🌌",
  "Gojo is watching the queue. 👁️",
  "System stable. Continue normally. 😎",
  "Another response is on the way. ⏳",
  "Infinity protocol operational. ♾️",
  "Six Eyes status: ONLINE. 👁️",
  "Gojo response generator activated. 🤖",
  "Message accepted by Infinity. 💙",
  "No duplicate response detected. ✅",
  "Queue protection active. 🛡️",
  "Gojo communication system ready. 📡",
  "Processing complete. ⚡",
  "Infinite confidence loaded. 😎",
  "Gojo has entered standby mode. 🌌",
  "Response queued successfully. 📥",
  "Infinity never rushes. ⏳",
  "Six Eyes knows when to respond. 👁️",
  "Gojo protocol continues. ♾️",
  "Stable mode activated. 🔋",
  "The strongest is still online. 😎",
  "Message received loud and clear. 📡",
  "Queue monitor active. 🛡️",
  "Gojo system continues running. ⚡",
  "Infinite Void remains operational. 🌌",
  "Response ready when the timing is right. ⏱️",
  "No need to panic. Infinity is active. ♾️",
  "Gojo status: still standing. 😎"
];

// ==================== GENERATED REPLIES ===============

const PREFIXES = [
  "♾️ Gojo mode",
  "👁️ Six Eyes",
  "🌌 Infinite Void",
  "💙 Honored
