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
  desc += `❒ Total serveur: ${guilds}\n`;
  desc += `❒ Total utilisateurs: ${users}\n`;
  desc += `❒ Total salons: ${channels}\n`;
  desc += `❒ Ping: ${client.ws.ping} ms\n`;
  desc += "\n";

  const embed = new MessageEmbed()
    .setTitle("Straw Informations")
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setThumbnail(client.user.displayAvatarURL())
    .setDescription(desc)
    .addField(
      "CPU:",
      stripIndent`
        <:point:955639055511601152>**OS:** ${platform} [${architecture}]
        <:point:955639055511601152>**Coeurs:** ${cores}
        <:point:955639055511601152>**Utilisation:** ${cpuUsage}
        `,
      true
    )
    .addField(
      "RAM Bot:",
      stripIndent`
        <:point:955639055511601152>**Utilisé:** ${botUsed}
        <:point:955639055511601152>**Disponible:** ${botAvailable}
        <:point:955639055511601152>**Utilisation:** ${botUsage}
        `,
      true
    )
    .addField(
      "RAM Total:",
      stripIndent`
      <:point:955639055511601152>**Utilisé:** ${overallUsed}
      <:point:955639055511601152>**Disponible:** ${overallAvailable}
      <:point:955639055511601152>**Utilisation:** ${overallUsage}
      `,
      true
    )
    .addField("Node Js", process.versions.node, false)
    .addField("En ligne depuis", "```" + timeformat(process.uptime()) + "```", false);

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
