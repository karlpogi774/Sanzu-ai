// ==========================================================
// 👑 SETWELCOME — ENGLISH | ADMIN PROTECTED ✅
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// ==========================================================

const { drive, getStreamFromURL, getExtFromUrl, getTime } = global.utils;

const ADMIN_IDS = new Set([
  "61594055835097",
  "61593892603402",
  "61594325727109",
  "61594022290817"
]);

function isAdmin(id) {
  return ADMIN_IDS.has(String(id));
}

module.exports = {
  config: {
    name: "setwelcome",
    aliases: ["setwc"],
    version: "2.0.0",
    author: "RYUK BOSS",
    countDown: 5,
    role: 1,
    description: {
      en: "Edit welcome message content when a new member joins your group chat"
    },
    category: "custom",
    guide: {
      en: {
        body: "   {pn} text [<content> | reset]: edit text content or reset to default, using these placeholders:"
          + "\n  + {userName}: new member's name"
          + "\n  + {userNameTag}: new member's name (tagged)"
          + "\n  + {boxName}:  group chat name"
          + "\n  + {multiple}: you || you guys"
          + "\n  + {session}:  time of day"
          + "\n\n   Example:"
          + "\n    {pn} text Hello {userName}, welcome to {boxName}! Hope you enjoy your stay here 💜"
          + "\n"
          + "\n   Reply to a message or send with a file: {pn} file — to add attachments (image, video, audio)"
          + "\n\n   Example:"
          + "\n    {pn} file reset: remove all attached files",
        attachment: {
          [`${__dirname}/assets/guide/setwelcome/setwelcome_en_1.png`]: "https://i.ibb.co/vsCz0ks/setwelcome-en-1.png"
        }
      }
    }
  },

  langs: {
    en: {
      turnedOn: "✅ Welcome message turned ON",
      turnedOff: "✅ Welcome message turned OFF",
      missingContent: "⚠️ Please enter welcome message content",
      edited: "✅ Welcome message updated to:\n%1",
      reseted: "✅ Welcome message reset to default",
      noFile: "⚠️ No attached files to remove",
      resetedFile: "✅ All attached files removed",
      missingFile: "⚠️ Please reply with or send an image/video/audio file",
      addedFile: "✅ Added %1 file attachment(s) to welcome message"
    }
  },

  onStart: async function ({ args, threadsData, message, event, commandName, getLang, role }) {
    const { threadID, senderID, body } = event;
    
    // ✅ ALLOW ADMINS + GROUP ADMINS
    if (role < 1 && !isAdmin(senderID)) {
      return message.reply("❌ Only group admins or bot admins can use this command!");
    }

    const { data, settings } = await threadsData.get(threadID);

    switch (args[0]) {
      case "text": {
        if (!args[1])
          return message.reply(getLang("missingContent"));
        else if (args[1] === "reset")
          delete data.welcomeMessage;
        else
          data.welcomeMessage = body.slice(body.indexOf(args[0]) + args[0].length).trim();
        
        await threadsData.set(threadID, { data });
        message.reply(data.welcomeMessage ? getLang("edited", data.welcomeMessage) : getLang("reseted"));
        break;
      }

      case "file": {
        if (args[1] === "reset") {
          if (!data.welcomeAttachment)
            return message.reply(getLang("noFile"));
          
          try {
            await Promise.all(data.welcomeAttachment.map(fileId => drive.deleteFile(fileId)));
            delete data.welcomeAttachment;
          } catch (e) {}
          
          await threadsData.set(threadID, { data });
          message.reply(getLang("resetedFile"));
        }
        else if (event.attachments.length === 0 && (!event.messageReply || event.messageReply.attachments.length === 0)) {
          return message.reply(getLang("missingFile"), (err, info) => {
            global.GoatBot.onReply.set(info.messageID, {
              messageID: info.messageID,
              author: senderID,
              commandName
            });
          });
        }
        else {
          saveChanges(message, event, threadID, senderID, threadsData, getLang);
        }
        break;
      }

      case "on":
      case "off": {
        settings.sendWelcomeMessage = args[0] === "on";
        await threadsData.set(threadID, { settings });
        message.reply(settings.sendWelcomeMessage ? getLang("turnedOn") : getLang("turnedOff"));
        break;
      }

      default:
        message.SyntaxError();
        break;
    }
  },

  onReply: async function ({ event, Reply, message, threadsData, getLang }) {
    const { threadID, senderID } = event;
    if (senderID !== Reply.author) return;

    if (event.attachments.length === 0 && (!event.messageReply || event.messageReply.attachments.length === 0))
      return message.reply(getLang("missingFile"));
    
    saveChanges(message, event, threadID, senderID, threadsData, getLang);
  }
};

async function saveChanges(message, event, threadID, senderID, threadsData, getLang) {
  const { data } = await threadsData.get(threadID);
  const attachments = [...event.attachments, ...(event.messageReply?.attachments || [])]
    .filter(item => ["photo", "png", "animated_image", "video", "audio"].includes(item.type));
  
  if (!data.welcomeAttachment)
    data.welcomeAttachment = [];

  await Promise.all(attachments.map(async attachment => {
    const { url } = attachment;
    const ext = getExtFromUrl(url);
    const fileName = `${getTime()}.${ext}`;
    const infoFile = await drive.uploadFile(`setwelcome_${threadID}_${senderID}_${fileName}`, await getStreamFromURL(url));
    data.welcomeAttachment.push(infoFile.id);
  }));

  await threadsData.set(threadID, { data });
  message.reply(getLang("addedFile", attachments.length));
}
