const { Command } = require("@src/structures");
const { Message, CommandInteraction } = require("discord.js");
const { musicValidations } = require("@utils/botUtils");

module.exports = class Volume extends Command {
  constructor(client) {
    super(client, {
      name: "volume",
      description: "régler le volume du lecteur de musique ",
      category: "MUSIC",
      validations: musicValidations,
      command: {
        enabled: true,
        usage: "<1-100>",
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "montant",
            description: "Entrez une valeur pour définir [0 à 100] ",
            type: "INTEGER",
            required: false,
          },
        ],
      },
    });
  }

  /**
   * @param {Message} message
   * @param {string[]} args
   */
  async messageRun(message, args) {
    const amount = args[0];
    const response = volume(message, amount);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const amount = interaction.options.getInteger("montant");
    const response = volume(interaction, amount);
    await interaction.followUp(response);
  }
};

function volume({ client, guildId }, volume) {
  const player = client.musicManager.get(guildId);

  if (!volume) return `> Le volume du lecteur est \`${player.volume}\`.`;
  if (volume < 1 || volume > 100) return "vous devez me donner un volume entre 1 et 100. ";

  player.setVolume(volume);
  return `Le volume du lecteur de musique est réglé sur  \`${volume}\`.`;
}
