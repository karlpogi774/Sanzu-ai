module.exports.config = {
  name: "autocomment",
  version: "1.1.0",
  hasPermission: 2,
  credits: "Ryuk",
  description: "Safe auto-comment command na may random lamyang Tagalog lines para ligtas sa restriction",
  usePrefix: true,
  commandCategory: "System",
  usages: "/autocomment <link ng post>",
  cooldowns: 15
};

// ================= CONFIGURATION =================
const ADMIN_UIDS = [
  "61594022290817",
  "61593892603402"
];

// LAMYANG NORMAL TAGALOG LINES PARA SA RANDOM COMMENTS
const NORMAL_LINES = [
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

function checkIsAdmin(senderID) {
  return ADMIN_UIDS.includes(String(senderID));
}

function extractPostID(url) {
  try {
    const urlObj = new URL(url);
    const searchParams = urlObj.searchParams;
    if (searchParams.has("story_fbid")) return searchParams.get("story_fbid");
    if (searchParams.has("fbid")) return searchParams.get("fbid");
    if (searchParams.has("posts")) return searchParams.get("posts");

    const match = url.match(/(?:posts|permalink|videos|photos)\/([0-9]+)/);
    if (match && match[1]) return match[1];

    if (/^\d+$/.test(url)) return url;
  } catch (e) {}
  
  const fallbackMatch = url.match(/\/([0-9]{10,})/);
  return fallbackMatch ? fallbackMatch[1] : null;
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (!checkIsAdmin(senderID)) {
    return;
  }

  const postUrl = args[0];
  if (!postUrl) {
    return api.sendMessage(
      "❌ Paki-lagay ang link ng post Boss Ryuk!\n\nGamitin ito:\n/autocomment <link ng post>",
      threadID,
      messageID
    );
  }

  const postID = extractPostID(postUrl);
  if (!postID) {
    return api.sendMessage("❌ Hindi mabasa ang Post ID o mali ang link na nailagay mo.", threadID, messageID);
  }

  // Pumili ng random lamyang normal line
  const randomComment = NORMAL_LINES[Math.floor(Math.random() * NORMAL_LINES.length)];

  api.sendMessage("⏳ Nagpapadala ng random lamyang comment...", threadID, messageID);

  try {
    api.sendMessage(randomComment, postID, (err, info) => {
      if (err) {
        return api.sendMessage("❌ Nabigo ang pag-comment. Posibleng restricted ang account o hindi pampubliko ang post.", threadID, messageID);
      }
      return api.sendMessage(`✅ Tagumpay! Na-comment: "${randomComment}" (Post ID: ${postID}).`, threadID, messageID);
    });

  } catch (error) {
    return api.sendMessage("❌ Nagka-error sa sistema ng pag-comment.", threadID, messageID);
  }
};
