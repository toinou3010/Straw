const { Command } = require("@src/structures");
const { Message, CommandInteraction } = require("discord.js");
const { removeReactionRole } = require("@schemas/Message");
const { parsePermissions } = require("@utils/botUtils");
const { getMatchingChannels } = require("@utils/guildUtils");

const channelPerms = ["EMBED_LINKS", "READ_MESSAGE_HISTORY", "ADD_REACTIONS", "USE_EXTERNAL_EMOJIS", "MANAGE_MESSAGES"];

module.exports = class RemoveReactionRole extends Command {
  constructor(client) {
    super(client, {
      name: "removerr",
      description: "supprimer la réaction configurée pour le message spécifié ",
      category: "ADMIN",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        usage: "<#salon> <messageid>",
        minArgsCount: 2,
      },
      slashCommand: {
        enabled: true,
        ephemeral: true,
        options: [
          {
            name: "salon",
            description: "canal où le message existe ",
            type: "CHANNEL",
            channelTypes: ["GUILD_TEXT"],
            required: true,
          },
          {
            name: "message_id",
            description: "ID de message pour lequel les rôles de réaction ont été configurés ",
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
    const targetChannel = getMatchingChannels(message.guild, args[0]);
    if (targetChannel.length === 0) return message.reply(`Aucune chaîne trouvée correspondant ${args[0]}`);

    const targetMessage = args[1];
    const response = await removeRR(message.guild, targetChannel[0], targetMessage);

    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const targetChannel = interaction.options.getString("salon");
    const messageId = interaction.options.getString("message_id");

    const response = await removeRR(interaction.guild, targetChannel, messageId);
    await interaction.followUp(response);
  }
};

async function removeRR(guild, channel, messageId) {
  if (!channel.permissionsFor(guild.me).has(channelPerms)) {
    return `Vous avez besoin des autorisations suivantes dans  ${channel.toString()}\n${parsePermissions(channelPerms)}`;
  }

  let targetMessage;
  try {
    targetMessage = await channel.messages.fetch(messageId);
  } catch (ex) {
    return "Impossible de récupérer le message. Avez-vous fourni un identifiant de message valide ?";
  }

  try {
    await removeReactionRole(guild.id, channel.id, targetMessage.id);
    await targetMessage.reactions?.removeAll();
  } catch (ex) {
    return "Oups! Une erreur inattendue est apparue. Réessayez plus tard ";
  }

  return "Fait! Configuration mise à jour ";
}
