const { MessageEmbed, Message, MessageActionRow, MessageButton, CommandInteraction } = require("discord.js");
const { Command } = require("@src/structures");
const { EMBED_COLORS } = require("@root/config.js");

// Schemas
const { createNewTicket } = require("@schemas/Message");

// Utils
const { parsePermissions } = require("@utils/botUtils");
const { canSendEmbeds, findMatchingRoles, getMatchingChannels } = require("@utils/guildUtils");
const { isTicketChannel, closeTicket, closeAllTickets } = require("@utils/ticketUtils");
const { isHex } = require("@utils/miscUtils");

const SETUP_TIMEOUT = 30 * 1000;

const SETUP_PERMS = ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS"];

module.exports = class Ticket extends Command {
  constructor(client) {
    super(client, {
      name: "ticket",
      description: "diverses commandes de billetterie ",
      category: "TICKET",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        minArgsCount: 1,
        subcommands: [
          {
            trigger: "setup",
            description: "démarrer une configuration de ticket interactif ",
          },
          {
            trigger: "log <#salon>",
            description: "configurer le salon de journalisation pour les tickets ",
          },
          {
            trigger: "limite <nombre>",
            description: "définir le nombre maximum de tickets ouverts simultanés ",
          },
          {
            trigger: "fermer",
            description: "fermer le ticket ",
          },
          {
            trigger: "toutfermer",
            description: "fermer tous les tickets ouverts ",
          },
          {
            trigger: "add <ID|roleID>",
            description: "add utilisateur/rôle au ticket ",
          },
          {
            trigger: "remove <ID|roleID>",
            description: "supprimer l'utilisateur/le rôle du ticket ",
          },
        ],
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "setup",
            description: "configurer un nouveau message de ticket ",
            type: "SUB_COMMAND",
            options: [
              {
                name: "salon",
                description: "le salon où le message de création de ticket doit être envoyé ",
                type: "CHANNEL",
                channelTypes: ["GUILD_TEXT"],
                required: true,
              },
              {
                name: "titre",
                description: "le titre du message du ticket ",
                type: "STRING",
                required: true,
              },
              {
                name: "role",
                description: "les rôles qui peuvent avoir accès aux tickets nouvellement ouverts ",
                type: "ROLE",
                required: false,
              },
              {
                name: "couleur",
                description: "couleur hexadécimale pour l'intégration du ticket ",
                type: "STRING",
                required: false,
              },
            ],
          },
          {
            name: "log",
            description: "configurer le salon de journalisation pour les tickets ",
            type: "SUB_COMMAND",
            options: [
              {
                name: "salon",
                description: "salon où les journaux de tickets doivent être envoyés ",
                type: "CHANNEL",
                channelTypes: ["GUILD_TEXT"],
                required: true,
              },
            ],
          },
          {
            name: "limite",
            description: "définir le nombre maximum de tickets ouverts simultanés ",
            type: "SUB_COMMAND",
            options: [
              {
                name: "montant",
                description: "nombre maximum de billets ",
                type: "INTEGER",
                required: true,
              },
            ],
          },
          {
            name: "fermer",
            description: "ferme le ticket [utilisé uniquement dans le canal de tickets] ",
            type: "SUB_COMMAND",
          },
          {
            name: "toutfermer",
            description: "ferme tous les tickets ouverts ",
            type: "SUB_COMMAND",
          },
          {
            name: "add",
            description: "ajouter un utilisateur au canal de tickets actuel [utilisé uniquement dans le canal de tickets] ",
            type: "SUB_COMMAND",
            options: [
              {
                name: "user_id",
                description: "l'identifiant de l'utilisateur à ajouter ",
                type: "STRING",
                required: true,
              },
            ],
          },
          {
            name: "remove",
            description: "supprimer l'utilisateur du canal de tickets [utilisé uniquement dans le canal de tickets] ",
            type: "SUB_COMMAND",
            options: [
              {
                name: "user",
                description: "l'utilisateur à supprimer ",
                type: "USER",
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
    const input = args[0].toLowerCase();
    let response;

    // Setup
    if (input === "setup") {
      if (!message.guild.me.permissions.has("MANAGE_CHANNELS")) {
        return message.reply("Il me manque **Gérer les canaux** pour créer des canaux de tickets ");
      }
      if (!message.channel.permissionsFor(message.guild.me).has("EMBED_LINKS")) {
        return message.reply("Il me manque l'autorisation **Intégrer des liens** pour exécuter une configuration interactive ");
      }
      return runInteractiveSetup(message);
    }

    // log ticket
    else if (input === "log") {
      if (args.length < 2) return message.reply("Veuillez fournir un salon où les journaux de tickets doivent être envoyés ");
      const target = getMatchingChannels(message.guild, args[1]);
      if (target.length === 0) return message.reply("mImpossible de trouver un salon correspondant ");
      response = await setupLogChannel(target[0], data.settings);
    }

    // Set limit
    else if (input === "limite") {
      if (args.length < 2) return message.reply("Veuillez fournir un numéro ");
      const limit = args[1];
      if (isNaN(limit)) return message.reply("Veuillez saisir un nombre ");
      response = await setupLimit(message, limit, data.settings);
    }

    // Close ticket
    else if (input === "fermer") {
      response = await close(message, message.author);
      if (!response) return;
    }

    // Close all tickets
    else if (input === "tout fermer") {
      let sent = await message.reply("D'accord veuillez patienter...");
      response = await closeAll(message);
      return sent.editable ? sent.edit(response) : message.channel.send(response);
    }

    // Add user to ticket
    else if (input === "add") {
      if (args.length < 2) return message.reply("Veuillez fournir un utilisateur ou un rôle à ajouter au ticket ");
      let inputId;
      if (message.mentions.users.size > 0) inputId = message.mentions.users.first().id;
      else if (message.mentions.roles.size > 0) inputId = message.mentions.roles.first().id;
      else inputId = args[1];
      response = await addToTicket(message, inputId);
    }

    // Remove user from ticket
    else if (input === "remove") {
      if (args.length < 2) return message.reply("Veuillez fournir un utilisateur ou un rôle à supprimer ");
      let inputId;
      if (message.mentions.users.size > 0) inputId = message.mentions.users.first().id;
      else if (message.mentions.roles.size > 0) inputId = message.mentions.roles.first().id;
      else inputId = args[1];
      response = await removeFromTicket(message, inputId);
    }

    // Invalid input
    else {
      return message.reply("Utilisation incorrecte de la commande ");
    }

    if (response) await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   * @param {object} data
   */
  async interactionRun(interaction, data) {
    const sub = interaction.options.getSubcommand();
    let response;

    // setup
    if (sub === "setup") {
      const channel = interaction.options.getChannel("salon");
      const title = interaction.options.getString("titre");
      const role = interaction.options.getRole("role");
      const color = interaction.options.getString("couleur");

      if (!interaction.guild.me.permissions.has("MANAGE_CHANNELS")) {
        return interaction.followUp("Il me manque **Gérer les salons** pour créer des salons de tickets ");
      }

      if (color && !isHex(color)) return interaction.followUp("Veuillez fournir une couleur hexadécimale valide ");
      if (role && (role.managed || interaction.guild.me.roles.highest.position < role.position)) {
        return interaction.followUp("Je n'ai pas les autorisations pour gérer ce rôle ");
      }

      if (!canSendEmbeds(channel)) {
        return interaction.followUp(`Je n'ai pas besoin d'autorisations pour envoyer des intégrations dans  ${channel}`);
      }

      response = await setupTicket(interaction.guild, channel, title, role, color);
    }

    // Log channel
    else if (sub === "log") {
      const channel = interaction.options.getChannel("salon");
      response = await setupLogChannel(channel, data.settings);
    }

    // Limit
    else if (sub === "limite") {
      const limit = interaction.options.getInteger("montant");
      response = await setupLimit(interaction, limit, data.settings);
    }

    // Close
    else if (sub === "fermer") {
      response = await close(interaction, interaction.user);
    }

    // Close all
    else if (sub === "toutfermer") {
      response = await closeAll(interaction);
    }

    // Add to ticket
    else if (sub === "add") {
      const inputId = interaction.options.getString("user_id");
      response = await addToTicket(interaction, inputId);
    }

    // Remove from ticket
    else if (sub === "remove") {
      const user = interaction.options.getUser("user");
      response = await removeFromTicket(interaction, user.id);
    }

    if (response) await interaction.followUp(response);
  }
};

/**
 * @param {Message} message
 */
async function runInteractiveSetup({ channel, guild, author }) {
  const filter = (m) => m.author.id === author.id;

  const embed = new MessageEmbed()
    .setAuthor({ name: "Configuration du ticket " })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setFooter({ text: "Tapez Annuler pour annuler la configuration " });

  let targetChannel;
  let title;
  let role;
  try {
    // wait for channel
    await channel.send({
      embeds: [embed.setDescription("Veuillez **mentionner le canal** dans lequel le message du ticket doit être envoyé ")],
    });
    let reply = (await channel.awaitMessages({ filter, max: 1, time: SETUP_TIMEOUT })).first();
    if (reply.content.toLowerCase() === "annuler") return reply.reply("La configuration du ticket a été annulée ");
    targetChannel = reply.mentions.channels.first();
    if (!targetChannel) return reply.reply("La configuration du ticket a été annulée. Vous n'avez pas mentionné de chaîne");
    if (!targetChannel.isText() && !targetChannel.permissionsFor(guild.me).has(SETUP_PERMS)) {
      return reply.reply(
        `La configuration du ticket a été annulée.\nJ'ai besoin  ${parsePermissions(SETUP_PERMS)} dans ${targetChannel}`
      );
    }

    // wait for title
    await channel.send({ embeds: [embed.setDescription("Veuillez entrer le **titre** du billet ")] });
    reply = (await channel.awaitMessages({ filter, max: 1, time: SETUP_TIMEOUT })).first();
    if (reply.content.toLowerCase() === "annuler") return reply.reply("La configuration du ticket a été annulée ");
    title = reply.content;

    // wait for roles
    const desc =
      "Quels rôles doivent avoir accès pour afficher les tickets nouvellement créés ?\n " +
      "Veuillez saisir le nom d'un rôle existant sur ce serveur.\n\n " +
      "Sinon, vous pouvez taper **aucun**;

    await channel.send({ embeds: [embed.setDescription(desc)] });
    reply = (await channel.awaitMessages({ filter, max: 1, time: SETUP_TIMEOUT })).first();
    const query = reply.content.toLowerCase();

    if (query === "annuler") return reply.reply("La configuration du ticket a été annulée ");
    if (query !== "aucun") {
      const roles = findMatchingRoles(guild, query);
      if (roles.length === 0) {
        return reply.reply(`Uh oh, je n'ai trouvé aucun rôle appelé  ${query}! La configuration du ticket a été annulée `);
      }
      role = roles[0];
      if (role.managed || guild.me.roles.highest.position < role.position) {
        return reply.reply("La configuration du ticket a été annulée. Je n'ai pas la permission de gérer ce rôle ");
      }
      await reply.reply(`Très bien!  \`${role.name}\` peut maintenant voir les tickets nouvellement créés `);
    }
  } catch (ex) {
    return channel.send("Pas de réponse pendant 30 secondes, la configuration a été annulée ");
  }

  const response = await setupTicket(guild, targetChannel, title, role);
  return channel.send(response);
}

async function setupTicket(guild, channel, title, role, color) {
  try {
    const embed = new MessageEmbed()
      .setAuthor({ name: "Billet d'assistance " })
      .setDescription(title)
      .setFooter({ text: "Vous ne pouvez avoir qu'un seul ticket ouvert à la fois ! " });

    if (color) embed.setColor(color);

    const row = new MessageActionRow().addComponents(
      new MessageButton().setLabel("Ouvrire").setCustomId("TICKET_CREATE").setStyle("SUCCESS")
    );

    const tktMessage = await channel.send({ embeds: [embed], components: [row] });

    // save to Database
    await createNewTicket(guild.id, channel.id, tktMessage.id, title, role?.id);

    // send success
    return "Configuration enregistrée ! Le message du ticket est maintenant configuré 🎉 ";
  } catch (ex) {
    guild.client.logger.error("ticketSetup", ex);
    return "Une erreur inattendue s'est produite! La configuration a échoué ";
  }
}

async function setupLogChannel(target, settings) {
  if (!canSendEmbeds(target)) return `Oups! J'ai l'autorisation d'envoyer une intégration à  ${target}`;

  settings.ticket.log_channel = target.id;
  await settings.save();

  return `Configuration enregistrée ! Les journaux de tickets seront envoyés à  ${target.toString()}`;
}

async function setupLimit(limit, settings) {
  if (Number.parseInt(limit, 10) < 5) return "La limite de billets ne peut pas être inférieure à 5 ";

  settings.ticket.limit = limit;
  await settings.save();

  return `Configuration enregistrée. Vous pouvez maintenant avoir un maximum de  \`${limit}\` billets ouverts `;
}

async function close({ channel }, author) {
  if (!isTicketChannel(channel)) return "Cette commande ne peut être utilisée que dans les canaux de tickets ";
  const status = await closeTicket(channel, author, "Fermé par un modérateur ");
  if (status === "MISSING_PERMISSIONS") return "Je n'ai pas la permission de fermer les billets ";
  if (status === "ERROR") return "Une erreur s'est produite lors de la fermeture du ticket ";
  return null;
}

async function closeAll({ guild }) {
  const stats = await closeAllTickets(guild);
  return `Terminé! Succès : \`${stats[0]}\` Manqué : \`${stats[1]}\``;
}

async function addToTicket({ channel }, inputId) {
  if (!isTicketChannel(channel)) return "Cette commande ne peut être utilisée que dans le canal de ticket ";
  if (!inputId || isNaN(inputId)) return "Oups! Vous devez saisir un ID utilisateur/roleId valide ";

  try {
    await channel.permissionOverwrites.create(inputId, {
      VIEW_CHANNEL: true,
      SEND_MESSAGES: true,
    });

    return "Fait";
  } catch (ex) {
    return "Échec de l'ajout de l'utilisateur/du rôle. Avez-vous fourni une pièce d'identité valide ? ";
  }
}

async function removeFromTicket({ channel }, inputId) {
  if (!isTicketChannel(channel)) return "Cette commande ne peut être utilisée que dans le canal de ticket ";
  if (!inputId || isNaN(inputId)) return "Oups! Vous devez saisir un ID utilisateur/roleId valide ";

  try {
    channel.permissionOverwrites.create(inputId, {
      VIEW_CHANNEL: false,
      SEND_MESSAGES: false,
    });
    return "Fait";
  } catch (ex) {
    return "Échec de la suppression de l'utilisateur/du rôle. Avez-vous fourni une pièce d'identité valide ? ";
  }
}
