const { Command } = require("@src/structures");
const { Message, CommandInteraction } = require("discord.js");
const { musicValidations } = require("@utils/botUtils");

module.exports = class Resume extends Command {
  constructor(client) {
    super(client, {
      name: "resume",
      description: "résumé une musique en pause",
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
    const response = resumePlayer(message);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const response = resumePlayer(interaction);
    await interaction.followUp(response);
  }
};

function resumePlayer({ client, guildId }) {
  const player = client.musicManager.get(guildId);
  if (!player.paused) return "Musique déjà remis en cours";
  player.pause(false);
  return "Musique remis en cours";
}
