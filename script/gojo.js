// ======================================================
// GOJO BOT V11 | Sanzu-style command module
// Filename: gojo.js
// ======================================================

const fs = require("fs");
const path = require("path");

const ADMIN_ID = "61594055835097";
const PREFIX = "/gojo";
const TRIGGER = "!gojo";

const DATA_DIR = path.join(__dirname, "gojo_data");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
const LOG_FILE = path.join(DATA_DIR, "errors.log");

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_SETTINGS = {
    active: true,
    autoReact: false,
    delay: 1200,
    cooldown: 5000,
    totalReplies: 0
};

function loadSettings() {
    try {
        if (!fs.existsSync(SETTINGS_FILE)) {
            saveSettings(DEFAULT_SETTINGS);
            return { ...DEFAULT_SETTINGS };
        }

        const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
        return { ...DEFAULT_SETTINGS, ...data };
    } catch (error) {
        logError(error);
        return { ...DEFAULT_SETTINGS };
    }
}

function saveSettings(data) {
    try {
        fs.writeFileSync(
            SETTINGS_FILE,
            JSON.stringify(data, null, 2),
            "utf8"
        );
    } catch (error) {
        logError(error);
    }
}

function logError(error) {
    try {
        fs.appendFileSync(
            LOG_FILE,
            `[${new Date().toISOString()}] ${error.stack || error}\n`
        );
    } catch (_) {}
}

const settings = loadSettings();
const queue = [];
const cooldowns = new Map();
const seenMessages = new Set();

const MAX_QUEUE = 100;
const MAX_SEEN = 1000;
let processing = false;

const REPLIES = [
    "Gojo is here. Ano'ng kailangan mo?",
    "Relax lang, isa-isahin natin.",
    "Nakita ko message mo. Ano'ng tanong?",
    "Gojo mode: ON.",
    "Sige, ano'ng next?",
    "Message received. Chill lang tayo."
];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function randomReply() {
    return REPLIES[Math.floor(Math.random() * REPLIES.length)];
}

function isAdmin(event) {
    return String(event.senderID) === ADMIN_ID;
}

function rememberMessage(id) {
    if (!id) return false;
    if (seenMessages.has(id)) return true;

    seenMessages.add(id);

    if (seenMessages.size > MAX_SEEN) {
        const oldest = seenMessages.values().next().value;
        seenMessages.delete(oldest);
    }

    return false;
}

async function sendMessage(api, threadID, message) {
    return new Promise((resolve, reject) => {
        api.sendMessage(message, threadID, error => {
            if (error) reject(error);
            else resolve();
        });
    });
}

async function react(api, messageID, emoji = "👍") {
    if (!messageID) return;

    return new Promise(resolve => {
        api.setMessageReaction(
            emoji,
            messageID,
            error => {
                if (error) logError(error);
                resolve();
            }
        );
    });
}

async function processQueue(api) {
    if (processing) return;
    processing = true;

    try {
        while (queue.length > 0) {
            const task = queue.shift();

            if (!settings.active) continue;

            try {
                await sleep(Math.max(500, Number(settings.delay) || 1200));
                await sendMessage(api, task.threadID, task.message);

                settings.totalReplies++;
                saveSettings(settings);
            } catch (error) {
                logError(error);
            }
        }
    } finally {
        processing = false;
    }
}

function enqueue(api, threadID, message) {
    if (queue.length >= MAX_QUEUE) return false;

    queue.push({ threadID, message });
    processQueue(api).catch(logError);

    return true;
}

function statusText() {
    return [
        "╭─「 GOJO STATUS 」",
        `│ Active: ${settings.active ? "ON" : "OFF"}`,
        `│ Auto react: ${settings.autoReact ? "ON" : "OFF"}`,
        `│ Delay: ${settings.delay} ms`,
        `│ Cooldown: ${settings.cooldown} ms`,
        `│ Total replies: ${settings.totalReplies}`,
        `│ Queue: ${queue.length}/${MAX_QUEUE}`,
        "╰──────────────"
    ].join("\n");
}

