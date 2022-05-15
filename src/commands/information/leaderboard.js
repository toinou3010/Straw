const { Command } = require("@src/structures");
const { Message, MessageEmbed, CommandInteraction } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");
const { getXpLb, getInvitesLb } = require("@schemas/Member");

module.exports = class LeaderBoard extends Command {
  constructor(client) {
    super(client, {
      name: "classement",
      description: "Affiche le classement xp ou invites",
      category: "INFORMATION",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        aliases: ["lb"],
        minArgsCount: 1,
        usage: "<xp|invite>",
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "type",
            description: "type of leaderboard to display",
            required: true,
            type: "STRING",
            choices: [
              {
                name: "xp",
                value: "xp",
              },
              {
                name: "invite",
                value: "invite",
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
   * @param {object} data
   */
  async messageRun(message, args, data) {
    const type = args[0].toLowerCase();
    let response;

    if (type === "xp") response = await getXpLeaderboard(message, message.author, data.settings);
    else if (type === "invite") response = await getInviteLeaderboard(message, message.author, data.settings);
    else response = "Type de classement non valide. Choisissez soit `xp` soit `invite`.";
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   * @param {object} data
   */
  async interactionRun(interaction, data) {
    const type = interaction.options.getString("type");
    let response;

    if (type === "xp") response = await getXpLeaderboard(interaction, interaction.user, data.settings);
    else if (type === "invite") response = await getInviteLeaderboard(interaction, interaction.user, data.settings);
    else response = "Type de classement non valide. Choisissez soit `xp` soit `invite`.";

    await interaction.followUp(response);
  }
};

async function getXpLeaderboard({ guild }, author, settings) {
  if (!settings.ranking.enabled) return "Le classement est désactivé sur ce serveur";

  const lb = await getXpLb(guild.id, 10);
  if (lb.length === 0) return "Aucun utilisateur dans le classement";

  let collector = "";
  for (let i = 0; i < lb.length; i++) {
    try {
      const user = await author.client.users.fetch(lb[i].member_id);
      collector += `<:fleche:975406471774888006> **#${(i + 1).toString()}** - <@${user.id}>\n`;
    } catch (ex) {
      // Ignore
    }
  }

  const embed = new MessageEmbed()
    .setAuthor({ name: "Classement XP" })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(collector)
    .setFooter({ text: `Demander par ${author.tag}` });

  return { embeds: [embed] };
}

async function getInviteLeaderboard({ guild }, author, settings) {
  if (!settings.invite.tracking) return "Le suivi des invitations est désactivé sur ce serveur";

  const lb = await getInvitesLb(guild.id, 10);
  if (lb.length === 0) return "Aucun utilisateur dans le classement";

  let collector = "";
  for (let i = 0; i < lb.length; i++) {
    try {
      const memberId = lb[i].member_id;
      if (memberId === "VANITY") collector += `<:fleche:975406471774888006> **#${(i + 1).toString()}** - Lien personnalisé [${lb[i].invites}]\n`;
      else {
        const user = await author.client.users.fetch(lb[i].member_id);
        collector += `<:fleche:975406471774888006> **#${(i + 1).toString()}** - <@${user.id}> [${lb[i].invites}]\n`;
      }
    } catch (ex) {
      collector += `<:fleche:975406471774888006> **#${(i + 1).toString()}** - DeletedUser#0000 [${lb[i].invites}]\n`;
    }
  }

  const embed = new MessageEmbed()
    .setAuthor({ name: "Classement Invite" })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(collector)
    .setFooter({ text: `Demander par ${author.tag}` });

  return { embeds: [embed] };
}
