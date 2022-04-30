const { Command } = require("@src/structures");
const { Message, MessageEmbed, CommandInteraction } = require("discord.js");
const { EMBED_COLORS } = require("@root/config.js");
const { table } = require("table");

module.exports = class AutomodConfigCommand extends Command {
  constructor(client) {
    super(client, {
      name: "automodconfig",
      description: "diverses configurations d'automod ",
      category: "AUTOMOD",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        minArgsCount: 1,
        subcommands: [
          {
            trigger: "status",
            description: "vérifier la configuration automod pour cette guilde ",
          },
          {
            trigger: "strikes <nombre>",
            description: "nombre de frappes",
          },
          {
            trigger: "action <MUTE|KICK|BAN>",
            description: "définir l'action à effectuer après avoir reçu le maximum de frappes ",
          },
          {
            trigger: "debug <ON|OFF>",
            description: "active l'automod pour les messages envoyés par les administrateurs et les modérateurs ",
          },
        ],
      },
      slashCommand: {
        enabled: true,
        ephemeral: true,
        options: [
          {
            name: "status",
            description: "Vérifier la configuration de l'automod ",
            type: "SUB_COMMAND",
          },
          {
            name: "strikes",
            description: "Définir le nombre maximum d'avertissements avant d'effectuer une action ",
            type: "SUB_COMMAND",
            options: [
              {
                name: "montant",
                description: "nombre de frappes (par défaut 5) ",
                required: true,
                type: "INTEGER",
              },
            ],
          },
          {
            name: "action",
            description: "Définir l'action à effectuer après avoir reçu le maximum de frappes ",
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
          {
            name: "debug",
            description: "Activer/désactiver l'automod pour les messages envoyés par les administrateurs et les modérateurs ",
            type: "SUB_COMMAND",
            options: [
              {
                name: "status",
                description: "état de la configuration ",
                required: true,
                type: "STRING",
                choices: [
                  {
                    name: "ON",
                    value: "ON",
                  },
                  {
                    name: "OFF",
                    value: "OFF",
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
    const settings = data.settings;

    let response;
    if (input === "status") {
      response = await getStatus(settings, message.guild);
    }

    else if (input === "strikes") {
      const strikes = args[1];
      if (isNaN(strikes) || Number.parseInt(strikes) < 1) {
        return message.reply("Les avertissements doivent être un nombre valide supérieur à 0 ");
      }
      response = await setStrikes(settings, strikes);
    }

    else if (input === "action") {
      const action = args[1].toUpperCase();
      if (!action || !["MUTE", "KICK", "BAN"].includes(action))
        return message.reply("Pas une action valide. L'action peut être `Mute`/`Kick`/`Ban`");
      response = await setAction(settings, message.guild, action);
    }

    else if (input === "debug") {
      const status = args[1].toLowerCase();
      if (!["on", "off"].includes(status)) return message.reply("Statut invalide. La valeur doit être  `on/off`");
      response = await setDebug(settings, status);
    }

    //
    else response = "Utilisation de la commande invalide ! ";
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   * @param {object} data
   */
  async interactionRun(interaction, data) {
    const sub = interaction.options.getSubcommand();
    const settings = data.settings;

    let response;

    // status
    if (sub === "status") response = await getStatus(settings, interaction.guild);
    else if (sub === "strikes") response = await setStrikes(settings, interaction.options.getInteger("montant"));
    else if (sub === "action")
      response = await setAction(settings, interaction.guild, interaction.options.getString("action"));
    else if (sub === "debug") response = await setDebug(settings, interaction.options.getString("status"));

    await interaction.followUp(response);
  }
};

async function getStatus(settings, guild) {
  const { automod } = settings;
  const row = [];

  const logChannel = settings.modlog_channel
    ? guild.channels.cache.get(settings.modlog_channel).toString()
    : "Pas configuré";

  row.push(["Lignes maximales ", automod.max_lines || "NA"]);
  row.push(["Nombre maximal de mentions ", automod.max_mentions || "NA"]);
  row.push(["Nombre maximal de mentions de rôle ", automod.max_role_mentions || "NA"]);
  row.push(["Anti-liens ", automod.anti_links ? "✓" : "✕"]);
  row.push(["Anti-Invites", automod.anti_invites ? "✓" : "✕"]);
  row.push(["Anti-arnaque ", automod.anti_scam ? "✓" : "✕"]);
  row.push(["Anti-Ghostping", automod.anti_ghostping ? "✓" : "✕"]);

  const asciiTable = table(row, {
    singleLine: true,
    header: {
      content: "Configuration automatique",
      alignment: "center",
    },
    columns: [
      {},
      {
        alignment: "center",
      },
    ],
  });

  const embed = new MessageEmbed()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription("```" + asciiTable + "```")
    .addField("Canal de journalisation ", logChannel, true)
    .addField("Frappes maximales ", automod.strikes.toString(), true)
    .addField("Action", automod.action, true);

  return { embeds: [embed] };
}

async function setStrikes(settings, strikes) {
  settings.automod.strikes = strikes;
  await settings.save();
  return `Configuration enregistrée ! Le nombre maximal d'avertissements est défini sur  ${strikes}`;
}

async function setAction(settings, guild, action) {
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

  settings.automod.action = action;
  await settings.save();
  return `Je n'ai pas la permission d'exclure des membresConfiguration enregistrée ! L'action Automod est définie sur  ${action}`;
}

async function setDebug(settings, input) {
  const status = input.toLowerCase() === "on" ? true : false;
  settings.automod.debug = status;
  await settings.save();
  return `Configuration enregistrée ! Le débogage d'Automod est maintenant  ${status ? "activé " : "désactivé "}`;
}
