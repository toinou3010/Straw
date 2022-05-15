const { Command } = require("@src/structures");
const { Message, CommandInteraction } = require("discord.js");
const { canSendEmbeds } = require("@utils/guildUtils");

module.exports = class ModLog extends Command {
  constructor(client) {
    super(client, {
      name: "modlog",
      description: "activer ou désactiver les journaux de modération ",
      category: "ADMIN",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        usage: "<#salon|off>",
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        ephemeral: true,
        options: [
          {
            name: "salon",
            description: "salon pour envoyer des journaux de moderation",
            required: false,
            type: "CHANNEL",
            channelTypes: ["GUILD_TEXT"],
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
    const input = args[0].toLowerCase();
    let targetChannel;

    if (input === "acun" || input === "off" || input === "desactive") targetChannel = null;
    else {
      if (message.mentions.channels.size === 0) return message.reply("Utilisation incorrecte de la commande");
      targetChannel = message.mentions.channels.first();
    }

    const response = await setChannel(targetChannel, data.settings);
    return message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   * @param {object} data
   */
  async interactionRun(interaction, data) {
    const response = await setChannel(interaction.options.getChannel("salon"), data.settings);
    return interaction.followUp(response);
  }
};

async function setChannel(targetChannel, settings) {
  if (targetChannel) {
    if (!canSendEmbeds(targetChannel))
      return "Pouah! Je ne peux pas envoyer de journaux à ce canal ? J'ai besoin des autorisations `Write Messages` et `Embed Links` dans ce canal ";
  }

  settings.modlog_channel = targetChannel?.id;
  await settings.save();
  return `Configuration enregistrée ! Chaîne Modlog ${targetChannel ? "mis à jour" : "retirer"}`;
}
