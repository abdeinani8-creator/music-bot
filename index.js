require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');
const Groq = require("groq-sdk");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 🎵 PLAYER (FIXED AUDIO SETTINGS)
const player = new Player(client);

(async () => {
  await player.extractors.loadMulti(DefaultExtractors);
})();

// 🤖 FREE AI
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

client.once('ready', () => {
  console.log('🔥 Bot ready 24/7 with FREE AI!');
});

// 🔥 KEEP BOT IN VC (FIXED)
async function stayInChannel(voiceChannel) {
  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    selfDeaf: false // 👈 IMPORTANT FIX (was true)
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    console.log('✅ Connected and can play sound');
  } catch (error) {
    console.log('❌ Connection failed');
    connection.destroy();
  }
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const voiceChannel = message.member?.voice?.channel;

  // 🔥 JOIN
  if (message.content === '!join') {
    if (!voiceChannel) return message.reply('❌ Join VC first');

    await stayInChannel(voiceChannel);
    return message.reply('✅ Joined and ready 🔊');
  }

  // 🎵 PLAY (FIXED)
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
          volume: 80, // 👈 important
          bufferingTimeout: 3000
        }
      });

      if (!result || !result.track) {
        return message.reply('❌ Could not play this song');
      }

      message.reply(`🎶 Playing: ${result.track.title}`);

    } catch (err) {
      console.error('PLAY ERROR:', err);
      message.reply('❌ Failed to play audio');
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

  // ⏹️ STOP
  if (message.content === '!stop') {
    const queue = player.nodes.get(message.guild.id);
    if (queue) queue.delete();

    message.reply('⏹️ Stopped');
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

  // 🤖 FREE AI
  if (message.content.startsWith('!ai')) {
    const userMessage = message.content.replace('!ai', '').trim();

    if (!userMessage) {
      return message.reply('❌ Write something after !ai');
    }

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: "You are a friendly Discord bot." },
          { role: "user", content: userMessage }
        ],
        model: "llama3-8b-8192"
      });

      message.reply(chatCompletion.choices[0].message.content);

    } catch (error) {
      console.error(error);
      message.reply('❌ AI error');
    }
  }

});

client.login(process.env.TOKEN);
