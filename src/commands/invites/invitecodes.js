const { Command } = require("@src/structures");
const { MessageEmbed, Message, CommandInteraction } = require("discord.js");
const { EMBED_COLORS } = require("@root/config.js");
const { resolveMember } = require("@utils/guildUtils");

module.exports = class InviteCodes extends Command {
  constructor(client) {
    super(client, {
      name: "invitecodes",
      description: "lister tous vos codes d'invitations dans cette guilde ",
      category: "INVITE",
      botPermissions: ["EMBED_LINKS", "MANAGE_GUILD"],
      command: {
        enabled: true,
        usage: "[@membre|id]",
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "utilisateur",
            description: "à l'utilisateur d'obtenir les codes d'invitation pour ",
            type: "USER",
            required: false,
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
    const target = (await resolveMember(message, args[0])) || message.member;
    const response = await getInviteCodes(message, target.user);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const user = interaction.options.getUser("utilisateur") || interaction.user;
    const response = await getInviteCodes(interaction, user);
    await interaction.followUp(response);
  }
};

async function getInviteCodes({ guild }, user) {
  const invites = await guild.invites.fetch({ cache: false });
  const reqInvites = invites.filter((inv) => inv.inviter.id === user.id);
  if (reqInvites.size === 0) return `\`${user.tag}\` n'a pas d'invitations sur ce serveur `;

  let str = "";
  reqInvites.forEach((inv) => {
    str += `❯ [${inv.code}](${inv.url}) : ${inv.uses} utilisations\n`;
  });

  const embed = new MessageEmbed()
    .setAuthor({ name: `Code d'invitation pour  ${user.username}` })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(str);

  return { embeds: [embed] };
}
