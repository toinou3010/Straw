const { Command, CommandCategory, BotClient } = require("@src/structures");
const { EMBED_COLORS, SUPPORT_SERVER } = require("@root/config.js");
const {
  MessageEmbed,
  MessageActionRow,
  MessageSelectMenu,
  Message,
  MessageButton,
  CommandInteraction,
} = require("discord.js");

const CMDS_PER_PAGE = 5;
const IDLE_TIMEOUT = 30;
const cache = {};

module.exports = class HelpCommand extends Command {
  constructor(client) {
    super(client, {
      name: "aide",
      description: "command help menu",
      category: "UTILITY",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        usage: "[command]",
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "commande",
            description: "nom de la commande",
            required: false,
            type: "STRING",
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
    let trigger = args[0];

    // !help
    if (!trigger) {
      if (cache[`${message.guildId}|${message.author.id}`]) {
        return message.reply("Tu regarde déja la page d'aide, Baka!.");
      }
      const response = await getHelpMenu(message);
      const sentMsg = await message.reply(response);
      return waiter(sentMsg, message.author.id, data.prefix);
    }

    // check if command help (!help cat)
    const cmd = this.client.getCommand(trigger);
    if (cmd) return cmd.sendUsage(message.channel, data.prefix, trigger);

    // No matching command/category found
    await message.reply("Zut! Aucune commande trouver");
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    let cmdName = interaction.options.getString("commande");

    // !help
    if (!cmdName) {
      if (cache[`${interaction.guildId}|${interaction.user.id}`]) {
        return interaction.followUp("Tu regarde déja la page d'aide, Baka!");
      }
      const response = await getHelpMenu(interaction);
      const sentMsg = await interaction.followUp(response);
      return waiter(sentMsg, interaction.user.id);
    }

    // check if command help (!help cat)
    const cmd = this.client.slashCommands.get(cmdName);
    if (cmd) {
      const embed = cmd.getSlashUsage();
      return interaction.followUp({ embeds: [embed] });
    }

    // No matching command/category found
    await interaction.followUp("Zut! Aucune commande trouver");
  }
};

/**
 * @param {CommandInteraction} interaction
 */
async function getHelpMenu({ client, guild }) {
  // Menu Row
  const options = [];
  const keys = Object.keys(CommandCategory);
  keys.forEach((key) => {
    const value = CommandCategory[key];
    const data = {
      label: value.name,
      value: key,
      description: `Voir les commandes de la catégorie ${value.name}`,
      emoji: value.emoji,
    };
    options.push(data);
  });

  const menuRow = new MessageActionRow().addComponents(
    new MessageSelectMenu().setCustomId("help-menu").setPlaceholder("Choisir une catégorie de commande").addOptions(options)
  );

  // Buttons Row
  let components = [];
  components.push(
    new MessageButton().setCustomId("previousBtn").setEmoji("⬅️").setStyle("SECONDARY").setDisabled(true),
    new MessageButton().setCustomId("nextBtn").setEmoji("➡️").setStyle("SECONDARY").setDisabled(true)
  );
	if (SUPPORT_SERVER) {
    components.push(new MessageButton().setLabel("🍣 Straw Café め").setURL(SUPPORT_SERVER).setStyle("LINK"));
  }

  let buttonsRow = new MessageActionRow().addComponents(components);

  const embed = new MessageEmbed()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setThumbnail(client.user.displayAvatarURL())
    .setDescription(
      "**<:point:955639055511601152> À propos de moi:**\n" +
        `Je suis Straw!\n` +
        "Je serais la baby-sitters sur votre serveur pendant votre absences, Je sais presque tout faire, Je suis en maintenance mais mes commandes marche tres bien sauf `rank, giveaways`\n\n" +
        `<:point:955639055511601152> **Invite Moi:** [Aller clique](${client.getInvite()})\n` +
        `<:point:955639055511601152> **Serveur d'Assistance:** [Straw Café](${SUPPORT_SERVER})`
    );

  return {
    embeds: [embed],
    components: [menuRow, buttonsRow],
  };
}

/**
 * @param {Message} msg
 * @param {string} userId
 * @param {string} prefix
 */
const waiter = (msg, userId, prefix) => {
  // Add to cache
  cache[`${msg.guildId}|${userId}`] = Date.now();

  const collector = msg.channel.createMessageComponentCollector({
    filter: (reactor) => reactor.user.id === userId,
    idle: IDLE_TIMEOUT * 1000,
    dispose: true,
    time: 5 * 60 * 1000,
  });

  let arrEmbeds = [];
  let currentPage = 0;
  let menuRow = msg.components[0];
  let buttonsRow = msg.components[1];

  collector.on("collect", async (response) => {
    if (!["help-menu", "previousBtn", "nextBtn"].includes(response.customId)) return;
    await response.deferUpdate();

    switch (response.customId) {
      case "help-menu": {
        const cat = response.values[0].toUpperCase();
        arrEmbeds = prefix ? getMsgCategoryEmbeds(msg.client, cat, prefix) : getSlashCategoryEmbeds(msg.client, cat);
        currentPage = 0;
        buttonsRow.components.forEach((button) => button.setDisabled(arrEmbeds.length > 1 ? false : true));
        msg.editable && (await msg.edit({ embeds: [arrEmbeds[currentPage]], components: [menuRow, buttonsRow] }));
        break;
      }

      case "previousBtn":
        if (currentPage !== 0) {
          --currentPage;
          msg.editable && (await msg.edit({ embeds: [arrEmbeds[currentPage]], components: [menuRow, buttonsRow] }));
        }
        break;

      case "nextBtn":
        if (currentPage < arrEmbeds.length - 1) {
          currentPage++;
          msg.editable && (await msg.edit({ embeds: [arrEmbeds[currentPage]], components: [menuRow, buttonsRow] }));
        }
        break;
    }
  });

  collector.on("end", () => {
    if (cache[`${msg.guildId}|${userId}`]) delete cache[`${msg.guildId}|${userId}`];
    if (!msg.guild || !msg.channel) return;
    return msg.editable && msg.edit({ components: [] });
  });
};

/**
 * Returns an array of message embeds for a particular command category [SLASH COMMANDS]
 * @param {BotClient} client
 * @param {string} category
 */
function getSlashCategoryEmbeds(client, category) {
  let collector = "";

  // For IMAGE Category
  if (category === "IMAGE") {
    client.slashCommands
      .filter((cmd) => cmd.category === category)
      .forEach((cmd) => (collector += `\`/${cmd.name}\`\n <:point:955639055511601152> ${cmd.description}\n\n`));

    const availableFilters = client.slashCommands
      .get("filter")
      .slashCommand.options[0].choices.map((ch) => ch.name)
      .join(", ");

    const availableGens = client.slashCommands
      .get("generator")
      .slashCommand.options[0].choices.map((ch) => ch.name)
      .join(", ");

    collector +=
      "**Filtres disponnible:**\n" + `${availableFilters}` + `*\n\n**Générateur disponnible**\n` + `${availableGens}`;

    const embed = new MessageEmbed()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setThumbnail(CommandCategory[category]?.image)
      .setAuthor({ name: `${category} Commandes` })
      .setDescription(collector);

    return [embed];
  }

  // For REMAINING Categories
  const commands = Array.from(client.slashCommands.filter((cmd) => cmd.category === category).values());

  if (commands.length === 0) {
    const embed = new MessageEmbed()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setThumbnail(CommandCategory[category]?.image)
      .setAuthor({ name: `${category} Commandes` })
      .setDescription("Circuler y'as rien à voir");

    return [embed];
  }

  const arrSplitted = [];
  const arrEmbeds = [];

  while (commands.length) {
    let toAdd = commands.splice(0, commands.length > CMDS_PER_PAGE ? CMDS_PER_PAGE : commands.length);

    toAdd = toAdd.map((cmd) => {
      const subCmds = cmd.slashCommand.options.filter((opt) => opt.type === "SUB_COMMAND");
      const subCmdsString = subCmds.map((s) => s.name).join(", ");

      return `\`/${cmd.name}\`\n <:point:955639055511601152> **Description**: ${cmd.description}\n ${
        subCmds == 0 ? "" : `<:point:955639055511601152> **SubCommands [${subCmds.length}]**: ${subCmdsString}\n`
      } `;
    });

    arrSplitted.push(toAdd);
  }

  arrSplitted.forEach((item, index) => {
    const embed = new MessageEmbed()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setThumbnail(CommandCategory[category]?.image)
      .setAuthor({ name: `${category} Commandes` })
      .setDescription(item.join("\n"))
      .setFooter({ text: `page ${index + 1} sur ${arrSplitted.length}` });
    arrEmbeds.push(embed);
  });

  return arrEmbeds;
}

/**
 * Returns an array of message embeds for a particular command category [MESSAGE COMMANDS]
 * @param {BotClient} client
 * @param {string} category
 * @param {string} prefix
 */
function getMsgCategoryEmbeds(client, category, prefix) {
  let collector = "";

  // For IMAGE Category
  if (category === "IMAGE") {
    client.commands
      .filter((cmd) => cmd.category === category)
      .forEach((cmd) =>
        cmd.command.aliases.forEach((alias) => {
          collector += `\`${alias}\`, `;
        })
      );

    collector +=
      "\n\nYou can use these image commands in following formats\n" +
      `**${prefix}cmd:** Picks message authors avatar as image\n` +
      `**${prefix}cmd <@member>:** Picks mentioned members avatar as image\n` +
      `**${prefix}cmd <url>:** Picks image from provided URL\n` +
      `**${prefix}cmd [attachment]:** Picks attachment image`;

    const embed = new MessageEmbed()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setThumbnail(CommandCategory[category]?.image)
      .setAuthor({ name: `${category} Commandes` })
      .setDescription(collector);

    return [embed];
  }

  // For REMAINING Categories
  const commands = client.commands.filter((cmd) => cmd.category === category);

  if (commands.length === 0) {
    const embed = new MessageEmbed()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setThumbnail(CommandCategory[category]?.image)
      .setAuthor({ name: `${category} Commandes` })
      .setDescription("Circuler y'as rien a voir");

    return [embed];
  }

  const arrSplitted = [];
  const arrEmbeds = [];

  while (commands.length) {
    let toAdd = commands.splice(0, commands.length > CMDS_PER_PAGE ? CMDS_PER_PAGE : commands.length);
    toAdd = toAdd.map((cmd) => `\`${prefix}${cmd.name}\`\n <:point:955639055511601152> ${cmd.description}\n`);
    arrSplitted.push(toAdd);
  }

  arrSplitted.forEach((item, index) => {
    const embed = new MessageEmbed()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setThumbnail(CommandCategory[category]?.image)
      .setAuthor({ name: `${category} Commandes` })
      .setDescription(item.join("\n"))
      .setFooter({
        text: `page ${index + 1} sur ${arrSplitted.length} | Tape ${prefix}aide <commande> pour plus d'information sue une commande, vous serais pas flic par hasard?`,
      });
    arrEmbeds.push(embed);
  });

  return arrEmbeds;
}
