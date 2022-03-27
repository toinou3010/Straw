const { permissions, parsePermissions } = require("@utils/botUtils");
const { timeformat } = require("@utils/miscUtils");

class BaseContext {
  /**
   * @typedef {Object} ContextData
   * @property {string} name - The name of the command (must be lowercase)
   * @property {string} description - A short description of the command
   * @property {"USER"|"MESSAGE"} type - The type of application command
   * @property {boolean} [enabled] - Whether the slash command is enabled or not
   * @property {boolean} [ephemeral] - Whether the reply should be ephemeral
   * @property {boolean} [defaultPermission] - Whether default permission must be enabled
   * @property {import('discord.js').PermissionResolvable[]} [userPermissions] - Permissions required by the user to use the command.
   * @property {number} [cooldown] - Command cooldown in seconds
   */

  /**
   * @param {import('discord.js').Client} client - The discord client
   * @param {ContextData} data - The context information
   */
  constructor(client, data) {
    this.constructor.validateInfo(client, data);
    if (typeof this.run !== "function") throw new Error("Missing run() method");
    this.client = client;
    this.name = data.name;
    this.description = data.description;
    this.type = data.type;
    this.enabled = Object.prototype.hasOwnProperty.call(data, "enabled") ? data.enabled : true;
    this.ephemeral = Object.prototype.hasOwnProperty.call(data, "ephemeral") ? data.ephemeral : false;
    this.options = Object.prototype.hasOwnProperty.call(data, "defaultPermission") ? data.defaultPermission : true;
    this.userPermissions = data.userPermissions || [];
    this.cooldown = data.cooldown || 0;
  }

  /**
   * @param {import('discord.js').ContextMenuInteraction} interaction
   */
  async execute(interaction) {
    if (this.cooldown > 0) {
      const remaining = this.getRemainingCooldown(interaction.user.id);
      if (remaining > 0) {
        return interaction.reply({
          content: `Vous êtes en temps de repos. Vous pouvez à nouveau utiliser la commande après ${timeformat(remaining)}`,
          ephemeral: true,
        });
      }
    }

    if (interaction.member && this.userPermissions.length > 0) {
      if (!interaction.member.permissions.has(this.userPermissions)) {
        return interaction.reply({
          content: `Tu as besoin de ${parsePermissions(this.userPermissions)} pour cet commande`,
          ephemeral: true,
        });
      }
    }

    try {
      await interaction.deferReply({ ephemeral: this.ephemeral });
      await this.run(interaction);
    } catch (ex) {
      interaction.followUp("Oups ! Une erreur s'est produite lors de l'exécution de la commande, je vais chialer");
      this.client.logger.error("contextRun", ex);
    } finally {
      this.applyCooldown(interaction.user.id);
    }
  }

  /**
   * Get remaining cooldown for the user
   * @param {string} userId
   */
  getRemainingCooldown(userId) {
    const key = this.name + "|" + userId;
    if (this.client.ctxCooldownCache.has(key)) {
      const remaining = (Date.now() - this.client.ctxCooldownCache.get(key)) * 0.001;
      if (remaining > this.cooldown) {
        this.client.ctxCooldownCache.delete(key);
        return 0;
      }
      return this.cooldown - remaining;
    }
    return 0;
  }

  /**
   * Apply cooldown to the user
   * @param {string} memberId
   */
  applyCooldown(memberId) {
    const key = this.name + "|" + memberId;
    this.client.ctxCooldownCache.set(key, Date.now());
  }

  /**
   * Validates constructor parameters
   * @param {import('discord.js').Client} client
   * @param {ContextData} data
   * @private
   */
  static validateInfo(client, data) {
    if (!client) throw new Error("Un client doit être spécifier");
    if (typeof data !== "object") {
      throw new TypeError("Context de données doit être un objet");
    }
    if (typeof data.name !== "string" || data.name !== data.name.toLowerCase()) {
      throw new Error("Le nom du contexte doit être une chaîne de caractères en minuscules.");
    }
    if (typeof data.description !== "string") {
      throw new TypeError("La description du contexte doit être une chaîne de caractères.");
    }
    if (data.type !== "USER" && data.type !== "MESSAGE") {
      throw new TypeError("Le type de contexte doit être soit UTILISATEUR/MESSAGE.");
    }
    if (Object.prototype.hasOwnProperty.call(data, "enabled") && typeof data.enabled !== "boolean") {
      throw new TypeError("Le contexte activé doit être une valeur booléenne.");
    }
    if (Object.prototype.hasOwnProperty.call(data, "ephemeral") && typeof data.ephemeral !== "boolean") {
      throw new TypeError("Le contexte activé doit être une valeur booléenne.AAA");
    }
    if (
      Object.prototype.hasOwnProperty.call(data, "defaultPermission") &&
      typeof data.defaultPermission !== "boolean"
    ) {
      throw new TypeError("Contexte defaultPermission doit être une valeur booléenne");
    }
    if (Object.prototype.hasOwnProperty.call(data, "cooldown") && typeof data.cooldown !== "number") {
      throw new TypeError("Le délai de récupération du contexte doit être un nombre");
    }
    if (data.userPermissions) {
      if (!Array.isArray(data.userPermissions)) {
        throw new TypeError("Le contexte userPermissions doit être un tableau de chaînes de clés de permission");
      }
      for (const perm of data.userPermissions) {
        if (!permissions[perm]) throw new RangeError(`Commande non valide userPermission: ${perm}`);
      }
    }
  }
}

module.exports = BaseContext;
