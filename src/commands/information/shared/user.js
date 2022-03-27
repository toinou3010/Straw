const { MessageEmbed } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");

module.exports = (member) => {
  let color = member.displayHexColor;
  if (color === "#000000") color = EMBED_COLORS.BOT_EMBED;

  const embed = new MessageEmbed()
    .setAuthor({
      name: `Information sur ${member.displayName}`,
      iconURL: member.user.displayAvatarURL(),
    })
    .setThumbnail(member.user.displayAvatarURL())
    .setColor(color)
    .addField("<:point:955639055511601152>Pseudo", member.user.tag, true)
    .addField("<:point:955639055511601152>ID", member.id, true)
    .addField("<:point:955639055511601152>Sur le serveur depuis", member.joinedAt.toUTCString())
   // .addField("Discord Registered", message.createdAt, true)
    .addField(`<:point:955639055511601152>Roles [${member.roles.cache.size}]`, member.roles.cache.map((r) => r.name).join(", "), false)
    .setFooter({ text: `Demander par ${member.user.tag}` })
    .setTimestamp(Date.now());

  return { embeds: [embed] };
};
