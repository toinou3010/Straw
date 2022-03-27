const { Command } = require("@src/structures");
const { Message, MessageEmbed, CommandInteraction } = require("discord.js");
const prettyMs = require("pretty-ms");
const { EMBED_COLORS } = require("@root/config");

module.exports = class Play extends Command {
  constructor(client) {
    super(client, {
      name: "play",
      description: "jouer de la musique sur discord",
      category: "MUSIC",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        usage: "<musique>",
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "query",
            description: "song name or url",
            type: "STRING",
            required: true,
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
    const query = args.join(" ");
    const response = await play(message, message.author, query);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const query = interaction.options.getString("query");
    const response = await play(interaction, interaction.user, query);
    await interaction.followUp(response);
  }
};

async function play({ member, guild, channel }, user, query) {
  if (!member.voice.channel) return "❀ Oh grand genie que vous êtes que votre grande sagesse vous guide jusqu'as un vocale, non serieux rejoin un vocale je suis pas spotify, Baka!";
  let player = guild.client.musicManager.get(guild.id);

  if (player && member.voice.channel !== guild.me.voice.channel) {
    return "❀ Tu doit être dans le même salon que moi";
  }

  try {
    player = guild.client.musicManager.create({
      guild: guild.id,
      textChannel: channel.id,
      voiceChannel: member.voice.channel.id,
      volume: 50,
    });
  } catch (ex) {
    if (ex.message === "No available nodes.") {
      guild.client.logger.debug("No available nodes!");
      return "❀ J'ai rencontrer une erreur attendais le temps que je discute avec l'erreur et vous pouvais refaire la commande";
    }
  }

  if (player.state !== "CONNECTED") player.connect();
  let res;

  try {
    res = await player.search(query, user);
    if (res.loadType === "LOAD_FAILED") {
      if (!player.queue.current) player.destroy();
      throw res.exception;
    }
  } catch (err) {
    guild.client.logger.error("Search Exception", err);
    return "❀ Erreur lors de la recherche";
  }

  let embed = new MessageEmbed().setColor(EMBED_COLORS.BOT_EMBED);
  let track;

  switch (res.loadType) {
    case "NO_MATCHES":
      if (!player.queue.current) player.destroy();
      return `Aucun résultats pour ${query}`;

    case "TRACK_LOADED":
      track = res.tracks[0];
      player.queue.add(track);
      if (!player.playing && !player.paused && !player.queue.size) {
        player.play();
        return "> ❀ Ajout de musique a la liste";
      }

      embed
        .setAuthor({ name: "❀ Musique ajouter a la liste" })
        .setDescription(`[${track.title}](${track.uri})`)
        .addField("<:point:955639055511601152>Durée :", "`" + prettyMs(track.duration, { colonNotation: true }) + "`", true)
        .setFooter({ text: `Demander par: ${track.requester.tag}` });

      if (typeof track.displayThumbnail === "function") embed.setThumbnail(track.displayThumbnail("hqdefault"));
      if (player.queue.totalSize > 0) embed.addField("<:point:955639055511601152>Position dans la liste", (player.queue.size - 0).toString(), true);
      return { embeds: [embed] };

    case "PLAYLIST_LOADED":
      player.queue.add(res.tracks);
      if (!player.playing && !player.paused && player.queue.totalSize === res.tracks.length) {
        player.play();
      }

      embed
        .setAuthor({ name: "❀ Playlist ajouter a la liste" })
        .setDescription(res.playlist.name)
        .addField("<:point:955639055511601152>Mis en liste", `${res.tracks.length} musique`, true)
        .addField("<:point:955639055511601152>Durée de la playlist", "`" + prettyMs(res.playlist.duration, { colonNotation: true }) + "`", true)
        .setFooter({ text: `Demander par: ${res.tracks[0].requester.tag}` });

      return { embeds: [embed] };

    case "SEARCH_RESULT":
      track = res.tracks[0];
      player.queue.add(track);
      if (!player.playing && !player.paused && !player.queue.size) {
        player.play();
        return "> ❀ Ajout à la liste";
      }

      embed
        .setAuthor({ name: "❀ Ajouter à la liste" })
        .setDescription(`[${track.title}](${track.uri})`)
        .addField("<:point:955639055511601152>Durée", "`" + prettyMs(track.duration, { colonNotation: true }) + "`", true)
        .setFooter({ text: `Demander par: ${track.requester.tag}` });

      if (player.queue.totalSize > 0) embed.addField("<:point:955639055511601152>Position dans la liste", (player.queue.size - 0).toString(), true);
      return { embeds: [embed] };
  }
}
