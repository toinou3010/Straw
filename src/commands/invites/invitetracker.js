const { Command } = require("@src/structures");
const { cacheGuildInvites } = require("@src/handlers/invite");
const { Message, CommandInteraction } = require("discord.js");

module.exports = class InviteTracker extends Command {
  constructor(client) {
    super(client, {
      name: "invitetracker",
      description: "activer ou désactiver le suivi des invitations sur le serveur ",
      category: "INVITE",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        aliases: ["invitetracking"],
        usage: "<ON|OFF>",
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "statut",
            description: "état de la configuration ",
            required: true,
            type: "STRING",
            choices: [
              {
                name: "ON",
                value: "ON",
              },
              {
                name: "OFF",
                value: "OFF",
              },
            ],
          },
        ],
      },
    });
  }

  /**
   * @param {Message} message
   * @param {string[]} args
   * @param {object} data
   */
  async messageRun(message, args, data) {
    const status = args[0].toLowerCase();
    if (!["on", "off"].includes(status)) return message.reply("Statut invalide. La valeur doit être `on/off`");
    const response = await setStatus(message, status, data.settings);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   * @param {object} data
   */
  async interactionRun(interaction, data) {
    const status = interaction.options.getString("statut");
    const response = await setStatus(interaction, status, data.settings);
    await interaction.followUp(response);
  }
};

async function setStatus({ guild }, input, settings) {
  const status = input.toUpperCase() === "ON" ? true : false;

  if (status) {
    if (!guild.me.permissions.has(["MANAGE_GUILD", "MANAGE_CHANNELS"])) {
      return "Oups! Il me manque l'autorisation `Gérer le serveur`, `Gérer les salons` !\nJe ne peux pas suivre les invitations ";
    }

    const channelMissing = guild.channels.cache
      .filter((ch) => ch.type === "GUILD_TEXT" && !ch.permissionsFor(guild.me).has("MANAGE_CHANNELS"))
      .map((ch) => ch.name);

    if (channelMissing.length > 1) {
      return `Je ne suis peut-être pas en mesure de suivre correctement les invitations\nIl me manque l'autorisation \`Gérer le salon\` dans le salon suivant  \`\`\`${channelMissing.join(
        ", "
      )}\`\`\``;
    }

    await cacheGuildInvites(guild);
  } else {
    guild.client.inviteCache.delete(guild.id);
  }

  settings.invite.tracking = status;
  await settings.save();

  return `Configuration enregistrée ! Le suivi des invitations est maintenant ${status ? "activé" : "desactivé"}`;
}
