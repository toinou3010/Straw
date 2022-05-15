const { Command } = require("@src/structures");
const { Message, CommandInteraction } = require("discord.js");
const { musicValidations } = require("@utils/botUtils");

module.exports = class Loop extends Command {
  constructor(client) {
    super(client, {
      name: "loop",
      description: "met en boucle le morceau ou la file d'attente",
      category: "MUSIC",
      validations: musicValidations,
      command: {
        enabled: true,
        minArgsCount: 1,
        usage: "<liste|piste>",
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "type",
            type: "STRING",
            description: "The entity you want to loop",
            required: false,
            choices: [
              {
                name: "queue",
                value: "queue",
              },
              {
                name: "track",
                value: "track",
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
    const input = args[0].toLowerCase();
    const type = input === "liste" ? "liste" : "piste";
    const response = toggleLoop(message, type);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const type = interaction.options.getString("type") || "piste";
    const response = toggleLoop(interaction, type);
    await interaction.followUp(response);
  }
};

function toggleLoop({ client, guildId }, type) {
  const player = client.musicManager.get(guildId);

  // track
  if (type === "piste") {
    player.setTrackRepeat(!player.trackRepeat);
    return `Piste en boucle ${player.trackRepeat ? "activer" : "désactiver"}`;
  }

  // queue
  else if (type === "liste") {
    player.setQueueRepeat(!player.queueRepeat);
    return `Liste en boucle ${player.queueRepeat ? "activer" : "désactiver"}`;
  }
}
