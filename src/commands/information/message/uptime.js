const { Command } = require("@src/structures");
const { Message } = require("discord.js");
const { timeformat } = require("@utils/miscUtils");

module.exports = class BotInvite extends Command {
  constructor(client) {
    super(client, {
      name: "uptime",
      description: "vous donne la disponibilité du bot",
      category: "INFORMATION",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
      },
      slashCommand: {
        enabled: false,
      },
    });
  }

  /**
   * @param {Message} message
   * @param {string[]} args
   */
  async messageRun(message, args) {
    await message.reply(`En ligne depuis: \`${timeformat(process.uptime())}\``);
  }
};
