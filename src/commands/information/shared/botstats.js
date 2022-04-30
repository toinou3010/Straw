const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { EMBED_COLORS, SUPPORT_SERVER, DASHBOARD } = require("@root/config");
const { timeformat } = require("@utils/miscUtils");
const os = require("os");
const { stripIndent } = require("common-tags");

module.exports = (client) => {
  // STATS
  const guilds = client.guilds.cache.size;
  const channels = client.channels.cache.size;
  const users = client.guilds.cache.reduce((size, g) => size + g.memberCount, 0);

  // CPU
  const platform = process.platform.replace(/win32/g, "Windows");
  const architecture = os.arch();
  const cores = os.cpus().length;
  const cpuUsage = `${(process.cpuUsage().user / 1024 / 1024).toFixed(2)} MB`;

  // RAM
  const botUsed = `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`;
  const botAvailable = `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`;
  const botUsage = `${((process.memoryUsage().heapUsed / os.totalmem()) * 100).toFixed(1)}%`;

  const overallUsed = `${((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(2)} GB`;
  const overallAvailable = `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`;
  const overallUsage = `${Math.floor(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)}%`;

  let desc = "";
  desc += `<:parapluie:963279429864419380> Total serveur: ${guilds}\n`;
  desc += `<:parapluie:963279429864419380> Total utilisateurs: ${users}\n`;
  desc += `<:parapluie:963279429864419380> Total salons: ${channels}\n`;
  desc += `<:wifi:963572473994031154> Ping: ${client.ws.ping} ms\n`;
  desc += "\n";

  const embed = new MessageEmbed()
    .setTitle("Straw Informations")
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setThumbnail(client.user.displayAvatarURL())
    .setDescription(desc)
    .addField(
      "<:processeur:963279496411250689> CPU:",
      stripIndent`
        <:fleche:963265299992444998> **OS:** ${platform} [${architecture}]
        <:fleche:963265299992444998> **Coeurs:** ${cores}
        <:fleche:963265299992444998> **Utilisation:** ${cpuUsage}
        `,
      true
    )
    .addField(
      "<:stats:963567717611339897> RAM Bot:",
      stripIndent`
        <:fleche:963265299992444998> **Utilisé:** ${botUsed}
        <:fleche:963265299992444998> **Disponible:** ${botAvailable}
        <:fleche:963265299992444998> **Utilisation:** ${botUsage}
        `,
      true
    )
    .addField(
      "<:stats:963567717611339897> RAM Total:",
      stripIndent`
      <:fleche:963265299992444998> **Utilisé:** ${overallUsed}
      <:fleche:963265299992444998> **Disponible:** ${overallAvailable}
      <:fleche:963265299992444998> **Utilisation:** ${overallUsage}
      `,
      true
    )
    .addField("<:javascript:963571763357298729> Node Js", process.versions.node, false)
    .addField("<:horloge:963571834547208232> En ligne depuis", "```" + timeformat(process.uptime()) + "```", false);

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
