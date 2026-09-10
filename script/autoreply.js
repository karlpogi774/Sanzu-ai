// Sample pool of banter/teasing responses
const responses = [
  "Bakit ka chat nang chat, miss mo 'ko agad?",
  "Ano na naman 'yan? Baka naman, tulog na.",
  "Sipag natin mag-message ah, wala bang ibang ginagawa?",
  "Galaw-galaw baka ma-inlove ka niyan!",
  "Auto-reply lang 'to, pero valid pa rin feelings mo... char!"
];

/**
 * Main auto-reply handler function
 * @param {Object} event - The incoming message event object
 * @param {Object} api - The bot framework API instance
 */
async function handleAutoReply(event, api) {
  try {
    // 1. Basic validation: ignore non-message events or messages sent by the bot itself
    if (!event || event.type !== "message" || event.isSelf) {
      return;
    }

    const threadID = event.threadID;
    
    // 2. Select a random playful response from the list
    const randomIndex = Math.floor(Math.random() * responses.length);
    const replyMessage = responses[randomIndex];

    // 3. Send the message reply back to the thread/chat
    await api.sendMessage(
      { body: replyMessage },
      threadID,
      event.messageID // Pass messageID to reply directly to the user's message
    );

  } catch (error) {
    console.error("Error sending auto-reply:", error);
  }
}

module.exports = { handleAutoReply };
