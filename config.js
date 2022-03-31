module.exports = {
  OWNER_IDS: ["499447456678019072", "635889581887062076"], // Créateur du bot
  PREFIX: ".", // Prefix par defaut
  SUPPORT_SERVER: "https://discord.gg/qsnUGDSHGt", // Serveur d'Assistance
  PRESENCE: {
    ENABLED: true,
    STATUS: "online",
    TYPE: "STREAMING",
    MESSAGE: ".aide | En Maintenance",
  },
  DASHBOARD: {
    enabled: true,
    baseURL: "https://strawcafe.herokuapp.com:8080",
    failureURL: "https://strawcafe.herokuapp.com:8080",
    port: "8080",
  },
  INTERACTIONS: {
    SLASH: false,
    CONTEXT: false,
    GLOBAL: false,
    TEST_GUILD_ID: "xxxxxxxxxx",
  },
  XP_SYSTEM: {
    COOLDOWN: 5,
    DEFAULT_LVL_UP_MSG: "Bravo tu viens de monter aux **Niveau {l}**",
  },
  MISCELLANEOUS: {
    DAILY_COINS: 100,
  },
  ECONOMY: {
    CURRENCY: "❀",
    DAILY_COINS: 100,
    MIN_BEG_AMOUNT: 100,
    MAX_BEG_AMOUNT: 2500,
  },
  SUGGESTIONS: {
    ENABLED: true,
    EMOJI: {
      UP_VOTE: "⬆️",
      DOWN_VOTE: "⬇️",
    },
    DEFAULT_EMBED: "#febf4b",
    APPROVED_EMBED: "#00ff00",
    DENIED_EMBED: "#ff0000",
  },
  IMAGE: {
    BASE_API: "https://image-api.strangebot.xyz",
  },
  MUSIC: {
    IDLE_TIME: 60,
    MAX_SEARCH_RESULTS: 5,
    NODES: [
      {
        host: "ger.lavalink.mitask.tech",
        port: 2333,
        password: "lvserver",
        identifier: "German Link",
        retryDelay: 5000,
        secure: false,
      },
      {
        host: "usa.lavalink.mitask.tech",
        port: 2333,
        password: "lvserver",
        identifier: "USA Link",
        retryDelay: 5000,
        secure: false,
      },
    ],
  },
  /* Couleurs des embed */
  EMBED_COLORS: {
    BOT_EMBED: "#febf4b",
    TRANSPARENT: "#febf4b",
    SUCCESS: "#B2FF5B",
    ERROR: "#FFC387",
    WARNING: "#FFC387",
    AUTOMOD: "#98755B",
    TICKET_CREATE: "#98755B",
    TICKET_CLOSE: "#98755B",
    TIMEOUT_LOG: "#98755B",
    UNTIMEOUT_LOG: "#98755B",
    KICK_LOG: "#98755B",
    SOFTBAN_LOG: "#98755B",
    BAN_LOG: "#98755B",
    VMUTE_LOG: "#98755B",
    VUNMUTE_LOG: "#98755B",
    DEAFEN_LOG: "#98755B",
    UNDEAFEN_LOG: "#98755B",
    DISCONNECT_LOG: "98755B",
    MOVE_LOG: "98755B",
    GIVEAWAYS: "#98755B",
  },
  /* Nombre maximal de clés pouvant être stockées */
  CACHE_SIZE: {
    GUILDS: 100,
    USERS: 10000,
    MEMBERS: 10000,
  },
  MESSAGES: {
    API_ERROR: "Erreur inattendue dans le backend ! Essayez à nouveau plus tard ou contactez le serveur d'assistance",
  },
};
