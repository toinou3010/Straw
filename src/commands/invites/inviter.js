const { Command } = require("@src/structures");
const { getEffectiveInvites } = require("@src/handlers/invite");
const { EMBED_COLORS } = require("@root/config.js");
const { MessageEmbed, Message, CommandInteraction } = require("discord.js");
const { stripIndent } = require("common-tags");
const { resolveMember } = require("@utils/guildUtils");
const { getMember } = require("@schemas/Member");

module.exports = class InviterCommand extends Command {
  constructor(client) {
    super(client, {
      name: "inviter",
      description: "affiche les informations de l'invitant ",
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
            description: "à l'utilisateur d'obtenir les informations d'invitation pour ",
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
    const response = await getInviter(message, target.user, data.settings);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   * @param {object} data
   */
  async interactionRun(interaction, data) {
    const user = interaction.options.getUser("utilisateur") || interaction.user;
    const response = await getInviter(interaction, user, data.settings);
    await interaction.followUp(response);
  }
};

async function getInviter({ guild }, user, settings) {
  if (!settings.invite.tracking) return `Le suivi des invitations est désactivé sur ce serveur `;

  const inviteData = (await getMember(guild.id, user.id)).invite_data;
  if (!inviteData || !inviteData.inviter) return `Impossible de savoir comment \`${user.tag}\` as rejoin`;

  const inviter = await guild.client.users.fetch(inviteData.inviter, false, true);
  const inviterData = (await getMember(guild.id, inviteData.inviter)).invite_data;

  const embed = new MessageEmbed()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: `Inviter des données pour  ${user.username}` })
    .setDescription(
      stripIndent`
      Inviteur : \`${inviter?.tag || "Utilisateur supprimé "}\`
      ID de l'inviteur : \`${inviteData.inviter}\`
      Code d'invitation : \`${inviteData.code}\`
      Invitations: \`${getEffectiveInvites(inviterData)}\`
      `
    );

  return { embeds: [embed] };
}
