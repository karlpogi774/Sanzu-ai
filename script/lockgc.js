const LOCKED_GC_NAME = "RYUK BOSS PINAKA POGI SA BUONG MUNDO";
const DEFAULT_NICKNAME = "RYUK POGI";
const ADMIN_ID = "61594055835097";

const lockedThreads = new Set();
const nicknameEnabledThreads = new Set();

const nicknameCooldown = new Map();
const RESTORE_COOLDOWN = 10000;

// ======================================================
// CONFIG
// ======================================================

module.exports.config = {
  name: "lockgc",
  version: "2.0.0",
  hasPermission: 0,
  credits: "Ryuk",
  description: "Locks GC name and manages auto nicknames",
  usePrefix: true,
  commandCategory: "Group",
  usages: "/lockgc on | off | nick | status",
  cooldowns: 2
};

// ======================================================
// HELPERS
// ======================================================

function isAdmin(senderID) {
  return String(senderID) === String(ADMIN_ID);
}

function safeSend(api, message, threadID) {
  return new Promise(resolve => {
    try {
      api.sendMessage(
        message,
        threadID,
        () => resolve()
      );
    } catch (err) {
      console.error("[LOCKGC SEND ERROR]", err);
      resolve();
    }
  });
}

function sleep(ms) {
  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}

// ======================================================
// SAFE SET TITLE
// ======================================================

async function safeSetTitle(
  api,
  title,
  threadID
) {
  try {
    await api.setTitle(
      title,
      threadID
    );

    return true;
  } catch (err) {
    console.error(
      "[LOCKGC TITLE ERROR]",
      err
    );

    return false;
  }
}

// ======================================================
// SAFE NICKNAME
// ======================================================

async function safeNickname(
  api,
  nickname,
  threadID,
  userID
) {
  try {
    await api.changeNickname(
      nickname,
      threadID,
      userID
    );

    return true;
  } catch (err) {
    console.error(
      "[LOCKGC NICK ERROR]",
      err
    );

    return false;
  }
}

// ======================================================
// COMMAND
// ======================================================

module.exports.run = async function ({
  api,
  event,
  args
}) {
  try {
    const {
      threadID,
      senderID
    } = event;

    const command =
      String(args?.[0] || "")
        .toLowerCase();

    // --------------------------------------------------
    // ADMIN ONLY
    // --------------------------------------------------

    if (!isAdmin(senderID)) {
      return safeSend(
        api,
        "❌ Admin only.",
        threadID
      );
    }

    // --------------------------------------------------
    // LOCKGC ON
    // --------------------------------------------------

    if (command === "on") {
      lockedThreads.add(threadID);

      nicknameEnabledThreads.add(threadID);

      const titleChanged =
        await safeSetTitle(
          api,
          LOCKED_GC_NAME,
          threadID
        );

      if (!titleChanged) {
        return safeSend(
          api,
          "❌ Hindi mapalitan ang GC name.\n" +
          "Baka walang permission ang bot.",
          threadID
        );
      }

      return safeSend(
        api,
        "🔒 LOCK GC: ON\n\n" +
        `GC Name:\n${LOCKED_GC_NAME}\n\n` +
        `Auto Nickname: ${DEFAULT_NICKNAME}\n` +
        "Status: ACTIVE",
        threadID
      );
    }

    // --------------------------------------------------
    // LOCKGC OFF
    // --------------------------------------------------

    if (command === "off") {
      lockedThreads.delete(threadID);

      nicknameEnabledThreads.delete(
        threadID
      );

      return safeSend(
        api,
        "🔓 LOCK GC: OFF\n\n" +
        "Auto restore: OFF\n" +
        "Auto nickname: OFF",
        threadID
      );
    }

    // --------------------------------------------------
    // NICK ON
    // --------------------------------------------------

    if (command === "nick") {
      nicknameEnabledThreads.add(
        threadID
      );

      return safeSend(
        api,
        "👤 AUTO NICKNAME: ON\n\n" +
        `Default: ${DEFAULT_NICKNAME}`,
        threadID
      );
    }

    // --------------------------------------------------
    // NICK OFF
    // --------------------------------------------------

    if (command === "nickoff") {
      nicknameEnabledThreads.delete(
        threadID
      );

      return safeSend(
        api,
        "👤 AUTO NICKNAME: OFF",
        threadID
      );
    }

    // --------------------------------------------------
    // STATUS
    // --------------------------------------------------

    if (command === "status") {
      return safeSend(
        api,
        "🔒 LOCK GC STATUS\n\n" +
        `GC Lock: ${
          lockedThreads.has(threadID)
            ? "ON"
            : "OFF"
        }\n\n` +
        `Auto Nickname: ${
          nicknameEnabledThreads.has(threadID)
            ? "ON"
            : "OFF"
        }\n\n` +
        `Locked Name:\n${LOCKED_GC_NAME}\n\n` +
        `Nickname:\n${DEFAULT_NICKNAME}`,
        threadID
      );
    }

    // --------------------------------------------------
    // HELP
    // --------------------------------------------------

    return safeSend(
      api,
      "🔒 LOCKGC COMMANDS\n\n" +
      "/lockgc on\n" +
      "/lockgc off\n" +
      "/lockgc nick\n" +
      "/lockgc nickoff\n" +
      "/lockgc status",
      threadID
    );

  } catch (err) {
    console.error(
      "[LOCKGC COMMAND ERROR]",
      err
    );
  }
};

