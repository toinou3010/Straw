const { Command } = require("@src/structures");
const { getEffectiveInvites, checkInviteRewards } = require("@src/handlers/invite");
const { EMBED_COLORS } = require("@root/config.js");
const { MessageEmbed, Message, CommandInteraction } = require("discord.js");
const { resolveMember } = require("@utils/guildUtils");
const { getMember } = require("@schemas/Member");

module.exports = class AddInvitesCommand extends Command {
  constructor(client) {
    super(client, {
      name: "addinvites",
      description: "ajouter des invitations à un membre",
      category: "INVITE",
      userPermissions: ["MANAGE_GUILD"],
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        usage: "<@membre|id> <invites>",
        minArgsCount: 2,
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "utilisateur",
            description: "l'utilisateur à qui donner des invitations",
            type: "USER",
            required: true,
          },
          {
            name: "invites",
            description: "le nombre d'invitations à donner",
            type: "INTEGER",
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
    const amount = parseInt(args[1]);

    if (!target) return message.reply("Syntaxe incorrecte. Vous devez mentionner une personne");
    if (isNaN(amount)) return message.reply("Le montant de l'invitation doit être un nombre");

    const response = await addInvites(message, target.user, parseInt(amount));
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const user = interaction.options.getUser("utilisateur");
    const amount = interaction.options.getInteger("invites");
    const response = await addInvites(interaction, user, amount);
    await interaction.followUp(response);
  }
};

async function addInvites({ guild }, user, amount) {
  if (user.bot) return "Oups ! Vous ne pouvez pas ajouter des invitations aux bots";

  const memberDb = await getMember(guild.id, user.id);
  memberDb.invite_data.added += amount;
  await memberDb.save();

  const embed = new MessageEmbed()
    .setAuthor({ name: `Ajout d'invitations à ${user.username}` })
    .setThumbnail(user.displayAvatarURL())
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(`${user.tag} as maintenant ${getEffectiveInvites(memberDb.invite_data)} invites`);

  checkInviteRewards(guild, memberDb, true);
  return { embeds: [embed] };
}
