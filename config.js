module.exports = {
  OWNER_IDS: ["499447456678019072", "635889581887062076"], // Créateur(s) du bot
  PREFIX: ".", // Prefix par defaut
  SUPPORT_SERVER: "https://discord.gg/qsnUGDSHGt", // Serveur d'Assistance
  PRESENCE: {
    ENABLED: true,
    STATUS: "online",
    TYPE: "WATCHING",
    MESSAGE: ".help",
  },
  DASHBOARD: {
    enabled: false,
    baseURL: "https://korone.strawcafe.repl.co:8080",
    failureURL: "https://korone.strawcafe.repl.co:8080",
    port: "8080",
  },
  INTERACTIONS: {
    SLASH: true,
    CONTEXT: true,
    GLOBAL: true,
    TEST_GUILD_ID: "681797849926860810",
  },
  XP_SYSTEM: {
    COOLDOWN: 5,
    DEFAULT_LVL_UP_MSG: "Bravo tu viens de monter aux **Niveau {l}**",
  },
  MISCELLANEOUS: {
    DAILY_COINS: 1000,
  },
  ECONOMY: {
    CURRENCY: "❀",
    DAILY_COINS: 1000,
    MIN_BEG_AMOUNT: 100,
    MAX_BEG_AMOUNT: 2500,
  },
  SUGGESTIONS: {
    ENABLED: true,
    EMOJI: {
      UP_VOTE: "⬆️",
      DOWN_VOTE: "⬇️",
    },
    DEFAULT_EMBED: "#303136",
    APPROVED_EMBED: "#00ff00",
    DENIED_EMBED: "#ff0000",
  },
  IMAGE: {
    BASE_API: "https://image-api.strangebot.xyz",
  },
  MUSIC: {
    IDLE_TIME: 1000,
    MAX_SEARCH_RESULTS: 10,
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
    BOT_EMBED: "#303136",
    TRANSPARENT: "#303136",
    SUCCESS: "#303136",
    ERROR: "#303136",
    WARNING: "#303136",
    AUTOMOD: "#303136",
    TICKET_CREATE: "#303136",
    TICKET_CLOSE: "#303136",
    TIMEOUT_LOG: "#303136",
    UNTIMEOUT_LOG: "#303136",
    KICK_LOG: "#303136",
    SOFTBAN_LOG: "#303136",
    BAN_LOG: "#303136",
    VMUTE_LOG: "#303136",
    VUNMUTE_LOG: "#303136",
    DEAFEN_LOG: "#303136",
    UNDEAFEN_LOG: "#303136",
    DISCONNECT_LOG: "303136",
    MOVE_LOG: "303136",
    GIVEAWAYS: "#303136",
  },
  /* Nombre maximal de clés pouvant être stockées */
  CACHE_SIZE: {
    GUILDS: 100,
    USERS: 1000,
    MEMBERS: 1000,
  },
  MESSAGES: {
    API_ERROR: "Erreur inattendue dans le backend ! Essayez à nouveau plus tard ou contactez le serveur d'assistance",
  },
};
