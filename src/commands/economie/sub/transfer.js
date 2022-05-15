const { MessageEmbed } = require("discord.js");
const { getUser } = require("@schemas/User");
const { ECONOMY, EMBED_COLORS } = require("@root/config");

module.exports = async (self, target, coins) => {
  if (isNaN(coins) || coins <= 0) return "Veuillez entrer un nombre valide de pièces à transférer ";
  if (target.bot) return "Vous ne pouvez pas transférer de pièces aux bots !";
  if (target.id === self.id) return "Vous ne pouvez pas transférer de pièces à vous-même !";

  const userDb = await getUser(self.id);

  if (userDb.bank < coins) {
    return `Solde bancaire insuffisant ! Vous n'avez que  ${userDb.bank}${ECONOMY.CURRENCY} dans votre compte bancaire. ${
      userDb.coins > 0 && "\nVous devez déposer vos pièces en banque avant de pouvoir transférer "
    } `;
  }

  const targetDb = await getUser(target.id);

  userDb.bank -= coins;
  targetDb.bank += coins;

  await userDb.save();
  await targetDb.save();

  const embed = new MessageEmbed()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: "Solde mis à jour " })
    .setDescription(`Vous avez transféré avec succès  ${coins}${ECONOMY.CURRENCY} à ${target.tag}`)
    .setTimestamp(Date.now());

  return { embeds: [embed] };
};
