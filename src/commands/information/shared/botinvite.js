const { MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");
const { EMBED_COLORS, SUPPORT_SERVER, DASHBOARD } = require("@root/config");

module.exports = (client) => {
  const embed = new MessageEmbed()
    .setAuthor({ name: "Liens" })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setThumbnail(client.user.displayAvatarURL())
    .setDescription("<:liens:963573935973203988> Voici les liens utiles\n\n<:plus2:963282449209630730> [Invite Moi](https://discord.com/oauth2/authorize?client_id=855107430693077033&scope=bot+applications.commands&permissions=275380301174)\n<:discord:963262544997404702> [Assistance](https://discord.gg/3sGyHNE3X9)");

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
