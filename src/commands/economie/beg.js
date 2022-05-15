const { Command } = require("@src/structures");
const { MessageEmbed, Message, CommandInteraction } = require("discord.js");
const { getUser } = require("@schemas/User");
const { EMBED_COLORS, ECONOMY } = require("@root/config.js");

module.exports = class BegCommand extends Command {
  constructor(client) {
    super(client, {
      name: "beg",
      description: "mendier à quelqu'un ",
      category: "ECONOMY",
      cooldown: 21600,
      botPermissions: ["EMBED_LINKS"],
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
  async messageRun(message) {
    const response = await beg(message.author);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const response = await beg(interaction.user);
    await interaction.followUp(response);
  }
};

async function beg(user) {
  let users = [
    "Becky Blackbell",
    "Franky",
    "Bond Forger",
    "Yor Forger",
    "Anya Forger",
    "Loid Forger",
  ];

  let amount = Math.floor(Math.random() * `${ECONOMY.MAX_BEG_AMOUNT}` + `${ECONOMY.MIN_BEG_AMOUNT}`);
  const userDb = await getUser(user.id);
  userDb.coins += amount;
  await userDb.save();

  const embed = new MessageEmbed()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: `${user.username}`, iconURL: user.displayAvatarURL() })
    .setDescription(
      `**${users[Math.floor(Math.random() * users.length)]}** vous a fait don de **${amount}** ${ECONOMY.CURRENCY}\n` +
        `**Solde mis à jour :** **${userDb.coins}** ${ECONOMY.CURRENCY}`
    );

  return { embeds: [embed] };
}
