const { BaseContext } = require("@src/structures");
const { ContextMenuInteraction, MessageEmbed } = require("discord.js");
const { getSettings } = require("@schemas/Guild");
const { getUser } = require("@schemas/User");
const { getMember } = require("@schemas/Member");
const { EMBED_COLORS, ECONOMY } = require("@root/config");

module.exports = class Profile extends BaseContext {
  constructor(client) {
    super(client, {
      name: "profile",
      description: "get users profile",
      type: "USER",
      enabled: true,
      ephemeral: true,
    });
  }

  /**
   * @param {ContextMenuInteraction} interaction
   */
  async run(interaction) {
    const user = await interaction.client.users.fetch(interaction.targetId);
    const response = await profile(interaction, user);
    await interaction.followUp(response);
  }
};

async function profile({ guild }, user) {
  const settings = await getSettings(guild);
  const memberData = await getMember(guild.id, user.id);
  const userData = await getUser(user.id);

  const embed = new MessageEmbed()
    .setThumbnail(user.displayAvatarURL())
    .setColor(EMBED_COLORS.BOT_EMBED)
    .addField("<:point:955639055511601152>Pseudo", user.tag, true)
    .addField("<:point:955639055511601152>ID", user.id, true)
    .addField("<:point:955639055511601152>Inscris depuis", user.createdAt.toDateString(), false)
    .addField("<:point:955639055511601152>Argent", `${userData.coins} ${ECONOMY.CURRENCY}`, true)
    .addField("<:point:955639055511601152>Banque", `${userData.bank} ${ECONOMY.CURRENCY}`, true)
    .addField("<:point:955639055511601152>Valeur not", `${userData.coins + userData.bank}${ECONOMY.CURRENCY}`, true)
    .addField("<:point:955639055511601152>Reputation", `${userData.reputation.received}`, true)
    .addField("<:point:955639055511601152>Payement par jour", `${userData.daily.streak}`, true)
    .addField("<:point:955639055511601152>XP*", `${settings.ranking.enabled ? memberData.xp + " " : "Non tracer"}`, true)
    .addField("<:point:955639055511601152>Niveau*", `${settings.ranking.enabled ? memberData.level + " " : "Non Tracer"}`, true)
    .addField("<:point:955639055511601152>Strikes*", memberData.strikes + " ", true)
    .addField("<:point:955639055511601152>Avertissement*", memberData.warnings + " ", true)
    .setFooter({ text: "Les zone avec (*) sont spécifiques aux serveur" });

  return { embeds: [embed] };
}
