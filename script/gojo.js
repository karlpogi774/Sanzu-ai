// ======================================================
// GOJO BOT V12 | INFINITY MAKUNAT EDITION
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

// ==================== STABILITY STATE =================

let lastQueueActivity = Date.now();
let totalRecoveries = 0;
let lastSave = Date.now();

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
        lastSave = Date.now();

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
    "Infinity protocol: operational. ♾️",
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
    "💙 Honored One",
    "⚡ Infinity",
    "🛡️ Infinity Shield",
    "📡 Gojo Signal",
    "🚀 Gojo System",
    "🔋 Gojo Energy",
    "✨ Gojo Protocol"
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
    "reply queued",
    "system stable",
    "monitoring messages",
    "processing request",
    "watching the queue",
    "response prepared",
    "connection stable",
    "waiting for the next message",
    "scanning the conversation",
    "protecting the queue",
    "running normally"
];

const EMOJIS = [
    "😎", "⚡", "♾️", "💙", "🌌",
    "👁️", "✨", "😂", "🔥", "🌀",
    "🚀", "🛡️", "📡", "⏳", "🔋"
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

// ==================== HELPERS =========================

function isAdmin(id) {
    return String(id) === ADMIN_ID;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function send(api, message, threadID, messageID) {
    try {
        api.sendMessage(
            message,
            threadID,
            error => {
                if (error) logError("Send message failed", error);
            },
            messageID
        );
    } catch (error) {
        logError("Send exception", error);
    }
}

function react(api, messageID) {
    try {
        if (typeof api.setMessageReaction !== "function") return;

        api.setMessageReaction(
            "😆",
            messageID,
            error => {
                if (error) logError("Reaction failed", error);
            },
            true
        );

    } catch (error) {
        logError("Reaction exception", error);
    }
}

function rememberMessage(messageID) {
    const id = String(messageID);

    if (seenMessages.has(id)) return false;

    seenMessages.add(id);

    if (seenMessages.size > MAX_SEEN) {
        const oldest = seenMessages.values().next().value;

        if (oldest !== undefined) {
            seenMessages.delete(oldest);
        }
    }

    return true;
}

// ==================== QUEUE ===========================

function enqueue(item) {
    if (queue.length >= MAX_QUEUE) {
        console.log("[GOJO] Queue full; message skipped.");
        return;
    }

    queue.push(item);
    startQueue();
}

function startQueue() {
    if (queueRunning) return;

    queueRunning = true;
    lastQueueActivity = Date.now();

    processQueue()
        .catch(error => {
            logError("Queue error", error);
        })
        .finally(() => {
            queueRunning = false;
            lastQueueActivity = Date.now();

            if (queue.length > 0) {
                setTimeout(() => {
                    startQueue();
                }, 100);
            }
        });
}

async function processQueue() {
    while (queue.length > 0) {

        lastQueueActivity = Date.now();

        const item = queue[0];

        try {
            if (!data.active) {
                await sleep(1000);
                continue;
            }

            const key =
                `${item.threadID}:${item.senderID}`;

            const last =
                userLastReply.get(key) || 0;

            const wait =
                data.cooldown -
                (Date.now() - last);

            if (wait > 0) {
                await sleep(Math.min(wait, 1000));
                continue;
            }

            await sleep(data.delay);

            lastQueueActivity = Date.now();

            if (!data.active) continue;

            const sent = await new Promise(resolve => {
                try {
                    item.api.sendMessage(
                        `♾️ [GOJO SATORU]\n\n${randomReply()}`,
                        item.threadID,
                        error => resolve(!error),
                        item.messageID
                    );
                } catch (error) {
                    logError(
                        "Queue send exception",
                        error
                    );

                    resolve(false);
                }
            });

            lastQueueActivity = Date.now();

            if (!sent) {
                queue.shift();

                await sleep(2000);
                continue;
            }

            userLastReply.set(
                key,
                Date.now()
            );

            data.totalReplies += 1;

            queue.shift();

            // Save less aggressively to reduce disk usage
            if (Date.now() - lastSave >= 10000) {
                saveData();
            }

        } catch (error) {

            logError(
                "Queue item failed",
                error
            );

            queue.shift();

            await sleep(1000);
        }
    }

    lastQueueActivity = Date.now();
}

// ==================== INFINITY GUARD ===================

// Automatic queue recovery.
// Helps if the queue unexpectedly stops while items remain.

let watchdogRunning = false;

function queueWatchdog() {
    if (watchdogRunning) return;

    watchdogRunning = true;

    try {
        if (
            data.active &&
            queue.length > 0 &&
            !queueRunning
        ) {
            totalRecoveries++;

            console.log(
                `[GOJO] Queue recovery #${totalRecoveries}`
            );

            startQueue();
        }

        const inactiveFor =
            Date.now() - lastQueueActivity;

        if (
            data.active &&
            queue.length > 0 &&
            queueRunning &&
            inactiveFor > 120000
        ) {
            logError(
                "Queue watchdog",
                new Error(
                    "Queue appeared stuck for more than 120 seconds."
                )
            );

            queueRunning = false;
            totalRecoveries++;

            setTimeout(() => {
                startQueue();
            }, 100);
        }

    } catch (error) {
        logError(
            "Watchdog error",
            error
        );
    } finally {
        watchdogRunning = false;
    }
}

// Check every 30 seconds
setInterval(() => {
    queueWatchdog();
}, 30000);

// Extra queue safety check every 10 seconds
setInterval(() => {
    try {
        if (
            data.active &&
            queue.length > 0 &&
            !queueRunning
        ) {
            startQueue();
        }
    } catch (error) {
        logError(
            "Auto queue restart failed",
            error
        );
    }
}, 10000);

// ==================== MEMORY CLEANUP ==================

setInterval(() => {
    try {
        if (seenMessages.size > MAX_SEEN) {
            while (seenMessages.size > MAX_SEEN) {
                const first =
                    seenMessages.values().next().value;

                if (first === undefined) break;

                seenMessages.delete(first);
            }
        }

        if (userLastReply.size > MAX_SEEN) {
            const entries =
                Array.from(userLastReply.entries());

            entries
                .sort((a, b) => a[1] - b[1])
                .slice(
                    0,
                    Math.max(
                        0,
                        entries.length - MAX_SEEN
                    )
                )
                .forEach(([key]) => {
                    userLastReply.delete(key);
                });
        }

    } catch (error) {
        logError(
            "Memory cleanup failed",
            error
        );
    }
}, 60000);

// ==================== AUTO SAVE =======================

setInterval(() => {
    try {
        saveData();
    } catch (error) {
        logError(
            "Periodic save failed",
            error
        );
    }
}, 60000);

// ==================== PROCESS PROTECTION ==============

process.on("uncaughtException", error => {
    logError(
        "Uncaught exception",
        error
    );

    setTimeout(() => {
        try {
            if (
                data.active &&
                queue.length > 0 &&
                !queueRunning
            ) {
                startQueue();
            }
        } catch (restartError) {
            logError(
                "Recovery after uncaught exception failed",
                restartError
            );
        }
    }, 1000);
});

process.on("unhandledRejection", error => {
    logError(
        "Unhandled rejection",
        error
    );

    setTimeout(() => {
        try {
            if (
                data.active &&
                queue.length > 0 &&
                !queueRunning
            ) {
                startQueue();
            }
        } catch (restartError) {
            logError(
                "Recovery after rejection failed",
                restartError
            );
        }
    }, 1000);
});

// ==================== CONFIG ==========================

module.exports.config = {
    name: "gojo",
    version: "12.0.0",
    hasPermission: 0,
    credits: "Gojo Infinity Edition",
    description:
        "Gojo auto-reply with queue and admin controls",
    usePrefix: true,
    commandCategory: "AI",
    usages: "/gojo help",
    cooldowns: 2
};

// ==================== EVENT HANDLER ===================

module.exports.handleEvent = async function ({
    api,
    event
}) {
    try {
        if (!api || !event) return;

        const {
            threadID,
            senderID,
            messageID,
            body
        } = event;

        if (
            !threadID ||
            !senderID ||
            !messageID
        ) return;

        const sender = String(senderID);

        const botID =
            String(
                api.getCurrentUserID?.() || ""
            );

        if (
            sender === botID ||
            isAdmin(sender)
        ) return;

        if (!rememberMessage(messageID)) return;

        if (data.autoReact) {
            react(api, messageID);
        }

        if (!data.active) return;

        // Ignore bot commands
        if (
            typeof body === "string" &&
            body.startsWith("/")
        ) return;

        enqueue({
            api,
            threadID,
            senderID: sender,
            messageID: String(messageID)
        });

    } catch (error) {
        logError(
            "handleEvent error",
            error
        );
    }
};

// ==================== COMMANDS ========================

module.exports.run = async function ({
    api,
    event,
    args
}) {
    try {
        const threadID = event.threadID;
        const messageID = event.messageID;
        const senderID =
            String(event.senderID || "");

        const action =
            String(
                args?.[0] || "help"
            ).toLowerCase();

        const adminActions = [
            "on",
            "off",
            "delay",
            "cooldown",
            "reacton",
            "reactoff",
            "render"
        ];

        if (
            adminActions.includes(action) &&
            !isAdmin(senderID)
        ) {
            return send(
                api,
                "⛔ Admin lamang ang puwedeng gumamit nito.",
                threadID,
                messageID
            );
        }

        if (action === "help") {
            return send(
                api,
                `🌌 GOJO INFINITY COMMANDS 🌌

/gojo help
Ipakita ang commands

/gojo status
Tingnan ang status

/gojo on
I-on ang auto-reply

/gojo off
I-off ang auto-reply

/gojo quote
Random Gojo reply

/gojo delay 2000
Set reply delay in milliseconds

/gojo cooldown 3000
Set cooldown in milliseconds

/gojo reacton
I-on ang auto-reaction

/gojo reactoff
I-off ang auto-reaction

/gojo render
I-restart ang reply queue

🔐 Admin ID: ${ADMIN_ID}`,
                threadID,
                messageID
            );
        }

        if (action === "status") {
            return send(
                api,
                `🌌 GOJO STATUS 🌌

Auto-reply: ${
                    data.active
                        ? "ON 🟢"
                        : "OFF 🔴"
                }

Auto-react: ${
                    data.autoReact
                        ? "ON 🟢"
                        : "OFF 🔴"
                }

Delay: ${data.delay} ms
Cooldown: ${data.cooldown} ms
Queue: ${queue.length}
Queue running: ${
                    queueRunning
                        ? "YES 🟢"
                        : "NO 🔴"
                }

Recoveries: ${totalRecoveries}
Reply bank: ${REPLIES.length}
Total replies: ${data.totalReplies}

Last queue activity:
${new Date(
    lastQueueActivity
).toLocaleString()}`,
                threadID,
                messageID
            );
        }

        if (action === "quote") {
            return send(
                api,
                `♾️ [GOJO SATORU]\n\n${randomReply()}`,
                threadID,
                messageID
            );
        }

        if (action === "on") {
            data.active = true;

            saveData();
            startQueue();

            re
