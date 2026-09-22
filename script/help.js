// ==========================================================
// 👑 HELP COMMAND — NEOkEX STYLE | ADMIN PROTECTED
// ADMIN IDs: 61594055835097, 61593892603402, 61594325727109, 61594022290817
// ==========================================================

const fs = require("fs-extra");
const path = require("path");

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
    aliases: ["menu", "commands"],
    version: "3.0.0",
    author: "RYUK BOSS",
    shortDescription: {
      en: "Show all available commands"
    },
    longDescription: {
      en: "Displays a clean categorized list of all bot commands"
    },
    category: "system",
    guide: {
      en: "{pn}help [command name]"
    }
  },

  onStart: async function ({ message, args, prefix, event }) {
    const allCommands = global.GoatBot.commands;
    const categories = {};
    const isUserAdmin = isAdmin(event.senderID);

    const emojiMap = {
      ai: "➥", "ai-image": "➥", group: "➥", system: "➥",
      fun: "➥", owner: "➥", config: "➥", economy: "➥",
      media: "➥", "18+": "➥", tools: "➥", utility: "➥",
      info: "➥", image: "➥", game: "➥", admin: "➥",
      rank: "➥", boxchat: "➥", others: "➥"
    };

    const cleanCategoryName = (text) => {
      if (!text) return "others";
      return text
        .normalize("NFKD")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
    };

    for (const [name, cmd] of allCommands) {
      // Hide admin-only commands from non-admins
      const cmdRole = cmd.config.role ?? 0;
      if (cmdRole > 0 && !isUserAdmin) continue;

      const cat = cleanCategoryName(cmd.config.category);
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(cmd.config.name);
    }

    if (args[0]) {
      const query = args[0].toLowerCase();
      const cmd =
        allCommands.get(query) ||
        [...allCommands.values()].find((c) => (c.config.aliases || []).includes(query));
      
      if (!cmd) return message.reply(`❌ Command "${query}" not found.`);

      const {
        name,
        version,
        author,
        guide,
        category,
        shortDescription,
        longDescription,
        aliases,
        role
      } = cmd.config;

      const desc =
        typeof longDescription === "string" ? longDescription :
        longDescription?.en || shortDescription?.en || shortDescription || "No description";

      const usage =
        typeof guide === "string" ? guide.replace(/{pn}/g, prefix) :
        guide?.en?.replace(/{pn}/g, prefix) || `${prefix}${name}`;

      const requiredRole = role !== undefined ? role : 0;

      return message.reply(
        `☠️ 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗜𝗡𝗙𝗢 ☠️\n\n` +
        `➥ Name: ${name}\n` +
        `➥ Category: ${category || "Uncategorized"}\n` +
        `➥ Description: ${desc}\n` +
        `➥ Aliases: ${aliases?.length ? aliases.join(", ") : "None"}\n` +
        `➥ Usage: ${usage}\n` +
        `➥ Permission Level: ${requiredRole}\n` +
        `➥ Author: ${author}\n` +
        `➥ Version: ${version}`
      );
    }

    const formatCommands = (cmds) => cmds.sort().map((cmd) => `× ${cmd}`).join("  ");

    let msg = `━━━👑 𝗥𝗬𝗨𝗞 𝗕𝗢𝗦𝗦 👑━━━\n`;
    const sortedCategories = Object.keys(categories).sort();
    
    for (const cat of sortedCategories) {
      const emoji = emojiMap[cat] || "➥";
      msg += `\n╭──『 ${cat.toUpperCase()} 』\n`;
      msg += `${formatCommands(categories[cat])}\n`;
      msg += `╰────────────◊\n`;
    }

    msg += `\n➥ Use: ${prefix}help [command name] for details\n`;
    if (isUserAdmin) msg += `👑 ADMIN MODE ACTIVE`;

    return message.reply(msg);
  }
};
        
