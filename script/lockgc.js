// ======================================================
// OPT-IN NICKNAME
// Command: /lockgc nick
// ======================================================

const NICK_SUFFIX = " | SI RYUK LANG PINAKA POGI DITO NA LALAKI";

module.exports.nick = async function ({ api, event }) {
  const threadID = String(event?.threadID || "");
  const senderID = String(event?.senderID || "");

  if (!threadID || !senderID) return;

  try {
    if (typeof api.changeNickname !== "function") {
      return api.sendMessage(
        "Hindi supported ang changeNickname() sa API ng bot mo.",
        threadID
      );
    }

    // Kumuha ng kasalukuyang nickname mula sa profile.
    const info = await new Promise((resolve, reject) => {
      api.getUserInfo(senderID, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });

    const currentName =
      info?.[senderID]?.name ||
      info?.[senderID]?.firstName ||
      "Member";

    const nickname = `${currentName}${NICK_SUFFIX}`.slice(0, 50);

    await new Promise((resolve, reject) => {
      api.changeNickname(
        nickname,
        threadID,
        senderID,
        error => error ? reject(error) : resolve()
      );
    });

    return api.sendMessage(
      "Nickname updated: " + nickname,
      threadID
    );
  } catch (error) {
    console.error("[LOCKGC NICK]", error);
    return api.sendMessage(
      "Hindi napalitan ang nickname. Baka hindi suportado ng Sanzu API mo o kulang ang bot permissions.",
      threadID
    );
  }
};
