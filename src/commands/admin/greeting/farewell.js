const { Command } = require("@src/structures");
const { isHex } = require("@utils/miscUtils");
const { buildGreeting } = require("@src/handlers/greeting");
const { Message, CommandInteraction } = require("discord.js");
const { canSendEmbeds } = require("@utils/guildUtils");
const { sendMessage } = require("@utils/botUtils");

module.exports = class Farewell extends Command {
  constructor(client) {
    super(client, {
      name: "aurevoir",
      description: "configurer le message d'aurevoir",
      category: "ADMIN",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        minArgsCount: 1,
        subcommands: [
          {
            trigger: "status <on|off>",
            description: "activer ou désactiver le message d'adieu ",
          },
          {
            trigger: "salon <#salon>",
            description: "salon",
          },
          {
            trigger: "preview",
            description: "prévisualiser le message d'adieu configuré ",
          },
          {
            trigger: "desc <text>",
            description: "définir la description intégrée ",
          },
          {
            trigger: "thumbnail <ON|OFF>",
            description: "activer/désactiver l'intégration de la vignette ",
          },
          {
            trigger: "color <hexcolor>",
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
            name: "status",
            description: "activer ou désactiver le message d'adieu ",
            type: "SUB_COMMAND",
            options: [
              {
                name: "status",
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
            name: "preview",
            description: "prévisualiser le message d'adieu configuré ",
            type: "SUB_COMMAND",
          },
          {
            name: "salon",
            description: "définir la chaîne d'adieu ",
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
                name: "status",
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
            type: "SUB_COMMAND",
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
            description: "définir le bas de page intégré ",
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
    if (type === "preview") {
      response = await sendPreview(settings, message.member);
    }

    // status
    else if (type === "status") {
      const status = args[1]?.toUpperCase();
      if (!status || !["ON", "OFF"].includes(status)) return message.reply("Statut invalide. La valeur doit être **on/off**");
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
      if (!status || !["ON", "OFF"].includes(status)) return message.reply("Statut invalide. La valeur doit être **on/off** ");
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
      case "preview":
        response = await sendPreview(settings, interaction.member);
        break;

      case "status":
        response = await setStatus(settings, interaction.options.getString("status"));
        break;

      case "salon":
        response = await setChannel(settings, interaction.options.getChannel("salon"));
        break;

      case "desc":
        response = await setDescription(settings, interaction.options.getString("cotenu"));
        break;

      case "thumbnail":
        response = await setThumbnail(settings, interaction.options.getString("status"));
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
  if (!settings.farewell?.enabled) return "Message d'adieu non activé sur ce serveur ";

  const targetChannel = member.guild.channels.cache.get(settings.farewell.channel);
  if (!targetChannel) return "Aucun canal n'est configuré pour envoyer un message d'adieu ";

  const response = await buildGreeting(member, "FAREWELL", settings.farewell);
  await sendMessage(targetChannel, response);

  return `Envoyé un aperçu d'adieu à  ${targetChannel.toString()}`;
}

async function setStatus(settings, status) {
  const enabled = status.toUpperCase() === "ON" ? true : false;
  settings.farewell.enabled = enabled;
  await settings.save();
  return `Configuration enregistrée ! Un message d'adieu ${status ? "activé" : "désactivé"}`;
}

async function setChannel(settings, channel) {
  if (!canSendEmbeds(channel)) {
    return (
      "Pouah! Je ne peux pas envoyer de message d'accueil à ce canal ? J'ai besoin des autorisations **Écrire des messages` et `Intégrer des liens** dans " +
      channel.toString()
    );
  }
  settings.farewell.channel = channel.id;
  await settings.save();
  return `Configuration enregistrée ! Un message d'adieu sera envoyé à ${channel ? channel.toString() : "Pas trouvé "}`;
}

async function setDescription(settings, desc) {
  settings.farewell.embed.description = desc;
  await settings.save();
  return "Configuration enregistrée ! Message d'adieu mis à jour ";
}

async function setThumbnail(settings, status) {
  settings.farewell.embed.thumbnail = status.toUpperCase() === "ON" ? true : false;
  await settings.save();
  return "Configuration enregistrée ! Message d'adieu mis à jour ";
}

async function setColor(settings, color) {
  settings.farewell.embed.color = color;
  await settings.save();
  return "Configuration enregistrée ! Message d'adieu mis à jour ";
}

async function setFooter(settings, content) {
  settings.farewell.embed.footer = content;
  await settings.save();
  return "Configuration enregistrée ! Message d'adieu mis à jour ";
}
