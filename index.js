const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
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

// 🔥 Load extractors
(async () => {
  await player.extractors.loadMulti(DefaultExtractors);
})();

client.once('ready', () => {
  console.log('🔥 Bot ready 24/7!');
});

// 🔥 GLOBAL ERROR HANDLING (VERY IMPORTANT)
player.events.on('error', (queue, error) => {
  console.log('GLOBAL ERROR:', error);
});

player.events.on('playerError', (queue, error) => {
  console.log('PLAYER ERROR:', error);
});

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

// 🔥 KEEP BOT IN VC
async function stayInChannel(voiceChannel) {
  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    selfDeaf: true
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    console.log('✅ Connected and staying 24/7');
  } catch (error) {
    console.log('❌ Connection failed');
    connection.destroy();
  }
}

// 🎵 COMMANDS
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const voiceChannel = message.member?.voice?.channel;

  // 🔥 JOIN (STAY FOREVER)
  if (message.content === '!join') {
    if (!voiceChannel) return message.reply('❌ Join VC first');

    await stayInChannel(voiceChannel);
    return message.reply('✅ I will stay here 24/7 😈');
  }

  // 🎵 PLAY
  if (message.content.startsWith('!play')) {
    if (!voiceChannel) return message.reply('❌ Join VC first');

    const query = message.content.slice(6).trim();
    if (!query) return message.reply('❌ Give song name');

    try {
      const result = await player.play(voiceChannel, query, {
        nodeOptions: {
          metadata: message,
          leaveOnEmpty: false,
          leaveOnEnd: false,
          leaveOnStop: false,
          autoplay: true
        }
      });

      if (!result || !result.track) {
        return message.reply('❌ Could not play this song');
      }

      message.reply(`🎶 Playing: ${result.track.title}`);

    } catch (err) {
      console.error('PLAY ERROR:', err);
      message.reply('❌ Failed to play audio (try another song)');
    }
  }

  // ⏭️ SKIP
  if (message.content === '!skip') {
    const queue = player.nodes.get(message.guild.id);
    if (!queue || !queue.currentTrack) {
      return message.reply('❌ No song to skip');
    }

    queue.node.skip();
    message.reply('⏭️ Skipped!');
  }

  // ⏹️ STOP (BUT STAY IN VC)
  if (message.content === '!stop') {
    const queue = player.nodes.get(message.guild.id);
    if (queue) queue.delete();

    message.reply('⏹️ Stopped (I stay in VC 😎)');
  }

  // 🔊 VOLUME
  if (message.content.startsWith('!volume')) {
    const queue = player.nodes.get(message.guild.id);
    if (!queue) return message.reply('❌ No music playing');

    const vol = parseInt(message.content.split(' ')[1]);
    if (isNaN(vol) || vol < 0 || vol > 100) {
      return message.reply('❌ Volume must be 0-100');
    }

    queue.node.setVolume(vol);
    message.reply(`🔊 Volume set to ${vol}%`);
  }
});

client.login(process.env.TOKEN);