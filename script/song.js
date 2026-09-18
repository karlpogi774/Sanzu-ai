// ======================================================
// SONG REQUEST COMMAND
// Admin ID: 61594055835097
// Sanzu-style command module
// ======================================================

const ADMIN_ID = "61594055835097";

module.exports.config = {
  name: "song",
  version: "1.0.0",
  hasPermission: 0,
  credits: "Gojo",
  description: "Song request command",
  commandCategory: "Music",
  usages: "/song <song name or link>",
  cooldowns: 5
};

function isAdmin(id) {
  return String(id) === ADMIN_ID;
}

function send(api, message, threadID, messageID) {
  try {
    api.sendMessage(
      message,
      threadID,
      error => {
        if (error) console.error("[SONG] Send error:", error);
      },
      messageID
    );
  } catch (error) {
    console.error("[SONG] Error:", error);
  }
}

module.exports.run = async function ({ api, event, args }) {
  try {
    const threadID = event.threadID;
    const messageID = event.messageID;
    const senderID = String(event.senderID || "");
    const action = String(args[0] || "").toLowerCase();

    // Admin-only commands
    if (["help", "admin"].includes(action) && !isAdmin(senderID)) {
      return send(
        api,
        "⛔ Admin lamang ang puwedeng gumamit ng command na ito.",
        threadID,
        messageID
      );
    }

    // Help
    if (action === "help") {
      return send(
        api,
        `🎵 SONG COMMAND 🎵

/song <song name>
Mag-request ng kanta

/song <song link>
Magpadala ng link ng kanta

/song admin
Ipakita ang admin info

🔐 Admin ID: ${ADMIN_ID}`,
        threadID,
        messageID
      );
    }

    // Admin info
    if (action === "admin") {
      return send(
        api,
        `🔐 SONG COMMAND ADMIN

Admin ID: ${ADMIN_ID}
Command: /song
Status: Ready 🎵`,
        threadID,
        messageID
      );
    }

    // Song request
    const songRequest = args.join(" ").trim();

    if (!songRequest) {
      return send(
        api,
        "🎵 Ilagay ang pangalan o link ng kanta.\nExample: /song Blue Bird",
        threadID,
        messageID
      );
    }

    return send(
      api,
      `🎶 SONG REQUEST RECEIVED 🎶

🎧 Request: ${songRequest}

✅ Naipasa na ang song request.
ℹ️ Hindi pa ito audio file; request text/link lamang ito.`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("[SONG] Command error:", error);
  }
};
