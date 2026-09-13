module.exports.config = {
  name: "pmautoreply",
  version: "1.0.0",
  hasPermission: 0,
  credits: "Ryuk",
  description: "Awtomatikong sumasagot sa mga pumapasok na Private Message (PM) sa Messenger",
  usePrefix: false,
  commandCategory: "System",
  cooldowns: 5
};

// ================= CONFIGURATION =================
// Mga authorized UIDs lang ang pwedeng pagandahin o i-on/off kung sakali, 
// pero ang PM bot ay Awtomatikong sasagot sa magte-text sa inbox mo.
const ADMIN_UIDS = [
  "61594022290817",
  "61593892603402"
];

// Lamyang normal tagalog lines para natural tingnan at hindi spam-detect
const NORMAL_PM_LINES = [
  "ge", "k", "kk", "ah ok", "gege", "we3h", "edi wow", "sige lang", "luh", "sige pre",
  "tuloy mo lang", "sabi mo eh", "cge cge", "basta ikaw", "sige lods", "yun lang", "okay",
  "geh", "copy", "noted", "lah", "ganun ba", "osige", "ge lang pre", "ah sige sige",
  "sige paps", "basta", "sabi mo", "weh ba", "totoo ba", "k lods", "uhm ok", "sige ah",
  "cge lang", "ge bro", "tara ge", "sige w8", "ge mamaya", "ok sige", "oo nalang",
  "ge ge ge", "ganun pala", "basta ge", "cge lodi", "alaws", "wehh", "ah okies",
  "sige ok", "ge ah", "sige sige", "oks lang", "ge bye", "w8 lang", "basta ok",
  "sige rin", "tuloy mo", "ge tamis", "lah talaga", "cge ge", "ok ok", "geh geh",
  "sigeee", "ahhh ok", "basta sige", "ge noted", "wehh di nga", "sige subukan mo",
  "yabang mo", "sus", "talaga ba", "ayoko nga", "ikaw na", "pogi mo naman", "xd"
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const userCooldown = new Map();

module.exports.handleEvent = async function ({ api, event }) {
  const { senderID, body, isGroup, threadID } = event;

  // 1. DAPAT PM LANG (HINDI GROUP CHAT)
  if (isGroup || !threadID) return;

  // 2. HUWAG SAGUTIN ANG SARILI MONG ACC
  if (senderID === api.getCurrentUserID()) return;

  // 3. HUWAG DIN SAGUTIN KUNG ADMIN ANG NAG-CHAT (Optional, para di mag-loop kung kayo nag-uusap)
  if (ADMIN_UIDS.includes(String(senderID))) return;

  // 4. COOLDOWN PER USER (Para hindi ma-restrict ang account sa sunud-sunod na PM)
  const now = Date.now();
  const lastTime = userCooldown.get(senderID) || 0;
  if (now - lastTime < 10000) return; // 10 seconds bago ulit mag-reply sa parehong tao
  userCooldown.set(senderID, now);

  // Pumili ng random lamyang linya
  const randomLine = NORMAL_PM_LINES[Math.floor(Math.random() * NORMAL_PM_LINES.length)];

  // Maghintay ng 1.5 seconds para mukhang tao ang nag-type
  await sleep(1500);

  try {
    api.sendMessage(randomLine, threadID, (err) => {
      if (err) console.error("[PM Auto-Reply Error]:", err);
    });
  } catch (e) {}
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;
  if (!ADMIN_UIDS.includes(String(senderID))) return;
  
  return api.sendMessage("🟢 PM Auto-Reply Bot is active and running smoothly for Boss Ryuk.", threadID, messageID);
};
