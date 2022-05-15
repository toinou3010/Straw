const { Command } = require("@src/structures");
const { findMatchingRoles } = require("@utils/guildUtils");
const { Message, CommandInteraction } = require("discord.js");

module.exports = class AddInvitesCommand extends Command {
  constructor(client) {
    super(client, {
      name: "inviterank",
      description: "configurer les rangs d'invitation ",
      category: "INVITE",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        usage: "<role> <invites>",
        minArgsCount: 2,
        subcommands: [
          {
            trigger: "ajouter <role> <invites>",
            description: "ajouter un classement automatique après avoir atteint un certain nombre d'invitations ",
          },
          {
            trigger: "retirer role",
            description: "supprimer le rang d'invitation configuré avec ce rôle ",
          },
        ],
      },
      slashCommand: {
        enabled: true,
        ephemeral: true,
        options: [
          {
            name: "ajouter",
            description: "ajouter un nouveau rang d'invitation ",
            type: "SUB_COMMAND",
            options: [
              {
                name: "role",
                description: "rôle à donner ",
                type: "ROLE",
                required: true,
              },
              {
                name: "invites",
                description: "nombre d'invitations nécessaires pour obtenir le rôle ",
                type: "INTEGER",
                required: true,
              },
            ],
          },
          {
            name: "retirer",
            description: "supprimer un rang d'invitation précédemment configuré ",
            type: "SUB_COMMAND",
            options: [
              {
                name: "role",
                description: "rôle avec rang d'invitation configuré ",
                type: "ROLE",
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
   * @param {object} data
   */
  async messageRun(message, args, data) {
    const sub = args[0].toLowerCase();

    if (sub === "ajouter") {
      const query = args[1];
      const invites = args[2];

      if (isNaN(invites)) return message.reply(`\`${invites}\` n'est pas un nombre valide d'invitations ?`);
      const role = message.mentions.roles.first() || findMatchingRoles(message.guild, query)[0];
      if (!role) return message.reply(`Aucun rôle trouvé correspondant  \`${query}\``);

      const response = await addInviteRank(message, role, invites, data.settings);
      await message.reply(response);
    }

    //
    else if (sub === "retirer") {
      const query = args[1];
      const role = message.mentions.roles.first() || findMatchingRoles(message.guild, query)[0];
      if (!role) return message.reply(`Aucun rôle trouvé correspondant  \`${query}\``);
      const response = await removeInviteRank(message, role, data.settings);
      await message.reply(response);
    }

    //
    else {
      await message.reply("Utilisation incorrecte de la commande !");
    }
  }

  /**
   * @param {CommandInteraction} interaction
   * @param {object} data
   */
  async interactionRun(interaction, data) {
    const sub = interaction.options.getSubcommand();
    //
    if (sub === "ajouter") {
      const role = interaction.options.getRole("role");
      const invites = interaction.options.getInteger("invites");

      const response = await addInviteRank(interaction, role, invites, data.settings);
      await interaction.followUp(response);
    }

    //
    else if (sub === "retirer") {
      const role = interaction.options.getRole("role");
      const response = await removeInviteRank(interaction, role, data.settings);
      await interaction.followUp(response);
    }
  }
};

async function addInviteRank({ guild }, role, invites, settings) {
  if (!settings.invite.tracking) return `Le suivi des invitations est désactivé sur ce serveur `;

  if (role.managed) {
    return "Vous ne pouvez pas attribuer un rôle de bot ";
  }

  if (guild.roles.everyone.id === role.id) {
    return "Je ne peux pas attribuer le rôle à tout le monde. ";
  }

  if (!role.editable) {
    return "Il me manque des autorisations pour déplacer des membres vers ce rôle. Ce rôle est-il en dessous de mon rôle le plus élevé ?";
  }

  const exists = settings.invite.ranks.find((obj) => obj._id === role.id);

  let msg = "";
  if (exists) {
    exists.invites = invites;
    msg += "Configuration précédente trouvée pour ce rôle. Ecrasement des données \n";
  }

  settings.invite.ranks.push({ _id: role.id, invites });
  await settings.save();
  return `${msg}Succès! Configuration enregistrée. `;
}

async function removeInviteRank({ guild }, role, settings) {
  if (!settings.invite.tracking) return `Le suivi des invitations est désactivé sur ce serveur `;

  if (role.managed) {
    return "Vous ne pouvez pas attribuer un rôle de bot ";
  }

  if (guild.roles.everyone.id === role.id) {
    return "Vous ne pouvez pas attribuer le rôle Tout le monde. ";
  }

  if (!role.editable) {
    return "Il me manque des autorisations pour déplacer des membres de ce rôle. Ce rôle est-il en dessous de mon rôle le plus élevé ?";
  }

  const exists = settings.invite.ranks.find((obj) => obj._id === role.id);
  if (!exists) return "Aucun classement d'invitation précédent n'a été configuré pour ce rôle ";

  // delete element from array
  const i = settings.invite.ranks.findIndex((obj) => obj._id === role.id);
  if (i > -1) settings.invite.ranks.splice(i, 1);

  await settings.save();
  return "Succès! Configuration enregistrée. ";
}
