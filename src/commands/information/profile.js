const { Command } = require("@src/structures");
const { Message, CommandInteraction, MessageEmbed } = require("discord.js");
const { getUser } = require("@schemas/User");
const { getMember } = require("@schemas/Member");
const { EMBED_COLORS, ECONOMY } = require("@root/config");
const { resolveMember } = require("@utils/guildUtils");

module.exports = class Profile extends Command {
  constructor(client) {
    super(client, {
      name: "profile",
      description: "affiche le profil des membres",
      cooldown: 5,
      category: "INFORMATION",
      command: {
        enabled: true,
        usage: "[@membre|id]",
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "utilisateur",
            description: "utilisateur cible ",
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
    const response = await profile(message, target.user, data.settings);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   * @param {object} data
   */
  async interactionRun(interaction, data) {
    const user = interaction.options.getUser("utilisateur") || interaction.user;
    const response = await profile(interaction, user, data.settings);
    await interaction.followUp(response);
  }
};

async function profile({ guild }, user, settings) {
  const memberData = await getMember(guild.id, user.id);
  const userData = await getUser(user.id);

  const embed = new MessageEmbed()
    .setThumbnail(user.displayAvatarURL())
    .setColor(EMBED_COLORS.BOT_EMBED)
    .addField("Tag d'utilisateur", user.tag, true)
    .addField("ID", user.id, true)
    .addField("Inscription Discord", user.createdAt.toDateString(), false)
    .addField("Argent", `${userData.coins} ${ECONOMY.CURRENCY}`, true)
    .addField("Banque", `${userData.bank} ${ECONOMY.CURRENCY}`, true)
    .addField("Valeur nette", `${userData.coins + userData.bank}${ECONOMY.CURRENCY}`, true)
    .addField("Reputation", `${userData.reputation.received}`, true)
    .addField("Série quotidienne", `${userData.daily.streak}`, true)
    .addField("XP*", `${settings.ranking.enabled ? memberData.xp + " " : "Non suivi"}`, true)
    .addField("Niveau*", `${settings.ranking.enabled ? memberData.level + " " : "Non suivi"}`, true)
    .addField("Series*", memberData.strikes + " ", true)
    .addField("Avertissement*", memberData.warnings + " ", true)
    .setFooter({ text: "Les champs marqués (*) sont spécifiques à la guilde" });

  return { embeds: [embed] };
}
