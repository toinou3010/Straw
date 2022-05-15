const { Command } = require("@src/structures");
const { Message } = require("discord.js");
const { resolveMember } = require("@utils/guildUtils");
const avatarInfo = require("../shared/avatar");

module.exports = class UserInfo extends Command {
  constructor(client) {
    super(client, {
      name: "avatar",
      description: "affiche des informations sur l'avatar d'un utilisateur",
      category: "INFORMATION",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        usage: "[@membre|id]",
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
    const target = (args.length && (await resolveMember(message, args[0]))) || message.member;
    const response = avatarInfo(target.user);
    await message.reply(response);
  }
};
