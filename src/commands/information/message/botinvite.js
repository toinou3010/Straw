const { Command } = require("@src/structures");
const { Message } = require("discord.js");
const botinvite = require("../shared/botinvite");

module.exports = class BotInvite extends Command {
  constructor(client) {
    super(client, {
      name: "invite",
      description: "inviter le bot",
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
    const response = botinvite(message.client);
    try {
      await message.author.send(response);
      return message.reply("Regarder le message que je vous ai envoyer en privée");
    } catch (ex) {
      return message.reply("Tu as fermer tes MP?");
    }
  }
};
