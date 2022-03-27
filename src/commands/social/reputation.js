const { Command } = require("@src/structures");
const { resolveMember } = require("@utils/guildUtils");
const { getUser } = require("@schemas/User");
const { MessageEmbed, Message } = require("discord.js");
const { diffHours, getRemainingTime } = require("@utils/miscUtils");
const { EMBED_COLORS } = require("@root/config");

module.exports = class Reputation extends Command {
  constructor(client) {
    super(client, {
      name: "rep",
      description: "donner une reputatiion à une personne",
      category: "SOCIAL",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        minArgsCount: 1,
        aliases: ["reputation"],
        subcommands: [
          {
            trigger: "voir [utilisateur]",
            description: "voir la reputation",
          },
          {
            trigger: "donner [utilisateur]",
            description: "donne une reputation",
          },
        ],
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "voir",
            description: "voir la reputation",
            type: "SUB_COMMAND",
            options: [
              {
                name: "user",
                description: "the user to check reputation for",
                type: "USER",
                required: false,
              },
            ],
          },
          {
            name: "give",
            description: "give reputation to a user",
            type: "SUB_COMMAND",
            options: [
              {
                name: "user",
                description: "the user to check reputation for",
                type: "USER",
                required: true,
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
    const sub = args[0];
    let response;

    // status
    if (sub === "voir") {
      let target = message.author;
      if (args.length > 1) {
        const resolved = (await resolveMember(message, args[1])) || message.member;
        if (resolved) target = resolved.user;
      }
      response = await viewReputation(target);
    }

    // give
    else if (sub === "donner") {
      const target = await resolveMember(message, args[1]);
      if (!target) return message.reply("specifier un utilisateur valide");
      response = await giveReputation(message.author, target.user);
    }

    //
    else {
      response = "Utilisation de commande invalide";
    }

    await message.reply(response);
  }

  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    let response;

    // status
    if (sub === "voir") {
      const target = interaction.options.getUser("user") || interaction.user;
      response = await viewReputation(target);
    }

    // give
    if (sub === "donner") {
      const target = interaction.options.getUser("user");
      response = await giveReputation(interaction.user, target);
    }

    await interaction.followUp(response);
  }
};

async function viewReputation(target) {
  const userData = await getUser(target.id);
  if (!userData) return `${target.tag} n'as aucune reputation`;

  const embed = new MessageEmbed()
    .setAuthor({ name: `Reputation de ${target.username}` })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setThumbnail(target.displayAvatarURL())
    .addField("Donner", userData.reputation?.given.toString(), true)
    .addField("Reçu", userData.reputation?.received.toString(), true);

  return { embeds: [embed] };
}

async function giveReputation(user, target) {
  if (target.bot) return "C'est un bot, Baka!";
  if (target.id === user.id) return "Et bah non tu auras rien";

  const userData = await getUser(user.id);
  if (userData && userData.reputation.timestamp) {
    const lastRep = new Date(userData.reputation.timestamp);
    const diff = diffHours(new Date(), lastRep);
    if (diff < 24) {
      const nextUsage = lastRep.setHours(lastRep.getHours() + 24);
      return `Tu peut utiliser cet commande que dans \`${getRemainingTime(nextUsage)}\``;
    }
  }

  const targetData = await getUser(target.id);

  userData.reputation.given += 1;
  userData.reputation.timestamp = new Date();
  targetData.reputation.received += 1;

  await userData.save();
  await targetData.save();

  const embed = new MessageEmbed()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(`${target.toString()} +1 Rep!`)
    .setFooter({ text: `Par ${user.tag}` })
    .setTimestamp(Date.now());

  return { embeds: [embed] };
}
