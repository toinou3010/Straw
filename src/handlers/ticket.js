const { getTicketConfig } = require("@schemas/Message");
const { closeTicket, openTicket } = require("@utils/ticketUtils");

/**
 * @param {import("discord.js").ButtonInteraction} interaction
 */
async function handleTicketOpen(interaction) {
  const config = await getTicketConfig(interaction.guildId, interaction.channelId, interaction.message.id);
  if (!config) return;

  const status = await openTicket(interaction.guild, interaction.user, config.ticket);

  if (status === "MISSING_PERMISSIONS") {
    return interaction.followUp(
      "Impossible de créer un canal de tickets, il manque la permission `Gérer le salon`. Contactez le gestionnaire du serveur pour obtenir de l'aide !"
    );
  }

  if (status === "ALREADY_EXISTS") {
    return interaction.followUp(`Vous avez déjà un ticket ouvert, Baka!`);
  }

  if (status === "TOO_MANY_TICKETS") {
    return interaction.followUp("Il y a trop de tickets ouverts. Réessayez plus tard");
  }

  if (status === "FAILED") {
    return interaction.followUp("Échec de la création du canal de tickets, une erreur s'est produite !");
  }

  await interaction.followUp(`Ticket créer!`);
}

/**
 * @param {import("discord.js").ButtonInteraction} interaction
 */
async function handleTicketClose(interaction) {
  const status = await closeTicket(interaction.channel, interaction.user);
  if (status === "MISSING_PERMISSIONS") {
    return interaction.followUp("Impossible de fermer le ticket, permissions manquantes. Contactez le gestionnaire du serveur pour obtenir de l'aide !");
  } else if (status == "ERROR") {
    return interaction.followUp("Impossible de fermer le ticket, une erreur s'est produite !");
  }
}

module.exports = {
  handleTicketOpen,
  handleTicketClose,
};
