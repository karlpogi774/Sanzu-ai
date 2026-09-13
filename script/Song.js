const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "song",
  version: "1.2.0",
  hasPermission: 2, // Admin/Owner Only access
  credits: "Ryuk",
  description: "Mag-play at mag-download ng kanta bilang FB Voice Message/Audio (Authorized Admins Only)",
  usePrefix: true,
  commandCategory: "Media",
  usages: "/song <pamagat ng kanta>",
  cooldowns: 5
};

// ================= CONFIGURATION =================
const ADMIN_UIDS = [
  "61594022290817",
  "61593892603402"
];

function checkIsAdmin(senderID) {
  return ADMIN_UIDS.includes(String(senderID));
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (!checkIsAdmin(senderID)) {
    return api.sendMessage("❌ Sensya ka na, para sa mga authorized admins lang ang command na ito.", threadID, messageID);
  }

  const query = args.join(" ");

  if (!query) {
    return api.sendMessage("❌ Paki-lagay ang pamagat ng kanta!\nHalimbawa: /song Pasilyo", threadID, messageID);
  }

  const cachePath = path.join(__dirname, "cache", `song_${Date.now()}.mp3`);

  try {
    api.sendMessage(`🎵 Hinahanap ang kantang "${query}"... Wait lang ng konti.`, threadID, messageID);

    const res = await axios.get(`https://api.kenliejugarap.com/songdownload/?query=${encodeURIComponent(query)}`);
    const songData = res.data;

    if (!songData || !songData.downloadUrl) {
      return api.sendMessage("❌ Pasensya na, hindi mahanap ang kanta na yan.", threadID, messageID);
    }

    const downloadUrl = songData.downloadUrl;
    const title = songData.title || query;

    fs.ensureDirSync(path.join(__dirname, "cache"));

    const writer = fs.createWriteStream(cachePath);
    const audioStream = await axios({
      url: downloadUrl,
      method: "GET",
      responseType: "stream"
    });

    audioStream.data.pipe(writer);

    writer.on("finish", () => {
      api.sendMessage(
        {
          body: `🎧 Eto na ang kanta:\n📌 Title: ${title}`,
          attachment: fs.createReadStream(cachePath)
        },
        threadID,
        (err) => {
          if (fs.existsSync(cachePath)) {
            fs.unlinkSync(cachePath);
          }
          if (err) {
            console.error("[Song Error]:", err.message);
          }
        },
        messageID
      );
    });

    writer.on("error", (err) => {
      if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      return api.sendMessage("❌ Nagka-error sa pag-download ng audio stream.", threadID, messageID);
    });

  } catch (error) {
    if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
    console.error("[Song API Error]:", error);
    return api.sendMessage("❌ May problema sa API server. Subukan ulit mamaya.", threadID, messageID);
  }
};
