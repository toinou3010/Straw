const { MessageEmbed, Message, CommandInteraction } = require("discord.js");
const { Command } = require("@src/structures");
const { EMBED_COLORS } = require("@root/config.js");
const { translate } = require("@utils/httpUtils");
const { GOOGLE_TRANSLATE } = require("@src/data.json");

// Discord limits to a maximum of 25 choices for slash command
// Add any 25 language codes from here: https://cloud.google.com/translate/docs/languages

const choices = ["ar", "cs", "de", "en", "fa", "fr", "hi", "hr", "it", "ja", "ko", "la", "nl", "pl", "ta", "te"];

module.exports = class TranslateCommand extends Command {
  constructor(client) {
    super(client, {
      name: "traduire",
      description: "translate from one language to other",
      cooldown: 20,
      category: "UTILITY",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        aliases: ["translate"],
        usage: "<iso-code> <message>",
        minArgsCount: 2,
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "language",
            description: "language de traduction",
            type: "STRING",
            required: true,
            choices: choices.map((choice) => ({ name: GOOGLE_TRANSLATE[choice], value: choice })),
          },
          {
            name: "texte",
            description: "texte a traduire",
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
    let embed = new MessageEmbed();
    const outputCode = args.shift();

    if (!GOOGLE_TRANSLATE[outputCode]) {
      embed
        .setColor(EMBED_COLORS.WARNING)
        .setDescription(
          "Code de traduction non valide. Visitez [ici](https://cloud.google.com/translate/docs/languages) pour consulter la liste des codes de traduction pris en charge."
        );
      return message.reply({ embeds: [embed] });
    }

    const input = args.join(" ");
    if (!input) message.reply("Fournir un texte de traduction valide");

    const response = await getTranslation(message.author, input, outputCode);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const outputCode = interaction.options.getString("language");
    const input = interaction.options.getString("texte");
    const response = await getTranslation(interaction.user, input, outputCode);
    await interaction.followUp(response);
  }
};

async function getTranslation(author, input, outputCode) {
  const data = await translate(input, outputCode);
  if (!data) return "Échec de la traduction de votre texte";

  const embed = new MessageEmbed()
    .setAuthor({
      name: `${author.username} à dit`,
      iconURL: author.avatarURL(),
    })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(data.output)
    .setFooter({ text: `${data.inputLang} (${data.inputCode}) ⟶ ${data.outputLang} (${data.outputCode})` });

  return { embeds: [embed] };
}
