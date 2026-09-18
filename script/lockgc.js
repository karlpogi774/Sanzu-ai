// ======================================================
// LOCKGC FINAL | RYUK POGI EDITION
// GC LOCK + AUTO NICKNAME + COOLDOWN + RENDER
// ======================================================

const LOCKED_GC_NAME =
  "RYUK BOSS PINAKA POGI SA BUONG MUNDO";

const DEFAULT_NICKNAME =
  "RYUK POGI";

const ADMIN_ID =
  "61594055835097";

// ======================================================
// SETTINGS
// ======================================================

const NICKNAME_COOLDOWN = 15000;
const TITLE_CHECK_COOLDOWN = 15000;

// ======================================================
// MEMORY
// ======================================================

const lockedThreads = new Set();
const nicknameThreads = new Set();

const nicknameCooldown = new Map();
const titleCooldown = new Map();

// ======================================================
// CONFIG
// ======================================================

module.exports.config = {
  name: "lockgc",
  version: "3.0.0",
  hasPermission: 0,
  credits: "Ryuk",
  description:
    "GC lock with auto nickname and protection",
  usePrefix: true,
  commandCategory: "Group",
  usages:
    "/lockgc on | off | nick | nickoff | status",
  cooldowns: 2
};

// ======================================================
// HELPERS
// ======================================================

function isAdmin(id) {
  return String(id) === String(ADMIN_ID);
}

function sleep(ms) {
  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}

function sendMessage(api, message, threadID) {
  return new Promise(resolve => {
    try {
      api.sendMessage(
        message,
        threadID,
        () => resolve()
      );
    } catch (err) {
      console.error(
        "[LOCKGC SEND]",
        err
      );

      resolve();
    }
  });
}

// ======================================================
// SET TITLE
// ======================================================

async function setGroupTitle(
  api,
  threadID
) {
  try {
    await api.setTitle(
      LOCKED_GC_NAME,
      threadID
    );

    return true;

  } catch (err) {
    console.error(
      "[LOCKGC TITLE]",
      err
    );

    return false;
  }
}

// ======================================================
// CHANGE NICKNAME
// ======================================================

