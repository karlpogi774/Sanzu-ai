// ======================================================
// LOCKGC V2 | MAKUNAT + AUTO NICKNAME
// Default nickname: RYUK POGI
// ======================================================

const fs = require("fs");
const path = require("path");

const ADMIN_ID = "61594055835097";

const DATA_FILE = path.join(__dirname, "lockgc_data.json");
const LOG_FILE = path.join(__dirname, "lockgc_error.log");

const DEFAULT_DATA = {
  enabled: true,
  nickname: "RYUK POGI",
  cooldown: 10000,
  totalProcessed: 0,
  totalChanged: 0,
  totalErrors: 0
};

let data = loadData();

// ======================================================
// STABILITY SETTINGS
// ======================================================

const MAX_QUEUE = 100;
const MAX_SEEN = 1000;
const MAX_RETRIES = 3;

const queue = [];
const seenMessages = new Set();
const userCooldown = new Map();

let queueRunning = false;
let healthStarted = false;

// ======================================================
// LOAD / SAVE
// ======================================================

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(DEFAULT_DATA, null, 2)
      );

      return { ...DEFAULT_DATA };
    }

    const saved = JSON.parse(
      fs.readFileSync(DATA_FILE, "utf8")
    );

    return {
      ...DEFAULT_DATA,
      ...saved
    };

  } catch (err) {
    logError("loadData", err);
    return { ...DEFAULT_DATA };
  }
}

function saveData() {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(data, null, 2)
    );
  } catch (err) {
    logError("saveData", err);
  }
}

// ======================================================
// ERROR LOGGER
// ======================================================

function logError(where, error) {
  try {
    fs.appendFileSync(
      LOG_FILE,
      `[${new Date().toISOString()}] ${where}: ` +
      `${error?.stack || error}\n`
    );
  } catch (_) {}
}

// ======================================================
// HELPERS
// ======================================================

function sleep(ms) {
  return new Promise(resolve =>
    set
