module.exports = {
    config: {
        name: "gojo",
        version: "1.0.0",
        author: "Admin 61594055835097",
        countDown: 5,
        role: 0,
        shortDescription: "Gojo pampakunat auto-reply bot",
        longDescription: "Global 1 message, 1 reply pampakunat bot para sa FB account protection na naka-style Gojo.",
        category: "system",
        guide: {
            en: "automatic global banter response as Gojo"
        }
    },

    onStart: async function({ api, event, client, __GLOBAL }) {
        console.log("Goat-bot-V2 Gojo Pampakunat module loaded for Admin ID: 61594055835097");
    },

    onChat: async function({ api, event, client, __GLOBAL }) {
        const adminID = "61594055835097";
        
        // Mga linyang pang-Gojo at pambara para sa pampakunat feature
        const gojoBanter = [
            "Huwag ka nang umangal, malakas ang infinity ko.",
            "Busy si Gojo-sensei ngayon, mag-antay ka.",
            "Autoreply muna kasi nasa malalim na pag-iisip si admin.",
            "Wag kang atat, hindi ka naman special grade.",
            "Seen zoned ka muna kay Gojo.",
            "Pampakunat mode active. Tigil-tigilan mo muna ako."
        ];

        // 1 message, 1 reply logic
        if (event.body && event.senderID !== api.getCurrentUserID()) {
            const randomReply = gojoBanter[Math.floor(Math.random() * gojoBanter.length)];
            
            return api.sendMessage(randomReply, event.threadID, event.messageID);
        }
    }
};