async function changeNickname(
  api,
  threadID,
  userID
) {
  try {
    await api.changeNickname(
      DEFAULT_NICKNAME,
      threadID,
      userID
    );

    return true;

  } catch (err) {
    console.error(
      "[LOCKGC NICK]",
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
    const threadID =
      event?.threadID;

    const senderID =
      event?.senderID;

    if (!threadID) return;

    const command =
      String(args?.[0] || "")
        .toLowerCase();

    // --------------------------------------------------
    // ADMIN
    // --------------------------------------------------

    if (!isAdmin(senderID)) {
      return sendMessage(
        api,
        "❌ Admin only.",
        threadID
      );
    }

    // --------------------------------------------------
    // ON
    // --------------------------------------------------

    if (command === "on") {

      lockedThreads.add(
        threadID
      );

      nicknameThreads.add(
        threadID
      );

      const success =
        await setGroupTitle(
          api,
          threadID
        );

      if (!success) {
        return sendMessage(
          api,
          "❌ Hindi ma-lock ang GC name.\n" +
          "Check bot permissions.",
          threadID
        );
      }

      return sendMessage(
        api,
        "🔒 LOCKGC: ON\n\n" +
        `GC Name:\n${LOCKED_GC_NAME}\n\n` +
        `Auto Nickname: ${DEFAULT_NICKNAME}\n` +
        "Protection: ACTIVE",
        threadID
      );
    }

    // --------------------------------------------------
    // OFF
    // --------------------------------------------------

    if (command === "off") {

      lockedThreads.delete(
        threadID
      );

      nicknameThreads.delete(
        threadID
      );

      titleCooldown.delete(
        threadID
      );

      return sendMessage(
        api,
        "🔓 LOCKGC: OFF\n\n" +
        "GC lock disabled.\n" +
        "Auto nickname disabled.",
        threadID
      );
    }

    // --------------------------------------------------
    // NICK ON
    // --------------------------------------------------

    if (command === "nick") {

      nicknameThreads.add(
        threadID
      );

      return sendMessage(
        api,
        "👤 AUTO NICKNAME: ON\n\n" +
        `Nickname: ${DEFAULT_NICKNAME}\n` +
        `Cooldown: ${NICKNAME_COOLDOWN}ms`,
        threadID
      );
    }

    // --------------------------------------------------
    // NICK OFF
    // --------------------------------------------------

    if (command === "nickoff") {

      nicknameThreads.delete(
        threadID
      );

      return sendMessage(
        api,
        "👤 AUTO NICKNAME: OFF",
        threadID
      );
    }

    // --------------------------------------------------
    // STATUS
    // --------------------------------------------------

    if (command === "status") {

      return sendMessage(
        api,
        "🔒 LOCKGC STATUS\n\n" +

        `GC Lock: ${
          lockedThreads.has(threadID)
            ? "ON"
            : "OFF"
        }\n` +

        `Auto Nickname: ${
          nicknameThreads.has(threadID)
            ? "ON"
            : "OFF"
        }\n\n` +

        `GC Name:\n${LOCKED_GC_NAME}\n\n` +

        `Nickname:\n${DEFAULT_NICKNAME}\n\n` +

        `Nickname Cooldown:\n` +
        `${NICKNAME_COOLDOWN}ms`,
        threadID
      );
    }

    // --------------------------------------------------
    // CLEAR
    // --------------------------------------------------

    if (command === "clear") {

      nicknameCooldown.clear();
      titleCooldown.clear();

      return sendMessage(
        api,
        "🧹 LOCKGC cooldown cache cleared.",
        threadID
      );
    }

    // --------------------------------------------------
    // HELP
    // --------------------------------------------------

    return sendMessage(
      api,
      "🔒 LOCKGC COMMANDS\n\n" +
      "/lockgc on\n" +
      "/lockgc off\n" +
      "/lockgc nick\n" +
      "/lockgc nickoff\n" +
      "/lockgc status\n" +
      "/lockgc clear",
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

module.exports.handleEvent =
async function ({
  api,
  event
}) {
  try {

    if (!event) return;

    const threadID =
      event.threadID;

    const senderID =
      event.senderID;

    if (!threadID) return;

    // ==================================================
    // AUTO RESTORE GC NAME
    // ==================================================

    if (
      lockedThreads.has(threadID)
    ) {

      const now =
        Date.now();

      const lastTitle =
        titleCooldown.get(
          threadID
        ) || 0;

      if (
        now - lastTitle >=
        TITLE_CHECK_COOLDOWN
      ) {

        titleCooldown.set(
          threadID,
          now
        );

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

              await setGroupTitle(
                api,
                threadID
              );
            }
          }

        } catch (err) {

          console.error(
            "[LOCKGC RESTORE]",
            err
          );
        }
      }
    }

    // ==================================================
    // AUTO NICKNAME
    // ==================================================

    if (
      !nicknameThreads.has(
        threadID
      )
    ) {
      return;
    }

    if (!senderID) return;

    // --------------------------------------------------
    // Ignore bot itself
    // --------------------------------------------------

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
    // USER COOLDOWN
    // --------------------------------------------------

    const key =
      `${threadID}:${senderID}`;

    const now =
      Date.now();

    const last =
      nicknameCooldown.get(
        key
      ) || 0;

    if (
      now - last <
      NICKNAME_COOLDOWN
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

    await changeNickname(
      api,
      threadID,
      senderID
    );

    // --------------------------------------------------
    // LIMIT MEMORY
    // --------------------------------------------------

    if (
      nicknameCooldown.size > 1000
    ) {

      const entries =
        Array.from(
          nicknameCooldown.keys()
        );

      for (
        const key
        of entries.slice(
          0,
          500
        )
      ) {
        nicknameCooldown.delete(
          key
        );
      }
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

module.exports.render =
async function ({
  api,
  event
}) {
  try {

    const threadID =
      event?.threadID;

    const lockStatus =
      threadID &&
      lockedThreads.has(
        threadID
      )
        ? "ON"
        : "OFF";

    const nickStatus =
      threadID &&
      nicknameThreads.has(
        threadID
      )
        ? "ON"
        : "OFF";

    const output =
      "🔒 LOCKGC RENDER\n\n" +

      `GC Lock: ${lockStatus}\n` +

      `Auto Nickname: ${nickStatus}\n\n` +

      `GC Name:\n${LOCKED_GC_NAME}\n\n` +

      `Nickname:\n${DEFAULT_NICKNAME}\n\n` +

      `Cooldown:\n` +
      `${NICKNAME_COOLDOWN}ms`;

    if (
      api &&
      threadID
    ) {

      return sendMessage(
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
// ERROR PROTECTION
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

// ======================================================
// END
// ======================================================
