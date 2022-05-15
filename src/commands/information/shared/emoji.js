const { Util, MessageEmbed } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");

module.exports = (emoji) => {
  let custom = Util.parseEmoji(emoji);
  if (!custom.id) return "Ceci n'est pas un emoji de guilde valide ";

  let url = `https://cdn.discordapp.com/emojis/${custom.id}.${custom.animated ? "gif?v=1" : "png"}`;

  const embed = new MessageEmbed()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: "Informations sur les émojis " })
    .setDescription(
      `**ID :** ${custom.id}\n` + `**Nom :** ${custom.name}\n` + `**Animé :** ${custom.animated ? "Oui " : "Non "}`
    )
    .setImage(url);

  return { embeds: [embed] };
};
