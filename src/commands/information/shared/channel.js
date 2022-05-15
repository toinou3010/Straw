const { MessageEmbed } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");
const { stripIndent } = require("common-tags");

const channelTypes = {
  GUILD_TEXT: "Textuel",
  GUILD_PUBLIC_THREAD: "Fil de discussion public ",
  GUILD_PRIVATE_THREAD: "Fil privé ",
  GUILD_NEWS: "Nouvelles ",
  GUILD_NEWS_THREAD: "Fil d'actualité ",
  GUILD_VOICE: "Vocale",
  GUILD_STAGE_VOICE: "Stage",
};

module.exports = (channel) => {
  const { id, name, topic, parent, position, type } = channel;

  let desc = stripIndent`
    ❯ ID : **${id}**
    ❯ Nom : **${name}**
    ❯ Type : **${channelTypes[type] || type}**
    ❯ Catégorie : **${parent || "NA"}**
    ❯ Sujet : **${topic || "Aucun sujet défini "}**\n
    `;

  if (type === "GUILD_TEXT") {
    const { rateLimitPerUser, nsfw } = channel;
    desc += stripIndent`
      ❯ Position : **${position}**
      ❯ Mode lent : **${rateLimitPerUser}**
      ❯ est NSFW : **${nsfw ? "✓" : "✕"}**
      `;
  }

  if (type === "GUILD_PUBLIC_THREAD" || type === "GUILD_PRIVATE_THREAD") {
    const { ownerId, archived, locked } = channel;
    desc += stripIndent`
      ❯ Identifiant du propriétaire : **${ownerId}**
      ❯ Est archivé : **${archived ? "✓" : "✕"}**
      ❯ Est verrouillé : **${locked ? "✓" : "✕"}**
      `;
  }

  if (type === "GUILD_NEWS" || type === "GUILD_NEWS_THREAD") {
    const { nsfw } = channel;
    desc += stripIndent`
      ❯ est NSFW : **${nsfw ? "✓" : "✕"}**
      `;
  }

  if (type === "GUILD_VOICE" || type === "GUILD_STAGE_VOICE ") {
    const { bitrate, userLimit, full } = channel;
    desc += stripIndent`
      ❯ Position: **${position}**
      ❯ Débit : **${bitrate}**
      ❯ Limite d'utilisateurs : **${userLimit}**
      ❯ est rempli : **${full ? "✓" : "✕"}**
      `;
  }

  const embed = new MessageEmbed()
    .setAuthor({ name: "Détails de la chaîne " })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(desc);

  return { embeds: [embed] };
};
