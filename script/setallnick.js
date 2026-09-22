// ==========================================================
// BOT NAME: setallnick | PALITAN ANG NICKNAME NG LAHAT SA GC
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// GAMIT: /setallnick [pangalan]
// ==========================================================

module.exports.config = {
  name: "setallnick",
  version: "1.0.0",
  hasPermission: 0,
  credits: "RYUK",
  description: "Palitan ang nickname ng lahat ng miyembro sa GC",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "/setallnick BOSS RYUK"
};

const DELAY = 1500; // ⚡ HINDI MABILIS — HINDI MA-RESTRICT

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  // ✅ TINGNAN KUNG ADMIN KA
  const ADMINS = ["61594055835097", "61593892603402", "61594325727109", "61594022290817"];
  if (!ADMINS.includes(senderID)) {
    return api.sendMessage("❌ Ikaw lang ang pwede gumamit nito!", threadID, messageID);
  }

  // ✅ KUNIN ANG BAGONG PANGALAN
  const newNick = args.join(" ").trim();
  if (!newNick) {
    return api.sendMessage("⚠️ Gamitin: /setallnick BOSS RYUK", threadID, messageID);
  }

  // ✅ KUNIN ANG LISTAHAN NG MIYEMBRO
  api.getThreadInfo(threadID, async (err, info) => {
    if (err || !info) {
      return api.sendMessage("⚠️ Hindi makuha ang impormasyon ng GC!", threadID, messageID);
    }

    let members = [];

    // Subukan lahat ng posibleng paraan
    if (Array.isArray(info.participantIDs) && info.participantIDs.length) {
      members = info.participantIDs;
    }
    else if (Array.isArray(info.participants) && info.participants.length) {
      members = info.participants.map(p => p.id || p.userID || p.psid).filter(Boolean);
    }
    else if (Array.isArray(info.members) && info.members.length) {
      members = info.members.map(p => p.id || p.userID || p.psid).filter(Boolean);
    }

    if (!members.length) {
      return api.sendMessage("⚠️ Walang miyembro na nakita! Subukan ulit mamaya.", threadID, messageID);
    }

    // ✅ ALISIN ANG SARILI NG BOT SA LISTAHAN
    const botID = api.getCurrentUserID();
    members = members.filter(id => String(id) !== String(botID));

    let count = 0, skipped = 0, failed = 0;
    const nicks = info.nicknames || {};

    await api.sendMessage(
      `✨ MAGSISIMULA NA!\n👥 Bilang: ${members.length} miyembro\n✏️ Bagong Pangalan: ${newNick}`,
      threadID,
      messageID
    );

    // ✅ ISA-ISANG PALITAN MAY DELAY
    for (const id of members) {
      try {
        await new Promise(res => setTimeout(res, DELAY));

        if (nicks[String(id)] === newNick) {
          skipped++;
          continue;
        }

        await new Promise(res => {
          api.changeNickname(newNick, threadID, id, (err) => {
            err ? failed++ : count++;
            res();
          });
        });
      } catch {
        failed++;
      }
    }

    // ✅ LUMABAS ANG RESULTA
    await api.sendMessage(
      `✅ TAPOS NA!\n\n✅ Napalitan: ${count}\n⏭️ Pareho na: ${skipped}\n⚠️ Nabigo: ${failed}\n\n👑 RYUK BOSS`,
      threadID
    );
  });
};
  
