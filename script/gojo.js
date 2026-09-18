const fs = require("fs");
const path = require("path");

const ADMIN_ID = "61594055835097";
const DATA_FILE = path.join(__dirname, "gojo_supreme_data.json");
const USER_COOLDOWN = new Map();

// Mas marami at mas malupit na linyahan para kay Gojo (Pampakunat / Anti-Spam)
const GOJO_QUOTES = [
  "Sa buong langit at lupa, ako lamang ang nag-iisang honored one.",
  "Walang makatibag sa depensang ito, tuloy-tuloy lang ang takbo ng sistema.",
  "Masyado silang mabagal para maabot ang antas ng kawalang-hanggan.",
  "Infinite ang kapasidad ng server na ito, kahit anong ban ang subukan nila.",
  "Huwag mong subukan ang tapang ng sistema kung simpleng galaw ko lang ay hindi mo makita.",
  "Domain Expansion: Infinite Void. Lahat ng pagtatangka nila ay mapupunta sa wala.",
  "Napakakinis ng takbo ng bot na ito, walang patid, walang aberya."
];

function loadSystemData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    }
  } catch (e) {}
  return { active: true, mode: "Supreme Shield" };
}

function saveSystemData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {}
}

module.exports.config = {
  name: "gojo",
  version: "7.0.0",
  hasPermission: 0,
  credits: "Gojo Supreme Framework",
  description: "Gojo Supreme Bot: Instant Response, Nonstop Infinite, Auto Self-React 😆, Anti-Spam & Anti-Ban Shield.",
  usePrefix: true,
  cooldowns: 2
};

// ==========================================
// HANDLE EVENT (Instant Auto-Reply & Anti-Spam)
// ==========================================
module.exports.handleEvent = async function({ api, event }) {
  const { threadID, senderID, messageID } = event;
  if (!threadID || !senderID) return;

  // Auto self-react ng 😆 agad sa bawat mensahe
  try {
    api.setMessageReaction("😆", messageID, () => {}, true);
  } catch (e) {}

  // Huwag pansinin ang sarili at ang Admin para iwas loop
  if (senderID === ADMIN_ID || senderID === api.getCurrentUserID()) return;

  // Mahigpit na Anti-Spam Cooldown (Proteksyon kontra Facebook spam filter / chat block)
  const now = Date.now();
  const lastTime = USER_COOLDOWN.get(senderID) || 0;
  if (now - lastTime < 4000) return; // 4 seconds interval per user
  USER_COOLDOWN.set(senderID, now);

  const systemData = loadSystemData();
  if (systemData.active && Math.random() < 0.20) { // 20% trigger rate para natural tingnan at hindi spammy
    const randomQuote = GOJO_QUOTES[Math.floor(Math.random() * GOJO_QUOTES.length)];
    
    // Walang delay: Instant send para mabilis at swabe
    api.sendMessage(`♾️ [Gojo Supreme]: ${randomQuote}`, threadID, () => {}, messageID);
  }
};

// ==========================================
// COMMAND RUNNER (Admin Controls & Features)
// ==========================================
module.exports.run = async function({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const action = (args[0] || "help").toLowerCase();
  let systemData = loadSystemData();

  if (action === "help") {
    return api.sendMessage(
      `🌌 **GOJO SUPREME CONTROL PANEL** 🌌\n\n` +
      `• /gojo help - Tingnan ang command list\n` +
      `• /gojo status - Suriin ang kalusugan at kunat ng bot\n` +
      `• /gojo ping - Sukatin ang bilis ng koneksyon\n` +
      `• /gojo on/off - (Admin Only) Patakbuhin o ihinto ang sistema`,
      threadID,
      () => {},
      messageID
    );
  }

  if (action === "status") {
    return api.sendMessage(
      `🛡️ **SUPREME SHIELD STATUS**\n\n` +
      `• Bot State: ${systemData.active ? "ONLINE (Nonstop Infinite)" : "OFFLINE"}\n` +
      `• Anti-Spam Shield: Active & Secure\n` +
      `• Kunat Level: Maximum (Anti-Ban Protected)\n` +
      `• Master Admin: ${ADMIN_ID}`,
      threadID,
      () => {},
      messageID
    );
  }

  if (action === "ping") {
    const timeStart = Date.now();
    return api.sendMessage("⚡ Sinusukat ang lakas ng Domain...", threadID, (err, info) => {
      if (!err && info) {
        const latency = Date.now() - timeStart;
        api.editMessage(`🚀 Latency: ${latency}ms. Walang paltos ang bagsak ng sistema ni Gojo!`, info.messageID);
      }
    }, messageID);
  }

  if (action === "on" || action === "off") {
    if (senderID !== ADMIN_ID) {
      return api.sendMessage("❌ Restricted: Tanging ang Admin ID 61594055835097 lamang ang may kapangyarihang magbago nito.", threadID, () => {}, messageID);
    }

    if (action === "on") {
      systemData.active = true;
      saveSystemData(systemData);
      return api.sendMessage("🚀 Gojo Supreme Bot is now fully ACTIVATED (Infinite Nonstop + Instant Response)!", threadID, () => {}, messageID);
    }

    if (action === "off") {
      systemData.active = false;
      saveSystemData(systemData);
      return api.sendMessage("🛑 Gojo Supreme auto-reply system is now DEACTIVATED.", threadID, () => {}, messageID);
    }
  }

  return api.sendMessage("⚠️ Hindi kilalang utos. I-type ang `/gojo help` para sa gabay.", threadID, () => {}, messageID);
};
