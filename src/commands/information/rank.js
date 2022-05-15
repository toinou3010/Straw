const { Command } = require("@src/structures");
const { Message, MessageAttachment, CommandInteraction } = require("discord.js");
const { EMBED_COLORS, IMAGE } = require("@root/config");
const { getBuffer } = require("@utils/httpUtils");
const { resolveMember } = require("@utils/guildUtils");
const { getMember, getXpLb } = require("@schemas/Member");

module.exports = class Rank extends Command {
  constructor(client) {
    super(client, {
      name: "rank",
      description: "shows members rank in this server",
      cooldown: 5,
      category: "INFORMATION",
      botPermissions: ["ATTACH_FILES"],
      command: {
        enabled: true,
        usage: "[@member|id]",
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "utilisateur",
            description: "utilisateur cible",
            type: "USER",
            required: false,
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
    const member = (await resolveMember(message, args[0])) || message.member;
    const response = await getRank(message, member, data.settings);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   * @param {object} data
   */
  async interactionRun(interaction, data) {
    const user = interaction.options.getUser("utilisateur") || interaction.user;
    const member = await interaction.guild.members.fetch(user);
    const response = await getRank(interaction, member, data.settings);
    await interaction.followUp(response);
  }
};

async function getRank({ guild }, member, settings) {
  const { user } = member;
  if (!settings.ranking.enabled) return "Le classement est désactivé sur ce serveur ";

  const memberDb = await getMember(guild.id, user.id);
  if (!memberDb.xp) return `${user.tag} n'est pas encore classé !`;

  const lb = await getXpLb(guild.id, 100);
  let pos = -1;
  lb.forEach((doc, i) => {
    if (doc.member_id == user.id) {
      pos = i + 1;
    }
  });

  const xpNeeded = memberDb.level * memberDb.level * 100;

  const url = new URL(`${IMAGE.BASE_API}/utils/rank-card`);
  url.searchParams.append("name", user.username);
  url.searchParams.append("discriminator", user.discriminator);
  url.searchParams.append("avatar", user.displayAvatarURL({ format: "png", size: 128 }));
  url.searchParams.append("currentxp", memberDb.xp);
  url.searchParams.append("reqxp", xpNeeded);
  url.searchParams.append("level", memberDb.level);
  url.searchParams.append("barcolor", EMBED_COLORS.BOT_EMBED);
  url.searchParams.append("status", member?.presence?.status?.toString() || "idle");
  if (pos !== -1) url.searchParams.append("rank", pos);

  const response = await getBuffer(url.href);
  if (!response.success) return "Impossible de générer la carte de classement ";

  const attachment = new MessageAttachment(response.buffer, "classement.png");
  return { files: [attachment] };
}