// ======================================================
// HANDLE EVENT
// ======================================================

module.exports.handleEvent = async function ({
  api,
  event
}) {
  try {
    if (!event) return;

    const {
      threadID,
      senderID,
      messageID
    } = event;

    if (!threadID) return;

    // ==================================================
    // AUTO RESTORE GC NAME
    // ==================================================

    if (lockedThreads.has(threadID)) {
      try {
        const info =
          await new Promise(
            (resolve, reject) => {
              api.getThreadInfo(
                threadID,
                (err, data) => {
                  if (err) {
                    return reject(err);
                  }

                  resolve(data);
                }
              );
            }
          );

        if (info) {
          const currentName =
            info.threadName || "";

          if (
            currentName !==
            LOCKED_GC_NAME
          ) {
            await safeSetTitle(
              api,
              LOCKED_GC_NAME,
              threadID
            );
          }
        }

      } catch (err) {
        console.error(
          "[LOCKGC RESTORE ERROR]",
          err
        );
      }
    }

    // ==================================================
    // AUTO NICKNAME
    // ==================================================

    if (
      !nicknameEnabledThreads.has(
        threadID
      )
    ) {
      return;
    }

    if (!senderID) return;

    // Ignore bot's own account
    try {
      const botID =
        api.getCurrentUserID?.();

      if (
        botID &&
        String(botID) ===
        String(senderID)
      ) {
        return;
      }
    } catch (_) {}

    // --------------------------------------------------
    // PER-USER COOLDOWN
    // --------------------------------------------------

    const key =
      `${threadID}:${senderID}`;

    const now = Date.now();

    const last =
      nicknameCooldown.get(key) || 0;

    if (
      now - last <
      RESTORE_COOLDOWN
    ) {
      return;
    }

    nicknameCooldown.set(
      key,
      now
    );

    // --------------------------------------------------
    // CHANGE NICKNAME
    // --------------------------------------------------

    await safeNickname(
      api,
      DEFAULT_NICKNAME,
      threadID,
      senderID
    );

    // --------------------------------------------------
    // CLEAN OLD COOLDOWNS
    // --------------------------------------------------

    if (
      nicknameCooldown.size > 1000
    ) {
      const entries =
        Array.from(
          nicknameCooldown.entries()
        );

      entries
        .slice(
          0,
          Math.floor(
            entries.length / 2
          )
        )
        .forEach(([key]) => {
          nicknameCooldown.delete(key);
        });
    }

  } catch (err) {
    console.error(
      "[LOCKGC EVENT ERROR]",
      err
    );
  }
};

// ======================================================
// RENDER
// ======================================================

module.exports.render = async function ({
  api,
  event
}) {
  try {
    const threadID =
      event?.threadID;

    const status =
      threadID &&
      lockedThreads.has(threadID)
        ? "ON"
        : "OFF";

    const nickStatus =
      threadID &&
      nicknameEnabledThreads.has(
        threadID
      )
        ? "ON"
        : "OFF";

    const output =
      "🔒 LOCKGC RENDER\n\n" +
      `GC Lock: ${status}\n` +
      `Auto Nickname: ${nickStatus}\n\n` +
      `GC Name:\n${LOCKED_GC_NAME}\n\n` +
      `Nickname:\n${DEFAULT_NICKNAME}`;

    if (
      api &&
      threadID
    ) {
      return safeSend(
        api,
        output,
        threadID
      );
    }

    return output;

  } catch (err) {
    console.error(
      "[LOCKGC RENDER ERROR]",
      err
    );

    return null;
  }
};

// ======================================================
// PROCESS ERROR PROTECTION
// ======================================================

process.on(
  "unhandledRejection",
  err => {
    console.error(
      "[LOCKGC UNHANDLED]",
      err
    );
  }
);
