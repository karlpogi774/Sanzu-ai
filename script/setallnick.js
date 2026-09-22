// ==========================================================
// BOT NAME: setallnick ✅ FINAL VERSION
// PALITAN ANG NICKNAME NG LAHAT SA GC
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// GAMIT: /setallnick BOSS RYUK
// ==========================================================

module.exports.config = {
  name: "setallnick",
  version: "1.1.0",
  hasPermission: 0,
  credits: "RYUK ✅",
  description: "Palitan nickname ng lahat sa GC",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "/setallnick BOSS RYUK"
};

const DELAY = 1800; // ⚡ HINDI MABILIS — IWAS RESTRICT

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, body } = event;

  // ✅ MGA ADMIN LANG ANG PWEDE
  const ADMINS = [
    "61594055835097",
    "61593892603402",
    "61594325727109",
    "61594022290817"
  ];
  if (!ADMINS.includes(senderID)) {
    return api.sendMessage("❌ Ikaw lang ang pwedeng gumamit nito!", threadID, messageID);
  }

  // ✅ KUNIN ANG PANGALAN — DALAWANG PARAAN PARA SIGURADO!
  let newNick = "";
  
  // Paraan 1: galing args
  if (args && args.length > 0) {
    newNick = args.join(" ").trim();
  }
  
  // Paraan 2: galing sa buong mensahe (kung walang args)
  if (!newNick) {
    const match = body.match(/setallnick\s+(.+)$/i);
    if (match && match[1]) {
      newNick = match[1].trim();
    }
  }

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
      members = info.participants.map(p => p.id || p.userID || p.psid || p.senderID).filter(Boolean);
    }
    else if (Array.isArray(info.members) && info.members.length) {
      members = info.members.map(p => p.id || p.userID || p.psid || p.senderID).filter(Boolean);
    }

    if (!members.length) {
      return api.sendMessage("⚠️ Hindi makuha ang listahan! Mag-chat muna sa GC tapos subukan ulit.", threadID, messageID);
    }

    // ✅ ALISIN ANG SARILI NG BOT
    const botID = String(api.getCurrentUserID());
    members = members.filter(id => String(id) !== botID);

    let count = 0, skipped = 0, failed = 0;
    const nicks = info.nicknames || {};

    await api.sendMessage(
      `✨ MAGSISIMULA NA!\n👥 Bilang: ${members.length} miyembro\n✏️ Bagong Pangalan: ${newNick}`,
      threadID,
      messageID
    );

    // ✅ ISA-ISANG PALITAN
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

    // ✅ RESULTA
    await api.sendMessage(
      `✅ TAPOS NA!\n\n✅ Napalitan: ${count}\n⏭️ Pareho na: ${skipped}\n⚠️ Nabigo: ${failed}\n\n👑 RYUK BOSS`,
      threadID
    );
  });
};
      
