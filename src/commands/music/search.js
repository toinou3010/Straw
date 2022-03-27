const { Command } = require("@src/structures");
const { Message, MessageEmbed, CommandInteraction, MessageActionRow, MessageSelectMenu } = require("discord.js");
const prettyMs = require("pretty-ms");
const { EMBED_COLORS } = require("@root/config");

module.exports = class Search extends Command {
  constructor(client) {
    super(client, {
      name: "recherche",
      description: "rechercher une musique",
      category: "MUSIC",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        usage: "<nom>",
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "query",
            description: "song to search",
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
    const response = await search(message, message.author, query);
    if (response) await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const query = interaction.options.getString("query");
    const response = await search(interaction, interaction.user, query);
    if (response) await interaction.followUp(response);
    else interaction.deleteReply();
  }
};

async function search({ member, guild, channel }, user, query) {
  if (!member.voice.channel) return "La légende raconte que tu es un idiot, rejoin un salon vocale je suis pas spotify";
  let player = guild.client.musicManager.get(guild.id);

  if (player && member.voice.channel !== guild.me.voice.channel) {
    return "Zut! sa marche pas, rejoin le même salon que moi s'il te plait";
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
      return "Erreur fatale, contacter le serveur d'Assistance";
    }
  }

  if (player.state !== "CONNECTED") player.connect();
  let res;

  try {
    res = await player.search(query, user);
    if (res.loadType === "LOAD_FAILED") {
      if (!player.queue.current) player.destroy();
      throw new Error(res.exception.message);
    }
  } catch (err) {
    guild.client.logger.error("Search Exception", err);
    return "Une erreur est survenus, contacter le serveur d'Assistance";
  }

  let embed = new MessageEmbed().setColor(EMBED_COLORS.BOT_EMBED);
  let track;

  switch (res.loadType) {
    case "NO_MATCHES":
      if (!player.queue.current) player.destroy();
      return `Aucun résultat pour ${query}`;

    case "TRACK_LOADED":
      track = res.tracks[0];
      player.queue.add(track);
      if (!player.playing && !player.paused && !player.queue.size) {
        player.play();
        return "Ajout de la musique a la liste";
      }

      embed
        .setThumbnail(track.displayThumbnail("hqdefault"))
        .setAuthor({ name: "Musique ajouter a la liste" })
        .setDescription(`[${track.title}](${track.uri})`)
        .addField("<:point:955639055511601152>Durée", "`" + prettyMs(track.duration, { colonNotation: true }) + "`", true)
        .setFooter({ text: `Demander par: ${track.requester.tag}` });

      if (player.queue.totalSize > 0) embed.addField("<:point:955639055511601152>Position dans la liste", (player.queue.size - 0).toString(), true);
      return { embeds: [embed] };

    case "PLAYLIST_LOADED":
      player.queue.add(res.tracks);
      if (!player.playing && !player.paused && player.queue.totalSize === res.tracks.length) {
        player.play();
      }

      embed
        .setAuthor({ name: "Ajout de la playlist a la liste" })
        .setDescription(res.playlist.name)
        .addField("<:point:955639055511601152>Mis en liste", `${res.tracks.length} musiques`, true)
        .addField("<:point:955639055511601152>Durée de la playlist", "`" + prettyMs(res.playlist.duration, { colonNotation: true }) + "`", true)
        .setFooter({ text: `Demander par: ${res.tracks[0].requester.tag}` });

      return { embeds: [embed] };

    case "SEARCH_RESULT": {
      let max = guild.client.config.MUSIC.MAX_SEARCH_RESULTS;
      if (res.tracks.length < max) max = res.tracks.length;

      const results = res.tracks.slice(0, max);
      const options = results.map((result, index) => ({
        label: result.title,
        value: index.toString(),
      }));

      const menuRow = new MessageActionRow().addComponents(
        new MessageSelectMenu()
          .setCustomId("search-results")
          .setPlaceholder("Choisissez un résultat")
          .setMaxValues(max)
          .addOptions(options)
      );

      embed.setAuthor({ name: "Résultat de recherche" }).setDescription(`Sélectionne une musique dans la liste`);

      const sentMsg = await channel.send({
        embeds: [embed],
        components: [menuRow],
      });

      const collector = channel.createMessageComponentCollector({
        filter: (reactor) => reactor.user.id === user.id,
        idle: 30 * 1000,
        dispose: true,
      });

      collector.on("collect", async (response) => {
        if (response.customId !== "search-results") return;
        const toAdd = [];
        response.values.forEach((v) => toAdd.push(results[v]));

        // Only 1 song is selected
        if (toAdd.length === 1) {
          track = toAdd[0];

          player.queue.add(track);
          if (!player.playing && !player.paused && !player.queue.size) {
            await sentMsg.edit({
              content: "Ajout de musique a la liste",
              embeds: [],
              components: [],
            });
            return player.play();
          }

          embed
            .setThumbnail(track.displayThumbnail("hqdefault"))
            .setAuthor({ name: "Musique ajouter a la liste" })
            .setDescription(`[${track.title}](${track.uri})`)
            .addField("<:point:955639055511601152>Durée", "`" + prettyMs(track.duration, { colonNotation: true }) + "`", true)
            .setFooter({ text: `Demander par: ${track.requester.tag}` });

          if (player.queue.totalSize > 0) embed.addField("Position dans la liste", (player.queue.size - 0).toString(), true);

          return sentMsg.edit({ embeds: [embed], components: [] });
        }

        // Multiple songs were selected
        player.queue.add(toAdd);
        if (!player.playing && !player.paused && player.queue.totalSize === toAdd.length) {
          player.play();
        }

        embed
          .setDescription(`Ajouter ${toAdd.length} musique a la liste`)
          .setFooter({ text: `Demander par: ${res.tracks[0].requester.tag}` });

        return sentMsg.edit({ embeds: [embed], components: [] });
      });

      collector.on("end", () => sentMsg.edit({ components: [] }));
    }
  }
}
