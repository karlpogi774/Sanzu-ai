// ==========================================================
// 👑 HELP COMMAND — DIRECT IN SCRIPT FOLDER | ADMIN PROTECTED
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// ==========================================================

const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

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
    name: "help",
    version: "2.2.0",
    author: "RYUK BOSS",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "View command usage and list all commands"
    },
    longDescription: {
      en: "View command usage and list all available commands directly"
    },
    category: "info",
    guide: {
      en: "{pn} [command name]"
    },
    priority: 1
  },

  onStart: async function ({ message, args, event, threadsData, role }) {
    const { threadID, senderID } = event;
    const threadData = await threadsData.get(threadID);
    const prefix = getPrefix(threadID);
    const isUserAdmin = isAdmin(senderID);

    if (args.length === 0) {
      const categories = {};
      let msg = "";

      for (const [name, value] of commands) {
        if (value.config.role > 0 && role < value.config.role && !isUserAdmin) continue;

        const category = value.config.category || "Uncategorized";
        categories[category] = categories[category] || { commands: [] };
        if (!categories[category].commands.includes(name)) {
          categories[category].commands.push(name);
        }
      }

      Object.keys(categories).sort().forEach((category) => {
        msg += `\n╭─────⭓ ${category.toUpperCase()}`;
        const names = categories[category].commands.sort();
        for (let i = 0; i < names.length; i += 3) {
          const cmds = names.slice(i, i + 3).map((item) => `✧${item}`);
          msg += `\n│ ${cmds.join("  ")}`;
        }
        msg += `\n╰────────────⭓\n`;
      });

      const totalCommands = commands.size;
      msg += `\n⭔ Total Commands: ${totalCommands}\n` +
             `⭔ Type ${prefix}help <command> to see details.\n`;

      if (isUserAdmin) {
        msg += `\n👑 — ADMIN MODE ACTIVE —\n`;
      }

      try {
        const sentMsg = await message.reply({ body: msg });
        setTimeout(() => message.unsend(sentMsg.messageID), 80000);
      } catch (error) {
        console.error("Help Error:", error);
      }

    } else {
      const commandName = args[0].toLowerCase();
      const command = commands.get(commandName) || commands.get(aliases.get(commandName));

      if (!command) {
        return message.reply(`❌ | Command "${commandName}" not found.`);
      }

      const config = command.config;
      const roleText = roleTextToString(config.role);

      const desc = config.description?.en || 
                   config.longDescription?.en || 
                   "No description available.";
      
      const guideBody = config.guide?.en || "";
      const usage = guideBody
        .replace(/{pn}/g, prefix + config.name)
        .replace(/{p}/g, prefix)
        .replace(/{n}/g, config.name);

      const response = `╭─────────⭓\n` +
                       `│ 🎀 NAME: ${config.name}\n` +
                       `│ 📃 ALIASES: ${config.aliases ? config.aliases.join(", ") : "None"}\n` +
                       `├──‣ INFO\n` +
                       `│ 📝 DESCRIPTION: ${desc}\n` +
                       `│ 👑 AUTHOR: ${config.author || "Unknown"}\n` +
                       `│ 📚 USAGE: ${usage || prefix + config.name}\n` +
                       `├──‣ DETAILS\n` +
                       `│ ⭐ VERSION: ${config.version || "1.0"}\n` +
                       `│ ♻️ ROLE: ${roleText}\n` +
                       `╰────────────⭓`;

      const helpMessage = await message.reply(response);
      setTimeout(() => message.unsend(helpMessage.messageID), 80000);
    }
  }
};

function roleTextToString(role) {
  const roles = [
    "All Users",
    "Group Admin",
    "Bot Admin",
    "Developer",
    "VIP User",
    "NSFW User"
  ];
  
  if (role >= 0 && role < roles.length) {
    return `${role} (${roles[role]})`;
  }
  return `${role} (Unknown)`;
  }
        
