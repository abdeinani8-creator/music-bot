require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const { Player } = require('discord-player');
const Groq = require("groq-sdk");

// 🔥 FIX: force ffmpeg path
process.env.FFMPEG_PATH = require('ffmpeg-static');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 🎵 PLAYER (STRONG CONFIG)
const player = new Player(client, {
  ytdlOptions: {
    filter: "audioonly",
    quality: "highestaudio",
    highWaterMark: 1 << 25
  }
});

// ✅ LOAD EXTRACTORS
(async () => {
  await player.extractors.loadDefault();
})();

// 🔥 ERROR HANDLING (IMPORTANT)
player.events.on('error', (queue, error) => {
  console.log('PLAYER ERROR:', error);
});

player.events.on('playerError', (queue, error) => {
  console.log('PLAYER ERROR:', error);
});

// 🤖 AI
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

client.once('clientReady', () => {
  console.log('🔥 Bot ready!');
});

// 🔊 STAY IN VC 24/7
async function stayInChannel(voiceChannel) {
  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    selfDeaf: false
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    console.log("✅ Connected (24/7 mode)");
  } catch {
    connection.destroy();
  }
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const voiceChannel = message.member?.voice?.channel;

  // 🔥 JOIN (STAY FOREVER)
  if (message.content === '!join') {
    if (!voiceChannel) return message.reply('❌ Join VC first');

    await stayInChannel(voiceChannel);
    return message.reply('✅ I stay here 24/7 😈');
  }

  // 🎵 PLAY
  if (message.content.startsWith('!play')) {
    if (!voiceChannel) return message.reply('❌ Join VC first');

    const query = message.content.slice(6).trim();
    if (!query) return message.reply('❌ Give song name');

    try {
      const result = await player.play(voiceChannel, query, {
        searchEngine: "youtube",
        nodeOptions: {
          leaveOnEmpty: false,
          leaveOnEnd: false,
          leaveOnStop: false,
          volume: 80
        }
      });

      if (!result || !result.track) {
        return message.reply('❌ No results found');
      }

      message.reply(`🎶 Playing: ${result.track.title}`);

    } catch (err) {
      console.error("MUSIC ERROR:", err);
      message.reply('❌ Error playing music');
    }
  }

  // ⏭️ SKIP
  if (message.content === '!skip') {
    const queue = player.nodes.get(message.guild.id);
    if (!queue || !queue.currentTrack) {
      return message.reply('❌ Nothing to skip');
    }

    queue.node.skip();
    message.reply('⏭️ Skipped');
  }

  // ⏹️ STOP (BUT STAY IN VC)
  if (message.content === '!stop') {
    const queue = player.nodes.get(message.guild.id);
    if (queue) queue.delete();

    message.reply('⏹️ Stopped (still in VC 😎)');
  }

  // 🤖 AI
  if (message.content.startsWith('!ai')) {
    const userMessage = message.content.replace('!ai', '').trim();
    if (!userMessage) return message.reply('❌ Write something');

    try {
      const res = await groq.chat.completions.create({
        messages: [
          { role: "system", content: "You are a helpful Discord bot." },
          { role: "user", content: userMessage }
        ],
        model: "llama-3.1-8b-instant"
      });

      message.reply(res.choices[0].message.content);

    } catch (err) {
      console.error("AI ERROR:", err);
      message.reply('❌ AI error');
    }
  }

});

client.login(process.env.TOKEN);
