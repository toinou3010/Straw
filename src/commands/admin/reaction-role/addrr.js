const { Command } = require("@src/structures");
const { findMatchingRoles, getMatchingChannels } = require("@utils/guildUtils");
const { addReactionRole, getReactionRoles } = require("@schemas/Message");
const { Util, Message, CommandInteraction } = require("discord.js");
const { parsePermissions } = require("@utils/botUtils");

const channelPerms = ["EMBED_LINKS", "READ_MESSAGE_HISTORY", "ADD_REACTIONS", "USE_EXTERNAL_EMOJIS", "MANAGE_MESSAGES"];

module.exports = class AddReactionRole extends Command {
  constructor(client) {
    super(client, {
      name: "addrr",
      description: "configurer le rôle de réaction pour le message spécifié ",
      category: "ADMIN",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        usage: "<#salon> <messageid> <emote> <role>",
        minArgsCount: 4,
      },
      slashCommand: {
        enabled: true,
        ephemeral: true,
        options: [
          {
            name: "salon",
            description: "salon où le message existe ",
            type: "CHANNEL",
            channelTypes: ["GUILD_TEXT"],
            required: true,
          },
          {
            name: "message_id",
            description: "ID de message pour lequel les rôles de réaction doivent être configurés ",
            type: "STRING",
            required: true,
          },
          {
            name: "emoji",
            description: "emoji à utiliser ",
            type: "STRING",
            required: true,
          },
          {
            name: "role",
            description: "rôle à attribuer à l'emoji sélectionné ",
            type: "ROLE",
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
    const targetChannel = getMatchingChannels(message.guild, args[0]);
    if (targetChannel.length === 0) return message.reply(`Aucun salon trouvée correspondant  ${args[0]}`);

    const targetMessage = args[1];

    const role = findMatchingRoles(message.guild, args[3])[0];
    if (!role) return message.reply(`Aucun rôle trouvé correspondant  ${args[3]}`);

    const reaction = args[2];

    const response = await addRR(message.guild, targetChannel[0], targetMessage, reaction, role);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const targetChannel = interaction.options.getChannel("salon");
    const messageId = interaction.options.getString("message_id");
    const reaction = interaction.options.getString("emoji");
    const role = interaction.options.getRole("role");

    const response = await addRR(interaction.guild, targetChannel, messageId, reaction, role);
    await interaction.followUp(response);
  }
};

async function addRR(guild, channel, messageId, reaction, role) {
  if (!channel.permissionsFor(guild.me).has(channelPerms)) {
    return `Vous avez besoin des autorisations suivantes dans  ${channel.toString()}\n${parsePermissions(channelPerms)}`;
  }

  let targetMessage;
  try {
    targetMessage = await channel.messages.fetch(messageId);
  } catch (ex) {
    return "Impossible de récupérer le message. Avez-vous fourni un identifiant de message valide ?";
  }

  if (role.managed) {
    return "Je ne peux pas attribuer de rôles de bot.";
  }

  if (guild.roles.everyone.id === role.id) {
    return "Vous ne pouvez pas attribuer le rôle Tout le monde. ";
  }

  if (guild.me.roles.highest.position < role.position) {
    return "Oups! Je ne peux pas ajouter/supprimer des membres à ce rôle. Ce rôle est-il supérieur au mien ? ";
  }

  const custom = Util.parseEmoji(reaction);
  if (custom.id && !guild.emojis.cache.has(custom.id)) return "Cet emoji n'appartient pas à ce serveur ";
  const emoji = custom.id ? custom.id : custom.name;

  try {
    await targetMessage.react(emoji);
  } catch (ex) {
    return `Tu veux je mettre cet emoji: ${reaction} ?`;
  }

  let reply = "";
  const previousRoles = getReactionRoles(guild.id, channel.id, targetMessage.id);
  if (previousRoles.length > 0) {
    const found = previousRoles.find((rr) => rr.emote === emoji);
    if (found) reply = "Un rôle est déjà configuré pour cet emoji. Ecrasement des données ,\n";
  }

  await addReactionRole(guild.id, channel.id, targetMessage.id, emoji, role.id);
  return (reply += "Fait! Configuration enregistrée ");
}
