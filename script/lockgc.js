const LOCKED_GC_NAME = "RYUK BOSS PINAKA POGI SA BUONG MUNDO";
const ADMIN_ID = "61594055835097";

module.exports.config = {
  name: "lockgc",
  version: "1.0.0",
  hasPermission: 0,
  credits: "Ryuk",
  description: "Locks the group chat name",
  usePrefix: true,
  commandCategory: "Group",
  usages: "/lockgc on | off | status",
  cooldowns: 2
};

const lockedThreads = new Set();

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID } = event;
  const command = String(args?.[0] || "").toLowerCase();

  // Admin only
  if (String(senderID) !== ADMIN_ID) {
    return api.sendMessage(
      "❌ Admin only.",
      threadID
    );
  }

  if (command === "on") {
    lockedThreads.add(threadID);

    try {
      await api.setTitle(
        LOCKED_GC_NAME,
        threadID
      );

      return api.sendMessage(
        `🔒 LOCK GC: ON\n\nGC Name:\n${LOCKED_GC_NAME}`,
        threadID
      );
    } catch (err) {
      return api.sendMessage(
        "❌ Hindi mapalitan ang GC name. Baka walang permission ang bot.",
        threadID
      );
    }
  }

  if (command === "off") {
    lockedThreads.delete(threadID);

    return api.sendMessage(
      "🔓 LOCK GC: OFF",
      threadID
    );
  }

  if (command === "status") {
    return api.sendMessage(
      `🔒 LOCK GC STATUS\n\n` +
      `Status: ${
        lockedThreads.has(threadID)
          ? "ON"
          : "OFF"
      }\n\n` +
      `Locked Name:\n${LOCKED_GC_NAME}`,
      threadID
    );
  }

  return api.sendMessage(
    "Usage:\n" +
    "/lockgc on\n" +
    "/lockgc off\n" +
    "/lockgc status",
    threadID
  );
};

// ======================================================
// AUTO RESTORE GC NAME
// ======================================================

module.exports.handleEvent = async function ({
  api,
  event
}) {
  try {
    const { threadID } = event;

    if (!threadID) return;
    if (!lockedThreads.has(threadID)) return;

    // Check current group info
    const info = await new Promise((resolve, reject) => {
      api.getThreadInfo(
        threadID,
        (err, data) => {
          if (err) return reject(err);
          resolve(data);
        }
      );
    });

    if (!info) return;

    const currentName =
      info.threadName || "";

    // Kapag iba ang GC name,
    // ibalik agad sa locked name.
    if (currentName !== LOCKED_GC_NAME) {
      await api.setTitle(
        LOCKED_GC_NAME,
        threadID
      );
    }

  } catch (err) {
    console.error(
      "[LOCKGC ERROR]",
      err
    );
  }
};
