const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { postToBin } = require("@utils/httpUtils");
const { EMBED_COLORS } = require("@root/config.js");
const { getSettings } = require("@schemas/Guild");
const { sendMessage, safeDM } = require("@utils/botUtils");
const { error } = require("@src/helpers/logger");

const OPEN_PERMS = ["MANAGE_CHANNELS"];
const CLOSE_PERMS = ["MANAGE_CHANNELS", "READ_MESSAGE_HISTORY"];

/**
 * @param {import('discord.js').Channel} channel
 */
function isTicketChannel(channel) {
  return (
    channel.type === "GUILD_TEXT" &&
    channel.name.startsWith("tіcket-") &&
    channel.topic &&
    channel.topic.startsWith("tіcket|")
  );
}

/**
 * @param {import('discord.js').Guild} guild
 */
function getTicketChannels(guild) {
  return guild.channels.cache.filter((ch) => isTicketChannel(ch));
}

/**
 * @param {import('discord.js').Guild} guild
 * @param {string} userId
 */
function getExistingTicketChannel(guild, userId) {
  const tktChannels = getTicketChannels(guild);
  return tktChannels.filter((ch) => ch.topic.split("|")[1] === userId).first();
}

/**
 * @param {import('discord.js').BaseGuildTextChannel} channel
 */
async function parseTicketDetails(channel) {
  if (!channel.topic) return;
  const split = channel.topic?.split("|");
  const userId = split[1];
  const title = split[2];
  const user = await channel.client.users.fetch(userId, { cache: false }).catch(() => {});
  return { title, user };
}

/**
 * @param {import('discord.js').BaseGuildTextChannel} channel
 * @param {import('discord.js').User} closedBy
 * @param {string} [reason]
 */
async function closeTicket(channel, closedBy, reason) {
  if (!channel.deletable || !channel.permissionsFor(channel.guild.me).has(CLOSE_PERMS)) {
    return "MISSING_PERMISSIONS";
  }

  try {
    const config = await getSettings(channel.guild);
    const messages = await channel.messages.fetch();
    const reversed = Array.from(messages.values()).reverse();

    let content = "";
    reversed.forEach((m) => {
      content += `[${new Date(m.createdAt).toLocaleString("fr-FR")}] - ${m.author.tag}\n`;
      if (m.cleanContent !== "") content += `${m.cleanContent}\n`;
      if (m.attachments.size > 0) content += `${m.attachments.map((att) => att.proxyURL).join(", ")}\n`;
      content += "\n";
    });

    const logsUrl = await postToBin(content, `Logs Ticket pour  ${channel.name}`);
    const ticketDetails = await parseTicketDetails(channel);

    const components = [];
    if (logsUrl) {
      components.push(
        new MessageActionRow().addComponents(
          new MessageButton().setLabel("Transcription").setURL(logsUrl.short).setStyle("LINK")
        )
      );
    }

    if (channel.deletable) await channel.delete();

    const embed = new MessageEmbed().setAuthor({ name: "Ticket Fermer" }).setColor(EMBED_COLORS.TICKET_CLOSE);
    if (reason) embed.addField("Raison", reason, false);
    embed
      .setDescription(`**Titre:** ${ticketDetails.title}`)
      .addField("Ouvert par", ticketDetails.user ? ticketDetails.user.tag : "Utilisateur partis", true)
      .addField("Fermer par", closedBy ? closedBy.tag : "Utilisateur partis", true);

    // send embed to log channel
    if (config.ticket.log_channel) {
      const logChannel = channel.guild.channels.cache.get(config.ticket.log_channel);
      sendMessage(logChannel, { embeds: [embed], components });
    }

    // send embed to user
    if (ticketDetails.user) {
      const dmEmbed = embed
        .setDescription(`**Serveur:** ${channel.guild.name}\n**Titre:** ${ticketDetails.title}`)
        .setThumbnail(channel.guild.iconURL());
      safeDM(ticketDetails.user, { embeds: [dmEmbed], components });
    }

    return "SUCCESS";
  } catch (ex) {
    error("closeTicket", ex);
    return "ERROR";
  }
}

/**
 * @param {import('discord.js').Guild} guild
 * @param {import('discord.js').User} author
 */
async function closeAllTickets(guild, author) {
  const channels = getTicketChannels(guild);
  let success = 0;
  let failed = 0;

  channels.forEach(async (ch) => {
    const status = await closeTicket(ch, author, "Forcer la fermeture de tout les tickets");
    if (status.success) success += 1;
    else failed += 1;
  });

  return [success, failed];
}

/**
 * @param {import('discord.js').Guild} guild
 * @param {import('discord.js').User} user
 * @param {Object} config
 */
async function openTicket(guild, user, config) {
  if (!guild.me.permissions.has(OPEN_PERMS)) return "MISSING_PERMISSIONS";

  const alreadyExists = getExistingTicketChannel(guild, user.id);
  if (alreadyExists) return "ALREADY_EXISTS";

  const settings = await getSettings(guild);
  const existing = getTicketChannels(guild).size;
  if (existing > settings.ticket.limit) return "TOO_MANY_TICKETS";

  try {
    const ticketNumber = (existing + 1).toString();
    const permissionOverwrites = [
      {
        id: guild.roles.everyone,
        deny: ["VIEW_CHANNEL"],
      },
      {
        id: user.id,
        allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY"],
      },
      {
        id: guild.me.roles.highest.id,
        allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY"],
      },
    ];

    if (config.support_roles.length > 0) {
      config.support_roles.forEach((role) => {
        permissionOverwrites.push({
          id: role,
          allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY"],
        });
      });
    }

    const tktChannel = await guild.channels.create(`tіcket-${ticketNumber}`, {
      type: "GUILD_TEXT",
      topic: `tіcket|${user.id}|${config.title}`,
      permissionOverwrites,
    });

    const embed = new MessageEmbed()
      .setAuthor({ name: `Ticket #${ticketNumber}` })
      .setDescription(
        `Salut, ${user.toString()}\nL'assistance va bientôt vous contacter, vous pouvais prendre un café pour passer le temps\n\n**Raison du ticket:**\n${config.title}`
      )

    let buttonsRow = new MessageActionRow().addComponents(
      new MessageButton().setLabel("Fermer").setCustomId("TICKET_CLOSE").setEmoji("❌").setStyle("PRIMARY")
    );

    const sent = await sendMessage(tktChannel, { content: user.toString(), embeds: [embed], components: [buttonsRow] });

    const dmEmbed = new MessageEmbed()
      .setColor(EMBED_COLORS.TICKET_CREATE)
      .setAuthor({ name: "Ticket Créer" })
      .setThumbnail(guild.iconURL())
      .setDescription(`**Serveur:** ${guild.name}\n**Titre:** ${config.title}`);

    const row = new MessageActionRow().addComponents(
      new MessageButton().setLabel("Voir le salon").setURL(sent.url).setStyle("LINK")
    );

    safeDM(user, { embeds: [dmEmbed], components: [row] });

    return "SUCCESS";
  } catch (ex) {
    error("openTicket", ex);
    return "FAILED";
  }
}

module.exports = {
  getTicketChannels,
  getExistingTicketChannel,
  isTicketChannel,
  closeTicket,
  closeAllTickets,
  openTicket,
};
