const { Command } = require("@src/structures");
const { Message, CommandInteraction } = require("discord.js");

module.exports = class XPSystem extends Command {
  constructor(client) {
    super(client, {
      name: "xpsystem",
      description: "activer ou désactiver le système de classement XP sur le serveur ",
      category: "ADMIN",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        aliases: ["xpsystem", "xptracking"],
        usage: "<on|off>",
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        ephemeral: true,
        options: [
          {
            name: "statut",
            description: "activé ou désactivé ",
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
    const input = args[0].toLowerCase();
    if (!["on", "off"].includes(input)) return message.reply("Statut invalide. La valeur doit être `on/off`");
    const response = await setStatus(input, data.settings);
    return message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   * @param {object} data
   */
  async interactionRun(interaction, data) {
    const response = await setStatus(interaction.options.getString("statut"), data.settings);
    await interaction.followUp(response);
  }
};

async function setStatus(input, settings) {
  const status = input.toLowerCase() === "on" ? true : false;

  settings.ranking.enabled = status;
  await settings.save();

  return `Configuration enregistrée ! Le système XP est maintenant ${status ? "activée" : "desactivée"}`;
}