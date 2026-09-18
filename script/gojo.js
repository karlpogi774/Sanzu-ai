"use strict";

const fs = require("fs");
const path = require("path");

// ======================================================
// GOJO BOT V10 | RATE-LIMITED INFINITY FRAMEWORK
// ======================================================

const ADMIN_ID = "61594055835097";

const DATA_FILE = path.join(__dirname, "gojo_exact_data.json");
const LOG_FILE = path.join(__dirname, "gojo_error.log");

// ======================================================
// DEFAULT SETTINGS
// ======================================================

const DEFAULT_DATA = {
  active: true,

  // Reaction can still happen to accepted trigger messages.
  autoReact: true,

  // Delay before replying.
  delay: 2000,

  // Statistics.
  totalReplies: 0,

  // Auto reply only happens when one of these triggers
  // appears in the message.
  triggers: [
    "gojo",
    "satoru",
    "infinity"
  ],

  // Maximum replies from the bot during this window.
  maxRepliesPerWindow: 5,

  // Rate-limit window.
  rateLimitWindowMs: 60000,

  // Same user cannot trigger another reply until this
  // cooldown expires.
  userCooldownMs: 10000
};

// ======================================================
// RUNTIME LIMITS
// ======================================================

const MAX_QUEUE = 25;
const MAX_SEEN_MESSAGES = 5000;
const MAX_COOLDOWN_ENTRIES = 3000;

// ======================================================
// RUNTIME STORAGE
// ======================================================

const USER_COOLDOWN = new Map();
const SEEN_MESSAGES = new Set();

const REPLY_QUEUE = [];
const RATE_LIMIT_TIMES = [];

let queueRunning = false;
let saveTimer = null;

// ======================================================
// GOJO QUOTES
// ======================================================

const GOJO_QUOTES = [
  "Sa buong langit at lupa, ako lamang ang nag-iisang Honored One. ♾️",

  "Infinity ang pagitan natin. Hindi mo ako maaabot. 😎",

  "Domain Expansion: Infinite Void. 🌌",

  "Relax ka lang. Nandito na ang pinakamalakas. 💙",

  "Isang mensahe, isang sagot. Walang doble-doble.",

  "Masyado kang mabagal para sa Infinity ko. ⚡",

  "Hindi ako nagyayabang. Sinasabi ko lang ang katotohanan. 😏",

  "Six Eyes activated. Walang nakakalusot sa paningin ko. 👁️",

  "Kalmado lang. Gojo Satoru ang kausap mo. ♾️",

  "Walang challenge na hindi kayang harapin ng pinakamalakas.",

  "Your move. Ako na ang bahala sa reply. 😎",

  "Kahit gaano ka pa kabilis, Infinity pa rin ang haharapin mo.",

  "Walang drama. Isang reply lang, sapat na. 😂",

  "Nasa ibang level ang laro ko. 🌌",

  "Sige lang, mag-message ka. May sagot ako diyan. 😆",

  "Relax. Hindi pa nga ako seryoso. 💙",

  "Ang lakas mo naman... sa chat. 😂",

  "Infinite Void: loading your thoughts... 🌌",

  "Hindi lahat ng tahimik ay talo. Minsan, nag-iisip lang ng reply.",

  "Gojo mode: ON. ♾️",

  "Walang duplicate reply dito. Unique ang bawat galaw.",

  "Sino'ng nagsabing kailangan kong mag-effort? 😏",

  "Isang tingin lang, alam ko nang may bagong message. 👁️",

  "Infinity never sleeps. Pero ako, minsan kailangan din magpahinga. 😂",

  "Ang bilis mo mag-chat. Hinay-hinay lang, boss. 😆",

  "Sige, noted. Pero Gojo pa rin ang pinakamalakas. ♾️",

  "May bagong message? Hayaan mong sagutin ng legend.",

  "Ang buhay ay parang Infinite Void. Maraming iniisip, walang katapusan.",

  "Kaya kong sagutin 'yan. Pero kaya mo bang tanggapin? 😎",

  "System online. Gojo is watching. 👁️"
];

// ======================================================
// LOGGING
// ======================================================

function logError(error) {
  const text =
    `[${new Date().toISOString()}] ` +
    `${error && error.stack ? error.stack : String(error)}\n`;

  try {
    fs.appendFileSync(LOG_FILE, text, "utf8");
  } catch (logErrorObject) {
    console.error(
      "[GOJO] Failed to write error log:",
      logErrorObject.message
    );
  }
}

// ======================================================
// DATA MANAGEMENT
// ======================================================

function normalizeData(saved) {
  const result = {
    ...DEFAULT_DATA,
    ...(saved || {})
  };

  result.active = Boolean(result.active);
  result.autoReact = Boolean(result.autoReact);

  result.delay = clampNumber(
    result.delay,
    0,
    10000,
    DEFAULT_DATA.delay
  );

  result.totalReplies = Number.isFinite(Number(result.totalReplies))
    ? Number(result.totalReplies)
    : 0;

  result.maxRepliesPerWindow = clampNumber(
    result.maxRepliesPerWindow,
    1,
    20,
    DEFAULT_DATA.maxRepliesPerWindow
  );

  result.rateLimitWindowMs = clampNumber(
    result.rateLimitWindowMs,
    10000,
    300000,
    DEFAULT_DATA.rateLimitWindowMs
  );

  result.userCooldownMs = clampNumber(
    result.userCooldownMs,
    1000,
    120000,
    DEFAULT_DATA.userCooldownMs
  );

  if (!Array.isArray(result.triggers)) {
    result.triggers = [...DEFAULT_DATA.triggers];
  }

  result.triggers = result.triggers
    .map(value => normalizeText(value))
    .filter(Boolean)
    .slice(0, 50);

  return result;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, number));
}

function loadSystemData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return normalizeData(DEFAULT_DATA);
    }

    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const saved = JSON.parse(raw);

    return normalizeData(saved);
  } catch (error) {
    logError(error);
    return normalizeData(DEFAULT_DATA);
  }
}

let SYSTEM_DATA = loadSystemData();

function saveSystemData() {
  const temporaryFile = `${DATA_FILE}.tmp`;

  try {
    fs.writeFileSync(
      temporaryFile,
      JSON.stringify(SYSTEM_DATA, null, 2),
      "utf8"
    );

    fs.renameSync(temporaryFile, DATA_FILE);

    return true;
  } catch (error) {
    logError(error);

    try {
      if (fs.existsSync(temporaryFile)) {
        fs.unlinkSync(temporaryFile);
      }
    } catch (_) {}

    return false;
  }
}

// ======================================================
// DEBOUNCED SAVE
// Prevents excessive disk writes.
// ======================================================

function scheduleSave() {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }

  saveTimer = setTimeout(() => {
    saveTimer = null;
    saveSystemData();
  }, 1000);
}

// ======================================================
// HELPERS
// ======================================================

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function isAdmin(senderID) {
  return String(senderID || "") === ADMIN_ID;
}

function randomQuote() {
  return GOJO_QUOTES[
    Math.floor(Math.random() * GOJO_QUOTES.length)
  ];
}

function getThreadID(event) {
  return String(
    event?.threadID ||
    event?.threadId ||
    ""
  );
}

function getSenderID(event) {
  return String(
    event?.senderID ||
    event?.senderId ||
    ""
  );
}

function getMessageID(event) {
  return String(
    event
