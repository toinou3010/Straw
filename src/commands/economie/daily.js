const { Command } = require("@src/structures");
const { MessageEmbed, Message, CommandInteraction } = require("discord.js");
const { getUser } = require("@schemas/User");
const { EMBED_COLORS, ECONOMY } = require("@root/config.js");
const { diffHours, getRemainingTime } = require("@utils/miscUtils");

module.exports = class DailyCommand extends Command {
  constructor(client) {
    super(client, {
      name: "daily",
      description: "recevoir un bonus quotidien ",
      category: "ECONOMY",
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
  async messageRun(message, args) {
    const response = await daily(message.author);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const response = await daily(interaction.user);
    await interaction.followUp(response);
  }
};

async function daily(user) {
  const userDb = await getUser(user.id);
  let streak = 0;

  if (userDb.daily.timestamp) {
    const lastUpdated = new Date(userDb.daily.timestamp);
    const difference = diffHours(new Date(), lastUpdated);
    if (difference < 24) {
      const nextUsage = lastUpdated.setHours(lastUpdated.getHours() + 24);
      return `Vous pouvez à nouveau exécuter cette commande dans  \`${getRemainingTime(nextUsage)}\``;
    }
    streak = userDb.daily.streak || streak;
    if (difference < 48) streak += 1;
    else streak = 0;
  }

  userDb.daily.streak = streak;
  userDb.coins += ECONOMY.DAILY_COINS;
  userDb.daily.timestamp = new Date();
  await userDb.save();

  const embed = new MessageEmbed()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
    .setDescription(
      `Vous avez reçu ${ECONOMY.DAILY_COINS}${ECONOMY.CURRENCY} comme récompense quotidienne \n` +
        `**Solde mis à jour :** ${userDb.coins}${ECONOMY.CURRENCY}`
    );

  return { embeds: [embed] };
}
