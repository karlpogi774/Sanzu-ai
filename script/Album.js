// ==========================================================
// 👑 ALBUM BOT — MAY ADMIN IDs ✅
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// ==========================================================

const axios = require("axios");
const fs = require("fs");
const path = require("path");

// ✅ LAHAT NG ADMIN ID MO
const ADMIN_IDS = new Set([
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
]);

const baseApiUrl = async () => {
  try {
    const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
    return base.data.mahmud;
  } catch {
    return ["https://mahmud-apis-v24.onrender.com"];
  }
};

function isAdmin(id) {
  return ADMIN_IDS.has(String(id));
}

module.exports = { 
  config: { 
    name: "album", 
    version: "1.8", 
    role: 0, 
    author: "RYUK BOSS", 
    category: "media", 
    guide: { 
      en: "{p}{n} [page number]\n{p}{n} add [category] [URL]\n{p}{n} list",
    }, 
  },

  onStart: async function ({ api, event, args }) {     
     const senderID = event.senderID;
     
     // ✅ TANGGALIN ANG AUTHOR LOCK — IKAW LANG ANG MAKAKAGAMIT NG ADD
     if (args[0] === "add" && !isAdmin(senderID)) {
       return api.sendMessage("❌ Ikaw lang ang pwedeng magdagdag!", event.threadID, event.messageID);
     }

     const apiUrl = await baseApiUrl();

     if (args[0] === "add") {
        if (!args[1]) {
          return api.sendMessage("⚠️ Gamitin: !album add [kategorya] [url]", event.threadID, event.messageID);   
        }
        const category = args[1].toLowerCase(); 
        
        // Reply sa video
        if (event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
          const attachment = event.messageReply.attachments[0];
          if (attachment.type !== "video") {
            return api.sendMessage("❌ Video lang ang pwede!", event.threadID, event.messageID);
          }

          try {
            const imgurRes = await axios.post("https://api.imgur.com/3/image", 
              { image: attachment.url, type: "url" },
              { headers: { Authorization: "Client-ID 7050c14d20499ad" } }
            );
            const imgurLink = imgurRes.data?.data?.link;
            if (!imgurLink) throw new Error("Imgur upload failed");

            const uploadRes = await axios.post(`${apiUrl}/api/add`, {
              category,
              videoUrl: imgurLink
            });
            return api.sendMessage(`✅ ${uploadRes.data.message}`, event.threadID, event.messageID);
          } catch (error) {
            return api.sendMessage(`❌ Error: ${error.response?.data?.error || error.message}`, event.threadID, event.messageID);
          }
        }
        
        // Direktang URL
        if (!args[2]) {
          return api.sendMessage("⚠️ Ilagay ang URL: !album add [kategorya] [url]", event.threadID, event.messageID);
        }
        const videoUrl = args.slice(2).join(" ");
        try {
          const uploadRes = await axios.post(`${apiUrl}/api/add`, { category, videoUrl });
          return api.sendMessage(`✅ ${uploadRes.data.message}`, event.threadID, event.messageID);
        } catch (error) {
          return api.sendMessage(`❌ ${error.response?.data?.error || error.message}`, event.threadID, event.messageID);
        }
     } 
     else if (args[0] === "list") {
       try {
         const res = await axios.get(`${apiUrl}/api/album/mahmud/list`);
         api.sendMessage(res.data.message, event.threadID, event.messageID);
       } catch (error) {
         api.sendMessage(`❌ ${error.message}`, event.threadID, event.messageID);
       }
     } 
     else {
       const displayNames = [
         "𝐅𝐮𝐧𝐧𝐲 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐈𝐬𝐥𝐚𝐦𝐢𝐜 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐒𝐚𝐝 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐀𝐧𝐢𝐦𝐞 𝐕𝐢𝐝𝐞𝐨 🎀",
         "𝐋𝐨𝐅𝐈 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐀𝐭𝐭𝐢𝐭𝐮𝐝𝐞 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐇𝐨𝐫𝐧𝐲 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐂𝐨𝐮𝐩𝐥𝐞 𝐕𝐢𝐝𝐞𝐨 🎀",
         "𝐂𝐚𝐫 𝐄𝐝𝐢𝐭 𝐕𝐢𝐝𝐞𝐨🎀", "𝐁𝐢𝐤𝐞 𝐄𝐝𝐢𝐭 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐋𝐨𝐯𝐞 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐋𝐲𝐫𝐢𝐜𝐬 𝐕𝐢𝐝𝐞𝐨 🎀",
         "𝐂𝐚𝐭 𝐕𝐢𝐝𝐞𝐨 🎀", "𝟏𝟖+ 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐌𝐞𝐦𝐞 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐅𝐨𝐨𝐭𝐛𝐚𝐥𝐥 𝐕𝐢𝐝𝐞𝐨 🎀",
         "𝐁𝐚𝐛𝐲 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐅𝐫𝐢𝐞𝐧𝐝𝐬 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐌𝐨𝐧𝐞𝐲 𝐯𝐢𝐝𝐞𝐨 🎀", "𝐅𝐥𝐨𝐰𝐞𝐫 𝐕𝐢𝐝𝐞𝐨🎀",
         "𝐍𝐚𝐫𝐮𝐭𝐨 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐃𝐫𝐚𝐠𝐨𝐧 𝐛𝐚𝐥𝐥 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐁𝐥𝐞𝐚𝐜𝐡 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐃𝐞𝐦𝐨𝐧 𝐬𝐲𝐥𝐞𝐫 𝐁𝐚𝐛𝐲 🎀",
         "𝐉𝐮𝐣𝐮𝐭𝐬𝐮 𝐊𝐚𝐢𝐬𝐞𝐧 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐒𝐨𝐥𝐨 𝐥𝐞𝐯𝐞𝐥𝐢𝐧𝐠 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐓𝐨𝐤𝐲𝐨 𝐫𝐞𝐯𝐞𝐧𝐠𝐞𝐫 𝐕𝐢𝐝𝐞𝐨 🎀",
         "𝐁𝐥𝐮𝐞 𝐥𝐨𝐜𝐤 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐂𝐡𝐚𝐢𝐧𝐬𝐚𝐰 𝐦𝐚𝐧 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐃𝐞𝐚𝐭𝐡 𝐧𝐨𝐭𝐞 𝐕𝐢𝐝𝐞𝐨 🎀",
         "𝐎𝐧𝐞 𝐏𝐢𝐞𝐜𝐞 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐀𝐭𝐭𝐚𝐜𝐤 𝐨𝐧 𝐓𝐢𝐭𝐚𝐧 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐒𝐚𝐤𝐚𝐦𝐨𝐭𝐨 𝐃𝐚𝐲𝐬 𝐕𝐢𝐝𝐞𝐨 🎀",
         "𝐰𝐢𝐧𝐝 𝐛𝐫𝐞𝐚𝐤𝐞𝐫 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐎𝐧𝐞 𝐩𝐮𝐧𝐜𝐡 𝐦𝐚𝐧 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐀𝐥𝐲𝐚 𝐑𝐮𝐬𝐬𝐢𝐚𝐧 𝐕𝐢𝐝𝐞𝐨 🎀",
         "𝐁𝐥𝐮𝐞 𝐛𝐨𝐱 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐇𝐮𝐧𝐭𝐞𝐫 𝐱 𝐇𝐮𝐧𝐭𝐞𝐫 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐋𝐨𝐧𝐞𝐫 𝐥𝐢𝐟𝐞 𝐕𝐢𝐝𝐞𝐨 🎀",
         "𝐇𝐚𝐧𝐢𝐦𝐞 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐍𝐞𝐲𝐦𝐚𝐫 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐌𝐞𝐬𝐬𝐢 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐑𝐨𝐧𝐚𝐥𝐝𝐨 𝐕𝐢𝐝𝐞𝐨 🎀",
         "𝐕𝐢𝐧𝐢 𝐉𝐫 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐌𝐛𝐚𝐩𝐩𝐞 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐘𝐚𝐦𝐚𝐥 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐑𝐚𝐩𝐢𝐧𝐡𝐚 𝐕𝐢𝐝𝐞𝐨 🎀",
         "𝐃𝐲𝐛𝐚𝐥𝐚 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐏𝐞𝐥𝐞 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐌𝐚𝐫𝐚𝐝𝐨𝐧𝐚 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐖𝐡𝐢𝐭𝐞 𝟒𝟒𝟒 𝐕𝐢𝐝𝐞𝐨 🎀",
         "𝐑𝐮𝐨𝐤 𝐟𝐟 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐁𝟐𝐤 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐁𝐧𝐥 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐕𝐢𝐧𝐜𝐞𝐧𝐳𝐨 𝐕𝐢𝐝𝐞𝐨 🎀",
         "𝐒𝐲𝐛𝐥𝐮𝐬 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐑𝐚𝐢𝐬𝐭𝐚𝐫 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐒𝐦𝐨𝐨𝐭𝐡 𝟒𝟒𝟒 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐀𝐬𝐭𝐚𝐭𝐢𝐧𝐞 𝐕𝐢𝐝𝐞𝐨 🎀",
         "𝐅𝐅 𝐄𝐬𝐩𝐨𝐫𝐭𝐬 𝐕𝐢𝐝𝐞𝐨🎀", "𝐅𝐫𝐞𝐞 𝐅𝐢𝐫𝐞 𝐕𝐢𝐝𝐞𝐨🎀", "𝐏𝐮𝐛𝐠 𝐕𝐢𝐝𝐞𝐨🎀", "𝐂𝐚𝐥𝐥 𝐨𝐟 𝐃𝐮𝐭𝐲 𝐕𝐢𝐝𝐞𝐨🎀",
         "𝐂𝐥𝐚𝐬𝐡 𝐨𝐟 𝐂𝐥𝐚𝐧𝐬 𝐕𝐢𝐝𝐞𝐨🎀", "𝐌𝐨𝐛𝐢𝐥𝐞 𝐋𝐞𝐠𝐞𝐧𝐝 𝐕𝐢𝐝𝐞𝐨🎀", "𝐞𝐅𝐨𝐨𝐭𝐛𝐚𝐥𝐥 𝐕𝐢𝐝𝐞𝐨🎀",
         "𝐌𝐢𝐧𝐞𝐜𝐫𝐚𝐟𝐭 𝐕𝐢𝐝𝐞𝐨🎀", "𝐆𝐭𝐚 𝐕𝐜 𝐕𝐢𝐝𝐞𝐨🎀", "𝐖𝐡𝐞𝐫𝐞 𝐰𝐢𝐧𝐝𝐬 𝐦𝐞𝐞𝐭🎀", "𝐆𝐞𝐧𝐬𝐡𝐢𝐧 𝐈𝐦𝐩𝐚𝐜𝐭🎀"
       ];
       
       const realCategories = [
         "funny", "islamic", "sad", "anime", "lofi", "attitude", "horny", "couple", "car", "bike", "love", "lyrics", "cat", "18+", "meme",
         "football", "baby", "friend", "money", "flower", "naruto", "dragon", "bleach", "demon", "jjk", "solo", "tokyo", "bluelock", "cman", "deathnote",
         "onepiece", "attack", "sakamoto", "wind", "onepman", "alya", "bluebox", "hunter", "loner", "hanime",
         "neymar", "messi", "ronaldo", "vini", "mbappe", "yamal", "rapinha", "dybala", "pele", "maradona", "white", "ruok", "b2k",
         "bnl", "vincenzo", "syblus", "raistar", "smooth", "astatine", "esports",
         "freefire", "pubg", "cod", "coc", "mlbb", "efootball", "minecraft", "gta", "wwmeet", "genshin"                
       ];
       
       const captions = [
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐅𝐮𝐧𝐧𝐲 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 😺",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐈𝐬𝐥𝐚𝐦𝐢𝐜 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 ✨",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐒𝐚𝐝 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 😢",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐀𝐧𝐢𝐦𝐞 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🌟",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐋𝐨𝐅𝐈 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🎶",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐀𝐭𝐭𝐢𝐭𝐮𝐝𝐞 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 ☠",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐇𝐨𝐫𝐧𝐲 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🥵",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐂𝐨𝐮𝐩𝐥𝐞 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 💑",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐂𝐚𝐫 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🌸",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐁𝐢𝐤𝐞 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 😘",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐋𝐨𝐯𝐞 𝐯𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 ❤",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐋𝐲𝐫𝐢𝐜𝐬 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🎵",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐂𝐚𝐭 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🐱",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝟏𝟖+ 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🥵",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐌𝐞𝐦𝐞 𝐕𝐢𝐝𝐞𝐨 🔥",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐅𝐨𝐨𝐭𝐛𝐚𝐥𝐥 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 ⚽",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐁𝐚𝐛𝐲 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🐥",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐅𝐫𝐢𝐞𝐧𝐝𝐬 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 👭",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐌𝐨𝐧𝐞𝐲 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 💸",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐅𝐥𝐨𝐰𝐞𝐫 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🌸",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐍𝐚𝐫𝐮𝐭𝐨 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🌟",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐃𝐫𝐚𝐠𝐨𝐧 𝐛𝐚𝐥𝐥 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🌟",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐁𝐥𝐞𝐚𝐜𝐡 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🌟",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐃𝐞𝐦𝐨𝐧 𝐒𝐥𝐚𝐲𝐞𝐫 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🌟",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐉𝐮𝐣𝐮𝐭𝐬𝐮 𝐊𝐚𝐢𝐬𝐞𝐧 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🌟",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐒𝐨𝐥𝐨 𝐋𝐞𝐯𝐞𝐥𝐢𝐧𝐠 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🌟",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐓𝐨𝐤𝐲𝐨 𝐑𝐞𝐯𝐞𝐧𝐠𝐞𝐫𝐬 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🌟",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐁𝐥𝐮𝐞 𝐋𝐨𝐜𝐤 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🌟",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐂𝐡𝐚𝐢𝐧𝐬𝐚𝐰 𝐌𝐚𝐧 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🌟",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐃𝐞𝐚𝐭𝐡 𝐍𝐨𝐭𝐞 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🌟",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐎𝐧𝐞 𝐏𝐢𝐞𝐜𝐞 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🌟",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐀𝐭𝐭𝐚𝐜𝐤 𝐨𝐧 𝐓𝐢𝐭𝐚𝐧 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🌟",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐒𝐚𝐤𝐚𝐦𝐨𝐭𝐨 𝐃𝐚𝐲𝐬 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🌟",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐖𝐢𝐧𝐝 𝐁𝐫𝐞𝐚𝐤𝐞𝐫 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🌟",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐎𝐧𝐞 𝐏𝐮𝐧𝐜𝐡 𝐌𝐚𝐧 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🌟",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐀𝐥𝐲𝐚 𝐑𝐮𝐬𝐬𝐢𝐚𝐧 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🌟",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐁𝐥𝐮𝐞 𝐁𝐨𝐱 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🌟",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐇𝐮𝐧𝐭𝐞𝐫 𝐱 𝐇𝐮𝐧𝐭𝐞𝐫 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🌟",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐋𝐨𝐧𝐞𝐫 𝐋𝐢𝐟𝐞 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🌟",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐇𝐚𝐧𝐢𝐦𝐞 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🌟",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐍𝐞𝐲𝐦𝐚𝐫 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 ⚽",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐌𝐞𝐬𝐬𝐢 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 ⚽",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐑𝐨𝐧𝐚𝐥𝐝𝐨 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 ⚽",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐕𝐢𝐧𝐢 𝐉𝐫 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 ⚽",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐌𝐛𝐚𝐩𝐩𝐞 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 ⚽",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐘𝐚𝐦𝐚𝐥 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 ⚽",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐑𝐚𝐩𝐢𝐧𝐡𝐚 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 ⚽",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐃𝐲𝐛𝐚𝐥𝐚 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 ⚽",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐏𝐞𝐥𝐞 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 ⚽",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐌𝐚𝐫𝐚𝐝𝐨𝐧𝐚 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 ⚽",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐖𝐡𝐢𝐭𝐞 𝟒𝟒𝟒 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🔥",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐑𝐮𝐨𝐤 𝐅𝐅 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🔥",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐁𝟐𝐊 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🔥",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐁𝐍𝐋 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🔥",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐕𝐢𝐧𝐜𝐞𝐧𝐳𝐨 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🎬",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐒𝐲𝐛𝐥𝐮𝐬 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🔥",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐑𝐚𝐢𝐬𝐭𝐚𝐫 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🔥",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐒𝐦𝐨𝐨𝐭𝐡 𝟒𝟒𝟒 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🔥",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐀𝐬𝐭𝐚𝐭𝐢𝐧𝐞 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🔥",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐅𝐅 𝐄𝐬𝐩𝐨𝐫𝐭𝐬 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 😘",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐅𝐫𝐞𝐞 𝐅𝐢𝐫𝐞 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 😘",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐏𝐮𝐛𝐆 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🎮",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐂𝐚𝐥𝐥 𝐨𝐟 𝐃𝐮𝐭𝐲 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🎮",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐂𝐥𝐚𝐬𝐡 𝐨𝐟 𝐂𝐥𝐚𝐧𝐬 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🎮",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐌𝐨𝐛𝐢𝐥𝐞 𝐋𝐞𝐠𝐞𝐧𝐝 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🎮",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐞𝐅𝐨𝐨𝐭𝐛𝐚𝐥𝐥 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 ⚽",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐌𝐢𝐧𝐞𝐜𝐫𝐚𝐟𝐭 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🎮",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐆𝐓𝐀 𝐕𝐂 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🎮",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐖𝐡𝐞𝐫𝐞 𝐖𝐢𝐧𝐝𝐬 𝐌𝐞𝐞𝐭 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🎬",
         "𝐇𝐞𝐫𝐞 𝐲𝐨𝐮𝐫 𝐆𝐞𝐧𝐬𝐡𝐢𝐧 𝐈𝐦𝐩𝐚𝐜𝐭 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 🎮"
       ];
       
       const itemsPerPage = 10;
       const page = parseInt(args[0]) || 1;
       const totalPages = Math.ceil(displayNames.length / itemsPerPage);
       
       if (page < 1 || page > totalPages) {
         return api.sendMessage(`❌ Pumili sa pagitan ng 1 - ${totalPages}`, event.threadID, event.messageID);
       }

       const startIndex = (page - 1) * itemsPerPage;
       const endIndex = startIndex + itemsPerPage;
       const displayed = displayNames.slice(startIndex, endIndex);
       
       const msg = `📂 𝐀𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞 𝐀𝐥𝐛𝐮𝐦 𝐕𝐢𝐝𝐞𝐨\n` +
       "━━━━━━━━━━━━━━━━━━━━━━━\n" +
       displayed.map((n, i) => `${startIndex + i + 1}. ${n}`).join("\n") +
       "\n━━━━━━━━━━━━━━━━━━━━━━━" +
       `\n📄 Pahina [${page}/${totalPages}]` +
       (page < totalPages ? `\nℹ️ I-type !album ${page + 1} para sa susunod` : "");
       
       await api.sendMessage(msg, event.threadID, (err, info) => {
         global.GoatBot.onReply.set(info.messageID, {
           commandName: this.config.name,
           type: "reply",
           messageID: info.messageID,
           author: senderID,
           page,
           startIndex,
           realCategories,
           captions
         });
       }, event.messageID);
     }
  },

  onReply: async function ({ api, event, Reply }) {
    api.unsendMessage(Reply.messageID);
    const choice = parseInt(event.body);
    const idx = choice - 1;
    
    if (isNaN(choice) || idx < 0 || idx >= Reply.realCategories.length) {
      return api.sendMessage("❌ Maglagay ng tamang numero!", event.threadID, event.messageID);
    }

    const category = Reply.realCategories[idx];
    const caption = Reply.captions[idx];
    const userID = event.senderID;
    
    try {
      const apiUrl = await baseApiUrl();
      const res = await axios.get(`${apiUrl}/api/album/mahmud/videos/${category}?userID=${userID}`);
      
      if (!res.data.success || !res.data.videos?.length) {
        return api.sendMessage("❌ Wala pang video sa kategoryang ito.", event.threadID, event.messageID);
      }

      const videoUrl = res.data.videos[Math.floor(Math.random() * res.data.videos.length)];
      const filePath = path.join(__dirname, `temp_${Date.now()}.mp4`);
      
      const downloadRes = await axios({
        url: videoUrl,
        method: "GET",
        responseType: "stream",
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);
        downloadRes.data.pipe(writer);
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      api.sendMessage(
        { body: caption, attachment: fs.createReadStream(filePath) },
        event.threadID,
        () => fs.unlinkSync(filePath),
        event.messageID
      );
    } catch (error) {
      api.sendMessage("❌ Nabigo ang pagkuha ng video. Subukan mo ulit mamaya.", event.threadID, event.messageID);
    }
  }
};
