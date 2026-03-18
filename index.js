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

const player = new Player(client);

(async () => {
  await player.extractors.loadMulti(DefaultExtractors);
})();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

client.once('ready', () => {
  console.log('🔥 Bot ready!');
});

async function stayInChannel(voiceChannel) {
  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    selfDeaf: false
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
  } catch {
    connection.destroy();
  }
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const voiceChannel = message.member?.voice?.channel;

  if (message.content === '!join') {
    if (!voiceChannel) return message.reply('Join VC first');
    await stayInChannel(voiceChannel);
    return message.reply('Joined 🔊');
  }

  if (message.content.startsWith('!play')) {
    if (!voiceChannel) return message.reply('Join VC first');

    const query = message.content.slice(6).trim();

    const result = await player.play(voiceChannel, query);
    message.reply(`🎶 ${result.track.title}`);
  }

  if (message.content.startsWith('!ai')) {
    const userMessage = message.content.replace('!ai', '').trim();

    const res = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a Discord bot." },
        { role: "user", content: userMessage }
      ],
      model: "llama3-70b-8192"
    });

    message.reply(res.choices[0].message.content);
  }
});

client.login(process.env.TOKEN);