function helpText() {
    return [
        "╭─「 GOJO COMMANDS 」",
        `${PREFIX} on`,
        `${PREFIX} off`,
        `${PREFIX} status`,
        `${PREFIX} react on`,
        `${PREFIX} react off`,
        `${PREFIX} delay <milliseconds>`,
        `${PREFIX} cooldown <milliseconds>`,
        `${PREFIX} quote`,
        "",
        `Trigger: ${TRIGGER}`,
        "╰──────────────"
    ].join("\n");
}

async function handleCommand(api, event, body) {
    const threadID = event.threadID;
    const args = body.slice(PREFIX.length).trim().split(/\s+/);
    const action = (args[0] || "help").toLowerCase();

    if (!isAdmin(event)) {
        return sendMessage(api, threadID, "Admin-only command.");
    }

    if (action === "help") {
        return sendMessage(api, threadID, helpText());
    }

    if (action === "on") {
        settings.active = true;
        saveSettings(settings);
        return sendMessage(api, threadID, "Gojo is ON.");
    }

    if (action === "off") {
        settings.active = false;
        queue.length = 0;
        saveSettings(settings);
        return sendMessage(api, threadID, "Gojo is OFF. Queue cleared.");
    }

    if (action === "status") {
        return sendMessage(api, threadID, statusText());
    }

    if (action === "quote") {
        return sendMessage(api, threadID, randomReply());
    }

    if (action === "react" && args[1] === "on") {
        settings.autoReact = true;
        saveSettings(settings);
        return sendMessage(api, threadID, "Auto react is ON.");
    }

    if (action === "react" && args[1] === "off") {
        settings.autoReact = false;
        saveSettings(settings);
        return sendMessage(api, threadID, "Auto react is OFF.");
    }

    if (action === "delay") {
        const value = Number(args[1]);

        if (!Number.isFinite(value) || value < 500 || value > 60000) {
            return sendMessage(
                api,
                threadID,
                "Delay must be between 500 and 60000 milliseconds."
            );
        }

        settings.delay = value;
        saveSettings(settings);
        return sendMessage(api, threadID, `Delay set to ${value} ms.`);
    }

    if (action === "cooldown") {
        const value = Number(args[1]);

        if (!Number.isFinite(value) || value < 1000 || value > 3600000) {
            return sendMessage(
                api,
                threadID,
                "Cooldown must be between 1000 and 3600000 milliseconds."
            );
        }

        settings.cooldown = value;
        saveSettings(settings);
        return sendMessage(api, threadID, `Cooldown set to ${value} ms.`);
    }

    return sendMessage(api, threadID, "Unknown command. Use /gojo help.");
}

module.exports.config = {
    name: "gojo",
    version: "11.0.0",
    hasPermssion: 0,
    credits: "Gojo Bot",
    description: "Gojo trigger reply and admin controls",
    commandCategory: "chat",
    usages: "/gojo help",
    cooldowns: 3
};

module.exports.handleEvent = async function ({ api, event }) {
    try {
        if (!event || !event.threadID || !event.senderID) return;
        if (event.senderID === api.getCurrentUserID?.()) return;

        const messageID = event.messageID;
        if (rememberMessage(messageID)) return;

        const body = String(event.body || "").trim();
        if (!body) return;

        if (body.toLowerCase().startsWith(PREFIX)) {
            return handleCommand(api, event, body);
        }

        if (!settings.active) return;

        // React only when enabled and only to trigger messages.
        if (settings.autoReact && body.toLowerCase() === TRIGGER) {
            await react(api, messageID, "👍");
        }

        // Respond only when the user explicitly types !gojo.
        if (body.toLowerCase() !== TRIGGER) return;

        const senderID = String(event.senderID);
        const now = Date.now();
        const lastUsed = cooldowns.get(senderID) || 0;

        if (now - lastUsed < settings.cooldown) return;

        cooldowns.set(senderID, now);

        enqueue(api, event.threadID, randomReply());
    } catch (error) {
        logError(error);
    }
};

module.exports.run = async function ({ api, event }) {
    return handleCommand(api, event, `${PREFIX} help`);
};
