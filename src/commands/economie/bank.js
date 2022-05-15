const { resolveMember } = require("@root/src/utils/guildUtils");
const { Command } = require("@src/structures");
const { Message, CommandInteraction } = require("discord.js");
const balance = require("./sub/balance");
const deposit = require("./sub/deposit");
const transfer = require("./sub/transfer");
const withdraw = require("./sub/withdraw");

module.exports = class BankCommand extends Command {
  constructor(client) {
    super(client, {
      name: "banque",
      description: "accès aux opérations bancaires ",
      category: "ECONOMY",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        minArgsCount: 1,
        subcommands: [
          {
            trigger: "balance",
            description: "vérifier votre solde ",
          },
          {
            trigger: "deposer <pieces>",
            description: "déposer des pièces sur votre compte bancaire ",
          },
          {
            trigger: "retirer <pieces>",
            description: "retirer des pièces de votre compte bancaire ",
          },
          {
            trigger: "transfere <utilisateur> <pieces>",
            description: "transférer des pièces à un autre utilisateur ",
          },
        ],
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "balance",
            description: "vérifier votre solde de pièces ",
            type: "SUB_COMMAND",
            options: [
              {
                name: "utilisateur",
                description: "nom de l'utilisateur ",
                type: "USER",
                required: false,
              },
            ],
          },
          {
            name: "deposer",
            description: "déposer des pièces sur votre compte bancaire ",
            type: "SUB_COMMAND",
            options: [
              {
                name: "pieces",
                description: "nombre de pièces à déposer ",
                type: "INTEGER",
                required: true,
              },
            ],
          },
          {
            name: "retirer",
            description: "retirer des pièces de votre compte bancaire ",
            type: "SUB_COMMAND",
            options: [
              {
                name: "pieces",
                description: "nombre de pièces à retirer ",
                type: "INTEGER",
                required: true,
              },
            ],
          },
          {
            name: "transfere",
            description: "transférer des pièces à un autre utilisateur ",
            type: "SUB_COMMAND",
            options: [
              {
                name: "utilisateur",
                description: "l'utilisateur à qui les pièces doivent être transférées ",
                type: "USER",
                required: true,
              },
              {
                name: "pieces",
                description: "le montant de pièces à transférer ",
                type: "INTEGER",
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
   */
  async messageRun(message, args) {
    const sub = args[0];
    let response;

    if (sub === "balance") {
      const resolved = (await resolveMember(message, args[1])) || message.member;
      response = await balance(resolved.user);
    }

    //
    else if (sub === "deposer") {
      const coins = args.length && parseInt(args[1]);
      if (isNaN(coins)) return message.reply("Indiquez un nombre valide de pièces que vous souhaitez déposer ");
      response = await deposit(message.author, coins);
    }

    //
    else if (sub === "retirer") {
      const coins = args.length && parseInt(args[1]);
      if (isNaN(coins)) return message.reply("Indiquez un nombre valide de pièces que vous souhaitez retirer ");
      response = await withdraw(message.author, coins);
    }

    //
    else if (sub === "transfere") {
      if (args.length < 3) return message.reply("Fournir un utilisateur valide et des pièces à transférer ");
      const target = await resolveMember(message, args[1], true);
      if (!target) return message.reply("Fournir un utilisateur valide pour transférer des pièces vers ");
      const coins = parseInt(args[2]);
      if (isNaN(coins)) return message.reply("Indiquez un nombre valide de pièces que vous souhaitez transférer ");
      response = await transfer(message.author, target.user, coins);
    }

    //
    else {
      return message.reply("Utilisation de la commande non valide ");
    }

    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    let response;

    // balance
    if (sub === "balance") {
      const user = interaction.options.getUser("utilisateur") || interaction.user;
      response = await balance(user);
    }

    // deposit
    else if (sub === "deposer") {
      const coins = interaction.options.getInteger("pieces");
      response = await deposit(interaction.user, coins);
    }

    // withdraw
    else if (sub === "retirer") {
      const coins = interaction.options.getInteger("pieces");
      response = await withdraw(interaction.user, coins);
    }

    // transfer
    else if (sub === "transfere") {
      const user = interaction.options.getUser("utilisateur");
      const coins = interaction.options.getInteger("pieces");
      response = await transfer(interaction.user, user, coins);
    }

    await interaction.followUp(response);
  }
};
