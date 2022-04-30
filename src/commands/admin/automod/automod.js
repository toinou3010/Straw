const { Command } = require("@src/structures");
const { Message, CommandInteraction } = require("discord.js");

module.exports = class Automod extends Command {
  constructor(client) {
    super(client, {
      name: "automoderation",
      description: "protéger votre serveur",
      category: "AUTOMOD",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        minArgsCount: 2,
        subcommands: [
          {
            trigger: "antighostping <ON|OFF>",
            description: "Affiche dans un salon les personnes qui ghostping sur ton serveur",
          },
          {
            trigger: "antiinvites <ON|OFF>",
            description: "Active ou Désactive l'envoie d'invitation discord",
          },
          {
            trigger: "antiliens <ON|OFF>",
            description: "Activer ou Désactiver l'envoie de lien",
          },
          {
            trigger: "antiarnaque <ON|OFF>",
            description: "Active ou désactive la protection contre les arnaqueurs",
          },
          {
            trigger: "lignemax <nombre>",
            description: "Définit le nombre maximum de lignes autorisées par message [0 pour désactiver]",
          },
          {
            trigger: "maxmentions <nombre>",
            description: "Définit le nombre maximum de mentions de membres autorisées par message [0 pour désactiver]",
          },
          {
            trigger: "maxrolementions <nombre>",
            description: "Définit le nombre maximum de mentions de rôle autorisées par message [0 à désactiver]",
          },
        ],
      },
      slashCommand: {
        enabled: true,
        ephemeral: true,
        options: [
          {
            name: "antighostping",
            description: "Enregistre les mentions fantômes sur votre serveur",
            type: "SUB_COMMAND",
            options: [
              {
                name: "status",
                description: "état de la configuration",
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
          {
            name: "antiinvites",
            description: "Autoriser ou non l'envoi d'invitations discord dans le message",
            type: "SUB_COMMAND",
            options: [
              {
                name: "status",
                description: "état de la configuration",
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
          {
            name: "antiliens",
            description: "Autoriser ou non l'envoi de liens dans le message",
            type: "SUB_COMMAND",
            options: [
              {
                name: "status",
                description: "état de la configuration",
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
          {
            name: "antiarnaque",
            description: "Activer ou désactiver la détection anti-arnaque ",
            type: "SUB_COMMAND",
            options: [
              {
                name: "status",
                description: "état de la configuration",
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
          {
            name: "lignemax",
            description: "Définit le nombre maximum de lignes autorisées par message",
            type: "SUB_COMMAND",
            options: [
              {
                name: "montant",
                description: "montant de la configuration (0 pour désactiver)",
                required: true,
                type: "INTEGER",
              },
            ],
          },
          {
            name: "maxmentions",
            description: "Définit le nombre maximum de mentions d'utilisateur autorisées par message",
            type: "SUB_COMMAND",
            options: [
              {
                name: "montant",
                description: "montant de la configuration (0 pour désactiver)",
                required: true,
                type: "INTEGER",
              },
            ],
          },
          {
            name: "maxrolementions",
            description: "Définit le nombre maximum de mentions de rôle autorisées par message",
            type: "SUB_COMMAND",
            options: [
              {
                name: "montant",
                description: "montant de la configuration (0 pour désactiver)",
                required: true,
                type: "INTEGER",
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
    const settings = data.settings;
    const sub = args[0].toLowerCase();

    let response;
    if (sub == "antighostping") {
      const status = args[1].toLowerCase();
      if (!["on", "off"].includes(status)) return message.reply("Statut non valide. La valeur doit être `on/off`");
      response = await antighostPing(settings, status);
    }

    //
    else if (sub === "antiinvites") {
      const status = args[1].toLowerCase();
      if (!["on", "off"].includes(status)) return message.reply("Statut non valide. La valeur doit être `on/off`");
      response = await antiInvites(settings, status);
    }

    //
    else if (sub == "antiliens") {
      const status = args[1].toLowerCase();
      if (!["on", "off"].includes(status)) return message.reply("Statut non valide. La valeur doit être `on/off`");
      response = await antilinks(settings, status);
    }

    //
    else if (sub == "antiarnaque") {
      const status = args[1].toLowerCase();
      if (!["on", "off"].includes(status)) return message.reply("Statut non valide. La valeur doit être `on/off`");
      response = await antiScam(settings, status);
    }

    //
    else if (sub === "lignemax") {
      const max = args[1];
      if (isNaN(max) || Number.parseInt(max) < 1) {
        return message.reply("Les lignes max doit être un nombre valide supérieur à 0");
      }
      response = await maxLines(settings, max);
    }

    //
    else if (sub === "maxmentions") {
      const max = args[1];
      if (isNaN(max) || Number.parseInt(max) < 1) {
        return message.reply("Le nombre de mentions maximum doit être un nombre valide supérieur à 0");
      }
      response = await maxMentions(settings, max);
    }

    //
    else if (sub === "maxrolementions") {
      const max = args[1];
      if (isNaN(max) || Number.parseInt(max) < 1) {
        return message.reply("Le nombre maximum de mentions de role doit être un nombre valide supérieur à 0");
      }
      response = await maxRoleMentions(settings, max);
    }

    //
    else response = "Utilisation d'une commande non valide !";

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
    if (sub == "antighostping") response = await antighostPing(settings, interaction.options.getString("status"));
    else if (sub === "antiinvites") response = await antiInvites(settings, interaction.options.getString("status"));
    else if (sub == "antiliens") response = await antilinks(settings, interaction.options.getString("status"));
    else if (sub == "antiarnaque") response = await antiScam(settings, interaction.options.getString("status"));
    else if (sub === "lignemax") response = await maxLines(settings, interaction.options.getInteger("montant"));
    else if (sub === "maxmentions") response = await maxMentions(settings, interaction.options.getInteger("montant"));
    else if (sub === "maxrolementions") {
      response = await maxRoleMentions(settings, interaction.options.getInteger("montant"));
    }

    await interaction.followUp(response);
  }
};

async function antighostPing(settings, input) {
  const status = input.toUpperCase() === "ON" ? true : false;
  settings.automod.anti_ghostping = status;
  await settings.save();
  return `Configuration sauvegardée ! L'interdiction de ping fantome est maintenant ${status ? "activer" : "désactiver"}`;
}

async function antiInvites(settings, input) {
  const status = input.toUpperCase() === "ON" ? true : false;
  settings.automod.anti_invites = status;
  await settings.save();
  return `Les messages ${
    status ? "avec les invitations discord seront désormais automatiquement supprimées" : "ne seront pas filtrés pour les invitations discord maintenant"
  }`;
}

async function antilinks(settings, input) {
  const status = input.toUpperCase() === "ON" ? true : false;
  settings.automod.anti_links = status;
  await settings.save();
  return `Les messages ${status ? "avec des liens seront désormais automatiquement supprimés" : "ne seront pas filtrés pour les liens maintenant"}`;
}

async function antiScam(settings, input) {
  const status = input.toUpperCase() === "ON" ? true : false;
  settings.automod.anti_scam = status;
  await settings.save();
  return `La détection d'anti-arnaque est maintenant ${status ? "activer" : "désactiver"}`;
}

async function maxLines(settings, input) {
  const lines = Number.parseInt(input);
  if (isNaN(lines)) return "Veuillez saisir un numéro valide";

  settings.automod.max_lines = lines;
  await settings.save();
  return `${
    input === 0
      ? "La limite de ligne maximale est désactivée"
      : `Les messages plus longs que \`${input}\` lignes seront maintenant automatiquement supprimées`
  }`;
}

async function maxMentions(settings, input) {
  const mentions = Number.parseInt(input);
  if (isNaN(mentions)) return "Veuillez saisir un numéro valide";

  settings.automod.max_mentions = mentions;
  await settings.save();
  return `${
    input === 0
      ? "La limite maximale de mentions d'utilisateurs est désactivée"
      : `Les messages ayant plus de \`${input}\` mentions d'utilisateurs seront désormais automatiquement supprimées`
  }`;
}

async function maxRoleMentions(settings, input) {
  const mentions = Number.parseInt(input);
  if (isNaN(mentions)) return "Veuillez saisir un numéro valide";

  settings.automod.max_role_mentions = mentions;
  await settings.save();
  return `${
    input === 0
      ? "La limite maximale des mentions de rôle est désactivée"
      : `Les messages ayant plus de \`${input}\` mentions de rôle seront désormais automatiquement supprimées`
  }`;
}
