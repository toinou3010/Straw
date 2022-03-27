const { MessageEmbed } = require("discord.js");
const { getSettings: registerGuild } = require("@schemas/Guild");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Guild} guild
 */
module.exports = async (client, guild) => {
  if (!guild.members.cache.has(guild.ownerId)) await guild.fetchOwner({ cache: true });
  client.logger.log(`Guild Joined: ${guild.name} Members: ${guild.memberCount}`);
  await registerGuild(guild);

  if (!client.joinLeaveWebhook) return;

  const embed = new MessageEmbed()
    .setTitle("Serveur rejoin")
    .setThumbnail(guild.iconURL())
    .setColor(client.config.EMBED_COLORS.SUCCESS)
    .addField("<:point:955639055511601152>Nom :", guild.name, false)
    .addField("<:point:955639055511601152>ID", guild.id, false)
    .addField("<:point:955639055511601152>Propriétaire", `${client.users.cache.get(guild.ownerId).tag} [\`${guild.ownerId}\`]`, false)
    .addField("<:point:955639055511601152>Membres", `\`\`\`yaml\n${guild.memberCount}\`\`\``, false)
    .setFooter({ text: `<:point:955639055511601152>Serveur #${client.guilds.cache.size}` });

  client.joinLeaveWebhook.send({
    username: "Nouveau Serveur 🎏",
    avatarURL: client.user.displayAvatarURL(),
    embeds: [embed],
  });
};
