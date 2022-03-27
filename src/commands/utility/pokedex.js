const { Command } = require("@src/structures");
const { MessageEmbed, Message, CommandInteraction } = require("discord.js");
const { MESSAGES, EMBED_COLORS } = require("@root/config.js");
const { getJson } = require("@utils/httpUtils");
const { stripIndent } = require("common-tags");

module.exports = class Pokedex extends Command {
  constructor(client) {
    super(client, {
      name: "pokedex",
      description: "voir les informations sur un pokemon",
      category: "UTILITY",
      botPermissions: ["EMBED_LINKS"],
      cooldown: 5,
      command: {
        enabled: true,
        usage: "<pokemon>",
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "pokemon",
            description: "nom du pokemon",
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
    const pokemon = args.join(" ");
    const response = await pokedex(pokemon);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const pokemon = interaction.options.getString("pokemon");
    const response = await pokedex(pokemon);
    await interaction.followUp(response);
  }
};

async function pokedex(pokemon) {
  const response = await getJson(`https://pokeapi.glitch.me/v1/pokemon/${pokemon}`);
  if (response.status === 404) return "```Pokemon introuvable```";
  if (!response.success) return MESSAGES.API_ERROR;

  const json = response.data[0];

  const embed = new MessageEmbed()
    .setTitle(`Pokédex - ${json.name}`)
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setThumbnail(json.sprite)
    .setDescription(
      stripIndent`
            ♢ **ID**: ${json.number}
            ♢ **Nom**: ${json.name}
            ♢ **Capacités**: ${json.species}
            ♢ **Type(s)**: ${json.types}
            ♢ **Capacités(normale)**: ${json.abilities.normal}
            ♢ **Capacités(cacher)**: ${json.abilities.hidden}
            ♢ **Groupe d'Oeuf(s)**: ${json.eggGroups}
            ♢ **Genre**: ${json.gender}
            ♢ **Hauteur**: ${json.height} foot tall
            ♢ **Poids**: ${json.weight}
            ♢ **Stade d'évolution actuel**: ${json.family.evolutionStage}
            ♢ **Evolution**: ${json.family.evolutionLine}
            ♢ **Débutant?**: ${json.starter}
            ♢ **Legendaire?**: ${json.legendary}
            ♢ **Mythique?**: ${json.mythical}
            ♢ **Generation?**: ${json.gen}
            `
    )
    .setFooter({ text: json.description });

  return { embeds: [embed] };
}
