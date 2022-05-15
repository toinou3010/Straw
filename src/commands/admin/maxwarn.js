const { Command } = require("@src/structures");
const { Message, CommandInteraction } = require("discord.js");

module.exports = class MaxWarn extends Command {
  constructor(client) {
    super(client, {
      name: "maxwarn",
      description: "définir la configuration maximale des avertissements ",
      category: "ADMIN",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        minArgsCount: 1,
        subcommands: [
          {
            trigger: "limite <nombre>",
            description: "définir le nombre maximal d'avertissements qu'un membre peut recevoir avant d'effectuer une action ",
          },
          {
            trigger: "action <mute|kick|ban>",
            description: "définir l'action à effectuer après avoir reçu le nombre maximal d'avertissements ",
          },
        ],
      },
      slashCommand: {
        enabled: true,
        ephemeral: true,
        options: [
          {
            name: "limite",
            description: "définir le nombre maximal d'avertissements qu'un membre peut recevoir avant d'effectuer une action ",
            type: "SUB_COMMAND",
            options: [
              {
                name: "montant",
                description: "nombre maximum de frappes ",
                type: "INTEGER",
                required: true,
              },
            ],
          },
          {
            name: "action",
            description: "définir l'action à effectuer après avoir reçu le nombre maximal d'avertissements ",
            type: "SUB_COMMAND",
            options: [
              {
                name: "action",
                description: "action à effectuer ",
                type: "STRING",
                required: true,
                choices: [
                  {
                    name: "MUTE",
                    value: "MUTE",
                  },
                  {
                    name: "KICK",
                    value: "KICK",
                  },
                  {
                    name: "BAN",
                    value: "BAN",
                  },
                ],
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
    const input = args[0].toLowerCase();
    if (!["limite", "action"].includes(input)) return message.reply("Utilisation de la commande non valide ");

    let response;
    if (input === "limite") {
      const max = parseInt(args[1]);
      if (isNaN(max) || max < 1) return message.reply("Le nombre maximal d'avertissements doit être un nombre valide supérieur à 0 ");
      response = await setLimit(max, data.settings);
    }

    if (input === "action") {
      const action = args[1]?.toUpperCase();
      if (!action || !["MUTE", "KICK", "BAN"].includes(action))
        return message.reply("Pas une action valide. L'action peut être  `Mute`/`Kick`/`Ban`");
      response = await setAction(message.guild, action, data.settings);
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
    if (sub === "limite") {
      response = await setLimit(interaction.options.getInteger("montant"), data.settings);
    }

    if (sub === "action") {
      response = await setAction(interaction.options.getString("action"), data.settings);
    }

    await interaction.followUp(response);
  }
};

async function setLimit(limit, settings) {
  settings.max_warn.limit = limit;
  await settings.save();
  return `Configuration enregistrée ! Le nombre maximal d'avertissements est défini sur ${limit}`;
}()

async function setAction(guild, action, settings) {
  if (action === "MUTE") {
    if (!guild.me.permissions.has("MODERATE_MEMBERS")) {
      return "Je n'autorise pas les membres à expirer ";
    }
  }

  if (action === "KICK") {
    if (!guild.me.permissions.has("KICK_MEMBERS")) {
      return "Je n'ai pas la permission d'expulser des membres ";
    }
  }

  if (action === "BAN") {
    if (!guild.me.permissions.has("BAN_MEMBERS")) {
      return "Je n'ai pas la permission d'exclure des membres ";
    }
  }

  settings.max_warn.action = action;
  await settings.save();
  return `Configuration enregistrée ! L'action Automod est définie sur ${action}`;
}
