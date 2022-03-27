const { MessageEmbed, Message, CommandInteraction } = require("discord.js");
const { Command } = require("@src/structures");
const { MESSAGES, EMBED_COLORS } = require("@root/config.js");
const { getJson } = require("@utils/httpUtils");
const timestampToDate = require("timestamp-to-date");

module.exports = class CovidCommand extends Command {
  constructor(client) {
    super(client, {
      name: "covid",
      description: "avoir les statistiques covid d'un pays",
      cooldown: 5,
      category: "UTILITY",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        usage: "<pays>",
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "pays",
            description: "nom du pays auquel vous souhaiter voir les statistiques covid",
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
    const country = args.join(" ");
    const response = await getCovid(country);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const country = interaction.options.getString("pays");
    const response = await getCovid(country);
    await interaction.followUp(response);
  }
};

async function getCovid(country) {
  const response = await getJson(`https://disease.sh/v2/countries/${country}`);

  if (response.status === 404) return "```css\nNom du pays spécifier introuvable, recommence Baka!```";
  if (!response.success) return MESSAGES.API_ERROR;
  const { data } = response;

  const mg = timestampToDate(data?.updated, "dd.MM.yyyy at HH:mm");
  const embed = new MessageEmbed()
    .setTitle(`Covid - ${data?.country}`)
    .setThumbnail(data?.countryInfo.flag)
    .setColor(EMBED_COLORS.BOT_EMBED)
    .addField("<:point:955639055511601152> Cas total", data?.cases.toString(), true)
    .addField("<:point:955639055511601152> Cas du jour", data?.todayCases.toString(), true)
    .addField("<:point:955639055511601152> Morts total", data?.deaths.toString(), true)
    .addField("<:point:955639055511601152> Morts du jour", data?.todayDeaths.try {
    	
    } catch (error) {
    	
    }oString(), true)
    .addField("<:point:955639055511601152> Guérris", data?.recovered.toString(), true)
    .addField("<:point:955639055511601152> Active", data?.active.toString(), true)
    .addField("<:point:955639055511601152> État critique", data?.critical.toString(), true)
    .addField("<:point:955639055511601152> Cas par 1 million", data?.casesPerOneMillion.toString(), true)
    .addField("<:point:955639055511601152> Morts par 1 million", data?.deathsPerOneMillion.toString(), true)
    .setFooter({ text: `Dernier mis à jour le ${mg}` });

  return { embeds: [embed] };
}
