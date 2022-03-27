const { Command } = require("@src/structures");
const { Message, CommandInteraction } = require("discord.js");
const { musicValidations } = require("@utils/botUtils");

module.exports = class Pause extends Command {
  constructor(client) {
    super(client, {
      name: "pause",
      description: "mettre en pause une musique",
      category: "MUSIC",
      validations: musicValidations,
      command: {
        enabled: true,
      },
      slashCommand: {
        enabled: true,
      },
    });
  }

  /**
   * @param {Message} message
   * @param {string[]} args
   */
  async messageRun(message, args) {
    const response = pause(message);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const response = pause(interaction);
    await interaction.followUp(response);
  }
};

function pause({ client, guildId }) {
  const player = client.musicManager.get(guildId);
  if (player.paused) return "La musique est déjà en pause.";

  player.pause(true);
  return "Musique mis en pause.";
}
