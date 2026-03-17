const { Client, GatewayIntentBits } = require('discord.js');
const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const player = new Player(client);

// load extractors
(async () => {
  await player.extractors.loadMulti(DefaultExtractors);
})();

client.once('clientReady', () => {
  console.log('🔥 Bot ready');
});

// 🎧 EVENTS (autoplay + logs)
player.events.on('playerStart', (queue, track) => {
  queue.metadata.channel.send(`🎶 Now playing: **${track.title}**`);
});

player.events.on('playerFinish', (queue) => {
  if (queue.tracks.size === 0) {
    queue.metadata.channel.send('🔁 Queue ended');
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const args = message.content.split(' ');
  const command = args[0];

  // 🎧 PLAY
  if (command === '!play') {
    const query = args.slice(1).join(' ');
    if (!query) return message.reply('❌ Give song name');

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('❌ Join VC first');

    try {
      await player.play(voiceChannel, query, {
        nodeOptions: {
          metadata: message
        }
      });

    } catch (err) {
      console.error(err);
      message.reply('❌ Error playing song');
    }
  }

  // ⏭️ SKIP
  if (command === '!skip') {
    const queue = player.nodes.get(message.guild.id);
    if (!queue || !queue.isPlaying()) {
      return message.reply('❌ Nothing playing');
    }

    queue.node.skip();
    message.reply('⏭️ Skipped!');
  }

  // ⏹️ STOP
  if (command === '!stop') {
    const queue = player.nodes.get(message.guild.id);
    if (!queue) return message.reply('❌ Nothing playing');

    queue.delete();
    message.reply('⏹️ Stopped music');
  }

  // 🔊 VOLUME
  if (command === '!volume') {
    const queue = player.nodes.get(message.guild.id);
    if (!queue) return message.reply('❌ Nothing playing');

    const vol = parseInt(args[1]);
    if (!vol || vol < 0 || vol > 100) {
      return message.reply('❌ Volume must be 0-100');
    }

    queue.node.setVolume(vol);
    message.reply(`🔊 Volume set to ${vol}%`);
  }

  // 📃 QUEUE
  if (command === '!queue') {
    const queue = player.nodes.get(message.guild.id);
    if (!queue || !queue.tracks.size) {
      return message.reply('❌ Queue is empty');
    }

    const tracks = queue.tracks.toArray().slice(0, 5);
    const list = tracks.map((t, i) => `${i + 1}. ${t.title}`).join('\n');

    message.reply(`📃 Queue:\n${list}`);
  }

  // 🔁 AUTOPLAY
  if (command === '!autoplay') {
    const queue = player.nodes.get(message.guild.id);
    if (!queue) return message.reply('❌ Nothing playing');

    queue.setRepeatMode(3); // autoplay mode
    message.reply('🔁 Autoplay enabled');
  }
});

//
client.login(process.env.TOKEN);