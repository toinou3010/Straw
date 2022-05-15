const { Command } = require("@src/structures");
const { Message, CommandInteraction } = require("discord.js");
const { findMatchingRoles } = require("@utils/guildUtils");

module.exports = class AutoRole extends Command {
  constructor(client) {
    super(client, {
      name: "roleauto",
      description: "rôle de configuration à donner lorsqu'un membre rejoint le serveur",
      category: "ADMIN",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        usage: "<role|off>",
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        ephemeral: true,
        options: [
          {
            name: "add",
            description: "setup the autorole",
            type: "SUB_COMMAND",
            options: [
              {
                name: "role",
                description: "the role to be given",
                type: "ROLE",
                required: false,
              },
              {
                name: "role_id",
                description: "the role id to be given",
                type: "STRING",
                required: false,
              },
            ],
          },
          {
            name: "remove",
            description: "disable the autorole",
            type: "SUB_COMMAND",
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
    const input = args.join(" ");
    let response;

    if (input.toLowerCase() === "off") {
      response = await setAutoRole(message, null, data.settings);
    } else {
      const roles = findMatchingRoles(message.guild, input);
      if (roles.length === 0) response = "Aucun rôle correspondant à votre requête n'a été trouvé";
      else response = await setAutoRole(message, roles[0], data.settings);
    }

    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   * @param {object} data
   */
  async interactionRun(interaction, data) {
    const sub = interaction.options.getSubcommand();
    let response;

    // add
    if (sub === "add") {
      let role = interaction.options.getRole("role");
      if (!role) {
        const role_id = interaction.options.getString("role_id");
        if (!role_id) return interaction.followUp("Veuillez fournir un rôle ou un identifiant de rôle");

        const roles = findMatchingRoles(interaction.guild, role_id);
        if (roles.length === 0) return interaction.followUp("Aucun rôle correspondant à votre requête n'a été trouvé");
        role = roles[0];
      }

      response = await setAutoRole(interaction, role, data.settings);
    }

    // remove
    else if (sub === "remove") {
      response = await setAutoRole(interaction, null, data.settings);
    }

    // default
    else response = "Sous-commande invalide";

    await interaction.followUp(response);
  }
};

async function setAutoRole({ guild }, role, settings) {
  if (role) {
    if (!guild.me.permissions.has("MANAGE_ROLES")) return "Je n'ai pas l'autorisation `MANAGE_ROLES`.";
    if (guild.me.roles.highest.position < role.position) return "Je n'ai pas les permissions nécessaires pour attribuer ce rôle.";
    if (role.managed) return "Oups ! Ce rôle est géré par une intégration";
  }

  if (!role) settings.autorole = null;
  else settings.autorole = role.id;

  await settings.save();
  return `Configuration sauvegardée ! L'autorole est ${!role ? "désactiver" : "configuré"}`;
}
