/**
 * Auto-Reply Handler: Pang-asar / Mambabwisit Edition
 */

// Listahan ng mga pang-asar na reply
const pangAsarReplies = [
  "Ge lang, kwento mo sa pagong. 🐢",
  "Seen. 👁️👁️",
  "K.",
  "Ganda ng sinabi mo, subukan mo ulit mamaya baka may pumasok na sense. 💅",
  "Ah ok, pakibasa ulit yung patingin ko kung may naniwala. 🥱",
  "Sige, ilagay natin 'yan sa listahan ng mga bagay na walang nagtanong. 📋",
  "Wow, galing! Biyayaan ka sana ng kaunting logic. ✨",
  "Type pa nang mabilis, baka sakaling maging tama 'yang sinasabi mo. ⌨️",
  "Copy-paste ko 'to ha, pakita ko sa naghahanap ng paki. 🔍",
  "Galit na galit, gustong manakit? 🥺"
];

/**
 * Main Auto-Reply Function
 * @param {Object} message - Incoming message object
 * @param {string} message.text - Message content
 * @param {string} message.sender - Sender ID/name
 * @returns {string} Single pang-asar response
 */
function generateAsarReply(message) {
  // Siguraduhing may laman ang mensahe
  if (!message || !message.text) return "K.";

  // Random selector para sa pang-asar lines
  const randomIndex = Math.floor(Math.random() * pangAsarReplies.length);
  return pangAsarReplies[randomIndex];
}

/**
 * Instant execution setup (1 message = 1 instant reply)
 */
function onMessageReceived(incomingMessage, sendCallback) {
  console.log(`[Message from ${incomingMessage.sender}]: ${incomingMessage.text}`);

  // Kunin agad ang reply
  const reply = generateAsarReply(incomingMessage);

  // Send agad, walang delay / walang time limit restriction
  sendCallback(incomingMessage.sender, reply);
}

// --- Halimbawa ng Output ---

function sendMessage(recipient, text) {
  console.log(`[Auto-Reply to ${recipient}]: ${text}\n`);
}

// Subok:
onMessageReceived({ sender: "Tropa", text: "Tol san ka na?" }, sendMessage);
onMessageReceived({ sender: "Tropa", text: "Hoy reply ka naman!" }, sendMessage);
