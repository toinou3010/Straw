const { Command } = require("@src/structures");
const { Message, CommandInteraction } = require("discord.js");

module.exports = class SetPrefix extends Command {
  constructor(client) {
    super(client, {
      name: "setprefix",
      description: "définit un nouveau préfixe pour ce serveur",
      category: "ADMIN",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        usage: "<prefix>",
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        ephemeral: true,
        options: [
          {
            name: "prefix",
            description: "le nouveau préfixe à définir ",
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
   * @param {object} data
   */
  async messageRun(message, args, data) {
    const newPrefix = args[0];
    const response = await setNewPrefix(newPrefix, data.settings);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   * @param {object} data
   */
  async interactionRun(interaction, data) {
    const response = await setNewPrefix(interaction.options.getString("prefix"), data.settings);
    await interaction.followUp(response);
  }
};

async function setNewPrefix(newPrefix, settings) {
  if (newPrefix.length > 2) return "La longueur du préfixe ne peut pas dépasser '2' caractères ";
  settings.prefix = newPrefix;
  await settings.save();

  return `Le nouveau préfixe est défini sur \`${newPrefix}\``;
}
