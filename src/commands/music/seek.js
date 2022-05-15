const { Command } = require("@src/structures");
const { Message, CommandInteraction } = require("discord.js");
const { musicValidations } = require("@utils/botUtils");
const prettyMs = require("pretty-ms");
const { durationToMillis } = require("@utils/miscUtils");

module.exports = class Seek extends Command {
  constructor(client) {
    super(client, {
      name: "seek",
      description: "définit la position de la piste de lecture à la position spécifiée ",
      category: "MUSIC",
      validations: musicValidations,
      command: {
        enabled: true,
        usage: "<duration>",
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "temp",
            description: "Le temps que vous voulez chercher. ",
            type: "STRING",
            required: true,
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
    const time = args.join(" ");
    const response = seekTo(message, time);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const time = interaction.options.getString("temp");
    const response = seekTo(interaction, time);
    await interaction.followUp(response);
  }
};

function seekTo({ client, guildId }, time) {
  const player = client.musicManager?.get(guildId);
  const seekTo = durationToMillis(time);

  if (seekTo > player.queue.current.duration) {
    return "La durée que vous fournissez dépasse la durée de la piste actuelle ";
  }

  player.seek(seekTo);
  return `A cherché à  ${prettyMs(seekTo, { colonNotation: true, secondsDecimalDigits: 0 })}`;
}
