const { MessageEmbed } = require("discord.js");
const { getSettings } = require("@schemas/Guild");
const { sendMessage } = require("@utils/botUtils");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Message|import('discord.js').PartialMessage} message
 */
module.exports = async (client, message) => {
  if (message.partial) return;
  if (message.author.bot || !message.guild) return;

  const settings = await getSettings(message.guild);
  if (!settings.automod.anti_ghostping || !settings.modlog_channel) return;
  const { members, roles, everyone } = message.mentions;

  // Check message if it contains mentions
  if (members.size > 0 || roles.size > 0 || everyone) {
    const logChannel = message.guild.channels.cache.get(settings.modlog_channel);
    if (!logChannel) return;

    const embed = new MessageEmbed()
      .setAuthor({ name: "Mention Fantôme détectée" })
      .setDescription(
        `**<:point:955639055511601152>Message:**\n${message.content}\n\n` +
          `**<:point:955639055511601152>Auteur:** ${message.author.tag} \`${message.author.id}\`\n` +
          `**<:point:955639055511601152>Salon:** ${message.channel.toString()}`
      )
      .addField("<:point:955639055511601152>Membres", members.size.toString(), true)
      .addField("<:point:955639055511601152>Roles", roles.size.toString(), true)
      .addField("<:point:955639055511601152>Everyone?", everyone.toString(), true)
      .setFooter({ text: `Envoyé à ${message.createdAt}` });

    sendMessage(logChannel, { embeds: [embed] });
  }
};
