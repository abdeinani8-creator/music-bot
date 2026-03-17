const { Client, GatewayIntentBits } = require('discord.js');
const { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource,
  AudioPlayerStatus,
  entersState,
  VoiceConnectionStatus
} = require('@discordjs/voice');

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

(async () => {
  await player.extractors.loadMulti(DefaultExtractors);
})();

client.once('ready', () => {
  console.log('🔥 Bot ready 24/7!');
});


// 🔥 KEEP ALIVE FUNCTION
async function stayInChannel(voiceChannel) {
  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    selfDeaf: true
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    console.log('✅ Staying in voice channel 24/7');
  } catch (error) {
    console.log('❌ Failed to connect');
    connection.destroy();
  }

  return connection;
}


// 🎵 COMMANDS
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const voiceChannel = message.member.voice.channel;

  // 🔥 JOIN COMMAND (stay forever)
  if (message.content === '!join') {
    if (!voiceChannel) return message.reply('❌ Join VC first');

    await stayInChannel(voiceChannel);

    message.reply('✅ I will stay here 24/7 😈');
  }

  // 🎵 PLAY
  if (message.content.startsWith('!play')) {
    if (!voiceChannel) return message.reply('❌ Join VC first');

    const query = message.content.slice(6);

    if (!query) return message.reply('❌ Give song name');

    try {
      await player.play(voiceChannel, query, {
        nodeOptions: {
          metadata: message,
          leaveOnEmpty: false,      // ❌ DON'T LEAVE
          leaveOnEnd: false,        // ❌ DON'T LEAVE
          leaveOnStop: false,       // ❌ DON'T LEAVE
          autoplay: true            // ✅ CONTINUE MUSIC
        }
      });

      message.reply(`🎶 Playing: ${query}`);
    } catch (err) {
      console.error(err);
      message.reply('❌ Error playing');
    }
  }

  // 🔇 STOP BUT STAY IN VC
  if (message.content === '!stop') {
    const queue = player.nodes.get(message.guild.id);
    if (queue) queue.delete();

    message.reply('⏹️ Stopped BUT staying in VC 😎');
  }
});

client.login(process.env.TOKEN);