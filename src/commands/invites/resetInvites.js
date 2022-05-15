const { Command } = require("@src/structures");
const { resolveMember } = require("@utils/guildUtils");
const { Message, CommandInteraction } = require("discord.js");
const { getMember } = require("@schemas/Member");

module.exports = class ResetInvites extends Command {
  constructor(client) {
    super(client, {
      name: "resetinvites",
      description: "effacer les invitations ajoutées par un utilisateur ",
      category: "INVITE",
      userPermissions: ["MANAGE_GUILD"],
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        usage: "<@membre>",
        aliases: ["clearinvites"],
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "utilisateur",
            description: "à l'utilisateur d'effacer les invitations pour ",
            type: "USER",
            required: true,
          },
        ],
      },
    });
  }

  /**
   * @param {Message} message
   * @param {string[]} args
   */
  async messageRun(message, args) {
    const target = await resolveMember(message, args[0], true);
    if (!target) return message.reply("Syntaxe incorrecte. Vous devez mentionner une cible ");
    const response = await clearInvites(message, target.user);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const user = interaction.options.getUser("utilisateur");
    const response = await clearInvites(interaction, user);
    await interaction.followUp(response);
  }
};

async function clearInvites({ guild }, user) {
  const memberDb = await getMember(guild.id, user.id);
  memberDb.invite_data.added = 0;
  await memberDb.save();
  return `Fait! Invitations effacées pour  \`${user.tag}\``;
}
