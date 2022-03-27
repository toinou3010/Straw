const { MessageEmbed } = require("discord.js");
const { getSettings } = require("@schemas/Guild");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Guild} guild
 */
module.exports = async (client, guild) => {
  client.logger.log(`Guild Left: ${guild.name} Members: ${guild.memberCount}`);

  const settings = await getSettings(guild);
  settings.data.leftAt = new Date();
  await settings.save();

  if (!client.joinLeaveWebhook) return;

  let ownerTag;
  const ownerId = guild.ownerId || settings.data.owner.id;
  try {
    const owner = await client.users.fetch(guild.ownerId);
    ownerTag = owner.tag;
  } catch (err) {
    ownerTag = settings.data.owner.tag;
  }

  const embed = new MessageEmbed()
    .setTitle("Serveur quitté")
    .setThumbnail(guild.iconURL())
    .setColor(client.config.EMBED_COLORS.ERROR)
    .addField("<:point:955639055511601152>Nom", guild.name || "<:point:955639055511601152>Inconnue", false)
    .addField("<:point:955639055511601152>ID", guild.id, false)
    .addField("<:point:955639055511601152>Owner", `${ownerTag} [\`${ownerId}\`]`, false)
    .addField("<:point:955639055511601152>Membres", `\`\`\`yaml\n${guild.memberCount}\`\`\``, false)
    .setFooter({ text: `<:point:955639055511601152>Serveur #${client.guilds.cache.size}` });

  client.joinLeaveWebhook.send({
    username: "Serveur quitté 🍥",
    avatarURL: client.user.displayAvatarURL(),
    embeds: [embed],
  });
};
