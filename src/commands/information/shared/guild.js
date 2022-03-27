const { MessageEmbed } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");
const moment = require("moment");

module.exports = async (guild) => {
  const { name, id, preferredLocale, channels, roles, ownerId } = guild;

  const owner = await guild.members.fetch(ownerId);
  const createdAt = moment(guild.createdAt);

  const totalChannels = channels.cache.size;
  const categories = channels.cache.filter((c) => c.type === "GUILD_CATEGORY").size;
  const textChannels = channels.cache.filter((c) => c.type === "GUILD_TEXT").size;
  const voiceChannels = channels.cache.filter((c) => c.type === "GUILD_VOICE" || c.type === "GUILD_STAGE_VOICE").size;
  const threadChannels = channels.cache.filter(
    (c) => c.type === "GUILD_PRIVATE_THREAD" || c.type === "GUILD_PUBLIC_THREAD"
  ).size;

  const memberCache = guild.members.cache;
  const all = memberCache.size;
  const bots = memberCache.filter((m) => m.user.bot).size;
  const users = all - bots;
  const onlineUsers = memberCache.filter((m) => !m.user.bot && m.presence?.status === "online").size;
  const onlineBots = memberCache.filter((m) => m.user.bot && m.presence?.status === "online").size;
  const onlineAll = onlineUsers + onlineBots;
  const rolesCount = roles.cache.size;

  const getMembersInRole = (members, role) => {
    return members.filter((m) => m.roles.cache.has(role.id)).size;
  };

  const rolesString = roles.cache
    .filter((r) => !r.name.includes("everyone"))
    .map((r) => `${r.name}[${getMembersInRole(memberCache, r)}]`)
    .join(", ");

  let { verificationLevel } = guild;
  switch (guild.verificationLevel) {
    case "CITADELLE":
      verificationLevel = "┻�?┻ミヽ(ಠ益ಠ)ノ彡┻�?┻";
      break;

    case "MOYEN":
      verificationLevel = "(╯°□°）╯︵ ┻�?┻";
      break;

    default:
      break;
  }

  let desc = "";
  desc = `${desc + "<:point:955639055511601152>"} **ID:** ${id}\n`;
  desc = `${desc + "<:point:955639055511601152>"} **Nom:** ${name}\n`;
  desc = `${desc + "<:point:955639055511601152>"} **Propriétaire:** ${owner.user.tag}\n`;
  desc = `${desc + "<:point:955639055511601152>"} **Region:** ${preferredLocale}\n`;
  desc += "\n";

  const embed = new MessageEmbed()
    .setTitle("GUILD INFORMATION")
    .setThumbnail(guild.iconURL())
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(desc)
    .addField(`<:point:955639055511601152>Membres Total [${all}]`, `\`\`\`Membres: ${users}\nBots: ${bots}\`\`\``, true)
    .addField(`<:point:955639055511601152>En Ligne [${onlineAll}]`, `\`\`\`Membres: ${onlineUsers}\nBots: ${onlineBots}\`\`\``, true)
    .addField(
      `Categories et Salons [${totalChannels}]`,
      `\`\`\`Categories: ${categories}\nTextuel: ${textChannels}\nVocale: ${voiceChannels}\nFil: ${threadChannels}\`\`\``,
      false
    )
    .addField("<:point:955639055511601152>Verification", `\`\`\`${verificationLevel}\`\`\``, true)
    .addField("<:point:955639055511601152>Boosts", `\`\`\`${guild.premiumSubscriptionCount}\`\`\``, true)
   // .addField(
    //  `Server Created `\${guild.createdAt.toUTCString().substr(0, 16)} (${checkDays(guild.createdAt)}), false
 //   );

  if (guild.splashURL) embed.setImage(guild.splashURL);

  return { embeds: [embed] };
};
