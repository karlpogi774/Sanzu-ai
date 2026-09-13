const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports.config = {
  name: "count",
  version: "1.0.0",
  hasPermission: 2, // Admin/Owner Only
  credits: "Ryuk",
  description: "Mag-count mula 1 hanggang 50 na may kasamang reason, win tag, at time/date",
  usePrefix: true,
  commandCategory: "Utility",
  usages: "/count",
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

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  // STRICT ADMIN/OWNER CHECK
  if (!checkIsAdmin(senderID)) {
    return api.sendMessage("❌ Sensya ka na, para sa mga authorized admins lang ang command na ito.", threadID, messageID);
  }

  api.sendMessage("🔢 Nagsisimula na ang pag-count mula 1 hanggang 50... Sandali lang Boss Ryuk.", threadID, messageID);
  await sleep(1500);

  // Bibilang mula 1 hanggang 50 na may konting delay para hindi ma-spam block ng Facebook
  for (let i = 1; i <= 50; i++) {
    try {
      await api.sendMessage(String(i), threadID);
      await sleep(1000); // 1 second interval bawat bilang
    } catch (err) {
      console.error("[Count Error]:", err.message);
    }
  }

  // Pagkatapos ng 50, isesend ang kumpletong detalye
  const now = new Date();
  
  // Time check (Philippine Time format)
  const timeString = now.toLocaleTimeString("en-US", { timeZone: "Asia/Manila", hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  
  // Date, Month, Year check
  const options = { timeZone: "Asia/Manila", year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  const dateString = now.toLocaleDateString("en-US", options);

  const finalReport = 
    `╭─────────────────╮\n` +
    `   📊 COUNTING SESSION REPORT\n` +
    `╰─────────────────╯\n\n` +
    `📌 Status: Tapos na ang pag-count (1 - 50)\n` +
    `🛑 Reason kung bakit huminto/nawala: Naabot na ang maximum limit na 50 counts para sa session na ito.\n\n` +
    `👑 WIN RYUK\n\n` +
    `🕒 Time Check: ${timeString}\n` +
    `📅 Date: ${dateString}\n` +
    `🗓️ Year: 2026\n` +
    `✨ System: Stable & Executed Successfully`;

  return api.sendMessage(finalReport, threadID);
};
