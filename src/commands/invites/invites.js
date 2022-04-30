const { Command } = require("@src/structures");
const { getEffectiveInvites } = require("@src/handlers/invite");
const { EMBED_COLORS } = require("@root/config.js");
const { MessageEmbed, Message, CommandInteraction } = require("discord.js");
const { resolveMember } = require("@utils/guildUtils");
const { getMember } = require("@schemas/Member");

module.exports = class InvitesCommand extends Command {
  constructor(client) {
    super(client, {
      name: "invites",
      description: "montre le nombre d'invitations dans ce serveur",
      category: "INVITE",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        usage: "[@membre|id]",
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "utilisateur",
            description: "l'utilisateur pour obtenir les invitations pour",
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
   * @param {object} data
   */
  async messageRun(message, args, data) {
    const target = (await resolveMember(message, args[0])) || message.member;
    const response = await getInvites(message, target.user, data.settings);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   * @param {object} data
   */
  async interactionRun(interaction, data) {
    const user = interaction.options.getUser("utilisateur") || interaction.user;
    const response = await getInvites(interaction, user, data.settings);
    await interaction.followUp(response);
  }
};

async function getInvites({ guild }, user, settings) {
  if (!settings.invite.tracking) return `Le suivi des invitations est désactivé sur ce serveur`;

  const inviteData = (await getMember(guild.id, user.id)).invite_data;

  const embed = new MessageEmbed()
    .setAuthor({ name: `Invitations pour ${user.username}` })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setThumbnail(user.displayAvatarURL())
    .setDescription(`${user.toString()} as ${getEffectiveInvites(inviteData)} invites`)
    .addField("<:stats:963567717611339897> Invitations", `**${inviteData?.tracked + inviteData?.added || 0}**`, true)
    .addField("<:stats:963567717611339897> Faux Invites", `**${inviteData?.fake || 0}**`, true)
    .addField("<:stats:963567717611339897> Membres Partis", `**${inviteData?.left || 0}**`, true);

  return { embeds: [embed] };
}
