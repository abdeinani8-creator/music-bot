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

// 🎵 PLAYER
const player = new Player(client);

// ✅ LOAD EXTRACTORS (NEW WAY)
(async () => {
  await player.extractors.loadDefault();
})();

// 🤖 AI (Groq)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

client.once('ready', () => {
  console.log('🔥 Bot ready!');
});

// 🔊 JOIN VC
async function stayInChannel(voiceChannel) {
  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    selfDeaf: false
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    console.log("✅ Connected to VC");
  } catch {
    console.log("❌ VC connection failed");
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
    return message.reply('✅ Joined 🔊');
  }

  // 🎵 PLAY
  if (message.content.startsWith('!play')) {
    if (!voiceChannel) return message.reply('❌ Join VC first');

    const query = message.content.slice(6).trim();
    if (!query) return message.reply('❌ Give song name');

    try {
      const result = await player.play(voiceChannel, query, {
        nodeOptions: {
          leaveOnEmpty: false,
          leaveOnEnd: false,
          volume: 80
        }
      });

      if (!result || !result.track) {
        return message.reply('❌ Could not find song');
      }

      message.reply(`🎶 Playing: ${result.track.title}`);

    } catch (err) {
      console.error(err);
      message.reply('❌ Error playing music');
    }
  }

  // 🤖 AI COMMAND
  if (message.content.startsWith('!ai')) {
    const userMessage = message.content.replace('!ai', '').trim();

    if (!userMessage) {
      return message.reply('❌ Write something after !ai');
    }

    try {
      const res = await groq.chat.completions.create({
        messages: [
          { role: "system", content: "You are a friendly Discord bot." },
          { role: "user", content: userMessage }
        ],
        model: "mixtral-8x7b-32768" // ✅ WORKING MODEL
      });

      const reply = res.choices?.[0]?.message?.content || "No response";
      message.reply(reply);

    } catch (err) {
      console.error(err);
      message.reply('❌ AI error');
    }
  }

});

client.login(process.env.TOKEN);
