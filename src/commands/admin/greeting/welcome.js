const { Command } = require("@src/structures");
const { isHex } = require("@utils/miscUtils");
const { buildGreeting } = require("@src/handlers/greeting");
const { Message, CommandInteraction } = require("discord.js");
const { canSendEmbeds } = require("@utils/guildUtils");
const { sendMessage } = require("@utils/botUtils");

module.exports = class Welcome extends Command {
  constructor(client) {
    super(client, {
      name: "bienvenue",
      description: "configurer le message de bienvenue",
      category: "ADMIN",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        minArgsCount: 1,
        subcommands: [
          {
            trigger: "statut <on|off>",
            description: "activer ou désactiver le message de bienvenue ",
          },
          {
            trigger: "salon <#salon>",
            description: "configurer le message de bienvenue ",
          },
          {
            trigger: "voir",
            description: "prévisualiser le message de bienvenue configuré ",
          },
          {
            trigger: "desc <text>",
            description: "définir la description intégrée ",
          },
          {
            trigger: "vignette <ON|OFF>",
            description: "activer/désactiver l'intégration de la vignette ",
          },
          {
            trigger: "couleur <#hex>",
            description: "définir la couleur d'intégration ",
          },
          {
            trigger: "footer <text>",
            description: "définir le contenu du pied de page intégré ",
          },
        ],
      },
      slashCommand: {
        enabled: true,
        ephemeral: true,
        options: [
          {
            name: "statut",
            description: "activer ou désactiver le message de bienvenue ",
            type: "SUB_COMMAND",
            options: [
              {
                name: "statut",
                description: "activé ou désactivé ",
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
            name: "voir",
            description: "prévisualiser le message de bienvenue configuré ",
            type: "SUB_COMMAND",
          },
          {
            name: "channel",
            description: "set welcome channel",
            type: "SUB_COMMAND",
            options: [
              {
                name: "salon",
                description: "nom du salon",
                type: "CHANNEL",
                channelTypes: ["GUILD_TEXT"],
                required: true,
              },
            ],
          },
          {
            name: "desc",
            description: "définir la description intégrée ",
            type: "SUB_COMMAND",
            options: [
              {
                name: "contenu",
                description: "contenu descriptif ",
                type: "STRING",
                required: true,
              },
            ],
          },
          {
            name: "vignette",
            description: "configurer la miniature intégrée ",
            type: "SUB_COMMAND",
            options: [
              {
                name: "statut",
                description: "état des vignettes ",
                type: "STRING",
                required: true,
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
            name: "couleur",
            description: "définir la couleur d'intégration ",
            options: [
              {
                name: "hex-code",
                description: "code couleur hexadécimal ",
                type: "STRING",
                required: true,
              },
            ],
          },
          {
            name: "footer",
            description: "définir le pied de page intégré ",
            type: "SUB_COMMAND",
            options: [
              {
                name: "contenu",
                description: "contenu du bas de page ",
                type: "STRING",
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
    const type = args[0].toLowerCase();
    const settings = data.settings;
    let response;

    // preview
    if (type === "voir") {
      response = await sendPreview(settings, message.member);
    }

    // status
    else if (type === "statut") {
      const status = args[1]?.toUpperCase();
      if (!status || !["ON", "OFF"].includes(status)) return message.reply("Statut invalide. La valeur doit être `on/off`");
      response = await setStatus(settings, status);
    }

    // channel
    else if (type === "salon") {
      const channel = message.mentions.channels.first();
      response = await setChannel(settings, channel);
    }

    // desc
    else if (type === "desc") {
      if (args.length < 2) return message.reply("Arguments insuffisants ! Veuillez fournir un contenu valide ");
      const desc = args.slice(1).join(" ");
      response = await setDescription(settings, desc);
    }

    // thumbnail
    else if (type === "vignette") {
      const status = args[1]?.toUpperCase();
      if (!status || !["ON", "OFF"].includes(status)) return message.reply("Statut invalide. La valeur doit être `on/off`");
      response = await setThumbnail(settings, status);
    }

    // color
    else if (type === "couleur") {
      const color = args[1];
      if (!color || !isHex(color)) return message.reply("Couleur invalide. La valeur doit être une couleur hexadécimale valide ");
      response = await setColor(settings, color);
    }

    // footer
    else if (type === "footer") {
      if (args.length < 2) return message.reply("Arguments insuffisants ! Veuillez fournir un contenu valide ");
      const content = args.slice(1).join(" ");
      response = await setFooter(settings, content);
    }

    //
    else response = "Utilisation de la commande non valide !";
    return message.reply(response);
  }

  /**
   *
   * @param {CommandInteraction} interaction
   * @param {object} data
   */
  async interactionRun(interaction, data) {
    const sub = interaction.options.getSubcommand();
    const settings = data.settings;

    let response;
    switch (sub) {
      case "voir":
        response = await sendPreview(settings, interaction.member);
        break;

      case "statut":
        response = await setStatus(settings, interaction.options.getString("statut"));
        break;

      case "salon":
        response = await setChannel(settings, interaction.options.getChannel("salon"));
        break;

      case "desc":
        response = await setDescription(settings, interaction.options.getString("contenu"));
        break;

      case "vignette":
        response = await setThumbnail(settings, interaction.options.getString("statut"));
        break;

      case "couleur":
        response = await setColor(settings, interaction.options.getString("couleur"));
        break;

      case "footer":
        response = await setFooter(settings, interaction.options.getString("contenu"));
        break;

      default:
        response = "Sous-commande invalide ";
    }

    return interaction.followUp(response);
  }
};

async function sendPreview(settings, member) {
  if (!settings.welcome?.enabled) return "Message de bienvenue non activé sur ce serveur ";

  const targetChannel = member.guild.channels.cache.get(settings.welcome.channel);
  if (!targetChannel) return "Aucun canal n'est configuré pour envoyer un message de bienvenue ";

  const response = await buildGreeting(member, "WELCOME", settings.welcome);
  await sendMessage(targetChannel, response);

  return `Aperçu de bienvenue envoyé à  ${targetChannel.toString()}`;
}

async function setStatus(settings, status) {
  const enabled = status.toUpperCase() === "ON" ? true : false;
  settings.welcome.enabled = enabled;
  await settings.save();
  return `Configuration enregistrée ! Message de bienvenue ${enabled ? "activer" : "desactiver"}`;
}

async function setChannel(settings, channel) {
  if (!canSendEmbeds(channel)) {
    return (
      "Pouah! Je ne peux pas envoyer de message d'accueil à ce canal ? J'ai besoin des autorisations `Write Messages` et `Embed Links` dans " +
      channel.toString()
    );
  }
  settings.welcome.channel = channel.id;
  await settings.save();
  return `Configuration enregistrée ! Un message de bienvenue sera envoyé à ${channel ? channel.toString() : "Pas trouvé"}`;
}

async function setDescription(settings, desc) {
  settings.welcome.embed.description = desc;
  await settings.save();
  return "Configuration enregistrée ! Message de bienvenue mis à jour ";
}

async function setThumbnail(settings, status) {
  settings.welcome.embed.thumbnail = status.toUpperCase() === "ON" ? true : false;
  await settings.save();
  return "Configuration enregistrée ! Message de bienvenue mis à jour ";
}

async function setColor(settings, color) {
  settings.welcome.embed.color = color;
  await settings.save();
  return "Configuration enregistrée ! Message de bienvenue mis à jour ";
}

async function setFooter(settings, content) {
  settings.welcome.embed.footer = content;
  await settings.save();
  return "Configuration enregistrée ! Message de bienvenue mis à jour ";
}
