const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "Song", // ✅ PANGALAN NG BOT: "Song"
  version: "1.2.0",
  hasPermission: 1, // Ikaw lang
  credits: "Ryuk | 61594055835097",
  description: "Pangalan ng Kanta — Voice Message 🎶",
  usePrefix: true,
  commandCategory: "Ryuk Only",
  usages: "/song | /song [pangalan ng kanta]",
  cooldowns: 2
};

const ADMIN_ID = "61594055835097";

// 🎶 LISTAHAN NG KANTA
const KANTA_LIST = [
  { name: "Pagsamo", artist: "Arthur Nery" },
  { name: "Leaves", artist: "Ben&Ben" },
  { name: "Kathang Isip", artist: "Ben&Ben" },
  { name: "Anak", artist: "Freddie Aguilar" },
  { name: "Dahil Sa'yo", artist: "Iñigo Pascual" },
  { name: "Tadhana", artist: "Up Dharma Down" },
  { name: "Huling Sandali", artist: "December Avenue" },
  { name: "Pano", artist: "Zack Tabudlo" },
  { name: "Sana", artist: "I Belong to the Zoo" },
  { name: "Kung Di Rin Lang Ikaw", artist: "December Avenue ft. Moira" },
  { name: "Ikaw Lamang", artist: "Jaya" },
  { name: "Kahit Maputi Na Ang Buhok Ko", artist: "Rey Valera" },
  { name: "Binibini", artist: "Zack Tabudlo" },
  { name: "Ere", artist: "JK Labajo" },
  { name: "Pasilyo", artist: "Sunkissed Lola" }
];

function getRandomSong() {
  return KANTA_LIST[Math.floor(Math.random() * KANTA_LIST.length)];
}

function searchSong(keyword) {
  const q = keyword.toLowerCase();
  return KANTA_LIST.filter(song =>
    song.name.toLowerCase().includes(q) ||
    song.artist.toLowerCase().includes(q)
  );
}

// ==============================================
// 🎤 MAIN
// ==============================================
module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;

  // ✅ ADMIN LANG
  if (String(senderID) !== ADMIN_ID) {
    return api.sendMessage(
      "🔒 **ACCESS DENIED**\n" +
      "Ryuk lang ang pwedeng gumamit nito!",
      threadID, messageID
    );
  }

  const input = args.join(" ").trim();

  // Walang input → Random
  if (!input) {
    const song = getRandomSong();
    return api.sendMessage(
      `🎶 **SONG** 🎶\n\n` +
      `🎵 Kanta: ${song.name}\n` +
      `🎤 Artist: ${song.artist}\n\n` +
      `Gusto mo ito? I-type:\n` +
      `👉 /song ${song.name}\n\n` +
      `© Ryuk | 61594055835097`,
      threadID, messageID
    );
  }

  // Maghanap
  const results = searchSong(input);

  if (results.length === 0) {
    return api.sendMessage(
      `❌ Wala pangalan ng kanta: "${input}"\n\n` +
      `Subukan ang mga ito:\n` +
      KANTA_LIST.map(s => `• ${s.name}`).join("\n") +
      `\n\n© Ryuk`,
      threadID, messageID
    );
  }

  if (results.length === 1) {
    const s = results[0];
    return api.sendMessage(
      `✅ **Nahanap ko, Ryuk!**\n\n` +
      `🎵 Kanta: ${s.name}\n` +
      `🎤 Artist: ${s.artist}\n\n` +
      `🎤 Voice message naghahanda...\n\n` +
      `© Ryuk | 61594055835097`,
      threadID, messageID
    );
  }

  // Maraming resulta
  return api.sendMessage(
    `🔍 **Maraming kanta, Ryuk! Alin?**\n\n` +
    results.map((s, i) => `${i+1}. ${s.name} — ${s.artist}`).join("\n") +
    `\n\nI-type: /song 1\n\n© Ryuk`,
    threadID, messageID
  );
};
    
