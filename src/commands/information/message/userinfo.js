const { Command } = require("@src/structures");
const { Message } = require("discord.js");
const { resolveMember } = require("@utils/guildUtils");
const userInfo = require("../shared/user");

module.exports = class UserInfo extends Command {
  constructor(client) {
    super(client, {
      name: "userinfo",
      description: "information sur un membre",
      category: "INFORMATION",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        usage: "[@member|id]",
        aliases: ["info", "memberinfo"],
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
    const response = userInfo(target);
    await message.reply(response);
  }
};
