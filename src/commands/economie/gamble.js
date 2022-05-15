const { Command } = require("@src/structures");
const { MessageEmbed, Message, CommandInteraction } = require("discord.js");
const { getUser } = require("@schemas/User");
const { EMBED_COLORS, ECONOMY } = require("@root/config.js");
const { getRandomInt } = require("@utils/miscUtils");

module.exports = class Gamble extends Command {
  constructor(client) {
    super(client, {
      name: "gamble",
      description: "tentez votre chance en jouant ",
      category: "ECONOMY",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        usage: "<montant>",
        minArgsCount: 1,
        aliases: ["slot"],
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "pieces",
            description: "nombre de pièces à miser ",
            required: true,
            type: "INTEGER",
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
    const betAmount = parseInt(args[0]);
    if (isNaN(betAmount)) return message.reply("Le montant du pari doit être un nombre valide ");
    const response = await gamble(message.author, betAmount);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const betAmount = interaction.options.getInteger("pieces");
    const response = await gamble(interaction.user, betAmount);
    await interaction.followUp(response);
  }
};

function getEmoji() {
  const ran = getRandomInt(9);
  switch (ran) {
    case 1:
      return "\uD83C\uDF52";
    case 2:
      return "\uD83C\uDF4C";
    case 3:
      return "\uD83C\uDF51";
    case 4:
      return "\uD83C\uDF45";
    case 5:
      return "\uD83C\uDF49";
    case 6:
      return "\uD83C\uDF47";
    case 7:
      return "\uD83C\uDF53";
    case 8:
      return "\uD83C\uDF50";
    case 9:
      return "\uD83C\uDF4D";
    default:
      return "\uD83C\uDF52";
  }
}

function calculateReward(amount, var1, var2, var3) {
  if (var1 === var2 && var2.equals === var3) return 3 * amount;
  if (var1 === var2 || var2 === var3 || var1 === var3) return 2 * amount;
  return 0;
}

async function gamble(user, betAmount) {
  if (isNaN(betAmount)) return "Le montant du pari doit être un nombre valide ";
  if (betAmount < 0) return "Le montant du pari ne peut pas être négatif ";
  if (betAmount < 10) return "Le montant du pari ne peut pas être inférieur à 10 ";

  const userDb = await getUser(user.id);
  if (userDb.coins < betAmount)
    return `Vous n'avez pas assez de pièces pour jouer !\n**Solde en pièces :** ${userDb.coins || 0}${ECONOMY.CURRENCY}`;

  const slot1 = getEmoji();
  const slot2 = getEmoji();
  const slot3 = getEmoji();

  const str = `
    **Montant du pari :** ${betAmount}${ECONOMY.CURRENCY}
    **Multiplicateur :** 2x
    ╔══════════╗
    ║ ${getEmoji()} ║ ${getEmoji()} ║ ${getEmoji()} ‎‎‎‎║
    ╠══════════╣
    ║ ${slot1} ║ ${slot2} ║ ${slot3} ⟸
    ╠══════════╣
    ║ ${getEmoji()} ║ ${getEmoji()} ║ ${getEmoji()} ║
    ╚══════════╝
    `;

  const reward = calculateReward(betAmount, slot1, slot2, slot3);
  const result = (reward > 0 ? `Tu as gagné : ${reward}` : `Tu as perdu : ${betAmount}`) + ECONOMY.CURRENCY;
  const balance = reward - betAmount;

  userDb.coins += balance;
  await userDb.save();

  const embed = new MessageEmbed()
    .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
    .setColor(EMBED_COLORS.TRANSPARENT)
    .setThumbnail("")
    .setDescription(str)
    .setFooter({ text: `${result}\nSolde mis à jour : ${userDb?.coins}${ECONOMY.CURRENCY}` });

  return { embeds: [embed] };
}
