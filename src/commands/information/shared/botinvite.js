const { MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");
const { EMBED_COLORS, SUPPORT_SERVER, DASHBOARD } = require("@root/config");

module.exports = (client) => {
  const embed = new MessageEmbed()
    .setAuthor({ name: "Liens" })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setThumbnail(client.user.displayAvatarURL())
    .setDescription("<:point:955639055511601152>Voici les liens utiles");

  // Buttons
  let components = [];
  components.push(new MessageButton().setLabel("Invitation").setURL(client.getInvite()).setStyle("LINK"));

  if (SUPPORT_SERVER) {
    components.push(new MessageButton().setLabel("Serveur d'Assistance").setURL(SUPPORT_SERVER).setStyle("LINK"));
  }

  if (DASHBOARD.enabled) {
    components.push(new MessageButton().setLabel("Dashboard Link").setURL(DASHBOARD.baseURL).setStyle("LINK"));
  }

  let buttonsRow = new MessageActionRow().addComponents(components);
  return { embeds: [embed], components: [buttonsRow] };
};
