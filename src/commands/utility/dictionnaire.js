const { Command } = require("@src/structures");
const { MessageEmbed, Message, CommandInteraction } = require("discord.js");
const { MESSAGES, EMBED_COLORS } = require("@root/config.js");
const { getJson } = require("@utils/httpUtils");
const moment = require("moment");

module.exports = class UrbanCommand extends Command {
  constructor(client) {
    super(client, {
      name: "dictionnaire",
      description: "rechercher dans le dictionnaire",
      cooldown: 5,
      category: "UTILITY",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        usage: "<mot>",
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "mots",
            description: "le mot à chercher",
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
    const word = args.join(" ");
    const response = await urban(word);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const word = interaction.options.getString("mots");
    const response = await urban(word);
    await interaction.followUp(response);
  }
};

async function urban(word) {
  const response = await getJson(`http://api.urbandictionary.com/v0/define?term=${word}`);
  if (!response.success) return MESSAGES.API_ERROR;

  const json = response.data;
  if (!json.list[0]) return `Rien de trouver pour \`${word}\``;

  const data = json.list[0];
  const embed = new MessageEmbed()
    .setTitle(data.word)
    .setURL(data.permalink)
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(`**Définition de**\`\`\`css\n${data.definition}\`\`\``)
    .addField("Auteur", data.author, true)
    .addField("ID", data.defid.toString(), true)
    .addField("Likes / Dislikes", `👍 ${data.thumbs_up} | 👎 ${data.thumbs_down}`, true)
    .addField("Exemple", data.example, false)
    .setFooter({ text: `Créer le ${moment(data.written_on).fromNow()}` });

  return { embeds: [embed] };
}
