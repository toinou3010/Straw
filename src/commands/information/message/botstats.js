const { Command } = require("@src/structures");
const { Message } = require("discord.js");
const botstats = require("../shared/botstats");

module.exports = class BotStats extends Command {
  constructor(client) {
    super(client, {
      name: "botstats",
      description: "Information sur le bot",
      category: "INFORMATION",
      botPermissions: ["EMBED_LINKS"],
      cooldown: 5,
      command: {
        enabled: true,
        aliases: ["botstat", "stats"],
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
    const response = botstats(message.client);
    await message.reply(response);
  }
};
