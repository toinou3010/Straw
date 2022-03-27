const { Command } = require("@src/structures");
const { Message, CommandInteraction } = require("discord.js");
const { musicValidations } = require("@utils/botUtils");

const levels = {
  aucune: 0.0,
  faible: 0.1,
  moyen: 0.15,
  fort: 0.25,
};

module.exports = class Bassboost extends Command {
  constructor(client) {
    super(client, {
      name: "bassboost",
      description: "niveau baassboost",
      category: "MUSIC",
      validations: musicValidations,
      command: {
        enabled: true,
        minArgsCount: 1,
        usage: "<aucune|faible|moyen|fort>",
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "level",
            description: "bassboost level",
            type: "STRING",
            required: true,
            choices: [
              {
                name: "none",
                value: "none",
              },
              {
                name: "low",
                value: "low",
              },
              {
                name: "medium",
                value: "medium",
              },
              {
                name: "high",
                value: "high",
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
   */
  async messageRun(message, args) {
    let level = "aucune";
    if (args.length && args[0].toLowerCase() in levels) level = args[0].toLowerCase();
    const response = setBassBoost(message, level);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    let level = interaction.options.getString("level");
    const response = setBassBoost(interaction, level);
    await interaction.followUp(response);
  }
};

function setBassBoost({ client, guildId }, level) {
  const player = client.musicManager.get(guildId);
  const bands = new Array(3).fill(null).map((_, i) => ({ band: i, gain: levels[level] }));
  player.setEQ(...bands);
  return `> Réglez le niveau de bassboost sur \`${level}\``;
}
